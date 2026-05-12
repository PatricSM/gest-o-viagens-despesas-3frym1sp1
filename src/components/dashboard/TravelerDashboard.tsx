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

export function TravelerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    viagensAndamento: 0,
    viagensProximas: 0,
    despesasPendentes: 0,
    relatoriosAprovacao: 0,
    saldoAdiantamentos: 0,
  })

  const loadData = async () => {
    if (!user) return
    try {
      const [vAnd, vProx, dPend, rAprov, adiant] = await Promise.all([
        pb
          .collection('viagens')
          .getList(1, 1, { filter: `usuario_id = "${user.id}" && status = "em_andamento"` }),
        pb
          .collection('viagens')
          .getList(1, 1, {
            filter: `usuario_id = "${user.id}" && (status = "aprovada" || status = "em_aprovacao")`,
          }),
        pb
          .collection('despesas')
          .getList(1, 1, {
            filter: `usuario_id = "${user.id}" && (status = "pendente" || status = "rascunho")`,
          }),
        pb
          .collection('prestacoes_contas')
          .getList(1, 1, {
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
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Viagens Ativas</CardTitle>
            <Plane className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.viagensAndamento}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Próximas Viagens</CardTitle>
            <Clock className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.viagensProximas}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Despesas Pendentes</CardTitle>
            <Receipt className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.despesasPendentes}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Relatórios em Aprovação</CardTitle>
            <FileText className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.relatoriosAprovacao}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-primary">Saldo Adiantamentos</CardTitle>
            <Wallet className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(stats.saldoAdiantamentos)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2 shadow-sm">
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

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Linha do Tempo</CardTitle>
            <CardDescription>Suas atividades recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {mockTimeline.map((item) => (
                <div key={item.id} className="flex gap-4 items-start">
                  <div className="mt-0.5 bg-muted p-2 rounded-full shrink-0">
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
