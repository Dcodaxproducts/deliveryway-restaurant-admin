"use client";

import { LocateFixed, MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  isValidLatitude,
  isValidLongitude,
  type GuestDeliveryAddress,
} from "@/components/pages/Pos/components/pos/pos-checkout-payload";

type NominatimAddress = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
};

type NominatimResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: NominatimAddress;
};

type GuestAddressLocationPickerProps = {
  address: GuestDeliveryAddress;
  onChange: (field: keyof GuestDeliveryAddress, value: string) => void;
};

const getAddressLine = (result: NominatimResult) => {
  const address = result.address;
  const streetName =
    address?.road || address?.pedestrian || address?.footway || "";
  const houseNumber = address?.house_number || "";
  const street = [streetName, houseNumber].filter(Boolean).join(" ").trim();

  return street || result.display_name?.split(",")[0]?.trim() || "";
};

const getCity = (address?: NominatimAddress) => {
  return (
    address?.city ||
    address?.town ||
    address?.village ||
    address?.municipality ||
    address?.county ||
    ""
  );
};

const getResultArray = (value: unknown): NominatimResult[] => {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is NominatimResult => {
    return Boolean(item && typeof item === "object" && !Array.isArray(item));
  });
};

export function GuestAddressLocationPicker({
  address,
  onChange,
}: GuestAddressLocationPickerProps) {
  const t = useTranslations("pos");
  const commonT = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);

  const hasCoordinates =
    isValidLatitude(address.lat) && isValidLongitude(address.lng);
  const previewUrl = useMemo(() => {
    if (!hasCoordinates) return "";

    const lat = Number(address.lat);
    const lng = Number(address.lng);
    const delta = 0.01;
    const bbox = [
      lng - delta,
      lat - delta,
      lng + delta,
      lat + delta,
    ].join(",");

    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  }, [address.lat, address.lng, hasCoordinates]);

  const applyResult = (result: NominatimResult) => {
    if (!result.lat || !result.lon) return;

    const resultAddress = result.address;
    onChange("lat", result.lat);
    onChange("lng", result.lon);
    onChange("street", getAddressLine(result));
    onChange(
      "area",
      resultAddress?.suburb || resultAddress?.neighbourhood || address.area || "",
    );
    onChange("postalCode", resultAddress?.postcode || address.postalCode || "");
    onChange("city", getCity(resultAddress) || address.city || "");
    onChange("state", resultAddress?.state || address.state || "");
    onChange("country", resultAddress?.country || address.country || "");
    setOpen(false);
  };

  const searchLocations = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    try {
      setSearching(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(trimmedQuery)}`,
      );
      const data: unknown = await response.json();
      setResults(getResultArray(data));
    } catch {
      toast.error(t("locationSearchFailed"));
    } finally {
      setSearching(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t("locationUnavailable"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = String(position.coords.latitude);
        const lng = String(position.coords.longitude);
        onChange("lat", lat);
        onChange("lng", lng);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`,
          );
          const data = (await response.json()) as NominatimResult;
          applyResult({ ...data, lat, lon: lng });
        } catch {
          setOpen(false);
        }
      },
      () => {
        toast.error(t("locationPermissionDenied"));
      },
    );
  };

  return (
    <>
      <div className="space-y-2 rounded-md border border-dashed border-gray-200 bg-gray-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-gray-700">
              {t("guestAddressLocation")}
            </p>
            <p className="text-[11px] text-gray-500">
              {hasCoordinates
                ? `${address.lat}, ${address.lng}`
                : t("guestAddressLocationMissing")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="h-9 gap-2"
          >
            <MapPin className="h-4 w-4" />
            {t("pickLocation")}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={address.lat || ""}
            onChange={(event) => onChange("lat", event.target.value)}
            placeholder={t("guestAddressLat")}
            className="h-10 rounded-md text-sm"
          />
          <Input
            value={address.lng || ""}
            onChange={(event) => onChange("lng", event.target.value)}
            placeholder={t("guestAddressLng")}
            className="h-10 rounded-md text-sm"
          />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {t("pickDeliveryLocation")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void searchLocations();
                    }
                  }}
                  placeholder={t("searchLocationPlaceholder")}
                  className="h-11 pl-9 text-sm"
                />
              </div>
              <Button
                type="button"
                onClick={() => void searchLocations()}
                disabled={searching}
                className="h-11 gap-2"
              >
                <Search className="h-4 w-4" />
                {searching ? commonT("loading") : commonT("search")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={useCurrentLocation}
                className="h-11 gap-2"
              >
                <LocateFixed className="h-4 w-4" />
                {t("useCurrentLocation")}
              </Button>
            </div>

            {results.length > 0 ? (
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.lat}-${result.lon}-${index}`}
                    type="button"
                    onClick={() => applyResult(result)}
                    className="w-full rounded-md border border-gray-100 bg-white p-2 text-left text-sm transition hover:border-primary/30 hover:bg-primary/5"
                  >
                    <span className="block font-medium text-gray-900">
                      {getAddressLine(result) || t("deliveryLocation")}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      {result.display_name}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="overflow-hidden rounded-md border bg-gray-100">
              {previewUrl ? (
                <iframe
                  title={t("deliveryLocation")}
                  src={previewUrl}
                  className="h-64 w-full border-0"
                />
              ) : (
                <div className="flex h-64 items-center justify-center px-6 text-center text-sm text-gray-500">
                  {t("guestAddressLocationMissing")}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
