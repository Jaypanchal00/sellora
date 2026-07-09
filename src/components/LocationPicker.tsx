import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";

// Fix leaflet default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationPickerProps {
  value: string;
  onChange: (location: string) => void;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

function MapEvents({ setPosition, onLocationSelected }: { 
  setPosition: (pos: [number, number]) => void;
  onLocationSelected: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>([23.0225, 72.5714]); // Default to Ahmedabad
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const debouncedQuery = useDebounce(query, 500);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update query when value prop changes externally (e.g. initial load)
  useEffect(() => {
    if (value && value !== query) {
      setQuery(value);
    }
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Autocomplete Suggestions
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery === value) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    let active = true;
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedQuery)}&limit=5&addressdetails=1`);
        const data = await res.json();
        if (active) {
          // Format suggestions nicely
          const formatted = data.map((d: any) => {
            const addr = d.address || {};
            const city = addr.city || addr.town || addr.village || addr.county || "";
            const state = addr.state || "";
            const name = addr.road || addr.suburb || addr.neighbourhood || "";
            
            let displayName = d.display_name;
            if (city && state) {
              displayName = name ? `${name}, ${city}, ${state}` : `${city}, ${state}`;
            }
            return {
              display_name: displayName,
              lat: d.lat,
              lon: d.lon,
            };
          });
          
          setSuggestions(formatted);
          setShowDropdown(formatted.length > 0);
        }
      } catch (err) {
        console.error("Geocoding error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSuggestions();
    return () => { active = false; };
  }, [debouncedQuery, value]);

  const handleSuggestionClick = (s: Suggestion) => {
    const lat = parseFloat(s.lat);
    const lon = parseFloat(s.lon);
    setPosition([lat, lon]);
    setQuery(s.display_name);
    onChange(s.display_name);
    setShowDropdown(false);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.village || addr.county || "";
        const state = addr.state || "";
        const name = addr.road || addr.suburb || addr.neighbourhood || "";
        
        let simpleName = data.display_name;
        if (city && state) {
          simpleName = name ? `${name}, ${city}, ${state}` : `${city}, ${state}`;
        } else if (city || state) {
          simpleName = city || state;
        }

        setQuery(simpleName);
        onChange(simpleName);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setPosition([lat, lon]);
        reverseGeocode(lat, lon);
        setLoading(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Could not get your current location. Please check browser permissions.");
        setLoading(false);
      }
    );
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="relative z-20" ref={dropdownRef}>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            placeholder="Search city, neighborhood, or drop a pin..."
            className="h-12 pl-10 pr-24 bg-white border-slate-200"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : (
              <button
                type="button"
                onClick={getCurrentLocation}
                className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
              >
                Locate Me
              </button>
            )}
          </div>
        </div>
        
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-start gap-2"
              >
                <MapPin className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
                <span className="text-sm text-slate-700 line-clamp-2">{s.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-[250px] w-full rounded-xl overflow-hidden border border-slate-200 z-10 relative bg-slate-100">
        <MapContainer 
          key={`${position[0]}-${position[1]}`} 
          center={position} 
          zoom={13} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            subdomains={['mt0','mt1','mt2','mt3']}
          />
          <Marker position={position} />
          <MapEvents 
            setPosition={setPosition} 
            onLocationSelected={reverseGeocode} 
          />
        </MapContainer>
        <div className="absolute bottom-2 right-2 z-[400] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm text-xs font-semibold text-slate-600 pointer-events-none">
          Click map to drop pin
        </div>
      </div>
    </div>
  );
}
