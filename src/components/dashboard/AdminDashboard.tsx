import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Users, Settings, Workflow, FileLock2, AlertCircle, CheckCircle2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Skeleton } from '@/components/ui/skeleton'

export function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    usuariosAtivos: 0,
    usuariosTotal: 0,
    workflows: 0,
    politicaVersao: 1,
  })
  const [health, setHealth] = useState({
    workflowsOk: true,
    politicaOk: true,
    smtpOk: false,
  })
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [uAtivos, uTotal, wf, pol, emp] = await Promise.all([
        pb.collection('users').getList(1, 1, { filter: `active = true` }),
        pb.collection('users').getList(1, 1),
        pb.collection('workflows').getList(1, 1, { filter: `active = true` }),
        pb
          .collection('politicas')
          .getList(1, 1, { sort: '-vigencia_inicio', filter: 'active = true' }),
        pb.collection('empresas').getOne(user?.empresa_id || ''),
      ])

      setStats({
        usuariosAtivos: uAtivos.totalItems,
        usuariosTotal: uTotal.totalItems,
        workflows: wf.totalItems,
        politicaVersao: pol.items[0]?.versao || 1,
      })

      setHealth({
        workflowsOk: wf.totalItems >= 4,
        politicaOk: pol.items.length > 0,
        smtpOk: !!emp.smtp_config,
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

  const barData = [
    { depto: 'Comercial', gasto: 45000 },
    { depto: 'Engenharia', gasto: 32000 },
    { depto: 'Marketing', gasto: 15000 },
    { depto: 'Diretoria', gasto: 58000 },
    { depto: 'RH', gasto: 8000 },
  ]

  const chartConfig = {
    gasto: { label: 'Gasto Mensal', color: 'hsl(var(--primary))' },
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Administração</h2>
        <p className="text-muted-foreground mt-1">
          Configurações globais, auditoria e saúde do sistema.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm bg-surface-container-lowest border-outline-variant">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {stats.usuariosAtivos} / {stats.usuariosTotal}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-surface-container-lowest border-outline-variant">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Gasto Mensal Total</CardTitle>
            <Settings className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 158K</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-surface-container-lowest border-outline-variant">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Workflows Ativos</CardTitle>
            <Workflow className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.workflows}</div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-surface-container-lowest border-outline-variant">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Política Vigente</CardTitle>
            <FileLock2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">v{stats.politicaVersao}.0</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-2 shadow-sm bg-surface-container-lowest border-outline-variant">
          <CardHeader>
            <CardTitle>Gasto Mensal por Departamento</CardTitle>
            <CardDescription>Comparativo global de despesas no último mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={barData} margin={{ top: 20, right: 0, bottom: 20, left: 20 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="depto" axisLine={false} tickLine={false} tickMargin={10} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `R$${val / 1000}k`}
                  width={60}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="gasto" fill="var(--color-gasto)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-surface-container-lowest border-outline-variant">
          <CardHeader>
            <CardTitle>Health Check</CardTitle>
            <CardDescription>Status das configurações base</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-outline-variant bg-surface-container-lowest">
              <div className="flex items-center gap-3">
                {health.workflowsOk ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
                <span className="text-sm font-medium">Workflows Base</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {health.workflowsOk ? 'Configurado' : 'Pendente'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-outline-variant bg-surface-container-lowest">
              <div className="flex items-center gap-3">
                {health.politicaOk ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm font-medium">Política Ativa</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {health.politicaOk ? 'Vigente' : 'Expirada/Ausente'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-outline-variant bg-surface-container-lowest">
              <div className="flex items-center gap-3">
                {health.smtpOk ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
                <span className="text-sm font-medium">SMTP Config</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {health.smtpOk ? 'Configurado' : 'Pendente'}
              </span>
            </div>

            <div className="mt-6 pt-6 border-t border-outline-variant space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Top 3 Categorias
              </h4>
              <div className="text-sm flex justify-between">
                <span>Passagens</span> <span className="font-medium">45%</span>
              </div>
              <div className="text-sm flex justify-between">
                <span>Hospedagem</span> <span className="font-medium">30%</span>
              </div>
              <div className="text-sm flex justify-between">
                <span>Alimentação</span> <span className="font-medium">15%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
