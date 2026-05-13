import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  FileText,
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  Printer,
  Image as ImageIcon,
  RotateCcw,
  Landmark,
  History,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/use-auth'
import {
  getPrestacao,
  getDespesasPorPrestacao,
  getAdiantamentosPorPrestacao,
  getPrestacaoAnexos,
  updatePrestacao,
} from '@/services/prestacoes'
import { getWorkflowRunSteps, triggerWorkflow } from '@/services/workflows'
import { getDespesaComprovantes } from '@/services/prestacoes'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'
import { exportPrestacaoPDF } from '@/lib/pdf-export'
import { ApprovalTimeline } from '@/components/common/ApprovalTimeline'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/common/StatusBadge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

export default function DetalhePrestacao() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, currentEmpresa, userRole } = useAuth()

  const [prestacao, setPrestacao] = useState<any>(null)
  const [despesas, setDespesas] = useState<any[]>([])
  const [adiantamentos, setAdiantamentos] = useState<any[]>([])
  const [anexos, setAnexos] = useState<any[]>([])
  const [despesasComprovantes, setDespesasComprovantes] = useState<Record<string, any[]>>({})
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([])

  const [viewerUrl, setViewerUrl] = useState<string | null>(null)

  const isOwner = user?.id === prestacao?.usuario_id
  const isDraft = prestacao?.status === 'rascunho'
  const isManager = userRole === 'gestor'
  const isFinance = userRole === 'financeiro' || userRole === 'admin'

  const loadData = async () => {
    if (!id || !currentEmpresa || !user) return
    try {
      const p = await getPrestacao(id)
      setPrestacao(p)

      const [d, a, ax] = await Promise.all([
        getDespesasPorPrestacao(id),
        getAdiantamentosPorPrestacao(id),
        getPrestacaoAnexos(id),
      ])
      setDespesas(d)
      setAdiantamentos(a)
      setAnexos(ax)

      if (p.workflow_run_id) {
        getWorkflowRunSteps(p.workflow_run_id).then(setWorkflowSteps)
      }

      const comprovantesMap: Record<string, any[]> = {}
      for (const despesa of d) {
        const comps = await getDespesaComprovantes(despesa.id)
        comprovantesMap[despesa.id] = comps
      }
      setDespesasComprovantes(comprovantesMap)
    } catch (err) {
      toast.error('Erro ao carregar dados.')
    }
  }

  useEffect(() => {
    loadData()
  }, [id, currentEmpresa, user])

  const handleAction = async (action: string) => {
    if (!id || !currentEmpresa) return
    try {
      let nextStatus = prestacao.status
      if (action === 'enviar') {
        nextStatus = 'enviada'
        await triggerWorkflow(currentEmpresa.id, 'prestacao', 'prestacoes_contas', id, user.id)
      } else if (action === 'aprovar_gestor') {
        nextStatus = 'em_aprovacao_financeiro'
      } else if (action === 'aprovar_financeiro') {
        nextStatus = 'aprovada'
      } else if (action === 'rejeitar') {
        nextStatus = 'rejeitada'
      } else if (action === 'devolver') {
        nextStatus = 'devolvida'
      } else if (action === 'pagar') {
        nextStatus = 'paga'
      }

      await updatePrestacao(id, {
        status: nextStatus,
        [action === 'enviar'
          ? 'data_envio'
          : action === 'aprovar_financeiro'
            ? 'data_aprovacao_financeiro'
            : action === 'pagar'
              ? 'data_pagamento'
              : 'updated']: new Date().toISOString(),
      })
      toast.success('Ação realizada com sucesso!')
      loadData()
    } catch (err) {
      toast.error('Erro ao processar ação.')
    }
  }

  const handleExportPDF = () => {
    if (!prestacao || !currentEmpresa) return

    let minDate = new Date()
    let maxDate = new Date(0)
    if (despesas.length > 0) {
      despesas.forEach((d) => {
        const dDate = new Date(d.data_despesa)
        if (dDate < minDate) minDate = dDate
        if (dDate > maxDate) maxDate = dDate
      })
    }

    const periodoInicio = despesas.length > 0 ? format(minDate, 'dd/MM/yyyy') : '-'
    const periodoFim = despesas.length > 0 ? format(maxDate, 'dd/MM/yyyy') : '-'

    exportPrestacaoPDF({
      codigo: prestacao.codigo || '-',
      titulo: prestacao.titulo || 'Prestação',
      viajante_nome:
        prestacao.expand?.usuario_id?.name || prestacao.expand?.usuario_id?.email || '-',
      empresa_nome: currentEmpresa.nome_fantasia || currentEmpresa.razao_social || '-',
      viagem_codigo: prestacao.expand?.viagem_id?.codigo,
      periodo: { inicio: periodoInicio, fim: periodoFim },
      despesas: despesas.map((d) => ({
        data: format(new Date(d.data_despesa), 'dd/MM/yyyy'),
        categoria: d.expand?.categoria_id?.nome || '-',
        fornecedor: d.expand?.fornecedor_id?.nome || '-',
        descricao: d.descricao || '-',
        valor: d.valor_convertido || d.valor || 0,
      })),
      total_despesas: prestacao.total_despesas || 0,
      total_adiantamento: prestacao.total_adiantamento || 0,
      saldo: prestacao.saldo || 0,
      moeda_simbolo: currency,
      timeline: workflowSteps.map((step) => ({
        etapa: step.expand?.etapa_id?.tipo_aprovador?.replace('_', ' ') || '-',
        aprovador: step.expand?.aprovador_id?.name || '-',
        data: step.decided_at ? format(new Date(step.decided_at), 'dd/MM/yyyy HH:mm') : 'Pendente',
        comentario: step.comentario || '-',
      })),
    })
  }

  if (!prestacao) return null

  const currency = prestacao.expand?.moeda_id?.codigo || 'BRL'

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10 animate-fade-in print:max-w-none print:m-0 print:p-0 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/prestacoes')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{prestacao.titulo}</h2>
            <div className="text-sm text-muted-foreground flex gap-2 items-center mt-1">
              <span>{prestacao.codigo || '-'}</span>
              <span>•</span>
              <StatusBadge status={prestacao.status} />
              <span>•</span>
              <span>
                {prestacao.expand?.usuario_id?.name || prestacao.expand?.usuario_id?.email}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Printer className="w-4 h-4 mr-2" /> Exportar PDF
          </Button>

          {isOwner && (isDraft || prestacao.status === 'devolvida') && (
            <Button onClick={() => handleAction('enviar')} className="bg-primary">
              <Send className="w-4 h-4 mr-2" /> Enviar para Aprovação
            </Button>
          )}

          {(prestacao.status === 'enviada' || prestacao.status === 'em_aprovacao_gestor') &&
            isManager && (
              <>
                <Button
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  onClick={() => handleAction('rejeitar')}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Rejeitar
                </Button>
                <Button variant="outline" onClick={() => handleAction('devolver')}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Devolver
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleAction('aprovar_gestor')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Aprovar
                </Button>
              </>
            )}

          {prestacao.status === 'em_aprovacao_financeiro' && isFinance && (
            <>
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => handleAction('rejeitar')}
              >
                <XCircle className="w-4 h-4 mr-2" /> Rejeitar
              </Button>
              <Button variant="outline" onClick={() => handleAction('devolver')}>
                <RotateCcw className="w-4 h-4 mr-2" /> Devolver
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleAction('aprovar_financeiro')}
              >
                <CheckCircle className="w-4 h-4 mr-2" /> Aprovar
              </Button>
            </>
          )}

          {prestacao.status === 'aprovada' && isFinance && (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleAction('pagar')}>
              <Landmark className="w-4 h-4 mr-2" /> Marcar como Paga
            </Button>
          )}
        </div>
      </div>

      <div className="hidden print:block mb-8 text-center border-b border-outline-variant pb-4">
        {currentEmpresa.logo && (
          <img
            src={pb.files.getURL(currentEmpresa, currentEmpresa.logo)}
            alt="Logo"
            className="h-16 mx-auto mb-4 object-contain"
          />
        )}
        <h1 className="text-2xl font-bold uppercase tracking-wider">
          {currentEmpresa.nome_fantasia || currentEmpresa.razao_social}
        </h1>
        <h2 className="text-xl mt-2">Relatório de Prestação de Contas</h2>
        <p className="text-sm mt-1">
          Código: {prestacao.codigo} | Emissão: {format(new Date(), 'dd/MM/yyyy HH:mm')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
        <Card className="lg:col-span-2 shadow-sm border-outline-variant/50 bg-surface-container-lowest">
          <CardHeader>
            <CardTitle className="text-lg">Dados Principais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div>
                <p className="text-muted-foreground">Colaborador</p>
                <p className="font-medium text-base">
                  {prestacao.expand?.usuario_id?.name || prestacao.expand?.usuario_id?.email}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Data de Envio</p>
                <p className="font-medium text-base">
                  {prestacao.data_envio
                    ? format(new Date(prestacao.data_envio), 'dd/MM/yyyy')
                    : '-'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Viagem Relacionada</p>
                <p className="font-medium text-base">
                  {prestacao.expand?.viagem_id
                    ? `${prestacao.expand.viagem_id.codigo} - ${prestacao.expand.viagem_id.motivo}`
                    : 'Nenhuma viagem vinculada'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Descrição</p>
                <p className="font-medium text-base">{prestacao.descricao || 'Sem descrição.'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-outline-variant/50 bg-surface-container-low print:bg-white print:border">
          <CardHeader>
            <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total de Despesas</span>
              <span className="font-medium text-base">
                {prestacao.total_despesas?.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency,
                }) || (0).toLocaleString('pt-BR', { style: 'currency', currency })}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total de Adiantamentos</span>
              <span className="font-medium text-base text-destructive">
                -{' '}
                {prestacao.total_adiantamento?.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency,
                }) || (0).toLocaleString('pt-BR', { style: 'currency', currency })}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Saldo Final</span>
              <span
                className={cn(
                  prestacao.saldo > 0
                    ? 'text-primary'
                    : prestacao.saldo < 0
                      ? 'text-destructive'
                      : '',
                )}
              >
                {prestacao.saldo?.toLocaleString('pt-BR', { style: 'currency', currency }) ||
                  (0).toLocaleString('pt-BR', { style: 'currency', currency })}
              </span>
            </div>
            <div className="bg-surface-container-lowest rounded-md p-3 text-center border border-outline-variant mt-2">
              <span className="text-sm font-medium uppercase tracking-wide">
                {prestacao.saldo > 0
                  ? 'A pagar ao colaborador'
                  : prestacao.saldo < 0
                    ? 'A devolver à empresa'
                    : 'Sem saldo residual'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="despesas" className="mt-8 print:hidden">
        <TabsList className="mb-4">
          <TabsTrigger value="despesas">Despesas ({despesas.length})</TabsTrigger>
          <TabsTrigger value="adiantamentos">Adiantamentos ({adiantamentos.length})</TabsTrigger>
          <TabsTrigger value="anexos">Anexos ({anexos.length})</TabsTrigger>
          <TabsTrigger value="workflow">Histórico & Aprovações</TabsTrigger>
        </TabsList>

        <TabsContent value="despesas">
          <Card className="bg-surface-container-lowest border-outline-variant">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Comprovante</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {despesas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        Nenhuma despesa vinculada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    despesas.map((d) => {
                      const comp = despesasComprovantes[d.id]?.[0]
                      return (
                        <TableRow key={d.id}>
                          <TableCell>
                            {comp ? (
                              <button
                                onClick={() => setViewerUrl(pb.files.getURL(comp, comp.arquivo))}
                                className="w-10 h-10 rounded border border-outline-variant overflow-hidden hover:opacity-80 transition flex items-center justify-center bg-surface-container"
                              >
                                {comp.arquivo.endsWith('.pdf') ? (
                                  <FileText className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                  <img
                                    src={pb.files.getURL(comp, comp.arquivo)}
                                    alt="Thumb"
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </button>
                            ) : (
                              <div className="w-10 h-10 rounded border border-outline-variant flex items-center justify-center bg-surface-container-low">
                                <ImageIcon className="w-4 h-4 text-muted/50" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{format(new Date(d.data_despesa), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="font-medium">
                            {d.expand?.categoria_id?.nome}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={d.descricao}>
                            {d.descricao || '-'}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {(d.valor_convertido || d.valor)?.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: d.expand?.moeda_id?.codigo || 'BRL',
                            })}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adiantamentos">
          <Card className="bg-surface-container-lowest border-outline-variant">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Justificativa</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adiantamentos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        Nenhum adiantamento vinculado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    adiantamentos.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{format(new Date(a.created), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{a.justificativa}</TableCell>
                        <TableCell className="text-right font-semibold text-destructive">
                          -{' '}
                          {a.valor?.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: a.expand?.moeda_id?.codigo || 'BRL',
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anexos">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {anexos.map((a) => (
              <Card
                key={a.id}
                className="overflow-hidden cursor-pointer hover:border-primary transition bg-surface-container-lowest border-outline-variant"
                onClick={() => setViewerUrl(pb.files.getURL(a, a.arquivo))}
              >
                <div className="aspect-square bg-surface-container-low flex items-center justify-center p-4">
                  {a.arquivo.endsWith('.pdf') ? (
                    <FileText className="w-12 h-12 text-muted-foreground" />
                  ) : (
                    <img
                      src={pb.files.getURL(a, a.arquivo)}
                      alt="Anexo"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <CardContent className="p-3 text-sm truncate">{a.arquivo}</CardContent>
              </Card>
            ))}
            {anexos.length === 0 && (
              <div className="col-span-full py-8 text-center text-muted-foreground">
                Nenhum anexo adicional.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="workflow">
          <Card className="bg-surface-container-lowest border-outline-variant">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5" /> Linha do Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workflowSteps.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Nenhum histórico de aprovação disponível.
                </div>
              ) : (
                <ApprovalTimeline
                  submittedBy={
                    prestacao.expand?.usuario_id?.name ||
                    prestacao.expand?.usuario_id?.email ||
                    'Usuário'
                  }
                  submittedAt={prestacao.data_envio || prestacao.created}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print Only Views */}
      <div className="hidden print:block mt-8">
        <h3 className="text-xl font-bold mb-4 border-b pb-2">1. Despesas Detalhadas</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Data</th>
              <th className="border p-2 text-left">Categoria</th>
              <th className="border p-2 text-left">Descrição</th>
              <th className="border p-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {despesas.map((d) => (
              <tr key={d.id}>
                <td className="border p-2">{format(new Date(d.data_despesa), 'dd/MM/yyyy')}</td>
                <td className="border p-2">{d.expand?.categoria_id?.nome}</td>
                <td className="border p-2">{d.descricao || '-'}</td>
                <td className="border p-2 text-right">
                  {(d.valor_convertido || d.valor)?.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: d.expand?.moeda_id?.codigo || 'BRL',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {adiantamentos.length > 0 && (
          <>
            <h3 className="text-xl font-bold mt-8 mb-4 border-b pb-2">
              2. Adiantamentos Vinculados
            </h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Data</th>
                  <th className="border p-2 text-left">Justificativa</th>
                  <th className="border p-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {adiantamentos.map((a) => (
                  <tr key={a.id}>
                    <td className="border p-2">{format(new Date(a.created), 'dd/MM/yyyy')}</td>
                    <td className="border p-2">{a.justificativa}</td>
                    <td className="border p-2 text-right">
                      {a.valor?.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: a.expand?.moeda_id?.codigo || 'BRL',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div className="mt-16 pt-8 text-center text-sm text-gray-500">
          <p>Assinatura Eletrônica Registrada no Sistema Gestão V&D</p>
          <p>Este documento possui validade legal conforme política interna.</p>
        </div>

        {/* Appendices for images in print */}
        <div className="break-before-page">
          <h3 className="text-xl font-bold mb-4 border-b pb-2">Anexos & Comprovantes</h3>
          <div className="flex flex-col gap-8">
            {despesas.map((d) => {
              const comps = despesasComprovantes[d.id] || []
              return comps.map(
                (c) =>
                  !c.arquivo.endsWith('.pdf') && (
                    <div key={c.id} className="text-center break-inside-avoid">
                      <p className="font-bold mb-2">
                        Ref: {d.expand?.categoria_id?.nome} -{' '}
                        {format(new Date(d.data_despesa), 'dd/MM/yyyy')}
                      </p>
                      <img
                        src={pb.files.getURL(c, c.arquivo)}
                        className="max-w-full max-h-[800px] object-contain mx-auto border p-2"
                      />
                    </div>
                  ),
              )
            })}
            {anexos.map(
              (a) =>
                !a.arquivo.endsWith('.pdf') && (
                  <div key={a.id} className="text-center break-inside-avoid">
                    <p className="font-bold mb-2">Anexo: {a.arquivo}</p>
                    <img
                      src={pb.files.getURL(a, a.arquivo)}
                      className="max-w-full max-h-[800px] object-contain mx-auto border p-2"
                    />
                  </div>
                ),
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!viewerUrl} onOpenChange={(open) => !open && setViewerUrl(null)}>
        <DialogContent className="max-w-5xl h-[85vh] p-2 flex flex-col items-center justify-center bg-black/5 [&>button]:hidden">
          <DialogTitle className="sr-only">Visualização de Arquivo</DialogTitle>
          <DialogDescription className="sr-only">
            Visualização do comprovante ou anexo
          </DialogDescription>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-4 right-4 z-50 rounded-full"
            onClick={() => setViewerUrl(null)}
          >
            <XCircle className="w-5 h-5" />
          </Button>
          {viewerUrl?.endsWith('.pdf') ? (
            <iframe src={viewerUrl} className="w-full h-full bg-white rounded-md shadow-sm" />
          ) : (
            <img
              src={viewerUrl || ''}
              alt="Visualização"
              className="max-w-full max-h-full object-contain rounded-md shadow-sm bg-white p-2"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
