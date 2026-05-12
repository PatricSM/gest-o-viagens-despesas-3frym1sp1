import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const chartData = [
  { month: 'Janeiro', alimentacao: 400, transporte: 200, hospedagem: 800 },
  { month: 'Fevereiro', alimentacao: 300, transporte: 400, hospedagem: 600 },
  { month: 'Março', alimentacao: 500, transporte: 350, hospedagem: 1200 },
]

const chartConfig = {
  alimentacao: {
    label: 'Alimentação',
    color: 'hsl(var(--chart-1))',
  },
  transporte: {
    label: 'Transporte',
    color: 'hsl(var(--chart-2))',
  },
  hospedagem: {
    label: 'Hospedagem',
    color: 'hsl(var(--chart-3))',
  },
}

export function ExpensesChart() {
  return (
    <Card
      className="border-none shadow-elevation animate-slide-in-bottom"
      style={{ animationDelay: '400ms' }}
    >
      <CardHeader>
        <CardTitle className="text-title-sm">Despesas por Categoria (Últimos 3 meses)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              className="text-body-sm"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$${value}`}
              className="text-body-sm text-data-tabular"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="alimentacao"
              stackId="a"
              fill="var(--color-alimentacao)"
              radius={[0, 0, 4, 4]}
            />
            <Bar dataKey="transporte" stackId="a" fill="var(--color-transporte)" />
            <Bar
              dataKey="hospedagem"
              stackId="a"
              fill="var(--color-hospedagem)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
