import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Card } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'

const PIE_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#8b5cf6',
  '#6366f1',
  '#0ea5e9',
  '#14b8a6',
]

export function ReportChart({ type, data }: { type: string; data: any[] }) {
  const isPie = ['gasto-por-categoria', 'por-forma-pagamento', 'desvios-politica'].includes(type)
  const isLine = ['gasto-por-periodo'].includes(type)

  if (!data || data.length === 0) {
    return (
      <Card className="p-4 h-[300px] flex items-center justify-center text-muted-foreground shrink-0 bg-background">
        Sem dados para o período.
      </Card>
    )
  }

  const config = {
    value: { label: 'Valor', color: 'hsl(var(--primary))' },
    secondaryValue: { label: 'Secundário', color: 'hsl(var(--destructive))' },
  }

  return (
    <Card className="p-4 h-[300px] shrink-0 bg-background">
      <ChartContainer config={config} className="h-full w-full">
        {isPie ? (
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip />
          </PieChart>
        ) : isLine ? (
          <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <ChartTooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <ChartTooltip />
            <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} maxBarSize={60} />
            {data[0]?.secondaryValue !== undefined && (
              <Bar
                dataKey="secondaryValue"
                fill="var(--color-secondaryValue)"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            )}
          </BarChart>
        )}
      </ChartContainer>
    </Card>
  )
}
