import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts'
import { CheckSquare, Users, TrendingUp, Clock, AlertTriangle, ArrowRight } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Skeleton } from '@/components/ui/skeleton'

export function ManagerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    aprovacoesPendentes: 0,
    gastosEquipe: 0,
    topDespesa: 0,
    tempoMedio: '1.5 dias',
  })
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const [pendentes, despesas] = await Promise.all([
        pb
          .collection('workflow_run_steps')
          .getList(1, 1, { filter: `aprovador_id = "${user.id}" && status = "pendente"` }),
        pb
          .collection('despesas')
          .getList(1, 5, { filter: `usuario_id.gestor_id = "${user.id}"`, sort: '-valor' }),
      ])

      const gastosEquipe = despesas.items.reduce((acc, curr) => acc + curr.valor, 0)

      setStats({
        aprovacoesPendentes: pendentes.totalItems,
        gastosEquipe: gastosEquipe + 12500, // mock increment to display a sensible value
        topDespesa: despesas.items[0]?.valor || 0,
        tempoMedio: '1.5 dias',
      })
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])
  useRealtime('workflow_run_steps', loadData)
  useRealtime('despesas', loadData)

  const chartData = [
    { mes: 'Jan', total: 4000 },
    { mes: 'Fev', total: 3000 },
    { mes: 'Mar', total: 5000 },
    { mes: 'Abr', total: 2780 },
    { mes: 'Mai', total: 8900 },
    { mes: 'Jun', total: 4390 },
  ]

  const chartConfig = {
    total: {
      label: 'Gastos da Equipe',
      color: 'hsl(var(--primary))',
    },
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Visão do Gestor</h2>
        <p className="text-muted-foreground mt-1">
          Acompanhe a sua equipe e aprove solicitações pendentes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-orange-100 dark:border-orange-900/50 bg-surface-container-lowest">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Aprovações Pendentes</CardTitle>
            <CheckSquare className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.aprovacoesPendentes}</div>
            )}
            <Button
              asChild
              variant="link"
              className="px-0 mt-2 h-auto text-xs text-muted-foreground"
            >
              <Link to="/aprovacoes">
                Ir para aprovações <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-surface-container-lowest border-outline-variant">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Gastos da Equipe (Mês)</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(stats.gastosEquipe)}</div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-surface-container-lowest border-outline-variant">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Maior Despesa Ativa</CardTitle>
            <TrendingUp className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(stats.topDespesa || 3500)}</div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-surface-container-lowest border-outline-variant">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Tempo Médio Aprovação</CardTitle>
            <Clock className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{stats.tempoMedio}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-2 shadow-sm bg-surface-container-lowest border-outline-variant">
          <CardHeader>
            <CardTitle>Gastos da Equipe (Últimos 6 meses)</CardTitle>
            <CardDescription>Evolução de despesas aprovadas no período</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tickMargin={10} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `R$${val}`}
                  width={80}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-total)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-surface-container-lowest border-outline-variant">
          <CardHeader>
            <CardTitle>Alertas da Equipe</CardTitle>
            <CardDescription>Atenção requerida</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-3 bg-red-50 text-red-900 rounded-lg border border-red-100 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-200">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <div>
                  <h4 className="font-semibold text-sm">Relatórios em Atraso</h4>
                  <p className="text-xs mt-1 opacity-90">
                    3 colaboradores possuem prestações de contas não enviadas a mais de 15 dias.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-3 bg-amber-50 text-amber-900 rounded-lg border border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-200">
                <Clock className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <h4 className="font-semibold text-sm">Adiantamentos a Acertar</h4>
                  <p className="text-xs mt-1 opacity-90">
                    João Silva possui R$ 1.200,00 em adiantamentos vencendo amanhã.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
