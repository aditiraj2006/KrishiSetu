import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  BookmarkCheck,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Cloud,
  CloudLightning,
  CloudRain,
  Compass,
  Droplets,
  Info,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Snowflake,
  Sparkles,
  Sprout,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

export interface AdvisoryItem {
  id: string;
  category: string;
  severity: "danger" | "warning" | "info" | "success";
  title: string;
  description: string;
  action: string;
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  rainfallMm: number;
  description: string;
  icon: string;
  mainCondition: string;
  locationName: string;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  tempMin: number;
  tempMax: number;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  rainfallMm: number;
  mainCondition: string;
  description: string;
  icon: string;
  advisories: AdvisoryItem[];
}

export interface WeatherResponse {
  location: {
    district: string;
    state?: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: CurrentWeather;
  forecast: DailyForecast[];
  advisories: AdvisoryItem[];
  provider: "OpenWeatherMap" | "Location-Aware Engine";
}

const POPULAR_DISTRICTS = [
  { name: "Pune", state: "Maharashtra" },
  { name: "Nashik", state: "Maharashtra" },
  { name: "Nagpur", state: "Maharashtra" },
  { name: "Ludhiana", state: "Punjab" },
  { name: "Karnal", state: "Haryana" },
  { name: "Guntur", state: "Andhra Pradesh" },
  { name: "Patna", state: "Bihar" },
  { name: "Jaipur", state: "Rajasthan" },
  { name: "Bengaluru", state: "Karnataka" },
  { name: "Indore", state: "Madhya Pradesh" },
  { name: "Shimla", state: "Himachal Pradesh" },
  { name: "Varanasi", state: "Uttar Pradesh" },
];

export function WeatherWidget({ className = "" }: { className?: string }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    user?.preferredDistrict || user?.location || "Pune"
  );
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [customSearch, setCustomSearch] = useState<string>("");
  const [usingGeo, setUsingGeo] = useState<boolean>(false);
  const [savingDistrict, setSavingDistrict] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"advisories" | "forecast">("advisories");

  useEffect(() => {
    if (user?.preferredDistrict) {
      setSelectedDistrict(user.preferredDistrict);
    }
  }, [user?.preferredDistrict]);

  const fetchWeather = async (district?: string, lat?: number, lon?: number) => {
    setLoading(true);
    setError(null);
    try {
      let url = "/api/weather";
      const params = new URLSearchParams();
      if (lat !== undefined && lon !== undefined) {
        params.append("lat", lat.toString());
        params.append("lon", lon.toString());
      } else if (district) {
        params.append("district", district);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load weather data");
      const data: WeatherResponse = await res.json();
      setWeatherData(data);
      if (data.location?.district) {
        setSelectedDistrict(data.location.district);
      }
    } catch (err: any) {
      console.error("Error loading weather:", err);
      setError(err.message || "Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(selectedDistrict);
  }, []);

  const handleUseGeolocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser does not support automatic location detection.",
        variant: "destructive",
      });
      return;
    }

    setUsingGeo(true);
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUsingGeo(false);
        fetchWeather(undefined, pos.coords.latitude, pos.coords.longitude);
        toast({
          title: "Location Detected",
          description: "Loaded weather for your current coordinates.",
        });
      },
      (geoErr) => {
        setUsingGeo(false);
        setLoading(false);
        toast({
          title: "Location Access Denied",
          description: "Could not access browser location. Please choose a district manually.",
          variant: "destructive",
        });
      },
      { timeout: 10000 }
    );
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    setSavedSuccess(false);
    fetchWeather(district);
  };

  const handleCustomSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSearch.trim()) return;
    handleDistrictChange(customSearch.trim());
    setCustomSearch("");
  };

  const handleSavePreferredDistrict = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to save your preferred district.",
      });
      return;
    }

    setSavingDistrict(true);
    try {
      await apiRequest("PATCH", "/api/user/preferred-district", {
        district: selectedDistrict,
      });
      await refreshUser();
      setSavedSuccess(true);
      toast({
        title: "Preference Saved",
        description: `${selectedDistrict} set as your default agricultural district.`,
      });
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Could not save district preference.",
        variant: "destructive",
      });
    } finally {
      setSavingDistrict(false);
    }
  };

  const getWeatherIcon = (condition: string, iconCode?: string) => {
    const c = condition.toLowerCase();
    if (c.includes("rain") || c.includes("drizzle")) return <CloudRain className="h-6 w-6 text-blue-500 animate-pulse" />;
    if (c.includes("thunder") || c.includes("lightning")) return <CloudLightning className="h-6 w-6 text-yellow-500" />;
    if (c.includes("snow") || c.includes("frost")) return <Snowflake className="h-6 w-6 text-cyan-400" />;
    if (c.includes("cloud")) return <Cloud className="h-6 w-6 text-slate-400" />;
    return <Sun className="h-6 w-6 text-amber-500 animate-spin-slow" />;
  };

  const getSeverityBadge = (severity: AdvisoryItem["severity"]) => {
    switch (severity) {
      case "danger":
        return <Badge className="bg-red-500 hover:bg-red-600 text-white font-medium">Critical Action</Badge>;
      case "warning":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-medium">Precaution</Badge>;
      case "info":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-medium">Advisory</Badge>;
      case "success":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">Favorable</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className={`border-emerald-200 dark:border-emerald-900/40 shadow-lg bg-gradient-to-br from-emerald-50/40 via-background to-teal-50/30 dark:from-emerald-950/20 dark:to-background ${className}`}>
      <CardHeader className="pb-3 border-b border-emerald-100 dark:border-emerald-900/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2 text-foreground">
                Location Crop Advisory & Weather
                <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time weather insights paired with actionable farming recommendations
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUseGeolocation}
              disabled={usingGeo || loading}
              className="h-8 text-xs gap-1.5 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100/50"
            >
              <Compass className={`h-3.5 w-3.5 text-emerald-600 ${usingGeo ? "animate-spin" : ""}`} />
              {usingGeo ? "Detecting..." : "GPS Location"}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => fetchWeather(selectedDistrict)}
              disabled={loading}
              title="Refresh weather data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* District Selector & Custom Search */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-6">
            <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
              <SelectTrigger className="h-9 text-xs border-emerald-200 dark:border-emerald-800 bg-background/80">
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                  <SelectValue placeholder="Select Agricultural District" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {POPULAR_DISTRICTS.map((d) => (
                  <SelectItem key={d.name} value={d.name} className="text-xs">
                    {d.name}, <span className="text-muted-foreground">{d.state}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <form onSubmit={handleCustomSearchSubmit} className="sm:col-span-6 flex gap-1.5">
            <Input
              placeholder="Search district name..."
              value={customSearch}
              onChange={(e) => setCustomSearch(e.target.value)}
              className="h-9 text-xs border-emerald-200 dark:border-emerald-800 bg-background/80"
            />
            <Button type="submit" size="sm" className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Search className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
            <span>Fetching real-time weather & calculating crop advisories...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : weatherData ? (
          <>
            {/* Top Weather Overview Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
                <Sun className="w-48 h-48" />
              </div>

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-100 text-xs font-medium uppercase tracking-wider">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>
                      {weatherData.location.district}
                      {weatherData.location.state ? `, ${weatherData.location.state}` : ""}
                    </span>
                    <Badge variant="outline" className="border-emerald-300 text-emerald-100 text-[10px] py-0">
                      {weatherData.provider}
                    </Badge>
                  </div>

                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-4xl md:text-5xl font-extrabold tracking-tight">
                      {weatherData.current.temp}°C
                    </span>
                    <span className="text-sm text-emerald-100 capitalize">
                      {weatherData.current.description}
                    </span>
                  </div>

                  <p className="text-xs text-emerald-200 mt-1">
                    Feels like {weatherData.current.feelsLike}°C • Min {weatherData.current.tempMin}°C / Max {weatherData.current.tempMax}°C
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 bg-black/15 backdrop-blur-md p-3 rounded-xl border border-white/10 text-center text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-center gap-1 text-emerald-200">
                      <Droplets className="h-3.5 w-3.5" />
                      <span>Humidity</span>
                    </div>
                    <p className="font-bold text-sm text-white">{weatherData.current.humidity}%</p>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center justify-center gap-1 text-emerald-200">
                      <Wind className="h-3.5 w-3.5" />
                      <span>Wind</span>
                    </div>
                    <p className="font-bold text-sm text-white">{weatherData.current.windSpeed} km/h</p>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center justify-center gap-1 text-emerald-200">
                      <CloudRain className="h-3.5 w-3.5" />
                      <span>Rainfall</span>
                    </div>
                    <p className="font-bold text-sm text-white">{weatherData.current.rainfallMm} mm</p>
                  </div>
                </div>
              </div>

              {/* Save Preference Footer */}
              {user && user.preferredDistrict !== selectedDistrict && (
                <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
                  <span className="text-emerald-100">Set as your default profile district?</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleSavePreferredDistrict}
                    disabled={savingDistrict}
                    className="h-7 text-xs bg-white text-emerald-800 hover:bg-emerald-50 gap-1 font-semibold"
                  >
                    <BookmarkCheck className="h-3.5 w-3.5 text-emerald-600" />
                    {savingDistrict ? "Saving..." : savedSuccess ? "Saved!" : "Save Preference"}
                  </Button>
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "advisories" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("advisories")}
                  className={`h-8 text-xs gap-1.5 ${activeTab === "advisories" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Crop Advisories ({weatherData.advisories.length})
                </Button>
                <Button
                  variant={activeTab === "forecast" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("forecast")}
                  className={`h-8 text-xs gap-1.5 ${activeTab === "forecast" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  7-Day Forecast
                </Button>
              </div>

              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Targeted for farmers & crop managers
              </span>
            </div>

            {/* Tab 1: Weather-Aware Crop Advisories */}
            {activeTab === "advisories" && (
              <div className="space-y-3">
                {weatherData.advisories.map((adv) => (
                  <div
                    key={adv.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      adv.severity === "danger"
                        ? "bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/40"
                        : adv.severity === "warning"
                          ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40"
                          : adv.severity === "success"
                            ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
                            : "bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">
                            {adv.title}
                          </span>
                          {getSeverityBadge(adv.severity)}
                          <Badge variant="outline" className="text-[10px] py-0 bg-background/50">
                            {adv.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {adv.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex items-center gap-2 text-xs font-medium text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span>Recommended Action: <span className="font-normal text-muted-foreground">{adv.action}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: 7-Day Forecast Grid */}
            {activeTab === "forecast" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {weatherData.forecast.map((day) => (
                  <div
                    key={day.date}
                    className="p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-background/60 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 transition-colors text-center flex flex-col justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground">{day.dayName}</p>
                      <p className="text-[10px] text-muted-foreground">{day.date.slice(5)}</p>

                      <div className="my-2 flex justify-center">
                        {getWeatherIcon(day.mainCondition, day.icon)}
                      </div>

                      <p className="text-xs font-semibold text-foreground">
                        {day.tempMax}° / <span className="text-muted-foreground font-normal">{day.tempMin}°C</span>
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-border space-y-1 text-[10px] text-muted-foreground">
                      <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
                        <Droplets className="h-3 w-3" />
                        <span>{day.humidity}%</span>
                      </div>
                      {day.rainfallMm > 0 && (
                        <div className="font-medium text-blue-700 dark:text-blue-300">
                          {day.rainfallMm} mm rain
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
