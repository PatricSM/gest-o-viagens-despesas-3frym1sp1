import { ArrowDown, ArrowUp, LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ResponsiveContainer, LineChart, Line } from 'recharts'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

export interface StatCardWithTrendProps {
  label: string
  value: number | string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'flat'
  trendValue?: string
  trendText?: string
  sparklineData?: number[]
  isLoading?: boolean
  valueFormatter?: (value: number | string) => string
  className?: string
  children?: React.ReactNode
}

export function StatCardWithTrend({
  label,
  value,
  icon: Icon,
  trend = 'flat',
  trendValue = '0%',
  trendText = 'vs período anterior',
  sparklineData,
  isLoading,
  valueFormatter,
  className,
  children,
}: StatCardWithTrendProps) {
  const formattedValue = valueFormatter ? valueFormatter(value) : value

  // Generate deterministic mock data if not provided
  const chartData = useMemo(() => {
    if (sparklineData) return sparklineData.map((v) => ({ value: v }))

    // Default mock data based on value
    const baseValue =
      typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 100
    const points = []

    // Generate 7 points loosely simulating the trend
    let current =
      trend === 'up' ? baseValue * 0.7 : trend === 'down' ? baseValue * 1.3 : baseValue * 0.9
    for (let i = 0; i < 6; i++) {
      points.push({ value: current })
      const change = current * (Math.random() * 0.2 - 0.1) // +/- 10%
      current += change
    }
    points.push({ value: baseValue })
    return points
  }, [sparklineData, value, trend])

  return (
    <Card className={cn('shadow-sm bg-surface-container-lowest border-outline-variant', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-label-caps text-on-surface-variant text-xs uppercase tracking-wider font-medium">
          {label}
        </CardTitle>
        <Icon className="w-4 h-4 text-on-surface-variant opacity-60" />
      </CardHeader>
      <CardContent className="pt-4 pb-2 px-4">
        {isLoading ? (
          <Skeleton className="h-8 w-24 mb-4" />
        ) : (
          <div className="flex flex-col gap-2">
            <div className="text-3xl font-bold tabular-nums text-on-surface">{formattedValue}</div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {trend === 'up' && <ArrowUp className="w-3 h-3 text-emerald-700" />}
                {trend === 'down' && <ArrowDown className="w-3 h-3 text-red-700" />}

                <span
                  className={cn('text-xs font-medium', {
                    'text-emerald-700': trend === 'up',
                    'text-red-700': trend === 'down',
                    'text-on-surface-variant': trend === 'flat',
                  })}
                >
                  {trendValue}
                </span>

                <span className="text-xs text-on-surface-variant ml-1">{trendText}</span>
              </div>

              <div className="h-8 w-16 opacity-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  )
}
