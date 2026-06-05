"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  Controller,
  useForm,
  type FieldErrors,
  type Path,
  type UseFormSetValue,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { CARD_PANEL_CLASS, FIELD_ERROR_CLASS, MUTED_TEXT_SM_CLASS } from "@/components/common/common-classes";
import { useCreateBranch } from "@/hooks/useBranches";
import { AlertCircle, Loader2, MapPin, Search } from "lucide-react";
import {
  createBranchSchema,
  type BranchValues,
  type CreateBranchFormValues,
} from "@/validations/branches";
import { useTranslations } from "next-intl";

interface CreateBranchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const INPUT_CLASS =
  "h-[44px] rounded-[10px] px-3 text-sm placeholder:text-gray-400 border-gray-300 focus-visible:ring-1 focus-visible:ring-primary";
const PRIMARY_INPUT_CLASS = `${INPUT_CLASS} border-primary bg-primary/5`;
const GOOGLE_MAPS_SCRIPT_ID = "google-maps-delivery-areas-script";
const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY";

const DEFAULT_MAP_CENTER = {
  lat: 33.6844,
  lng: 73.0479,
};

const defaultCreateBranchSettings: NonNullable<BranchValues["settings"]> = {
    deliveryConfig: {
      mode: "RADIUS",
      radiusKm: 5,
      minOrderAmount: 0,
      deliveryFee: 0,
      isFreeDelivery: false,
      freeDeliveryThreshold: 0,
      zones: [],
      zoneBands: [],
      postalCodeRules: [],
    },
    allowedOrderTypes: ["DELIVERY"],
    allowedPaymentMethods: ["COD"],
    automation: {
      autoAcceptOrders: false,
      estimatedPrepTime: 30,
    },
    taxation: {
      taxPercentage: 0,
    },
    tableReservationsEnabled: false,
    tableReservationAutoAccept: false,
    tableCount: 0,
    contact: {
      phone: "",
      whatsapp: "",
    },
};

const defaultValues: CreateBranchFormValues = {
  restaurantId: "",
  name: "",
  street: "",
  city: "",
  state: "",
  country: "",
  area: "",
  lat: "",
  lng: "",
  isMain: false,
  settings: defaultCreateBranchSettings,
  branchAdmin: {
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  },
};

const buildCreateBranchSettings = (
  settings: CreateBranchFormValues["settings"]
): NonNullable<BranchValues["settings"]> => ({
  ...defaultCreateBranchSettings,
  ...(settings ?? {}),
  deliveryConfig: {
    ...defaultCreateBranchSettings.deliveryConfig,
    ...(settings?.deliveryConfig ?? {}),
  },
  automation: {
    ...defaultCreateBranchSettings.automation,
    ...(settings?.automation ?? {}),
  },
  taxation: {
    ...defaultCreateBranchSettings.taxation,
    ...(settings?.taxation ?? {}),
  },
  contact: {
    ...defaultCreateBranchSettings.contact,
    ...(settings?.contact ?? {}),
  },
  tableReservationsEnabled: settings?.tableReservationsEnabled ?? false,
  tableReservationAutoAccept: settings?.tableReservationAutoAccept ?? false,
  tableCount: settings?.tableCount ?? 0,
});

type FieldConfig = {
  name: Path<CreateBranchFormValues>;
  labelKey?: string;
  placeholderKey: string;
  type?: string;
  required?: boolean;
  primary?: boolean;
};

const branchFieldConfigs: FieldConfig[] = [
  {
    name: "name",
    labelKey: "branchName",
    placeholderKey: "branchNamePlaceholder",
    required: true,
    primary: true,
  },
  { name: "street", labelKey: "street", placeholderKey: "streetPlaceholder" },
  { name: "city", labelKey: "city", placeholderKey: "cityPlaceholder" },
  { name: "state", labelKey: "state", placeholderKey: "statePlaceholder" },
  { name: "country", labelKey: "country", placeholderKey: "countryPlaceholder" },
  { name: "area", labelKey: "area", placeholderKey: "areaPlaceholder" },
];

const adminFieldConfigs: FieldConfig[] = [
  { name: "branchAdmin.firstName", placeholderKey: "firstName" },
  { name: "branchAdmin.lastName", placeholderKey: "lastName" },
  { name: "branchAdmin.email", placeholderKey: "email" },
  { name: "branchAdmin.password", placeholderKey: "password", type: "password" },
  { name: "branchAdmin.phone", placeholderKey: "phone" },
];

const getErrorMessage = (
  errors: FieldErrors<CreateBranchFormValues>,
  name: Path<CreateBranchFormValues>
) => {
  if (name.startsWith("branchAdmin.")) {
    const adminKey = name.split(".")[1] as keyof CreateBranchFormValues["branchAdmin"];
    return errors.branchAdmin?.[adminKey]?.message;
  }

  const fieldName = name as keyof Omit<CreateBranchFormValues, "branchAdmin">;
  return errors[fieldName]?.message;
};

type LatLngNumberPoint = {
  lat: number;
  lng: number;
};

type GoogleLatLng = {
  lat: () => number;
  lng: () => number;
};

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GooglePlaceResult = {
  address_components?: GoogleAddressComponent[];
  formatted_address?: string;
  geometry?: {
    location?: GoogleLatLng;
  };
  name?: string;
};

type GoogleMapsListener = {
  remove: () => void;
};

type GoogleMapInstance = {
  addListener: (
    eventName: "click",
    handler: (event: { latLng?: GoogleLatLng }) => void
  ) => GoogleMapsListener;
  panTo: (point: LatLngNumberPoint) => void;
  setZoom: (zoom: number) => void;
};

type GoogleMarkerInstance = {
  setMap: (map: GoogleMapInstance | null) => void;
  setPosition: (point: LatLngNumberPoint) => void;
};

type GoogleAutocompleteInstance = {
  addListener: (
    eventName: "place_changed",
    handler: () => void
  ) => GoogleMapsListener;
  getPlace: () => GooglePlaceResult;
};

type GoogleGeocoderInstance = {
  geocode: (
    request: { address: string } | { location: LatLngNumberPoint },
    callback: (results: GooglePlaceResult[] | null, status: string) => void
  ) => void;
};

type GoogleMapsNamespace = {
  Map: new (
    element: HTMLElement,
    options: {
      center: LatLngNumberPoint;
      clickableIcons?: boolean;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      zoom: number;
    }
  ) => GoogleMapInstance;
  Marker: new (options: {
    map: GoogleMapInstance;
    position: LatLngNumberPoint;
    title?: string;
  }) => GoogleMarkerInstance;
  Geocoder: new () => GoogleGeocoderInstance;
  event?: {
    clearInstanceListeners: (instance: GoogleAutocompleteInstance) => void;
  };
  places?: {
    Autocomplete: new (
      input: HTMLInputElement,
      options: { fields: string[] }
    ) => GoogleAutocompleteInstance;
  };
};

type GoogleWindow = Window & {
  google?: {
    maps?: GoogleMapsNamespace;
  };
};

type AddressFields = Pick<
  CreateBranchFormValues,
  "area" | "city" | "country" | "lat" | "lng" | "state" | "street"
>;

const getGoogleMaps = () => (window as GoogleWindow).google?.maps;

const isGoogleMapsKeyConfigured = () =>
  Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== "YOUR_GOOGLE_MAPS_API_KEY";

const getAddressComponent = (
  components: GoogleAddressComponent[] | undefined,
  type: string,
  name: "long_name" | "short_name" = "long_name"
) => components?.find((component) => component.types.includes(type))?.[name] ?? "";

const mapPlaceToAddressFields = (
  place: GooglePlaceResult,
  point: LatLngNumberPoint
): AddressFields => {
  const streetNumber = getAddressComponent(place.address_components, "street_number");
  const route = getAddressComponent(place.address_components, "route");
  const neighborhood = getAddressComponent(place.address_components, "neighborhood");
  const sublocality = getAddressComponent(place.address_components, "sublocality");
  const locality = getAddressComponent(place.address_components, "locality");
  const adminArea = getAddressComponent(place.address_components, "administrative_area_level_1");
  const country = getAddressComponent(place.address_components, "country");
  const street = [streetNumber, route].filter(Boolean).join(" ");

  return {
    street: street || place.formatted_address || place.name || "",
    area: neighborhood || sublocality,
    city: locality || getAddressComponent(place.address_components, "administrative_area_level_2"),
    state: adminArea,
    country,
    lat: String(point.lat),
    lng: String(point.lng),
  };
};

const loadGoogleMapsScript = () =>
  new Promise<void>((resolve, reject) => {
    if (getGoogleMaps()?.Map) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Google Maps failed")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps failed"));
    document.head.appendChild(script);
  });

function CreateBranchLocationPicker({
  setValue,
}: {
  setValue: UseFormSetValue<CreateBranchFormValues>;
}) {
  const t = useTranslations("branches");
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markerRef = useRef<GoogleMarkerInstance | null>(null);
  const autocompleteRef = useRef<GoogleAutocompleteInstance | null>(null);
  const clickListenerRef = useRef<GoogleMapsListener | null>(null);

  const [mapsReady, setMapsReady] = useState(false);
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsError, setMapsError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedPoint, setSelectedPoint] = useState<LatLngNumberPoint | null>(null);

  const applyPlace = (place: GooglePlaceResult) => {
    const location = place.geometry?.location;

    if (!location) {
      setSearchError("Please select a valid Google Maps location.");
      return;
    }

    const point = {
      lat: Number(location.lat().toFixed(6)),
      lng: Number(location.lng().toFixed(6)),
    };
    const addressFields = mapPlaceToAddressFields(place, point);

    Object.entries(addressFields).forEach(([fieldName, value]) => {
      setValue(fieldName as keyof AddressFields, value, {
        shouldDirty: true,
        shouldValidate: true,
      });
    });

    setSearchQuery(place.formatted_address || place.name || `${point.lat}, ${point.lng}`);
    setSelectedPoint(point);
    setSearchError("");
    mapRef.current?.panTo(point);
    mapRef.current?.setZoom(16);

    if (markerRef.current) {
      markerRef.current.setPosition(point);
    } else {
      const maps = getGoogleMaps();
      if (maps && mapRef.current) {
        markerRef.current = new maps.Marker({
          map: mapRef.current,
          position: point,
          title: t("createBranchLocation"),
        });
      }
    }
  };

  const reverseGeocodePoint = (point: LatLngNumberPoint) => {
    const maps = getGoogleMaps();

    if (!maps?.Geocoder) {
      setSearchError("Google Maps is not ready yet.");
      return;
    }

    setSearchLoading(true);
    setSearchError("");

    const geocoder = new maps.Geocoder();
    geocoder.geocode({ location: point }, (results: GooglePlaceResult[] | null, status: string) => {
      if (status === "OK" && results?.[0]) {
        applyPlace({
          ...results[0],
          geometry: {
            location: {
              lat: () => point.lat,
              lng: () => point.lng,
            },
          },
        });
      } else {
        setValue("lat", String(point.lat), { shouldDirty: true, shouldValidate: true });
        setValue("lng", String(point.lng), { shouldDirty: true, shouldValidate: true });
        setSelectedPoint(point);
        setSearchQuery(`${point.lat}, ${point.lng}`);
        setSearchError("Address details were not found, but coordinates were selected.");
      }

      setSearchLoading(false);
    });
  };

  const handleMapSearch = () => {
    const query = searchQuery.trim();
    const maps = getGoogleMaps();

    if (!query) {
      setSearchError(t("searchAreaFirst"));
      return;
    }

    if (!maps?.Geocoder) {
      setSearchError("Google Maps is not ready yet.");
      return;
    }

    setSearchLoading(true);
    setSearchError("");

    const geocoder = new maps.Geocoder();
    geocoder.geocode({ address: query }, (results: GooglePlaceResult[] | null, status: string) => {
      if (status === "OK" && results?.[0]) {
        applyPlace(results[0]);
      } else {
        setSearchError("No matching location found. Try a more specific address.");
      }

      setSearchLoading(false);
    });
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    handleMapSearch();
  };

  useEffect(() => {
    if (!isGoogleMapsKeyConfigured()) {
      setMapsReady(false);
      setMapsLoading(false);
      setMapsError(t("googleMapsApiKeyMissing"));
      return;
    }

    setMapsLoading(true);
    setMapsError("");

    loadGoogleMapsScript()
      .then(() => {
        setMapsReady(true);
        setMapsLoading(false);
      })
      .catch(() => {
        setMapsReady(false);
        setMapsLoading(false);
        setMapsError("Failed to load Google Maps. Please verify the API key.");
      });
  }, [t]);

  useEffect(() => {
    const maps = getGoogleMaps();

    if (!mapsReady || !maps?.Map || !mapContainerRef.current || mapRef.current) return;

    const map = new maps.Map(mapContainerRef.current, {
      center: DEFAULT_MAP_CENTER,
      clickableIcons: false,
      mapTypeControl: false,
      streetViewControl: false,
      zoom: 12,
    });
    mapRef.current = map;

    clickListenerRef.current = map.addListener("click", (event: { latLng?: GoogleLatLng }) => {
      const latLng = event.latLng;
      if (!latLng) return;

      reverseGeocodePoint({
        lat: Number(latLng.lat().toFixed(6)),
        lng: Number(latLng.lng().toFixed(6)),
      });
    });
  }, [mapsReady]);

  useEffect(() => {
    const maps = getGoogleMaps();

    if (!mapsReady || !maps?.places?.Autocomplete || !searchInputRef.current) return;
    if (autocompleteRef.current) return;

    const autocomplete = new maps.places.Autocomplete(searchInputRef.current, {
      fields: ["address_components", "formatted_address", "geometry", "name", "place_id"],
    });
    autocompleteRef.current = autocomplete;

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place?.geometry?.location) {
        setSearchError("Please select a location from Google suggestions.");
        return;
      }

      applyPlace(place);
    });

    return () => {
      if (maps.event && autocompleteRef.current) {
        maps.event.clearInstanceListeners(autocompleteRef.current);
      }

      autocompleteRef.current = null;
    };
  }, [mapsReady]);

  useEffect(() => {
    return () => {
      clickListenerRef.current?.remove();
      markerRef.current?.setMap(null);
    };
  }, []);

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <Label htmlFor="create-branch-map-search" className="mb-1 block text-xs font-medium text-gray-500">
              {t("searchAreaAddress")}
            </Label>

            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                id="create-branch-map-search"
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSearchError("");
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder={t("searchAreaPlaceholder")}
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
              />
              {searchLoading ? (
                <Loader2
                  size={17}
                  className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary"
                />
              ) : null}
            </div>
          </div>

          <div className="flex min-w-0 items-end">
            <button
              type="button"
              onClick={handleMapSearch}
              disabled={searchLoading || !mapsReady}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary px-4 text-sm font-medium text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
            >
              {searchLoading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              {t("searchMap")}
            </button>
          </div>
        </div>

        {searchError ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{searchError}</span>
          </div>
        ) : null}
      </div>

      {mapsReady ? (
        <>
          <div ref={mapContainerRef} className="h-[320px] w-full" />
          <div className="flex flex-col gap-2 border-t border-gray-200 bg-white px-4 py-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <span>{t("selectBranchLocationOnMap")}</span>
            <span className="min-w-0 break-words font-medium text-gray-700 sm:shrink-0">
              {selectedPoint
                ? `${selectedPoint.lat}, ${selectedPoint.lng}`
                : t("branchLocationNotSelected")}
            </span>
          </div>
        </>
      ) : (
        <div className="flex min-h-[240px] flex-col items-center justify-center px-5 text-center">
          {mapsLoading ? (
            <>
              <Loader2 className="mb-3 animate-spin text-primary" size={28} />
              <p className="text-sm font-medium text-gray-700">{t("loadingGoogleMap")}</p>
            </>
          ) : (
            <>
              <MapPin className="mb-3 text-gray-400" size={30} />
              <p className="text-sm font-medium text-gray-700">
                {t("googleMapPreviewUnavailable")}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {mapsError || t("googleMapsApiKeyMissing")}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function CreateBranchModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateBranchModalProps) {
  const t = useTranslations("branches");
  const commonT = useTranslations("common");
  const { user } = useAuth();
  const createBranchMutation = useCreateBranch();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<CreateBranchFormValues>({
    resolver: zodResolver(createBranchSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
    }
  }, [open, reset]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(defaultValues);
    }

    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateBranchFormValues) => {
    const restaurantId = user?.restaurantId;

    if (!restaurantId) {
      return;
    }

    try {
      await createBranchMutation.mutateAsync({
        restaurantId,
        name: values.name,
        street: values.street ?? "",
        city: values.city ?? "",
        state: values.state ?? "",
        country: values.country ?? "",
        area: values.area ?? "",
        lat: values.lat ?? "",
        lng: values.lng ?? "",
        isMain: values.isMain,
        settings: buildCreateBranchSettings(values.settings),
        branchAdmin: {
          email: values.branchAdmin.email ?? "",
          password: values.branchAdmin.password ?? "",
          firstName: values.branchAdmin.firstName ?? "",
          lastName: values.branchAdmin.lastName ?? "",
          phone: values.branchAdmin.phone ?? "",
        },
      });

      reset(defaultValues);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      void error;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[760px] rounded-[20px] p-6 bg-[#F5F5F5] max-h-[95vh] overflow-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-semibold">{t("createBranch")}</DialogTitle>
          <p className={MUTED_TEXT_SM_CLASS}>{t("createDescription")}</p>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className={`mt-4 ${CARD_PANEL_CLASS} space-y-4`}>
            {branchFieldConfigs.map((config) => {
              const { labelKey, name, placeholderKey, primary, required, type } = config;
              const errorMessage = getErrorMessage(errors, name);
              const fieldId = `create-branch-${name.replace(/\./g, "-")}`;

              return (
                <div key={name} className="space-y-1">
                  {labelKey ? (
                    <Label htmlFor={fieldId} className="text-sm">
                      {t(labelKey)} {required ? <span className="text-primary">*</span> : null}
                    </Label>
                  ) : null}
                  <Input
                    id={fieldId}
                    type={type}
                    placeholder={t(placeholderKey)}
                    className={primary ? PRIMARY_INPUT_CLASS : INPUT_CLASS}
                    aria-invalid={Boolean(errorMessage)}
                    {...register(name)}
                  />
                  {errorMessage ? (
                    <p className={FIELD_ERROR_CLASS}>{errorMessage}</p>
                  ) : null}
                </div>
              );
            })}

            <div className="space-y-2">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {t("createBranchLocation")}
                </h4>
                <p className="mt-1 text-xs text-gray-500">
                  {t("createBranchLocationDescription")}
                </p>
              </div>
              <CreateBranchLocationPicker setValue={setValue} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="create-branch-is-main" className="text-sm">
                {t("mainBranch")}
              </Label>
              <Controller
                control={control}
                name="isMain"
                render={({ field }) => (
                  <Switch
                    id="create-branch-is-main"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-primary"
                  />
                )}
              />
            </div>

            <hr className="border-gray-200 my-2" />

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">
                {t("tableReservationSettings")}
              </h4>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="create-branch-table-reservations" className="text-sm">
                    {t("enableTableReservations")}
                  </Label>
                  <p className="text-xs text-gray-500">{t("allowTableReservations")}</p>
                </div>
                <Controller
                  control={control}
                  name="settings.tableReservationsEnabled"
                  render={({ field }) => (
                    <Switch
                      id="create-branch-table-reservations"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-primary"
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="create-branch-auto-accept-reservations" className="text-sm">
                    {t("autoAcceptReservations")}
                  </Label>
                  <p className="text-xs text-gray-500">{t("autoAcceptReservationsHelper")}</p>
                </div>
                <Controller
                  control={control}
                  name="settings.tableReservationAutoAccept"
                  render={({ field }) => (
                    <Switch
                      id="create-branch-auto-accept-reservations"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-primary"
                    />
                  )}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="create-branch-table-count" className="text-sm">
                  {t("tableCount")}
                </Label>
                <Input
                  id="create-branch-table-count"
                  type="number"
                  min={0}
                  className={INPUT_CLASS}
                  aria-invalid={Boolean(errors.settings?.tableCount?.message)}
                  {...register("settings.tableCount", { valueAsNumber: true })}
                />
                <p className="text-xs text-gray-500">{t("tableCountHelper")}</p>
                {errors.settings?.tableCount?.message ? (
                  <p className={FIELD_ERROR_CLASS}>
                    {errors.settings.tableCount.message}
                  </p>
                ) : null}
              </div>
            </div>

            <hr className="border-gray-200 my-2" />

            <h4 className="text-sm font-medium text-gray-900">{t("branchAdminInfo")}</h4>

            {adminFieldConfigs.map((config) => {
              const { name, placeholderKey, type } = config;
              const errorMessage = getErrorMessage(errors, name);
              const fieldId = `create-branch-${name.replace(/\./g, "-")}`;

              return (
                <div key={name} className="space-y-1">
                  <Label htmlFor={fieldId} className="sr-only">
                    {t(placeholderKey)}
                  </Label>
                  <Input
                    id={fieldId}
                    type={type}
                    placeholder={t(placeholderKey)}
                    className={INPUT_CLASS}
                    aria-invalid={Boolean(errorMessage)}
                    {...register(name)}
                  />
                  {errorMessage ? (
                    <p className={FIELD_ERROR_CLASS}>{errorMessage}</p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="ghost"
              className="text-gray-700 text-[17px]"
              onClick={() => handleOpenChange(false)}
            >
              {commonT("cancel")}
            </Button>

            <Button
              type="submit"
              className="px-8 py-2 rounded-[10px] bg-primary hover:bg-primary/90 text-[17px]"
              disabled={createBranchMutation.isPending}
            >
              {createBranchMutation.isPending ? t("creating") : commonT("create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
