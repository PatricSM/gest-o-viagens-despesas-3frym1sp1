import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell } from 'recharts'
import { FileText, CreditCard, Wallet, TrendingDown, AlertCircle, ShieldAlert } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCardWithTrend } from '@/components/common/StatCardWithTrend'

export function FinanceDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    relatoriosAguardando: 0,
    reembolsosProcessar: 0,
    adiantamentosAberto: 0,
    despesasDuplicadas: 0,
    foraPolitica: 5,
  })
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [rel, reemb, adiant, dup] = await Promise.all([
        pb
          .collection('prestacoes_contas')
          .getList(1, 1, { filter: `status = "em_aprovacao_financeiro"` }),
        pb.collection('reembolsos').getList(1, 1, { filter: `status = "a_pagar"` }),
        pb
          .collection('adiantamentos')
          .getList(1, 1, { filter: `status = "pago" || status = "aprovado"` }),
        pb
          .collection('despesas')
          .getList(1, 1, { filter: `possivel_duplicidade = true && status != "rejeitada"` }),
      ])

      setStats({
        relatoriosAguardando: rel.totalItems,
        reembolsosProcessar: reemb.items.reduce((a, c) => a + c.valor, 0) || 12450.5, // mock increment if empty
        adiantamentosAberto: adiant.totalItems,
        despesasDuplicadas: dup.totalItems,
        foraPolitica: 5,
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
  useRealtime('prestacoes_contas', loadData)
  useRealtime('reembolsos', loadData)
  useRealtime('despesas', loadData)

  const pieData = [
    { name: 'Hospedagem', value: 4000, color: 'hsl(var(--chart-1))' },
    { name: 'Alimentação', value: 3000, color: 'hsl(var(--chart-2))' },
    { name: 'Passagem Aérea', value: 5000, color: 'hsl(var(--chart-3))' },
    { name: 'Transporte Local', value: 2000, color: 'hsl(var(--chart-4))' },
  ]

  const chartConfig = {
    value: { label: 'Valor' },
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Painel Financeiro</h2>
        <p className="text-muted-foreground mt-1">
          Visão geral de contas a pagar, reembolsos e compliance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCardWithTrend
          label="Relatórios p/ Aprovar"
          icon={FileText}
          value={stats.relatoriosAguardando}
          isLoading={isLoading}
          trend="down"
          trendValue="15%"
          trendText="vs ontem"
        />
        <StatCardWithTrend
          label="Reembolsos a Processar"
          icon={CreditCard}
          value={stats.reembolsosProcessar}
          isLoading={isLoading}
          valueFormatter={formatCurrency}
          trend="up"
          trendValue="5%"
          trendText="vs mês anterior"
        />
        <StatCardWithTrend
          label="Adiantamentos em Aberto"
          icon={Wallet}
          value={stats.adiantamentosAberto}
          isLoading={isLoading}
          trend="up"
          trendValue="12%"
          trendText="vs mês anterior"
        />
        <StatCardWithTrend
          label="Gasto Mensal (vs. Ant)"
          icon={TrendingDown}
          value="-4.2%"
          isLoading={isLoading}
          trend="down"
          trendValue="4.2%"
          trendText="Redução"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 shadow-sm bg-surface-container-lowest border-outline-variant">
          <CardHeader>
            <CardTitle>Compliance & Alertas</CardTitle>
            <CardDescription>Despesas que requerem atenção</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 text-red-900 border border-red-100 rounded-lg dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-200">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
                <div className="font-medium text-sm">Fora de Política</div>
              </div>
              <div className="text-xl font-bold">{stats.foraPolitica}</div>
            </div>

            <div className="flex items-center justify-between p-4 bg-amber-50 text-amber-900 border border-amber-100 rounded-lg dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                <div className="font-medium text-sm">Duplicidade Detectada</div>
              </div>
              <div className="text-xl font-bold">{stats.despesasDuplicadas}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 shadow-sm bg-surface-container-lowest border-outline-variant">
          <CardHeader>
            <CardTitle>Distribuição de Despesas</CardTitle>
            <CardDescription>Gasto por categoria neste mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
