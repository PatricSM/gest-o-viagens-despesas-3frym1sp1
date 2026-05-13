import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plane,
  Receipt,
  FileText,
  Wallet,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCardWithTrend } from '@/components/common/StatCardWithTrend'

export function TravelerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    viagensAndamento: 0,
    viagensProximas: 0,
    despesasPendentes: 0,
    relatoriosAprovacao: 0,
    saldoAdiantamentos: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const [vAnd, vProx, dPend, rAprov, adiant] = await Promise.all([
        pb
          .collection('viagens')
          .getList(1, 1, { filter: `usuario_id = "${user.id}" && status = "em_andamento"` }),
        pb.collection('viagens').getList(1, 1, {
          filter: `usuario_id = "${user.id}" && (status = "aprovada" || status = "em_aprovacao")`,
        }),
        pb.collection('despesas').getList(1, 1, {
          filter: `usuario_id = "${user.id}" && (status = "pendente" || status = "rascunho")`,
        }),
        pb.collection('prestacoes_contas').getList(1, 1, {
          filter: `usuario_id = "${user.id}" && (status = "em_aprovacao_gestor" || status = "em_aprovacao_financeiro")`,
        }),
        pb
          .collection('adiantamentos')
          .getFullList({ filter: `usuario_id = "${user.id}" && status = "pago"` }),
      ])

      const saldo = adiant.reduce(
        (acc, curr) => acc + (curr.valor - (curr.valor_utilizado || 0)),
        0,
      )

      setStats({
        viagensAndamento: vAnd.totalItems,
        viagensProximas: vProx.totalItems,
        despesasPendentes: dPend.totalItems,
        relatoriosAprovacao: rAprov.totalItems,
        saldoAdiantamentos: saldo,
      })
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])
  useRealtime('viagens', loadData)
  useRealtime('despesas', loadData)
  useRealtime('prestacoes_contas', loadData)
  useRealtime('adiantamentos', loadData)

  const mockTimeline = [
    {
      id: 1,
      title: 'Nova sessão iniciada no sistema',
      time: 'Há poucos instantes',
      icon: CheckCircle2,
      color: 'text-green-500',
    },
    {
      id: 2,
      title: 'Despesa "Uber" cadastrada',
      time: 'Há 2 horas',
      icon: Receipt,
      color: 'text-blue-500',
    },
    {
      id: 3,
      title: 'Relatório #102 enviado para aprovação',
      time: 'Ontem',
      icon: FileText,
      color: 'text-orange-500',
    },
    {
      id: 4,
      title: 'Adiantamento de R$ 500 recebido',
      time: 'Há 3 dias',
      icon: Wallet,
      color: 'text-purple-500',
    },
    {
      id: 5,
      title: 'Política de Viagens da empresa foi atualizada',
      time: 'Há 1 semana',
      icon: AlertCircle,
      color: 'text-muted-foreground',
    },
  ]

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Olá, {user?.name || 'Viajante'}!</h2>
        <p className="text-muted-foreground mt-1">
          Aqui está o resumo das suas viagens e despesas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCardWithTrend
          label="Viagens Ativas"
          icon={Plane}
          value={stats.viagensAndamento}
          isLoading={isLoading}
          trend="up"
          trendValue="12%"
          trendText="vs mês anterior"
        />
        <StatCardWithTrend
          label="Próximas Viagens"
          icon={Clock}
          value={stats.viagensProximas}
          isLoading={isLoading}
          trend="flat"
          trendValue="0%"
          trendText="vs mês anterior"
        />
        <StatCardWithTrend
          label="Despesas Pendentes"
          icon={Receipt}
          value={stats.despesasPendentes}
          isLoading={isLoading}
          trend="down"
          trendValue="5%"
          trendText="vs mês anterior"
        />
        <StatCardWithTrend
          label="Relatórios em Aprovação"
          icon={FileText}
          value={stats.relatoriosAprovacao}
          isLoading={isLoading}
          trend="up"
          trendValue="2"
          trendText="novos hoje"
        />
        <StatCardWithTrend
          label="Saldo Adiantamentos"
          icon={Wallet}
          value={stats.saldoAdiantamentos}
          isLoading={isLoading}
          valueFormatter={formatCurrency}
          className="bg-primary/5 border-primary/20"
          trend="flat"
          trendValue="Estável"
          trendText="este mês"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2 shadow-sm bg-surface-container-lowest border-outline-variant">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>O que você precisa fazer hoje?</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Button
              asChild
              variant="outline"
              className="h-28 flex flex-col items-center justify-center gap-3 hover:border-primary hover:text-primary transition-all"
            >
              <Link to="/despesas/nova">
                <Receipt className="w-8 h-8" />
                <span className="font-medium">Nova Despesa</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-28 flex flex-col items-center justify-center gap-3 hover:border-primary hover:text-primary transition-all"
            >
              <Link to="/viagens/nova">
                <Plane className="w-8 h-8" />
                <span className="font-medium">Nova Viagem</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-28 flex flex-col items-center justify-center gap-3 hover:border-primary hover:text-primary transition-all"
            >
              <Link to="/prestacoes/nova">
                <FileText className="w-8 h-8" />
                <span className="font-medium text-center leading-tight">Nova Prestação</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-28 flex flex-col items-center justify-center gap-3 hover:border-primary hover:text-primary transition-all"
            >
              <Link to="/adiantamentos/novo">
                <Wallet className="w-8 h-8" />
                <span className="font-medium text-center leading-tight">Novo Adiantamento</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-surface-container-lowest border-outline-variant">
          <CardHeader>
            <CardTitle>Linha do Tempo</CardTitle>
            <CardDescription>Suas atividades recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {mockTimeline.map((item) => (
                <div key={item.id} className="flex gap-4 items-start">
                  <div className="mt-0.5 bg-surface-container-low p-2 rounded-full shrink-0">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-muted-foreground" size="sm">
              Ver histórico completo <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
