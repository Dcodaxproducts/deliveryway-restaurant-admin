"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AlertCircle, Loader2, MapPin, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-delivery-areas-script";
const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY";

const DEFAULT_MAP_CENTER = {
  lat: 33.6844,
  lng: 73.0479,
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

export type BranchLocationAddressFields = Partial<{
  area: string;
  city: string;
  country: string;
  postalCode: string;
  state: string;
  street: string;
}> & {
  lat: string;
  lng: string;
};

type BranchLocationPickerProps = {
  initialPoint?: LatLngNumberPoint | null;
  inputId: string;
  markerTitle?: string;
  onAddressFieldsChange: (fields: BranchLocationAddressFields) => void;
};

const getGoogleMaps = () => (window as GoogleWindow).google?.maps;

const isGoogleMapsKeyConfigured = () =>
  Boolean(GOOGLE_MAPS_API_KEY) &&
  GOOGLE_MAPS_API_KEY !== "YOUR_GOOGLE_MAPS_API_KEY";

const getAddressComponent = (
  components: GoogleAddressComponent[] | undefined,
  type: string,
  name: "long_name" | "short_name" = "long_name"
) => components?.find((component) => component.types.includes(type))?.[name] ?? "";

const mapPlaceToAddressFields = (
  place: GooglePlaceResult,
  point: LatLngNumberPoint
): BranchLocationAddressFields => {
  const streetNumber = getAddressComponent(place.address_components, "street_number");
  const route = getAddressComponent(place.address_components, "route");
  const neighborhood = getAddressComponent(place.address_components, "neighborhood");
  const sublocality = getAddressComponent(place.address_components, "sublocality");
  const locality = getAddressComponent(place.address_components, "locality");
  const adminArea = getAddressComponent(place.address_components, "administrative_area_level_1");
  const country = getAddressComponent(place.address_components, "country");
  const postalCode = getAddressComponent(place.address_components, "postal_code");
  const street = [streetNumber, route].filter(Boolean).join(" ");

  return {
    street: street || place.formatted_address || place.name || "",
    area: neighborhood || sublocality,
    postalCode,
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

export function BranchLocationPicker({
  initialPoint = null,
  inputId,
  markerTitle,
  onAddressFieldsChange,
}: BranchLocationPickerProps) {
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
  const [searchQuery, setSearchQuery] = useState(
    initialPoint ? `${initialPoint.lat}, ${initialPoint.lng}` : ""
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedPoint, setSelectedPoint] = useState<LatLngNumberPoint | null>(
    initialPoint
  );

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

    onAddressFieldsChange(mapPlaceToAddressFields(place, point));
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
          title: markerTitle || t("createBranchLocation"),
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
        onAddressFieldsChange({
          lat: String(point.lat),
          lng: String(point.lng),
        });
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
      center: initialPoint ?? DEFAULT_MAP_CENTER,
      clickableIcons: false,
      mapTypeControl: false,
      streetViewControl: false,
      zoom: initialPoint ? 16 : 12,
    });
    mapRef.current = map;

    if (initialPoint) {
      markerRef.current = new maps.Marker({
        map,
        position: initialPoint,
        title: markerTitle || t("createBranchLocation"),
      });
    }

    clickListenerRef.current = map.addListener("click", (event: { latLng?: GoogleLatLng }) => {
      const latLng = event.latLng;
      if (!latLng) return;

      reverseGeocodePoint({
        lat: Number(latLng.lat().toFixed(6)),
        lng: Number(latLng.lng().toFixed(6)),
      });
    });
  }, [initialPoint, mapsReady, markerTitle, t]);

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
            <Label htmlFor={inputId} className="mb-1 block text-xs font-medium text-gray-500">
              {t("searchAreaAddress")}
            </Label>

            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                id={inputId}
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
