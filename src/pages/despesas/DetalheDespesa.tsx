import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash, History, FileText, CheckCircle2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/common/StatusBadge'
import { MoneyDisplay } from '@/components/common/MoneyDisplay'
import { DateDisplay } from '@/components/common/DateDisplay'
import { ReceiptViewer } from '@/components/common/ReceiptViewer'
import { Timeline } from '@/components/common/Timeline'
import { PolicyViolationAlert } from '@/components/common/PolicyViolationAlert'
import { getDespesa, deleteDespesa } from '@/services/despesas'
import { getWorkflowRunSteps } from '@/services/workflows'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function DetalheDespesa() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [despesa, setDespesa] = useState<any>(null)
  const [steps, setSteps] = useState<any[]>([])
  const [auditLog, setAuditLog] = useState<any[]>([])

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const data = await getDespesa(id)
        setDespesa(data)

        if (data.workflow_run_id) {
          const runSteps = await getWorkflowRunSteps(data.workflow_run_id)
          setSteps(runSteps)
        }

        const logs = await pb.collection('audit_log').getFullList({
          filter: `record_id="${id}" && module="despesas"`,
          sort: '-created',
          expand: 'user_id',
        })
        setAuditLog(logs)
      } catch (err) {
        toast.error('Erro ao carregar despesa.')
        navigate('/despesas')
      }
    }
    load()
  }, [id, navigate])

  if (!despesa) return null

  const comprovantes = despesa.expand?.despesa_comprovantes_via_despesa_id || []
  const hasComprovante = comprovantes.length > 0
  const comprovanteUrl = hasComprovante
    ? pb.files.getURL(comprovantes[0], comprovantes[0].arquivo)
    : null
  const isImage = hasComprovante && comprovantes[0].arquivo.match(/\.(jpeg|jpg|gif|png)$/i)

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
      try {
        await deleteDespesa(despesa.id)
        toast.success('Despesa excluída com sucesso.')
        navigate('/despesas')
      } catch {
        toast.error('Erro ao excluir despesa.')
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/despesas')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-headline-md">Detalhes da Despesa</h2>
              <StatusBadge status={despesa.status} />
            </div>
            <p className="text-body-md text-muted-foreground mt-1">
              Registrada em <DateDisplay date={despesa.created} />
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {despesa.status === 'rascunho' && (
            <>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" /> Editar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash className="w-4 h-4 mr-2" /> Excluir
              </Button>
            </>
          )}
          {despesa.status === 'aprovada' && !despesa.prestacao_id && (
            <Button>
              <FileText className="w-4 h-4 mr-2" /> Anexar à Prestação
            </Button>
          )}
        </div>
      </div>

      <PolicyViolationAlert violations={despesa.politica_violacoes} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm bg-surface-container-lowest border-outline-variant">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Data da Despesa</p>
                  <p className="text-base font-semibold">
                    <DateDisplay date={despesa.data_despesa} />
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Valor Total</p>
                  <p className="text-lg font-bold text-primary">
                    <MoneyDisplay value={despesa.valor} moeda={despesa.expand?.moeda_id?.codigo} />
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Categoria</p>
                  <div className="flex items-center gap-2">
                    {despesa.expand?.categoria_id?.cor && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: despesa.expand.categoria_id.cor }}
                      />
                    )}
                    <span className="font-medium">{despesa.expand?.categoria_id?.nome}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Viagem Associada</p>
                  <p className="font-medium">{despesa.expand?.viagem_id?.codigo || '-'}</p>
                </div>
                {despesa.descricao && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Descrição</p>
                    <p className="text-base bg-surface-container-low p-3 rounded-md">
                      {despesa.descricao}
                    </p>
                  </div>
                )}
                {despesa.modo_km && (
                  <div className="col-span-2 grid grid-cols-4 gap-4 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-md border border-blue-100 dark:border-blue-900">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Origem</p>
                      <p className="text-sm font-medium">{despesa.km_origem}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Destino</p>
                      <p className="text-sm font-medium">{despesa.km_destino}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Percorrido</p>
                      <p className="text-sm font-medium">{despesa.km_percorridos} km</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Valor/Km</p>
                      <p className="text-sm font-medium">
                        <MoneyDisplay value={despesa.km_valor_por_km} />
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {steps.length > 0 && (
            <Card className="shadow-sm bg-surface-container-lowest border-outline-variant">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" /> Fluxo de Aprovação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline
                  items={steps.map((step, idx) => ({
                    id: step.id,
                    title:
                      step.expand?.etapa_id?.tipo_aprovador === 'gestor_direto'
                        ? 'Gestor Direto'
                        : 'Aprovador',
                    description: `${step.expand?.aprovador_id?.name || 'Aguardando atribuição'} ${step.comentario ? `- "${step.comentario}"` : ''}`,
                    status:
                      step.status === 'aprovado'
                        ? 'completed'
                        : step.status === 'rejeitado'
                          ? 'error'
                          : 'upcoming',
                    icon: <span className="text-xs font-bold">{idx + 1}</span>,
                    time: step.decided_at
                      ? new Intl.DateTimeFormat('pt-BR').format(new Date(step.decided_at))
                      : undefined,
                  }))}
                />
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm bg-surface-container-lowest border-outline-variant">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-5 h-5 text-muted-foreground" /> Histórico de Alterações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-4">
                  {auditLog.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum registro encontrado.</p>
                  )}
                  {auditLog.map((log) => (
                    <div
                      key={log.id}
                      className="text-sm pb-3 border-b border-outline-variant last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">
                          {log.expand?.user_id?.name || 'Sistema'}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          <DateDisplay date={log.created} />
                        </span>
                      </div>
                      <p className="text-muted-foreground">
                        Ação:{' '}
                        <strong className="text-foreground uppercase text-xs">{log.action}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="shadow-sm sticky top-6 bg-surface-container-lowest border-outline-variant">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" /> Comprovante
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 border-t border-outline-variant">
              <ReceiptViewer url={comprovanteUrl} isImage={isImage} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
