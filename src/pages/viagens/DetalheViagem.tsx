import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/common/StatusBadge'
import { MoneyDisplay } from '@/components/common/MoneyDisplay'
import { DateDisplay } from '@/components/common/DateDisplay'
import { ApprovalTimeline } from '@/components/common/ApprovalTimeline'
import {
  FileText,
  ArrowLeft,
  Download,
  Ban,
  Clock,
  MapPin,
  Receipt,
  Wallet,
  Copy,
  CheckCircle2,
} from 'lucide-react'
import {
  getViagem,
  getTrechos,
  getEstimativas,
  getAnexos,
  updateViagem,
  duplicateViagem,
} from '@/services/viagens'
import pb from '@/lib/pocketbase/client'
import { formatDate } from '@/lib/formatters'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

export default function DetalheViagem() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [data, setData] = useState<any>(null)
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([])

  const load = async () => {
    if (!id) return
    const [v, trechos, estimativas, anexos] = await Promise.all([
      getViagem(id),
      getTrechos(id),
      getEstimativas(id),
      getAnexos(id),
    ])
    setData({ v, trechos, estimativas, anexos })

    if (v.workflow_run_id) {
      const steps = await pb.collection('workflow_run_steps').getFullList({
        filter: `run_id="${v.workflow_run_id}"`,
        sort: 'ordem',
        expand: 'etapa_id,aprovador_id',
      })
      setWorkflowSteps(steps)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const handleDuplicate = async () => {
    if (!user || !id) return
    const nova = await duplicateViagem(id, user.id)
    toast({ title: 'Sucesso', description: 'Viagem duplicada com sucesso.' })
    navigate(`/viagens/nova?id=${nova.id}`)
  }

  const handleCancel = async () => {
    if (!confirm('Deseja cancelar esta viagem?')) return
    await updateViagem(id!, { status: 'cancelada' })
    toast({ title: 'Sucesso', description: 'Cancelada com sucesso.' })
    load()
  }

  if (!data)
    return (
      <div className="p-12 text-center text-muted-foreground animate-pulse">
        Carregando detalhes...
      </div>
    )

  const { v, trechos, estimativas } = data

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/viagens')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Solicitação {v.codigo || 'S/N'}</h2>
            <StatusBadge status={v.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Criada em <DateDisplay date={v.created} /> por {v.expand?.usuario_id?.name}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          {['rascunho', 'em_aprovacao'].includes(v.status) && (
            <Button variant="outline" className="text-destructive" onClick={handleCancel}>
              <Ban className="w-4 h-4 mr-2" /> Cancelar
            </Button>
          )}
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="w-4 h-4 mr-2" /> Duplicar
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" /> Gerar PDF
          </Button>
          {v.status === 'aprovada' && <Button>Iniciar Prestação</Button>}
        </div>
      </div>

      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12 bg-surface-container p-1 mb-6">
          <TabsTrigger value="resumo" className="data-[state=active]:bg-background">
            Resumo
          </TabsTrigger>
          <TabsTrigger value="aprovacao" className="data-[state=active]:bg-background">
            Aprovação
          </TabsTrigger>
          <TabsTrigger value="despesas" className="data-[state=active]:bg-background">
            Despesas
          </TabsTrigger>
          <TabsTrigger value="adiantamentos" className="data-[state=active]:bg-background">
            Adiantamentos
          </TabsTrigger>
          <TabsTrigger value="prestacao" className="data-[state=active]:bg-background">
            Prestação de Contas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-6 mt-0">
          <Card className="p-6 shadow-sm border-outline-variant/40 bg-surface-container-lowest">
            <h3 className="text-lg font-semibold mb-4 border-b border-outline-variant pb-2">
              Motivo e Classificação
            </h3>
            <p className="text-body-md text-foreground">{v.motivo}</p>
            <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-outline-variant/40">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">
                  Centro de Custo
                </p>
                <p className="font-medium mt-1">{v.expand?.centro_custo_id?.nome}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">
                  Departamento
                </p>
                <p className="font-medium mt-1">{v.expand?.departamento_id?.nome || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">
                  Total Estimado
                </p>
                <p className="font-bold text-primary mt-1 text-lg">
                  <MoneyDisplay value={v.total_estimado || 0} />
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 shadow-sm border-outline-variant/40 bg-surface-container-lowest">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-muted-foreground" /> Trechos
              </h3>
              <div className="space-y-4">
                {trechos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum trecho.</p>
                ) : (
                  trechos.map((t: any) => (
                    <div
                      key={t.id}
                      className="flex flex-col gap-1 p-3 bg-surface-container-low rounded-lg"
                    >
                      <div className="flex justify-between font-medium text-sm">
                        <span>{t.origem}</span>
                        <span>{t.destino}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <DateDisplay date={t.data_ida} /> • {t.tipo_transporte}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-6 shadow-sm border-outline-variant/40 bg-surface-container-lowest">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-muted-foreground" /> Estimativas
              </h3>
              <div className="space-y-3">
                {estimativas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma estimativa.</p>
                ) : (
                  estimativas.map((e: any) => (
                    <div
                      key={e.id}
                      className="flex justify-between items-center text-sm border-b border-outline-variant pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium capitalize">{e.tipo}</p>
                        <p className="text-xs text-muted-foreground">{e.descricao}</p>
                      </div>
                      <span className="font-semibold">
                        <MoneyDisplay value={e.valor} />
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="aprovacao" className="mt-0">
          <Card className="p-6 shadow-sm bg-surface-container-lowest border-outline-variant">
            {workflowSteps.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                Nenhum fluxo de aprovação iniciado.
              </p>
            ) : (
              <ApprovalTimeline
                submittedBy={v.expand?.usuario_id?.name || v.expand?.usuario_id?.email || 'Usuário'}
                submittedAt={v.created}
                steps={workflowSteps.map((step: any) => ({
                  id: step.id,
                  approverName: step.expand?.aprovador_id?.name,
                  approverRole: step.expand?.etapa_id?.tipo_aprovador,
                  status: step.status,
                  decidedAt: step.decided_at,
                  comentario: step.comentario,
                }))}
              />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="despesas">
          <Card className="p-12 text-center text-muted-foreground bg-surface-container-lowest border-outline-variant">
            <Receipt className="w-8 h-8 mx-auto mb-3 opacity-50" />
            Nenhuma despesa vinculada.
          </Card>
        </TabsContent>
        <TabsContent value="adiantamentos">
          <Card className="p-12 text-center text-muted-foreground bg-surface-container-lowest border-outline-variant">
            <Wallet className="w-8 h-8 mx-auto mb-3 opacity-50" />
            Nenhum adiantamento vinculado.
          </Card>
        </TabsContent>
        <TabsContent value="prestacao">
          <Card className="p-12 text-center text-muted-foreground bg-surface-container-lowest border-outline-variant">
            <FileText className="w-8 h-8 mx-auto mb-3 opacity-50" />
            Nenhuma prestação de contas criada.
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
