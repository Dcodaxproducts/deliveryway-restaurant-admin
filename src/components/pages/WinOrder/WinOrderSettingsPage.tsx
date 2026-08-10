"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Cable,
  CheckCircle2,
  Clipboard,
  KeyRound,
  RefreshCw,
  RotateCcw,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import Container from "@/components/common/Container";
import PageHeader from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentScope } from "@/hooks/useCurrentScope";
import { useGetBranches } from "@/hooks/useBranches";
import { getApiErrorMessage } from "@/lib/errors";
import { parseWinOrderStoreId } from "@/lib/winorder-store-id";
import { getStringValue, isRecord } from "@/lib/auth";
import {
  createWinOrderConnection,
  getWinOrderConnection,
  getWinOrderHealth,
  getWinOrderMappings,
  replaceWinOrderCatalogMappings,
  replaceWinOrderPaymentMappings,
  retryFailedWinOrderExports,
  rotateWinOrderCredentials,
  updateWinOrderConnection,
  type WinOrderCatalogMapping,
  type WinOrderConnection,
  type WinOrderPaymentMethod,
} from "@/services/winorder";

type Tab = "connection" | "mappings" | "health";
type BranchOption = { id: string; name: string };
type CatalogDraft = Record<
  string,
  {
    mappingType: WinOrderCatalogMapping["mappingType"];
    name: string;
    no: string;
  }
>;

const paymentMethods: WinOrderPaymentMethod[] = [
  "COD",
  "CARD_ON_DELIVERY",
  "STRIPE",
  "PAYPAL",
  "EASYPAISA",
  "JAZZCASH",
  "BANK_TRANSFER",
  "WALLET",
];

const readBranches = (response: unknown): BranchOption[] => {
  if (!isRecord(response)) return [];
  const rows = Array.isArray(response.data)
    ? response.data
    : isRecord(response.data) && Array.isArray(response.data.data)
      ? response.data.data
      : [];
  return rows.flatMap((row) => {
    if (!isRecord(row)) return [];
    const id = getStringValue(row, "id");
    if (!id) return [];
    return [{ id, name: getStringValue(row, "name") ?? id }];
  });
};

const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

export default function WinOrderSettingsPage() {
  const t = useTranslations("winorder");
  const { user } = useAuth();
  const scope = useCurrentScope();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("connection");
  const [selectedBranchId, setSelectedBranchId] = useState(
    scope.branchId ?? "",
  );
  const [storeId, setStoreId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [oneTimeCredentials, setOneTimeCredentials] =
    useState<WinOrderConnection | null>(null);
  const [catalogDraft, setCatalogDraft] = useState<CatalogDraft>({});
  const [paymentDraft, setPaymentDraft] = useState<Record<string, string>>({});
  const canEdit = !scope.isBranchAdmin;

  const branchesQuery = useGetBranches({
    limit: 100,
    restaurantId: scope.restaurantId,
    includeInactive: true,
  });
  const branches = useMemo(() => {
    if (scope.isBranchAdmin && scope.branchId) {
      return [{ id: scope.branchId, name: scope.branchName ?? t("ownBranch") }];
    }
    return readBranches(branchesQuery.data);
  }, [
    branchesQuery.data,
    scope.branchId,
    scope.branchName,
    scope.isBranchAdmin,
    t,
  ]);

  useEffect(() => {
    if (!selectedBranchId && branches[0]) setSelectedBranchId(branches[0].id);
  }, [branches, selectedBranchId]);

  const connectionQuery = useQuery({
    queryKey: ["winorder", "connection", selectedBranchId],
    queryFn: () => getWinOrderConnection(selectedBranchId),
    enabled: Boolean(selectedBranchId),
  });
  const connection = connectionQuery.data?.data ?? null;
  const parsedStoreId = parseWinOrderStoreId(storeId);
  const mappingsQuery = useQuery({
    queryKey: ["winorder", "mappings", selectedBranchId],
    queryFn: () => getWinOrderMappings(selectedBranchId),
    enabled: Boolean(selectedBranchId && connection),
  });
  const healthQuery = useQuery({
    queryKey: ["winorder", "health", selectedBranchId],
    queryFn: () => getWinOrderHealth(selectedBranchId),
    enabled: Boolean(selectedBranchId && connection),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    setStoreId(connection?.storeId?.toString() ?? "");
    setStoreName(connection?.storeName ?? "");
  }, [connection]);

  useEffect(() => {
    const data = mappingsQuery.data?.data;
    if (!data) return;
    const existing = new Map(
      data.catalogMappings.map((item) => [item.localKey, item]),
    );
    const next: CatalogDraft = {};
    for (const item of data.catalog.items) {
      const current = existing.get(item.key);
      next[item.key] = {
        mappingType: "ITEM",
        name:
          current?.externalArticleName ??
          item.variationName ??
          item.menuItemName ??
          item.key,
        no: current?.externalArticleNo ?? "",
      };
    }
    for (const modifier of data.catalog.modifiers) {
      const current = existing.get(modifier.key);
      next[modifier.key] = {
        mappingType: "MODIFIER",
        name: current?.externalArticleName ?? modifier.name ?? modifier.key,
        no: current?.externalArticleNo ?? "",
      };
    }
    const serviceCharge = existing.get("service_charge");
    next.service_charge = {
      mappingType: "SERVICE_CHARGE",
      name: serviceCharge?.externalArticleName ?? t("serviceCharge"),
      no: serviceCharge?.externalArticleNo ?? "",
    };
    setCatalogDraft(next);
    setPaymentDraft(
      Object.fromEntries(
        data.paymentMappings.map((item) => [
          item.paymentMethod,
          item.externalLabel,
        ]),
      ),
    );
  }, [mappingsQuery.data, t]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["winorder"] });
  };
  const mutation = useMutation({
    mutationFn: async (
      action: "save" | "create" | "rotate" | "toggle" | "retry",
    ) => {
      if (!selectedBranchId) throw new Error(t("selectBranch"));
      if (action === "create") {
        if (parsedStoreId === null) throw new Error(t("storeIdRequired"));
        return createWinOrderConnection({
          branchId: selectedBranchId,
          storeId: parsedStoreId,
          storeName: storeName || undefined,
        });
      }
      if (action === "rotate")
        return rotateWinOrderCredentials(selectedBranchId);
      if (action === "toggle" && connection) {
        if (!connection.isEnabled && parsedStoreId === null) {
          throw new Error(t("storeIdRequired"));
        }
        return updateWinOrderConnection(selectedBranchId, {
          isEnabled: !connection.isEnabled,
          ...(!connection.isEnabled && parsedStoreId !== null
            ? { storeId: parsedStoreId }
            : {}),
        });
      }
      if (action === "retry")
        return retryFailedWinOrderExports(selectedBranchId);
      if (parsedStoreId === null) throw new Error(t("storeIdRequired"));
      await updateWinOrderConnection(selectedBranchId, {
        storeId: parsedStoreId,
        storeName: storeName || undefined,
      });
      const catalogMappings = Object.entries(catalogDraft)
        .filter(([, value]) => value.no.trim())
        .map(([localKey, value]) => ({
          mappingType: value.mappingType,
          localKey,
          externalArticleNo: value.no.trim(),
          externalArticleName: value.name.trim() || localKey,
        }));
      const payments = paymentMethods.flatMap((paymentMethod) => {
        const externalLabel = paymentDraft[paymentMethod]?.trim();
        return externalLabel ? [{ paymentMethod, externalLabel }] : [];
      });
      await Promise.all([
        replaceWinOrderCatalogMappings(selectedBranchId, catalogMappings),
        replaceWinOrderPaymentMappings(selectedBranchId, payments),
      ]);
      return null;
    },
    onSuccess: async (response, action) => {
      if (
        (action === "create" || action === "rotate") &&
        response &&
        "data" in response
      ) {
        setOneTimeCredentials(response.data as WinOrderConnection);
      }
      toast.success(t("saved"));
      await refresh();
    },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, t("failed"))),
  });

  const endpointBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(
    /\/$/,
    "",
  );
  const endpoint = `${endpointBase}${connection?.endpointPath ?? "/winorder"}`;
  const oneTimeEndpoint = `${endpointBase}${oneTimeCredentials?.endpointPath ?? "/winorder"}`;
  const missingCount = mappingsQuery.data?.data.missingCatalogKeys.length ?? 0;
  const failedCount = healthQuery.data?.data.exportCounts.FAILED ?? 0;

  return (
    <Container className="max-w-[1440px]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader title={t("title")} description={t("description")} />
        <div className="min-w-0 lg:w-[360px]">
          <Label htmlFor="winorder-branch">{t("branch")}</Label>
          <select
            id="winorder-branch"
            value={selectedBranchId}
            onChange={(event) => {
              setSelectedBranchId(event.target.value);
              setOneTimeCredentials(null);
            }}
            disabled={scope.isBranchAdmin}
            className="mt-2 h-[52px] w-full rounded-[var(--brand-radius)] border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
          >
            <option value="">{t("selectBranch")}</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section
        className="grid gap-3 md:grid-cols-3"
        aria-label={t("setupProgress")}
      >
        <ProgressCard
          icon={KeyRound}
          label={t("credentials")}
          complete={Boolean(connection)}
        />
        <ProgressCard
          icon={Cable}
          label={t("mappings")}
          complete={Boolean(connection && missingCount === 0)}
        />
        <ProgressCard
          icon={Activity}
          label={t("liveStatus")}
          complete={Boolean(connection?.lastPollAt)}
        />
      </section>

      {oneTimeCredentials?.password ? (
        <Card className="border-amber-300 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-600" />
              {t("saveCredentialsNow")}
            </CardTitle>
            <CardDescription>{t("passwordOnce")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <CredentialField label={t("endpoint")} value={oneTimeEndpoint} />
            <CredentialField
              label={t("username")}
              value={oneTimeCredentials.username}
            />
            <CredentialField
              label={t("password")}
              value={oneTimeCredentials.password}
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="flex w-full gap-1 overflow-x-auto rounded-xl border bg-muted/40 p-1">
        {(["connection", "mappings", "health"] as Tab[]).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`min-h-11 flex-1 rounded-lg px-4 text-sm font-medium transition-colors ${tab === item ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t(item)}
          </button>
        ))}
      </div>

      {!selectedBranchId ? <EmptyNotice text={t("selectBranchHelp")} /> : null}
      {selectedBranchId && tab === "connection" ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("connectionSettings")}</CardTitle>
            <CardDescription>{t("connectionHelp")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {connection ? (
              <div className="grid gap-4 rounded-xl border bg-muted/20 p-4 md:grid-cols-2">
                <CredentialField label={t("endpoint")} value={endpoint} />
                <CredentialField
                  label={t("username")}
                  value={connection.username}
                />
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="store-id">{t("storeId")}</Label>
                <Input
                  id="store-id"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  disabled={!canEdit}
                  type="number"
                  min={0}
                  step={1}
                  required
                  aria-invalid={Boolean(storeId && parsedStoreId === null)}
                  className="mt-2"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("storeIdHelp")}
                </p>
              </div>
              <div>
                <Label htmlFor="store-name">{t("storeName")}</Label>
                <Input
                  id="store-name"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  disabled={!canEdit}
                  className="mt-2"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t pt-5">
              {!connection ? (
                <Button
                  disabled={
                    !canEdit || mutation.isPending || parsedStoreId === null
                  }
                  onClick={() => mutation.mutate("create")}
                >
                  <KeyRound />
                  {t("generateCredentials")}
                </Button>
              ) : (
                <>
                  <div className="mr-auto flex items-center gap-3">
                    <Switch
                      checked={connection.isEnabled}
                      disabled={!canEdit || mutation.isPending}
                      onCheckedChange={() => mutation.mutate("toggle")}
                    />
                    <span className="text-sm font-medium">
                      {connection.isEnabled ? t("enabled") : t("disabled")}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    disabled={!canEdit || mutation.isPending}
                    onClick={() => mutation.mutate("rotate")}
                  >
                    <RotateCcw />
                    {t("rotate")}
                  </Button>
                  <Button
                    disabled={
                      !canEdit || mutation.isPending || parsedStoreId === null
                    }
                    onClick={() => mutation.mutate("save")}
                  >
                    <Save />
                    {t("save")}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {selectedBranchId && tab === "mappings" ? (
        !connection ? (
          <EmptyNotice text={t("createFirst")} />
        ) : (
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{t("catalogMappings")}</CardTitle>
                    <CardDescription>{t("catalogHelp")}</CardDescription>
                  </div>
                  <Badge variant={missingCount ? "destructive" : "secondary"}>
                    {missingCount} {t("missing")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(catalogDraft).map(([key, value]) => (
                  <MappingRow
                    key={key}
                    localKey={key}
                    value={value}
                    disabled={!canEdit}
                    onChange={(next) =>
                      setCatalogDraft((current) => ({
                        ...current,
                        [key]: next,
                      }))
                    }
                  />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t("paymentMappings")}</CardTitle>
                <CardDescription>{t("paymentHelp")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {paymentMethods.map((method) => (
                  <div key={method}>
                    <Label htmlFor={`payment-${method}`}>
                      {method.replaceAll("_", " ")}
                    </Label>
                    <Input
                      id={`payment-${method}`}
                      className="mt-2"
                      placeholder={t("winOrderLabel")}
                      value={paymentDraft[method] ?? ""}
                      disabled={!canEdit}
                      onChange={(event) =>
                        setPaymentDraft((current) => ({
                          ...current,
                          [method]: event.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
            {canEdit ? (
              <div className="flex justify-end">
                <Button
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate("save")}
                >
                  <Save />
                  {t("saveMappings")}
                </Button>
              </div>
            ) : null}
          </div>
        )
      ) : null}

      {selectedBranchId && tab === "health" ? (
        !connection ? (
          <EmptyNotice text={t("createFirst")} />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                label={t("lastPoll")}
                value={formatDate(connection.lastPollAt)}
              />
              <MetricCard
                label={t("lastCallback")}
                value={formatDate(connection.lastSuccessfulCallbackAt)}
              />
              <MetricCard
                label={t("failedExports")}
                value={String(failedCount)}
                danger={failedCount > 0}
              />
            </div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{t("recentEvents")}</CardTitle>
                    <CardDescription>
                      {connection.lastError ?? t("noCurrentError")}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void healthQuery.refetch()}
                  >
                    <RefreshCw />
                    {t("refresh")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {healthQuery.data?.data.recentEvents.length ? (
                  healthQuery.data.data.recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center"
                    >
                      <Badge
                        variant={
                          event.result === "FAILED"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {event.result}
                      </Badge>
                      <span className="font-mono text-xs">{event.orderId}</span>
                      <span className="text-muted-foreground">
                        {t("statusLabel")}: {event.trackingStatus}
                      </span>
                      <span className="sm:ml-auto text-muted-foreground">
                        {formatDate(event.processedAt)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t("noEvents")}
                  </p>
                )}
              </CardContent>
            </Card>
            {canEdit && failedCount > 0 ? (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate("retry")}
                >
                  <RotateCcw />
                  {t("retryFailed")}
                </Button>
              </div>
            ) : null}
          </div>
        )
      ) : null}
      <p className="text-xs text-muted-foreground">
        {t("signedInAs", { email: user?.email ?? "—" })}
      </p>
    </Container>
  );
}

function ProgressCard({
  icon: Icon,
  label,
  complete,
}: {
  icon: typeof KeyRound;
  label: string;
  complete: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-4 ${complete ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20" : "bg-card"}`}
    >
      <div className="rounded-lg border bg-background p-2">
        <Icon className="size-5" />
      </div>
      <span className="text-sm font-medium">{label}</span>
      {complete ? (
        <CheckCircle2 className="ml-auto size-5 text-emerald-600" />
      ) : (
        <span className="ml-auto size-2 rounded-full bg-muted-foreground/40" />
      )}
    </div>
  );
}
function CredentialField({ label, value }: { label: string; value: string }) {
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    toast.success("Copied");
  };
  return (
    <div className="min-w-0">
      <Label>{label}</Label>
      <div className="mt-2 flex items-center gap-2 rounded-lg border bg-background p-2">
        <code className="min-w-0 flex-1 truncate px-2 text-sm">
          {value || "—"}
        </code>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => void copy()}
          aria-label={`Copy ${label}`}
        >
          <Clipboard />
        </Button>
      </div>
    </div>
  );
}
function MappingRow({
  localKey,
  value,
  disabled,
  onChange,
}: {
  localKey: string;
  value: CatalogDraft[string];
  disabled: boolean;
  onChange: (value: CatalogDraft[string]) => void;
}) {
  return (
    <div className="grid gap-2 rounded-lg border p-3 md:grid-cols-[minmax(180px,1fr)_180px_minmax(180px,1fr)] md:items-end">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{value.name}</p>
        <code className="text-xs text-muted-foreground">{localKey}</code>
      </div>
      <div>
        <Label>WinOrder #</Label>
        <Input
          className="mt-1 h-10"
          value={value.no}
          disabled={disabled}
          onChange={(event) => onChange({ ...value, no: event.target.value })}
        />
      </div>
      <div>
        <Label>WinOrder name</Label>
        <Input
          className="mt-1 h-10"
          value={value.name}
          disabled={disabled}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
        />
      </div>
    </div>
  );
}
function MetricCard({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <Card className={danger ? "border-destructive/40" : ""}>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={`mt-2 text-lg font-semibold ${danger ? "text-destructive" : ""}`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
function EmptyNotice({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-14 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
