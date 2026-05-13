import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  HelpCircle,
  FileText,
  Download,
} from 'lucide-react'
import { format } from 'date-fns'

import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/common/EmptyState'

export default function AuditoriaDuplicadas() {
  const { currentEmpresa, user } = useAuth()
  const { toast } = useToast()
  const [alertas, setAlertas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadAlertas = async () => {
    if (!currentEmpresa) return
    setLoading(true)
    try {
      const res = await pb.collection('duplicidade_alertas').getList(1, 50, {
        filter: `empresa_id = "${currentEmpresa.id}" && status = "aberto"`,
        expand:
          'despesa_a_id,despesa_b_id,despesa_a_id.usuario_id,despesa_a_id.fornecedor_id,despesa_a_id.categoria_id,despesa_b_id.usuario_id',
        sort: '-created',
      })

      // Load comprovantes for each expense
      const alertsWithComprovantes = await Promise.all(
        res.items.map(async (alerta) => {
          try {
            const compA = await pb
              .collection('despesa_comprovantes')
              .getList(1, 1, { filter: `despesa_id = "${alerta.despesa_a_id}"` })
            const compB = await pb
              .collection('despesa_comprovantes')
              .getList(1, 1, { filter: `despesa_id = "${alerta.despesa_b_id}"` })
            return {
              ...alerta,
              compA: compA.items[0] || null,
              compB: compB.items[0] || null,
            }
          } catch {
            return { ...alerta, compA: null, compB: null }
          }
        }),
      )

      setAlertas(alertsWithComprovantes)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os alertas.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlertas()
  }, [currentEmpresa])

  const handleConfirm = async (alerta: any) => {
    try {
      await pb.collection('duplicidade_alertas').update(alerta.id, {
        status: 'confirmado',
        reviewed_by: user?.id,
      })

      const despesaB = alerta.expand?.despesa_b_id
      if (despesaB) {
        await pb.collection('despesas').update(despesaB.id, {
          status: 'rejeitada',
          descricao: (despesaB.descricao || '') + ' [REJEITADA POR DUPLICIDADE]',
        })
      }

      toast({ title: 'Sucesso', description: 'Duplicidade confirmada e despesa rejeitada.' })
      loadAlertas()
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao confirmar duplicidade.',
        variant: 'destructive',
      })
    }
  }

  const handleFalsoPositivo = async (alerta: any) => {
    try {
      await pb.collection('duplicidade_alertas').update(alerta.id, {
        status: 'falso_positivo',
        reviewed_by: user?.id,
      })

      if (alerta.despesa_a_id) {
        await pb.collection('despesas').update(alerta.despesa_a_id, { possivel_duplicidade: false })
      }
      if (alerta.despesa_b_id) {
        await pb.collection('despesas').update(alerta.despesa_b_id, { possivel_duplicidade: false })
      }

      await pb.collection('audit_log').create({
        empresa_id: currentEmpresa?.id,
        user_id: user?.id,
        action: 'falso_positivo',
        module: 'despesas',
        record_id: alerta.id,
        before_state: alerta,
        after_state: { ...alerta, status: 'falso_positivo' },
        ip: 'client',
        user_agent: navigator.userAgent,
      })

      toast({ title: 'Sucesso', description: 'Marcado como falso positivo.' })
      loadAlertas()
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao marcar falso positivo.',
        variant: 'destructive',
      })
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  return (
    <div className="flex gap-6 h-full">
      <div className="flex-1 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoria de Duplicadas</h1>
          <p className="text-muted-foreground mt-1">
            Verifique despesas identificadas como possíveis duplicações pelo sistema.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : alertas.length === 0 ? (
          <Card className="border-dashed bg-muted/30">
            <CardContent className="p-0">
              <EmptyState
                variant="success"
                icon={CheckCircle}
                title="Nenhuma duplicidade pendente"
                description="O sistema não encontrou novas despesas suspeitas."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {alertas.map((alerta) => {
              const dA = alerta.expand?.despesa_a_id
              const dB = alerta.expand?.despesa_b_id
              if (!dA || !dB) return null

              return (
                <Card key={alerta.id} className="overflow-hidden border-warning/30 shadow-sm">
                  <div className="bg-warning/10 px-4 py-3 flex items-center justify-between border-b border-warning/20">
                    <div className="flex items-center gap-2 text-warning-foreground font-medium">
                      <AlertCircle className="w-5 h-5 text-warning" />
                      Assinatura de Risco: {alerta.motivo}
                    </div>
                    <Badge variant="outline" className="bg-background">
                      ID: {alerta.id.substring(0, 8)}
                    </Badge>
                  </div>

                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b">
                      {/* Despesa A */}
                      <div className="p-5 flex flex-col bg-background/50">
                        <div className="flex items-center justify-between mb-4">
                          <Badge variant="secondary">Despesa Original</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(dA.created), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-4 text-sm mb-4">
                          <div>
                            <p className="text-label-caps text-on-surface-variant">Viajante</p>
                            <p className="text-body-sm font-medium truncate">
                              {dA.expand?.usuario_id?.name || dA.expand?.usuario_id?.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-label-caps text-on-surface-variant">Fornecedor</p>
                            <p className="text-body-sm font-medium truncate">
                              {dA.expand?.fornecedor_id?.nome || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-label-caps text-on-surface-variant">
                              Data da Despesa
                            </p>
                            <p className="text-data-tabular text-on-surface-variant whitespace-nowrap">
                              {format(new Date(dA.data_despesa), 'dd/MM/yyyy')}
                            </p>
                          </div>
                          <div>
                            <p className="text-label-caps text-on-surface-variant">Valor</p>
                            <p className="text-data-tabular tabular-nums font-bold text-lg">
                              {formatCurrency(dA.valor)}
                            </p>
                          </div>
                        </div>

                        {alerta.compA ? (
                          <div className="mt-auto pt-4 border-t flex items-center gap-3">
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center shrink-0">
                              <FileText className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-medium truncate">{alerta.compA.arquivo}</p>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-xs text-primary"
                                onClick={() =>
                                  window.open(
                                    pb.files.getURL(alerta.compA, alerta.compA.arquivo),
                                    '_blank',
                                  )
                                }
                              >
                                Ver Comprovante
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-auto pt-4 border-t text-sm text-muted-foreground italic flex items-center gap-2">
                            <XCircle className="w-4 h-4" /> Sem comprovante anexado
                          </div>
                        )}
                      </div>

                      {/* Despesa B */}
                      <div className="p-5 flex flex-col bg-muted/10 relative">
                        <div className="absolute top-0 right-0 p-5 hidden md:block">
                          <Badge variant="destructive" className="animate-pulse">
                            Suspeita
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mb-4 md:hidden">
                          <Badge variant="destructive">Suspeita de Duplicidade</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(dB.created), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                        <div className="hidden md:block mb-4">
                          <span className="text-sm text-muted-foreground">
                            Cadastrada em {format(new Date(dB.created), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-4 text-sm mb-4">
                          <div>
                            <p className="text-label-caps text-on-surface-variant">Viajante</p>
                            <p className="text-body-sm font-medium truncate">
                              {dB.expand?.usuario_id?.name || dB.expand?.usuario_id?.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-label-caps text-on-surface-variant">Categoria</p>
                            <p className="text-body-sm font-medium truncate">
                              {dA.expand?.categoria_id?.nome || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-label-caps text-on-surface-variant">
                              Data da Despesa
                            </p>
                            <p className="text-data-tabular text-on-surface-variant whitespace-nowrap">
                              {format(new Date(dB.data_despesa), 'dd/MM/yyyy')}
                            </p>
                          </div>
                          <div>
                            <p className="text-label-caps text-on-surface-variant">Valor</p>
                            <p className="text-data-tabular tabular-nums font-bold text-lg text-destructive">
                              {formatCurrency(dB.valor)}
                            </p>
                          </div>
                        </div>

                        {alerta.compB ? (
                          <div className="mt-auto pt-4 border-t flex items-center gap-3">
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center shrink-0">
                              <FileText className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-medium truncate">{alerta.compB.arquivo}</p>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-xs text-primary"
                                onClick={() =>
                                  window.open(
                                    pb.files.getURL(alerta.compB, alerta.compB.arquivo),
                                    '_blank',
                                  )
                                }
                              >
                                Ver Comprovante
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-auto pt-4 border-t text-sm text-muted-foreground italic flex items-center gap-2">
                            <XCircle className="w-4 h-4" /> Sem comprovante anexado
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="bg-muted/30 px-5 py-4 flex flex-wrap gap-3 justify-end">
                    <Button
                      variant="outline"
                      className="text-foreground"
                      onClick={() => handleFalsoPositivo(alerta)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" /> Falso Positivo
                    </Button>
                    <Button variant="destructive" onClick={() => handleConfirm(alerta)}>
                      <AlertCircle className="w-4 h-4 mr-2" /> Confirmar Duplicidade
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <div className="w-[300px] hidden xl:block shrink-0">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Regras de Detecção
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4 text-muted-foreground">
            <p>
              O sistema cruza automaticamente as despesas recém-inseridas para encontrar potenciais
              duplicidades, ajudando a evitar pagamentos indevidos.
            </p>

            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                Parâmetros Atuais:
              </h4>
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-emerald-500" /> Mesmo Valor
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-emerald-500" /> Mesma Data
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-emerald-500" /> Mesmo Viajante
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-emerald-500" /> Mesmo Fornecedor (opcional)
                </li>
              </ul>
            </div>

            <Separator />
            <p className="text-xs italic">
              Ações realizadas nesta página geram registros automáticos de auditoria.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
