import { Sun, Cloud, CloudRain } from "lucide-react";
import { useWeather, getWeatherLabel, type TimePeriodForecast } from "@/hooks/useWeather";
import { cn } from "@/lib/utils";

function SunChanceBar({ chance }: { chance: number }) {
  const color = chance >= 70
    ? "bg-[#C87533]"
    : chance >= 40
      ? "bg-[#C87533]/60"
      : chance >= 15
        ? "bg-slate-300"
        : "bg-slate-400";

  return (
    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${Math.max(chance, 4)}%` }}
      />
    </div>
  );
}

function PeriodCard({ period, isNow }: { period: TimePeriodForecast; isNow: boolean }) {
  const { emoji } = getWeatherLabel(period.dominantWeatherCode);
  const hasPrecip = period.maxPrecip > 0;

  return (
    <div
      className={cn(
        "flex-1 rounded-lg border p-3 text-center transition-all",
        isNow ? "border-[#F0D5B0] bg-[#FDF0E3] shadow-sm" : "bg-[#FAFAF8]"
      )}
    >
      {isNow && (
        <div className="text-[10px] uppercase tracking-wider text-[#C87533] font-medium mb-1">NOW</div>
      )}
      <p className="text-xs font-semibold mt-0.5">{period.label}</p>
      <span className="text-2xl leading-none block my-1.5">{emoji}</span>
      <p className="text-sm font-bold">{period.avgTemp}°C</p>

      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-center gap-1 text-[11px] text-gray-400">
          <Sun className="h-3 w-3 text-[#C87533]" />
          <span className="font-medium">{period.sunChance}%</span>
        </div>
        <SunChanceBar chance={period.sunChance} />
      </div>

      <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
        <span><Cloud className="h-2.5 w-2.5 inline" /> {period.avgCloudCover}%</span>
        {hasPrecip && (
          <span><CloudRain className="h-2.5 w-2.5 inline" /> {period.maxPrecip}mm</span>
        )}
      </div>
    </div>
  );
}

function getCurrentPeriod(): "morning" | "midday" | "afternoon" | null {
  const now = new Date();
  const h = new Date(now.toLocaleString("en-US", { timeZone: "America/Halifax" })).getHours();
  if (h >= 7 && h < 11) return "morning";
  if (h >= 11 && h < 14) return "midday";
  if (h >= 14 && h < 18) return "afternoon";
  return null;
}

export function HourlyForecast() {
  const { forecast, isLoading } = useWeather();

  if (isLoading || forecast.length === 0) return null;

  const currentPeriod = getCurrentPeriod();
  const hasAnyData = forecast.some(p => p.hours.length > 0);
  if (!hasAnyData) return null;

  return (
    <div className="px-4 py-3">
      <h3 className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#1C1C1A' }}>
        Sun forecast today
      </h3>
      <div className="flex gap-2">
        {forecast.map((period) => (
          <PeriodCard
            key={period.period}
            period={period}
            isNow={period.period === currentPeriod}
          />
        ))}
      </div>
    </div>
  );
}
