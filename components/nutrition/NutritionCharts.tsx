"use client"

import { useEffect, useState } from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { GlassCard } from "@/components/ui/card"
import { nutritionApi } from "@/lib/api"
import { Flame, Beef, Wheat, Droplets, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

// ─── Types ───────────────────────────────────────────────────────────────────

type HistoryDay = {
  date: string
  day: string
  shortDate: string
  calories: number
  protein: number
  carbs: number
  fats: number
}

type MetricKey = "calories" | "protein" | "carbs" | "fats"

interface MetricConfig {
  key: MetricKey
  label: string
  unit: string
  icon: React.ReactNode
  color: string
  gradientId: string
  chartType: "area" | "bar"
}

// ─── Metric configs ───────────────────────────────────────────────────────────

const METRICS: MetricConfig[] = [
  {
    key: "calories",
    label: "Calories",
    unit: "kcal",
    icon: <Flame className="h-4 w-4" />,
    color: "#f97316",
    gradientId: "grad-calories",
    chartType: "area",
  },
  {
    key: "protein",
    label: "Protein",
    unit: "g",
    icon: <Beef className="h-4 w-4" />,
    color: "#10b981",
    gradientId: "grad-protein",
    chartType: "bar",
  },
  {
    key: "carbs",
    label: "Carbs",
    unit: "g",
    icon: <Wheat className="h-4 w-4" />,
    color: "#3b82f6",
    gradientId: "grad-carbs",
    chartType: "bar",
  },
  {
    key: "fats",
    label: "Fats",
    unit: "g",
    icon: <Droplets className="h-4 w-4" />,
    color: "#f59e0b",
    gradientId: "grad-fats",
    chartType: "bar",
  },
]

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function makeTooltipContent(metric: MetricConfig, goal: number, historyDays: HistoryDay[]) {
  // Returns a render fn that recharts can call — captures metric/goal via closure
  return function TooltipContent({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: Array<{ value: number }>
    label?: string | number
  }) {
    if (!active || !payload?.length) return null
    const value = payload[0].value
    const pct = goal > 0 ? Math.round((value / goal) * 100) : 0
    const over = value > goal
    // label is the XAxis dataKey value ("Mon"), map back to shortDate if possible
    const dayEntry = historyDays.find(d => d.day === label)
    const displayLabel = dayEntry?.shortDate ?? String(label)

    return (
      <div className="rounded-xl border border-white/10 bg-[#0f172a]/90 backdrop-blur-md px-4 py-3 shadow-2xl min-w-[140px]">
        <p className="text-xs text-slate-400 mb-1">{displayLabel}</p>
        <p className="text-lg font-bold" style={{ color: metric.color }}>
          {value.toLocaleString()}
          <span className="text-sm font-normal text-slate-400 ml-1">{metric.unit}</span>
        </p>
        <div className="flex items-center gap-1 mt-1">
          <div
            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${metric.color}20`, color: metric.color }}
          >
            {pct}% of goal
          </div>
          {over && <span className="text-xs text-amber-400">over</span>}
        </div>
      </div>
    )
  }
}

// ─── Trend badge ─────────────────────────────────────────────────────────────

function TrendBadge({ avg, goal }: { avg: number; goal: number }) {
  const diff = avg - goal
  const pct = goal > 0 ? Math.round((Math.abs(diff) / goal) * 100) : 0
  if (pct === 0) return <Minus className="h-3.5 w-3.5 text-slate-400" />
  if (diff > 0)
    return (
      <span className="flex items-center gap-0.5 text-amber-400 text-xs font-medium">
        <TrendingUp className="h-3.5 w-3.5" />+{pct}%
      </span>
    )
  return (
    <span className="flex items-center gap-0.5 text-emerald-400 text-xs font-medium">
      <TrendingDown className="h-3.5 w-3.5" />-{pct}%
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NutritionCharts() {
  const [history, setHistory] = useState<HistoryDay[]>([])
  const [goals, setGoals] = useState({ calories: 1900, protein: 110, carbs: 230, fats: 60 })
  const [averages, setAverages] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 })
  const [active, setActive] = useState<MetricKey>("calories")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    nutritionApi.getNutritionHistory(7).then((res) => {
      setHistory(res.history)
      setGoals(res.goals)
      setAverages(res.averages)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const metric = METRICS.find(m => m.key === active)!
  const goal = goals[active]
  const avg = averages[active]
  const TooltipContent = makeTooltipContent(metric, goal, history)

  // Today's value (last item)
  const todayVal = history.at(-1)?.[active] ?? 0

  if (loading) return <NutritionChartsSkeleton />

  return (
    <GlassCard className="p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold text-base">7-Day Nutrition Trend</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Daily intake vs. goal</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-muted-foreground">7-day avg</p>
          <p className="text-sm font-semibold" style={{ color: metric.color }}>
            {avg.toLocaleString()} {metric.unit}
          </p>
        </div>
      </div>

      {/* Metric tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setActive(m.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all touch-manipulation",
              active === m.key
                ? "text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary"
            )}
            style={
              active === m.key
                ? { backgroundColor: `${m.color}25`, color: m.color, boxShadow: `0 0 0 1px ${m.color}40` }
                : {}
            }
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Today", value: todayVal, unit: metric.unit },
          { label: "7-day avg", value: avg, unit: metric.unit },
          { label: "Goal", value: goal, unit: metric.unit },
        ].map(({ label, value, unit }) => (
          <div key={label} className="rounded-lg bg-secondary/40 px-3 py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
            <p className="text-sm font-bold" style={{ color: metric.color }}>
              {value.toLocaleString()}
              <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>
            </p>
            {label === "7-day avg" && (
              <div className="mt-0.5">
                <TrendBadge avg={avg} goal={goal} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-52 sm:h-64 w-full -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          {metric.chartType === "area" ? (
            <AreaChart data={history} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={metric.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metric.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={metric.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "rgba(148,163,184,0.8)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "rgba(148,163,184,0.6)" }}
                axisLine={false}
                tickLine={false}
                width={40}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
              />
              <Tooltip
                content={<TooltipContent />}
                cursor={{ stroke: metric.color, strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <ReferenceLine
                y={goal}
                stroke={metric.color}
                strokeDasharray="6 4"
                strokeWidth={1.5}
                strokeOpacity={0.5}
                label={{
                  value: "Goal",
                  position: "insideTopRight",
                  fill: metric.color,
                  fontSize: 10,
                  opacity: 0.7,
                }}
              />
              <Area
                type="monotone"
                dataKey={active}
                stroke={metric.color}
                strokeWidth={2.5}
                fill={`url(#${metric.gradientId})`}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: metric.color }}
              />
            </AreaChart>
          ) : (
            <BarChart data={history} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barSize={20}>
              <defs>
                <linearGradient id={metric.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metric.color} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={metric.color} stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "rgba(148,163,184,0.8)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "rgba(148,163,184,0.6)" }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                content={<TooltipContent />}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <ReferenceLine
                y={goal}
                stroke={metric.color}
                strokeDasharray="6 4"
                strokeWidth={1.5}
                strokeOpacity={0.5}
                label={{
                  value: "Goal",
                  position: "insideTopRight",
                  fill: metric.color,
                  fontSize: 10,
                  opacity: 0.7,
                }}
              />
              <Bar dataKey={active} radius={[4, 4, 0, 0]}>
                {history.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry[active] >= goal
                        ? `url(#${metric.gradientId})`
                        : `${metric.color}70`
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-5 h-0.5 rounded-full"
            style={{ background: metric.color, opacity: 0.5 }}
          />
          Goal line
        </span>
        {metric.chartType === "bar" && (
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: metric.color, opacity: 0.4 }}
            />
            Under goal
            <span
              className="inline-block w-3 h-3 rounded-sm ml-2"
              style={{ background: metric.color }}
            />
            At / over goal
          </span>
        )}
      </div>
    </GlassCard>
  )
}

function NutritionChartsSkeleton() {
  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex justify-between mb-5">
        <div>
          <Skeleton className="h-5 w-44 mb-1.5" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-20 hidden sm:block" />
      </div>
      <div className="flex gap-1.5 mb-5">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-20 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
      </div>
      <Skeleton className="h-52 sm:h-64 w-full rounded-lg" />
    </GlassCard>
  )
}
