import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Wallet, XCircle, DollarSign } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { getAdiantamento, updateAdiantamento } from '@/services/adiantamentos'
import { getWorkflowRunSteps } from '@/services/workflows'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { ApprovalTimeline } from '@/components/common/ApprovalTimeline'

export default function DetalheAdiantamento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { userRole } = useAuth()
  const [item, setItem] = useState<any>(null)
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([])

  const loadData = async () => {
    if (!id) return
    try {
      const data = await getAdiantamento(id)
      setItem(data)

      if (data.workflow_run_id) {
        getWorkflowRunSteps(data.workflow_run_id).then(setWorkflowSteps)
      }
    } catch {
      toast.error('Erro ao carregar adiantamento.')
      navigate('/adiantamentos')
    }
  }

  useEffect(() => {
    loadData()
  }, [id, navigate])

  if (!item) return null

  const isFinanceiro = userRole === 'financeiro' || userRole === 'admin'
  const isPendingPay = item.status === 'aprovado'
  const canCancel =
    item.status === 'solicitado' &&
    (userRole === 'admin' || item.usuario_id === pb.authStore.record?.id)

  const handleAction = async (action: 'pago' | 'cancelado') => {
    try {
      await updateAdiantamento(item.id, {
        status: action,
        data_pagamento: action === 'pago' ? new Date().toISOString() : item.data_pagamento,
      })
      toast.success(`Adiantamento ${action === 'pago' ? 'marcado como pago' : 'cancelado'}!`)
      loadData()
    } catch {
      toast.error(`Erro ao atualizar status.`)
    }
  }

  const valorUtilizado = item.valor_utilizado || 0
  const saldo = item.valor - valorUtilizado
  const valorDevolver = item.valor_devolver || 0

  return (
    <div className="flex gap-6 h-full animate-fade-in pb-12">
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/adiantamentos')}
              className="mt-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  Detalhes do Adiantamento {item.codigo && `#${item.codigo}`}
                </h1>
                <Badge
                  variant="outline"
                  className={
                    item.status === 'aprovado' ||
                    item.status === 'pago' ||
                    item.status === 'acertado'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : item.status === 'rejeitado' || item.status === 'cancelado'
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : 'bg-amber-100 text-amber-700 border-amber-200'
                  }
                >
                  {item.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Solicitado em {formatDate(item.created)} por {item.expand?.usuario_id?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canCancel && (
              <Button variant="destructive" onClick={() => handleAction('cancelado')}>
                <XCircle className="w-4 h-4 mr-2" /> Cancelar Solicitação
              </Button>
            )}
            {isFinanceiro && isPendingPay && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleAction('pago')}
              >
                <DollarSign className="w-4 h-4 mr-2" /> Marcar como Pago
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" /> Informações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Valor Solicitado
                    </p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(item.valor)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Moeda</p>
                    <p className="font-medium">
                      {item.expand?.moeda_id?.codigo} - {item.expand?.moeda_id?.nome}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Viagem Associada
                    </p>
                    <p className="font-medium">{item.expand?.viagem_id?.codigo || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Data Prevista/Pagamento
                    </p>
                    <p className="font-medium">
                      {item.data_pagamento ? formatDate(item.data_pagamento) : '-'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Justificativa</p>
                    <p className="text-base bg-muted/30 p-3 rounded-md">{item.justificativa}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {workflowSteps.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" /> Fluxo de Aprovação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ApprovalTimeline
                    submittedBy={
                      item.expand?.usuario_id?.name || item.expand?.usuario_id?.email || 'Usuário'
                    }
                    submittedAt={item.created}
                    steps={workflowSteps.map((step: any) => ({
                      id: step.id,
                      approverName: step.expand?.aprovador_id?.name,
                      approverRole: step.expand?.etapa_id?.tipo_aprovador,
                      status: step.status,
                      decidedAt: step.decided_at,
                      comentario: step.comentario,
                    }))}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          <div className="md:col-span-1 space-y-6">
            <Card className="shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" /> Acerto de Contas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm text-muted-foreground">Valor Concedido</span>
                    <span className="font-semibold">{formatCurrency(item.valor)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm text-muted-foreground">Valor Utilizado</span>
                    <span className="font-semibold">{formatCurrency(valorUtilizado)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm text-muted-foreground">Devolução Pendente</span>
                    <span className={`font-semibold ${valorDevolver > 0 ? 'text-red-500' : ''}`}>
                      {formatCurrency(valorDevolver)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-bold">Saldo</span>
                    <span
                      className={`font-bold text-lg ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {formatCurrency(saldo)}
                    </span>
                  </div>

                  {item.prestacao_id && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground text-center mb-2">
                        Vinculado à prestação de contas
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/prestacoes/${item.prestacao_id}`)}
                      >
                        Ver Prestação
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
