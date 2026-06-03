"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Section from "@/components/pages/Promotions/forms/Section";
import FormInput from "@/components/forms/common/FormInput";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertCircle,
  Copy,
  Crosshair,
  Loader2,
  LocateFixed,
  MapPin,
  Plus,
  Search,
  Trash2,
  Undo2,
} from "lucide-react";
import { useTranslations } from "next-intl";

const ORDER_TYPES = ["DELIVERY", "TAKEAWAY", "DINE_IN"];
const PAYMENT_METHODS = [
  "COD",
  "STRIPE",
  "EASYPAISA",
  "JAZZCASH",
  "BANK_TRANSFER",
];

type DeliveryMode = "RADIUS" | "ZONE" | "ZONE_BANDS" | "POSTAL_CODE";
type LatLngKey = "lat" | "lng";

type LatLngPoint = {
  lat: string | number;
  lng: string | number;
};

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-delivery-areas-script";
const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY";

const DEFAULT_MAP_CENTER = {
  lat: 33.6844,
  lng: 73.0479,
};

const DELIVERY_MODES: {
  value: DeliveryMode;
  labelKey: string;
  descriptionKey: string;
}[] = [
  {
    value: "RADIUS",
    labelKey: "deliveryModeRadius",
    descriptionKey: "deliveryModeRadiusDescription",
  },
  {
    value: "ZONE",
    labelKey: "deliveryModePolygonZones",
    descriptionKey: "deliveryModePolygonZonesDescription",
  },
  {
    value: "ZONE_BANDS",
    labelKey: "deliveryModeZoneBands",
    descriptionKey: "deliveryModeZoneBandsDescription",
  },
  {
    value: "POSTAL_CODE",
    labelKey: "deliveryModePostalCodes",
    descriptionKey: "deliveryModePostalCodesDescription",
  },
];

const isGoogleMapsKeyConfigured = () => {
  return (
    Boolean(GOOGLE_MAPS_API_KEY) &&
    GOOGLE_MAPS_API_KEY !== "YOUR_GOOGLE_MAPS_API_KEY"
  );
};

const formatLabel = (value: string) => {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const toInputNumber = (value: unknown) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return "";
  }

  return String(value);
};

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toFiniteNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const createDefaultZone = (deliveryFee = 0, center?: LatLngPoint | null) => {
  const lat = toFiniteNumber(center?.lat);
  const lng = toFiniteNumber(center?.lng);

  if (lat !== null && lng !== null) {
    const offset = 0.01;

    return {
      name: "",
      deliveryFee,
      minOrderAmount: 0,
      freeDeliveryThreshold: 0,
      polygon: [
        { lat: String(lat - offset), lng: String(lng - offset) },
        { lat: String(lat + offset), lng: String(lng - offset) },
        { lat: String(lat + offset), lng: String(lng + offset) },
        { lat: String(lat - offset), lng: String(lng + offset) },
      ],
    };
  }

  return {
    name: "",
    deliveryFee,
    minOrderAmount: 0,
    freeDeliveryThreshold: 0,
    polygon: [
      { lat: "", lng: "" },
      { lat: "", lng: "" },
      { lat: "", lng: "" },
    ],
  };
};

const createDefaultZoneBand = (fromKm = 0, deliveryFee = 0) => ({
  fromKm,
  toKm: fromKm + 5,
  deliveryFee,
  minOrderAmount: 0,
  freeDeliveryThreshold: 0,
});

const createDefaultPostalCodeRule = (deliveryFee = 0) => ({
  postalCode: "",
  deliveryFee,
});

const getValidPoint = (point: any) => {
  const lat = toFiniteNumber(point?.lat);
  const lng = toFiniteNumber(point?.lng);

  if (lat === null || lng === null) return null;

  return { lat, lng };
};

const formatCoordinate = (value: number) => Number(value).toFixed(6);

const createPolygonAroundCenter = (center: LatLngPoint, sizeKm = 1) => {
  const lat = toFiniteNumber(center?.lat);
  const lng = toFiniteNumber(center?.lng);

  if (lat === null || lng === null) return [];

  const safeSizeKm = Math.max(0.2, sizeKm);
  const halfLatOffset = safeSizeKm / 2 / 111;
  const lngDivider = 111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  const halfLngOffset = safeSizeKm / 2 / lngDivider;

  return [
    { lat: formatCoordinate(lat - halfLatOffset), lng: formatCoordinate(lng - halfLngOffset) },
    { lat: formatCoordinate(lat + halfLatOffset), lng: formatCoordinate(lng - halfLngOffset) },
    { lat: formatCoordinate(lat + halfLatOffset), lng: formatCoordinate(lng + halfLngOffset) },
    { lat: formatCoordinate(lat - halfLatOffset), lng: formatCoordinate(lng + halfLngOffset) },
  ];
};

const getZoneValidPoints = (zone: any) => {
  const polygon = Array.isArray(zone?.polygon) ? zone.polygon : [];
  return polygon.map(getValidPoint).filter(Boolean) as { lat: number; lng: number }[];
};

export default function EditBranchStepTwo({ data, setData }: any) {
  const t = useTranslations("branches");

  const [mapsReady, setMapsReady] = useState(false);
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsError, setMapsError] = useState("");
  const [activeZoneIndex, setActiveZoneIndex] = useState(0);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const [mapSearchError, setMapSearchError] = useState("");
  const [selectedMapLocation, setSelectedMapLocation] =
    useState<LatLngPoint | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapSearchInputRef = useRef<HTMLInputElement | null>(null);
  const mapAutocompleteRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const polygonMarkersRef = useRef<any[]>([]);
  const branchMarkerRef = useRef<any>(null);

  const safeData = data || {};

  const settings = safeData.settings || {};
  const delivery = settings.deliveryConfig || {};
  const branchAddress = safeData.address || {};

  const deliveryMode: DeliveryMode =
    delivery.mode === "ZONE" ||
    delivery.mode === "ZONE_BANDS" ||
    delivery.mode === "POSTAL_CODE"
      ? delivery.mode
      : "RADIUS";

  const zones = Array.isArray(delivery.zones) ? delivery.zones : [];
  const zoneBands = Array.isArray(delivery.zoneBands) ? delivery.zoneBands : [];
  const postalCodeRules = Array.isArray(delivery.postalCodeRules)
    ? delivery.postalCodeRules
    : [];

  const branchCoordinates = useMemo(() => {
    const lat = toFiniteNumber(branchAddress?.lat ?? safeData?.lat);
    const lng = toFiniteNumber(branchAddress?.lng ?? safeData?.lng);

    if (lat === null || lng === null) return null;

    return { lat, lng };
  }, [branchAddress?.lat, branchAddress?.lng, safeData?.lat, safeData?.lng]);

  const mapCenter = branchCoordinates || DEFAULT_MAP_CENTER;
  const shouldShowMap = deliveryMode === "RADIUS" || deliveryMode === "ZONE";

  const update = (path: string[], value: any) => {
    const newData = { ...data };
    let obj: any = newData;

    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      obj[key] = {
        ...(obj[key] || {}),
      };
      obj = obj[key];
    }

    obj[path[path.length - 1]] = value;
    setData(newData);
  };

  const updateDeliveryConfig = (key: string, value: any) => {
    update(["settings", "deliveryConfig", key], value);
  };

  const toggleArrayValue = (key: string, value: string) => {
    const current = Array.isArray(settings[key]) ? settings[key] : [];

    const updated = current.includes(value)
      ? current.filter((entry: string) => entry !== value)
      : [...current, value];

    update(["settings", key], updated);
  };

  const updateZone = (index: number, key: string, value: any) => {
    const nextZones = zones.map((zone: any, zoneIndex: number) =>
      zoneIndex === index
        ? {
            ...zone,
            [key]: value,
          }
        : zone
    );

    updateDeliveryConfig("zones", nextZones);
  };

  const addZone = () => {
    const nextZones = [
      ...zones,
      createDefaultZone(toNumber(delivery.deliveryFee, 0), branchCoordinates),
    ];

    updateDeliveryConfig("zones", nextZones);
    setActiveZoneIndex(nextZones.length - 1);
  };

  const duplicateZone = (index: number) => {
    const source = zones[index];

    if (!source) return;

    const clonedZone = {
      ...source,
      name: source?.name ? `${source.name} Copy` : "Zone Copy",
      polygon: Array.isArray(source?.polygon)
        ? source.polygon.map((point: any) => ({ ...point }))
        : [],
    };

    const nextZones = [...zones];
    nextZones.splice(index + 1, 0, clonedZone);
    updateDeliveryConfig("zones", nextZones);
    setActiveZoneIndex(index + 1);
  };

  const removeZone = (index: number) => {
    const nextZones = zones.filter((_: any, zoneIndex: number) => zoneIndex !== index);

    updateDeliveryConfig("zones", nextZones);
    setActiveZoneIndex((prev) => Math.max(0, Math.min(prev, nextZones.length - 1)));
  };

  const updateZonePoint = (
    zoneIndex: number,
    pointIndex: number,
    key: LatLngKey,
    value: string | number
  ) => {
    const nextZones = zones.map((zone: any, currentZoneIndex: number) => {
      if (currentZoneIndex !== zoneIndex) return zone;

      const polygon = Array.isArray(zone?.polygon) ? zone.polygon : [];

      return {
        ...zone,
        polygon: polygon.map((point: any, currentPointIndex: number) =>
          currentPointIndex === pointIndex
            ? {
                ...point,
                [key]: String(value),
              }
            : point
        ),
      };
    });

    updateDeliveryConfig("zones", nextZones);
  };

  const addZonePoint = (zoneIndex: number, point?: LatLngPoint | null) => {
    const nextZones = zones.map((zone: any, currentZoneIndex: number) => {
      if (currentZoneIndex !== zoneIndex) return zone;

      const polygon = Array.isArray(zone?.polygon) ? zone.polygon : [];
      const nextPoint = point
        ? {
            lat: String(point.lat),
            lng: String(point.lng),
          }
        : {
            lat: "",
            lng: "",
          };

      return {
        ...zone,
        polygon: [...polygon, nextPoint],
      };
    });

    updateDeliveryConfig("zones", nextZones);
  };

  const removeZonePoint = (zoneIndex: number, pointIndex: number) => {
    const nextZones = zones.map((zone: any, currentZoneIndex: number) => {
      if (currentZoneIndex !== zoneIndex) return zone;

      const polygon = Array.isArray(zone?.polygon) ? zone.polygon : [];

      return {
        ...zone,
        polygon: polygon.filter(
          (_: any, currentPointIndex: number) => currentPointIndex !== pointIndex
        ),
      };
    });

    updateDeliveryConfig("zones", nextZones);
  };

  const clearZonePoints = (zoneIndex: number) => {
    const nextZones = zones.map((zone: any, currentZoneIndex: number) => {
      if (currentZoneIndex !== zoneIndex) return zone;

      return {
        ...zone,
        polygon: [],
      };
    });

    updateDeliveryConfig("zones", nextZones);
  };

  const updateActiveZonePolygon = (polygon: LatLngPoint[]) => {
    if (!zones.length) {
      updateDeliveryConfig("zones", [
        {
          ...createDefaultZone(toNumber(delivery.deliveryFee, 0)),
          name: "Delivery Zone 1",
          polygon,
        },
      ]);
      setActiveZoneIndex(0);
      return;
    }

    const safeZoneIndex = Math.min(activeZoneIndex, zones.length - 1);

    const nextZones = zones.map((zone: any, zoneIndex: number) =>
      zoneIndex === safeZoneIndex
        ? {
            ...zone,
            polygon,
          }
        : zone
    );

    updateDeliveryConfig("zones", nextZones);
  };

  const getMapCenterPoint = () => {
    const center = mapInstanceRef.current?.getCenter?.();
    const lat = center?.lat?.();
    const lng = center?.lng?.();

    if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
      return {
        lat: formatCoordinate(Number(lat)),
        lng: formatCoordinate(Number(lng)),
      };
    }

    return branchCoordinates || DEFAULT_MAP_CENTER;
  };

  const panMapToPoint = (point: LatLngPoint, zoom = 15) => {
    const lat = toFiniteNumber(point?.lat);
    const lng = toFiniteNumber(point?.lng);

    if (lat === null || lng === null || !mapInstanceRef.current) return;

    const position = { lat, lng };

    mapInstanceRef.current.panTo(position);
    mapInstanceRef.current.setZoom(zoom);
  };

  const addMapCenterPointToActiveZone = () => {
    const center = getMapCenterPoint();

    if (!zones.length) {
      updateDeliveryConfig("zones", [
        {
          ...createDefaultZone(toNumber(delivery.deliveryFee, 0)),
          name: "Delivery Zone 1",
          polygon: [
            {
              lat: String(center.lat),
              lng: String(center.lng),
            },
          ],
        },
      ]);
      setActiveZoneIndex(0);
      return;
    }

    addZonePoint(Math.min(activeZoneIndex, zones.length - 1), center);
  };

  const undoLastZonePoint = () => {
    if (!zones.length) return;

    const safeZoneIndex = Math.min(activeZoneIndex, zones.length - 1);
    const zone = zones[safeZoneIndex];
    const polygon = Array.isArray(zone?.polygon) ? zone.polygon : [];

    if (!polygon.length) return;

    updateActiveZonePolygon(polygon.slice(0, -1));
  };

  const generatePolygonAroundSelectedLocation = () => {
    const center = selectedMapLocation || getMapCenterPoint();
    const polygon = createPolygonAroundCenter(center, 1);

    if (!polygon.length) return;

    updateActiveZonePolygon(polygon);
    panMapToPoint(center, 15);
  };

  const fitActiveZoneOnMap = () => {
    if (!window.google?.maps || !mapInstanceRef.current) return;

    const zone = zones[Math.min(activeZoneIndex, Math.max(0, zones.length - 1))];
    const points = getZoneValidPoints(zone);

    if (!points.length) {
      panMapToPoint(branchCoordinates || DEFAULT_MAP_CENTER, branchCoordinates ? 14 : 12);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    points.forEach((point) => bounds.extend(point));
    mapInstanceRef.current.fitBounds(bounds);
  };

  const applyMapPlace = (place: any) => {
    const location = place?.geometry?.location;

    const lat = location?.lat?.();
    const lng = location?.lng?.();

    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
      setMapSearchError("Please select a valid Google Maps location.");
      return false;
    }

    const point = {
      lat: formatCoordinate(Number(lat)),
      lng: formatCoordinate(Number(lng)),
    };

    const label =
      place?.formatted_address || place?.name || `${point.lat}, ${point.lng}`;

    setSelectedMapLocation(point);
    setMapSearchQuery(label);
    setMapSearchError("");
    panMapToPoint(point, 15);

    return true;
  };

  const handleMapSearch = () => {
    const query = mapSearchQuery.trim();

    if (!query) {
      setMapSearchError(t("searchAreaFirst"));
      return;
    }

    if (!window.google?.maps?.Geocoder) {
      setMapSearchError("Google Maps is not ready yet.");
      return;
    }

    setMapSearchLoading(true);
    setMapSearchError("");

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ address: query }, (results: any, status: string) => {
      if (status === "OK" && results?.[0]) {
        applyMapPlace(results[0]);
      } else {
        setMapSearchError("No matching location found. Try a more specific address.");
      }

      setMapSearchLoading(false);
    });
  };

  const handleMapSearchKeyDown = (event: any) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    handleMapSearch();
  };

  const updateZoneBand = (index: number, key: string, value: any) => {
    const nextBands = zoneBands.map((band: any, bandIndex: number) =>
      bandIndex === index
        ? {
            ...band,
            [key]: value,
          }
        : band
    );

    updateDeliveryConfig("zoneBands", nextBands);
  };

  const addZoneBand = () => {
    const lastBand = zoneBands[zoneBands.length - 1];
    const nextFromKm = lastBand ? toNumber(lastBand.toKm, 0) : 0;

    updateDeliveryConfig("zoneBands", [
      ...zoneBands,
      createDefaultZoneBand(nextFromKm, toNumber(delivery.deliveryFee, 0)),
    ]);
  };

  const duplicateZoneBand = (index: number) => {
    const source = zoneBands[index];

    if (!source) return;

    const nextBands = [...zoneBands];
    nextBands.splice(index + 1, 0, { ...source });
    updateDeliveryConfig("zoneBands", nextBands);
  };

  const removeZoneBand = (index: number) => {
    updateDeliveryConfig(
      "zoneBands",
      zoneBands.filter((_: any, bandIndex: number) => bandIndex !== index)
    );
  };

  const updatePostalRule = (index: number, key: string, value: any) => {
    const nextRules = postalCodeRules.map((rule: any, ruleIndex: number) =>
      ruleIndex === index
        ? {
            ...rule,
            [key]: value,
          }
        : rule
    );

    updateDeliveryConfig("postalCodeRules", nextRules);
  };

  const addPostalRule = () => {
    updateDeliveryConfig("postalCodeRules", [
      ...postalCodeRules,
      createDefaultPostalCodeRule(toNumber(delivery.deliveryFee, 0)),
    ]);
  };

  const duplicatePostalRule = (index: number) => {
    const source = postalCodeRules[index];

    if (!source) return;

    const nextRules = [...postalCodeRules];
    nextRules.splice(index + 1, 0, {
      ...source,
      postalCode: "",
    });

    updateDeliveryConfig("postalCodeRules", nextRules);
  };

  const removePostalRule = (index: number) => {
    updateDeliveryConfig(
      "postalCodeRules",
      postalCodeRules.filter((_: any, ruleIndex: number) => ruleIndex !== index)
    );
  };

  const clearMapOverlays = () => {
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }

    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }

    polygonMarkersRef.current.forEach((marker) => marker.setMap(null));
    polygonMarkersRef.current = [];
  };

  const renderBranchMarker = () => {
    if (!window.google?.maps || !mapInstanceRef.current || !branchCoordinates) {
      if (branchMarkerRef.current) {
        branchMarkerRef.current.setMap(null);
        branchMarkerRef.current = null;
      }
      return;
    }

    const position = {
      lat: branchCoordinates.lat,
      lng: branchCoordinates.lng,
    };

    if (!branchMarkerRef.current) {
      branchMarkerRef.current = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: "Branch location",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#111827",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
    } else {
      branchMarkerRef.current.setPosition(position);
      branchMarkerRef.current.setMap(mapInstanceRef.current);
    }
  };

  const renderRadiusOverlay = () => {
    if (!window.google?.maps || !mapInstanceRef.current) return;

    const center = branchCoordinates || DEFAULT_MAP_CENTER;
    const radiusMeters = Math.max(0.1, toNumber(delivery.radiusKm, 0)) * 1000;

    circleRef.current = new window.google.maps.Circle({
      map: mapInstanceRef.current,
      center,
      radius: radiusMeters,
      fillColor: "#2563eb",
      fillOpacity: 0.12,
      strokeColor: "#2563eb",
      strokeOpacity: 0.7,
      strokeWeight: 2,
    });

    mapInstanceRef.current.panTo(center);

    if (radiusMeters > 0) {
      const bounds = circleRef.current.getBounds?.();
      if (bounds) {
        mapInstanceRef.current.fitBounds(bounds);
      }
    }
  };

  const renderZoneOverlay = () => {
    if (!window.google?.maps || !mapInstanceRef.current) return;

    const zone = zones[activeZoneIndex];
    const points = Array.isArray(zone?.polygon)
      ? zone.polygon.map(getValidPoint).filter(Boolean)
      : [];

    if (!points.length) {
      mapInstanceRef.current.panTo(branchCoordinates || DEFAULT_MAP_CENTER);
      mapInstanceRef.current.setZoom(branchCoordinates ? 14 : 12);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();

    points.forEach((point: any, pointIndex: number) => {
      bounds.extend(point);

      const marker = new window.google.maps.Marker({
        position: point,
        map: mapInstanceRef.current,
        draggable: true,
        label: String(pointIndex + 1),
        title: `Point ${pointIndex + 1}`,
      });

      marker.addListener("dragend", () => {
        const position = marker.getPosition?.();
        const lat = position?.lat?.();
        const lng = position?.lng?.();

        if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
          updateZonePoint(activeZoneIndex, pointIndex, "lat", Number(lat).toFixed(6));
          updateZonePoint(activeZoneIndex, pointIndex, "lng", Number(lng).toFixed(6));
        }
      });

      polygonMarkersRef.current.push(marker);
    });

    if (points.length >= 3) {
      polygonRef.current = new window.google.maps.Polygon({
        paths: points,
        map: mapInstanceRef.current,
        fillColor: "#2563eb",
        fillOpacity: 0.12,
        strokeColor: "#2563eb",
        strokeOpacity: 0.85,
        strokeWeight: 2,
      });
    }

    mapInstanceRef.current.fitBounds(bounds);
  };

  /* ---------------- GOOGLE MAPS SCRIPT ---------------- */

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.maps) {
      setMapsReady(true);
      setMapsLoading(false);
      setMapsError("");
      return;
    }

    if (!isGoogleMapsKeyConfigured()) {
      setMapsReady(false);
      setMapsLoading(false);
      setMapsError(
        "Google Maps API key is missing. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in env."
      );
      return;
    }

    const existingScript = document.getElementById(
      GOOGLE_MAPS_SCRIPT_ID
    ) as HTMLScriptElement | null;

    const handleLoad = () => {
      setMapsReady(true);
      setMapsLoading(false);
      setMapsError("");
    };

    const handleError = () => {
      setMapsReady(false);
      setMapsLoading(false);
      setMapsError("Failed to load Google Maps. Please verify the API key.");
    };

    setMapsLoading(true);

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad);
      existingScript.addEventListener("error", handleError);

      if (window.google?.maps) {
        handleLoad();
      }

      return () => {
        existingScript.removeEventListener("load", handleLoad);
        existingScript.removeEventListener("error", handleError);
      };
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      GOOGLE_MAPS_API_KEY
    )}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
  }, []);

  /* ---------------- GOOGLE MAP SEARCH / AUTOCOMPLETE ---------------- */

  useEffect(() => {
    if (!mapsReady || !shouldShowMap || !mapSearchInputRef.current) return;
    if (!window.google?.maps?.places?.Autocomplete) return;
    if (mapAutocompleteRef.current) return;

    mapAutocompleteRef.current = new window.google.maps.places.Autocomplete(
      mapSearchInputRef.current,
      {
        fields: ["formatted_address", "geometry", "name", "place_id"],
        types: ["geocode"],
      }
    );

    mapAutocompleteRef.current.addListener("place_changed", () => {
      const place = mapAutocompleteRef.current?.getPlace?.();

      if (!place?.geometry) {
        setMapSearchError("Please select a location from Google suggestions.");
        return;
      }

      applyMapPlace(place);
    });

    return () => {
      if (window.google?.maps?.event && mapAutocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(mapAutocompleteRef.current);
      }

      mapAutocompleteRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsReady, shouldShowMap]);

  /* ---------------- GOOGLE MAP INIT ---------------- */

  useEffect(() => {
    if (!mapsReady || !shouldShowMap || !mapContainerRef.current) return;
    if (!window.google?.maps?.Map) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center: mapCenter,
        zoom: branchCoordinates ? 14 : 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        clickableIcons: false,
        draggableCursor: deliveryMode === "ZONE" ? "crosshair" : undefined,
      });
    }

    mapInstanceRef.current.setOptions({
      draggableCursor: deliveryMode === "ZONE" ? "crosshair" : undefined,
    });
  }, [mapsReady, shouldShowMap, mapCenter, branchCoordinates, deliveryMode]);

  /* ---------------- GOOGLE MAP OVERLAYS ---------------- */

  useEffect(() => {
    if (!mapsReady || !shouldShowMap || !mapInstanceRef.current) return;
    if (!window.google?.maps) return;

    clearMapOverlays();
    renderBranchMarker();

    window.google.maps.event.clearListeners(mapInstanceRef.current, "click");

    if (deliveryMode === "RADIUS") {
      renderRadiusOverlay();
      return;
    }

    renderZoneOverlay();

    mapInstanceRef.current.addListener("click", (event: any) => {
      const lat = event?.latLng?.lat?.();
      const lng = event?.latLng?.lng?.();

      if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return;

      const point = {
        lat: formatCoordinate(Number(lat)),
        lng: formatCoordinate(Number(lng)),
      };

      setSelectedMapLocation(point);
      setMapSearchError("");

      if (!zones.length) {
        updateDeliveryConfig("zones", [
          {
            ...createDefaultZone(toNumber(delivery.deliveryFee, 0)),
            name: "Delivery Zone 1",
            polygon: [point],
          },
        ]);
        setActiveZoneIndex(0);
        return;
      }

      const safeZoneIndex = Math.min(activeZoneIndex, zones.length - 1);
      addZonePoint(safeZoneIndex, point);
    });

    return () => {
      if (window.google?.maps?.event && mapInstanceRef.current) {
        window.google.maps.event.clearListeners(mapInstanceRef.current, "click");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mapsReady,
    shouldShowMap,
    deliveryMode,
    delivery.radiusKm,
    activeZoneIndex,
    zones,
    branchCoordinates,
  ]);

  useEffect(() => {
    if (activeZoneIndex <= zones.length - 1) return;
    setActiveZoneIndex(Math.max(0, zones.length - 1));
  }, [activeZoneIndex, zones.length]);

  const renderDeliveryMap = () => {
    if (!shouldShowMap) return null;

    const safeActiveZoneIndex = Math.min(activeZoneIndex, Math.max(0, zones.length - 1));
    const activeZone = zones[safeActiveZoneIndex];
    const activeZonePoints = Array.isArray(activeZone?.polygon)
      ? activeZone.polygon
      : [];

    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {deliveryMode === "RADIUS" ? t("radiusMapPreview") : t("polygonZoneBuilder")}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {deliveryMode === "RADIUS"
                ? t("radiusMapDescription")
                : t("polygonMapDescription")}
            </p>
          </div>

          {deliveryMode === "ZONE" && zones.length > 0 ? (
            <select
              value={safeActiveZoneIndex}
              onChange={(event) => setActiveZoneIndex(Number(event.target.value))}
              className="h-10 rounded-full border border-gray-200 bg-white px-4 text-sm outline-none focus:border-primary"
            >
              {zones.map((zone: any, index: number) => (
                <option key={`zone-select-${index}`} value={index}>
                  {zone?.name || t("zoneIndex", { index: index + 1 })} ·{" "}
                  {t("pointsCount", { count: Array.isArray(zone?.polygon) ? zone.polygon.length : 0 })}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        {mapsReady ? (
          <>
            <div className="border-b border-gray-200 bg-white p-4">
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_auto_auto]">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {t("searchAreaAddress")}
                  </label>

                  <div className="relative">
                    <Search
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      ref={mapSearchInputRef}
                      type="text"
                      value={mapSearchQuery}
                      onChange={(event) => {
                        setMapSearchQuery(event.target.value);
                        setMapSearchError("");
                      }}
                      onKeyDown={handleMapSearchKeyDown}
                      placeholder={t("searchAreaPlaceholder")}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                    />

                    {mapSearchLoading ? (
                      <Loader2
                        size={17}
                        className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary"
                      />
                    ) : null}
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleMapSearch}
                    disabled={mapSearchLoading}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary px-4 text-sm font-medium text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 xl:w-auto"
                  >
                    {mapSearchLoading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Search size={15} />
                    )}
                    {t("searchMap")}
                  </button>
                </div>

                {deliveryMode === "ZONE" ? (
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={generatePolygonAroundSelectedLocation}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary/90 xl:w-auto"
                    >
                      <Crosshair size={15} />
                      {t("generateStarterZone")}
                    </button>
                  </div>
                ) : null}
              </div>

              {mapSearchError ? (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{mapSearchError}</span>
                </div>
              ) : null}

              {deliveryMode === "ZONE" ? (
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
                  <button
                    type="button"
                    onClick={addMapCenterPointToActiveZone}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-700 transition hover:bg-white"
                  >
                    <Plus size={14} />
                    {t("addCenterPoint")}
                  </button>

                  <button
                    type="button"
                    onClick={undoLastZonePoint}
                    disabled={!activeZonePoints.length}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Undo2 size={14} />
                    {t("undoLastPoint")}
                  </button>

                  <button
                    type="button"
                    onClick={fitActiveZoneOnMap}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-700 transition hover:bg-white"
                  >
                    <LocateFixed size={14} />
                    {t("fitActiveZone")}
                  </button>

                  <button
                    type="button"
                    onClick={() => clearZonePoints(safeActiveZoneIndex)}
                    disabled={!zones.length || !activeZonePoints.length}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    {t("clearActiveZone")}
                  </button>
                </div>
              ) : null}

              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                {deliveryMode === "ZONE"
                  ? t("polygonRecommendedFlow")
                  : t("radiusCircleDescription")}
              </p>
            </div>

            <div className="relative">
              {deliveryMode === "ZONE" ? (
                <div className="absolute left-4 top-4 z-10 max-w-[280px] rounded-2xl bg-white/95 px-4 py-3 text-xs text-gray-600 shadow-sm ring-1 ring-gray-200">
                  <p className="font-semibold text-gray-900">
                    {t("activeZone")}:{" "}
                    {activeZone?.name || t("zoneIndex", { index: safeActiveZoneIndex + 1 })}
                  </p>
                  <p className="mt-1">
                    {t("activeZonePoints", { count: activeZonePoints.length })}
                  </p>
                </div>
              ) : null}

              <div ref={mapContainerRef} className="h-[420px] w-full" />
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-200 bg-white px-4 py-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {deliveryMode === "RADIUS"
                  ? t("branchLocationFromBasicInfo")
                  : t("mapClicksAddPoints")}
              </span>

              <span className="shrink-0 font-medium text-gray-700">
                {branchCoordinates
                  ? `${branchCoordinates.lat}, ${branchCoordinates.lng}`
                  : t("branchCoordinatesNotSelected")}
              </span>
            </div>
          </>
        ) : (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-5 text-center">
            {mapsLoading ? (
              <>
                <Loader2 className="mb-3 animate-spin text-primary" size={28} />
                <p className="text-sm font-medium text-gray-700">
                  {t("loadingGoogleMap")}
                </p>
              </>
            ) : (
              <>
                <MapPin className="mb-3 text-gray-400" size={30} />
                <p className="text-sm font-medium text-gray-700">
                  {t("googleMapPreviewUnavailable")}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {t("googleMapsApiKeyMissing")}
                </p>
              </>
            )}
          </div>
        )}

        {mapsError ? (
          <div className="flex items-start gap-2 border-t border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{mapsError}</span>
          </div>
        ) : null}
      </div>
    );
  };


  if (!data) return null;

  return (
    <div className="mt-10 space-y-8 rounded-[14px]">
      <Section label={t("allowedOrderTypes")}>
        <div className="flex flex-wrap gap-4">
          {ORDER_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2">
              <Checkbox
                checked={settings.allowedOrderTypes?.includes(type)}
                onCheckedChange={() => toggleArrayValue("allowedOrderTypes", type)}
              />
              <span className="text-sm">{formatLabel(type)}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section label={t("allowedPaymentMethods")}>
        <div className="flex flex-wrap gap-4">
          {PAYMENT_METHODS.map((method) => (
            <label key={method} className="flex items-center gap-2">
              <Checkbox
                checked={settings.allowedPaymentMethods?.includes(method)}
                onCheckedChange={() =>
                  toggleArrayValue("allowedPaymentMethods", method)
                }
              />
              <span className="text-sm">{formatLabel(method)}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section label={t("deliveryConfiguration")}>
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-medium text-gray-900">
              {t("deliveryAreaCalculationMode")}
            </p>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              {DELIVERY_MODES.map((mode) => {
                const active = deliveryMode === mode.value;

                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => updateDeliveryConfig("mode", mode.value)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                        : "border-gray-200 bg-white text-gray-700 hover:border-primary/40"
                    }`}
                  >
                    <span className="block text-sm font-semibold">
                      {t(mode.labelKey)}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                      {t(mode.descriptionKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FormInput
              label={t("baseDeliveryFee")}
              value={toInputNumber(delivery.deliveryFee)}
              onChange={(val) =>
                updateDeliveryConfig("deliveryFee", val ? Number(val) : 0)
              }
            />

            <FormInput
              label={t("radiusKm")}
              value={toInputNumber(delivery.radiusKm)}
              onChange={(val) =>
                updateDeliveryConfig("radiusKm", val ? Number(val) : 0)
              }
            />

            <FormInput
              label={t("minimumOrderAmount")}
              value={toInputNumber(delivery.minOrderAmount)}
              onChange={(val) =>
                updateDeliveryConfig("minOrderAmount", val ? Number(val) : 0)
              }
            />

            <FormInput
              label={t("freeDeliveryThreshold")}
              value={toInputNumber(delivery.freeDeliveryThreshold)}
              onChange={(val) =>
                updateDeliveryConfig(
                  "freeDeliveryThreshold",
                  val ? Number(val) : 0
                )
              }
            />
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-3 rounded-full border border-gray-200 bg-gray-50 px-4 py-2">
            <Checkbox
              checked={Boolean(delivery.isFreeDelivery)}
              onCheckedChange={(val) =>
                updateDeliveryConfig("isFreeDelivery", val === true)
              }
            />
            <span className="text-sm">{t("enableFreeDelivery")}</span>
          </label>

          {renderDeliveryMap()}

          {deliveryMode === "RADIUS" ? (
            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-gray-900">
                {t("radiusDeliveryArea")}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {t("radiusDeliveryAreaDescription")}
              </p>
            </div>
          ) : null}

          {deliveryMode === "ZONE_BANDS" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {t("distanceZoneBands")}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t("distanceZoneBandsDescription")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addZoneBand}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                >
                  <Plus size={15} />
                  {t("addZoneBand")}
                </button>
              </div>

              {zoneBands.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center text-sm text-gray-500">
                  {t("noDistanceBands")}
                </div>
              ) : (
                <div className="space-y-3">
                  {zoneBands.map((band: any, index: number) => (
                    <div
                      key={`zone-band-${index}`}
                      className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 lg:grid-cols-3"
                    >
                      <FormInput
                        label={t("fromKm")}
                        value={toInputNumber(band?.fromKm)}
                        onChange={(val) =>
                          updateZoneBand(index, "fromKm", val ? Number(val) : 0)
                        }
                      />

                      <FormInput
                        label={t("toKm")}
                        value={toInputNumber(band?.toKm)}
                        onChange={(val) =>
                          updateZoneBand(index, "toKm", val ? Number(val) : 0)
                        }
                      />

                      <FormInput
                        label={t("deliveryFee")}
                        value={toInputNumber(band?.deliveryFee)}
                        onChange={(val) =>
                          updateZoneBand(
                            index,
                            "deliveryFee",
                            val ? Number(val) : 0
                          )
                        }
                      />

                      <FormInput
                        label={t("minimumOrderAmount")}
                        value={toInputNumber(band?.minOrderAmount)}
                        onChange={(val) =>
                          updateZoneBand(
                            index,
                            "minOrderAmount",
                            val ? Number(val) : 0
                          )
                        }
                      />

                      <FormInput
                        label={t("freeDeliveryThreshold")}
                        value={toInputNumber(band?.freeDeliveryThreshold)}
                        onChange={(val) =>
                          updateZoneBand(
                            index,
                            "freeDeliveryThreshold",
                            val ? Number(val) : 0
                          )
                        }
                      />

                      <div className="flex items-end gap-2">
                        <button
                          type="button"
                          onClick={() => duplicateZoneBand(index)}
                          className="inline-flex h-11 items-center gap-2 rounded-full border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Copy size={14} />
                          {t("duplicate")}
                        </button>

                        <button
                          type="button"
                          onClick={() => removeZoneBand(index)}
                          className="inline-flex h-11 items-center justify-center rounded-full border border-red-100 bg-red-50 px-4 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {deliveryMode === "ZONE" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {t("polygonDeliveryZones")}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t("polygonDeliveryZonesDescription")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addZone}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                >
                  <Plus size={15} />
                  {t("addZone")}
                </button>
              </div>

              {zones.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center text-sm text-gray-500">
                  {t("noDeliveryZone")}
                </div>
              ) : (
                zones.map((zone: any, zoneIndex: number) => {
                  const polygon = Array.isArray(zone?.polygon)
                    ? zone.polygon
                    : [];

                  return (
                    <div
                      key={`delivery-zone-${zoneIndex}`}
                      className={`rounded-2xl border bg-white p-4 transition ${
                        zoneIndex === activeZoneIndex
                          ? "border-primary/40 ring-1 ring-primary/20"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveZoneIndex(zoneIndex)}
                          className="text-left"
                        >
                          <p className="text-sm font-semibold text-gray-900">
                            {t("zoneIndex", { index: zoneIndex + 1 })}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {zoneIndex === activeZoneIndex
                              ? t("activeOnMap")
                              : t("clickToEditOnMap")}
                          </p>
                        </button>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => clearZonePoints(zoneIndex)}
                            className="inline-flex h-9 items-center gap-2 rounded-full border border-gray-200 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            {t("clearPoints")}
                          </button>

                          <button
                            type="button"
                            onClick={() => duplicateZone(zoneIndex)}
                            className="inline-flex h-9 items-center gap-2 rounded-full border border-gray-200 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <Copy size={13} />
                            {t("duplicate")}
                          </button>

                          <button
                            type="button"
                            onClick={() => removeZone(zoneIndex)}
                            className="inline-flex h-9 items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 text-xs font-medium text-red-600 hover:bg-red-100"
                          >
                            <Trash2 size={13} />
                            {t("remove")}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <FormInput
                          label={t("zoneName")}
                          value={zone?.name || ""}
                          onChange={(val) => updateZone(zoneIndex, "name", val)}
                        />

                        <FormInput
                          label={t("zoneDeliveryFee")}
                          value={toInputNumber(zone?.deliveryFee)}
                          onChange={(val) =>
                            updateZone(
                              zoneIndex,
                              "deliveryFee",
                              val ? Number(val) : 0
                            )
                          }
                        />

                        <FormInput
                          label={t("zoneMinimumOrderAmount")}
                          value={toInputNumber(zone?.minOrderAmount)}
                          onChange={(val) =>
                            updateZone(
                              zoneIndex,
                              "minOrderAmount",
                              val ? Number(val) : 0
                            )
                          }
                        />

                        <FormInput
                          label={t("zoneFreeDeliveryThreshold")}
                          value={toInputNumber(zone?.freeDeliveryThreshold)}
                          onChange={(val) =>
                            updateZone(
                              zoneIndex,
                              "freeDeliveryThreshold",
                              val ? Number(val) : 0
                            )
                          }
                        />
                      </div>

                      <div className="mt-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {t("polygonPoints")}
                          </p>

                          <button
                            type="button"
                            onClick={() => addZonePoint(zoneIndex)}
                            className="inline-flex items-center gap-1 rounded-full border border-primary/20 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/5"
                          >
                            <Plus size={13} />
                            {t("addEmptyPoint")}
                          </button>
                        </div>

                        <div className="space-y-2">
                          {polygon.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                              {t("noPolygonPoints")}
                            </div>
                          ) : (
                            polygon.map((point: any, pointIndex: number) => (
                              <div
                                key={`zone-${zoneIndex}-point-${pointIndex}`}
                                className="grid grid-cols-1 gap-2 rounded-xl bg-gray-50 p-3 sm:grid-cols-[80px_1fr_1fr_auto]"
                              >
                                <div className="flex items-center text-xs font-medium text-gray-500">
                                  {t("pointIndex", { index: pointIndex + 1 })}
                                </div>

                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={point?.lat ?? ""}
                                  onChange={(event) =>
                                    updateZonePoint(
                                      zoneIndex,
                                      pointIndex,
                                      "lat",
                                      event.target.value
                                    )
                                  }
                                  placeholder={t("latitude")}
                                  className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-primary"
                                />

                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={point?.lng ?? ""}
                                  onChange={(event) =>
                                    updateZonePoint(
                                      zoneIndex,
                                      pointIndex,
                                      "lng",
                                      event.target.value
                                    )
                                  }
                                  placeholder={t("longitude")}
                                  className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-primary"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeZonePoint(zoneIndex, pointIndex)
                                  }
                                  disabled={polygon.length <= 3}
                                  className="inline-flex h-10 items-center justify-center rounded-lg border border-red-100 bg-red-50 px-3 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : null}

          {deliveryMode === "POSTAL_CODE" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {t("postalCodeRules")}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t("postalCodeRulesDescription")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addPostalRule}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                >
                  <Plus size={15} />
                  {t("addPostalCode")}
                </button>
              </div>

              {postalCodeRules.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center text-sm text-gray-500">
                  {t("noPostalCodeRule")}
                </div>
              ) : (
                <div className="space-y-3">
                  {postalCodeRules.map((rule: any, index: number) => (
                    <div
                      key={`postal-rule-${index}`}
                      className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 lg:grid-cols-[1fr_1fr_auto]"
                    >
                      <FormInput
                        label={t("postalCode")}
                        value={rule?.postalCode || ""}
                        onChange={(val) =>
                          updatePostalRule(index, "postalCode", val)
                        }
                      />

                      <FormInput
                        label={t("deliveryFee")}
                        value={toInputNumber(rule?.deliveryFee)}
                        onChange={(val) =>
                          updatePostalRule(
                            index,
                            "deliveryFee",
                            val ? Number(val) : 0
                          )
                        }
                      />

                      <div className="flex items-end gap-2">
                        <button
                          type="button"
                          onClick={() => duplicatePostalRule(index)}
                          className="inline-flex h-11 items-center gap-2 rounded-full border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Copy size={14} />
                          {t("duplicate")}
                        </button>

                        <button
                          type="button"
                          onClick={() => removePostalRule(index)}
                          className="inline-flex h-11 items-center justify-center rounded-full border border-red-100 bg-red-50 px-4 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </Section>

      <Section label={t("automation")}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <label className="flex min-h-[88px] cursor-pointer items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 transition hover:border-primary/30 hover:bg-primary/5">
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-gray-900">
                {t("autoAcceptOrders")}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                {t("autoAcceptOrdersDescription")}
              </span>
            </span>
            <Checkbox
              checked={Boolean(settings.automation?.autoAcceptOrders)}
              onCheckedChange={(val) =>
                update(["settings", "automation", "autoAcceptOrders"], val === true)
              }
            />
          </label>

          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
            <FormInput
              label={t("estimatedPrepTimeMinutes")}
              value={toInputNumber(settings.automation?.estimatedPrepTime)}
              onChange={(val) =>
                update(
                  ["settings", "automation", "estimatedPrepTime"],
                  val ? Number(val) : 0
                )
              }
            />
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              {t("estimatedPrepTimeDescription")}
            </p>
          </div>
        </div>
      </Section>

      {/* Taxation is intentionally hidden for now. */}
    </div>
  );
}
