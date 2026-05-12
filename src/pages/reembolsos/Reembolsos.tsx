import { useState, useEffect, useCallback, useMemo } from 'react'
import { format, isSameMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CheckCircle,
  Download,
  FileText,
  Search,
  History,
  Banknote,
  AlertCircle,
  Clock,
} from 'lucide-react'

import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import {
  getReembolsos,
  getPrestacoesPendentesFinanceiroCount,
  updateReembolsoStatus,
} from '@/services/reembolsos'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'

export default function Reembolsos() {
  const { userRole } = useAuth()
  const { toast } = useToast()

  const [reembolsos, setReembolsos] = useState<any[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchFilter, setSearchFilter] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [payDialog, setPayDialog] = useState<any>(null)
  const [historyDialog, setHistoryDialog] = useState<any>(null)

  const loadData = useCallback(async () => {
    try {
      const [reemData, pendCount] = await Promise.all([
        getReembolsos(),
        getPrestacoesPendentesFinanceiroCount(),
      ])
      setReembolsos(reemData)
      setPendingCount(pendCount)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os reembolsos.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('reembolsos', loadData)
  useRealtime('prestacoes_contas', loadData)

  const filteredReembolsos = useMemo(() => {
    return reembolsos.filter((r) => {
      const matchStatus = statusFilter === 'all' || r.status === statusFilter
      const matchSearch =
        searchFilter === '' ||
        r.codigo?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.expand?.usuario_id?.name?.toLowerCase().includes(searchFilter.toLowerCase())
      return matchStatus && matchSearch
    })
  }, [reembolsos, statusFilter, searchFilter])

  const totalAPagar = reembolsos
    .filter((r) => r.status === 'a_pagar')
    .reduce((acc, r) => acc + (r.valor || 0), 0)
  const totalPagosMes = reembolsos
    .filter(
      (r) =>
        r.status === 'pago' &&
        r.data_pagamento &&
        isSameMonth(new Date(r.data_pagamento), new Date()),
    )
    .reduce((acc, r) => acc + (r.valor || 0), 0)

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredReembolsos.map((r) => r.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id))
    }
  }

  const handleExportCSV = () => {
    const toExport = reembolsos.filter((r) => selectedIds.includes(r.id))
    if (toExport.length === 0) return

    const headers = [
      'Código',
      'Colaborador',
      'CPF',
      'Banco',
      'Agência',
      'Conta',
      'Chave PIX',
      'Valor',
      'Prestação',
      'Status',
    ]
    const rows = toExport.map((r) => [
      r.codigo || '',
      `"${r.expand?.usuario_id?.name || ''}"`,
      r.expand?.usuario_id?.cpf || '',
      `"${r.banco_destino || ''}"`,
      r.agencia_destino || '',
      r.conta_destino || '',
      r.chave_pix || '',
      r.valor?.toFixed(2) || '0.00',
      r.expand?.prestacao_id?.codigo || '',
      r.status || '',
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `remessa_pagamentos_${format(new Date(), 'yyyyMMdd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    const toExport = reembolsos.filter((r) => selectedIds.includes(r.id))
    if (toExport.length === 0) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const html = `
      <html>
        <head>
          <title>Remessa de Pagamentos</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f4f4f4; font-weight: bold; }
            h1 { font-size: 24px; margin-bottom: 5px; }
            .header { margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Remessa de Pagamentos</h1>
            <p><strong>Data de Emissão:</strong> ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Colaborador</th>
                <th>Dados Bancários</th>
                <th>Chave PIX</th>
                <th>Prestação</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              ${toExport
                .map(
                  (r) => `
                <tr>
                  <td>${r.codigo || '-'}</td>
                  <td>${r.expand?.usuario_id?.name || '-'}</td>
                  <td>
                    ${r.banco_destino ? `Banco: ${r.banco_destino}<br/>Ag: ${r.agencia_destino || '-'} / CC: ${r.conta_destino || '-'}` : '-'}
                  </td>
                  <td>${r.chave_pix || '-'}</td>
                  <td>${r.expand?.prestacao_id?.codigo || '-'}</td>
                  <td><strong>R$ ${r.valor?.toFixed(2)}</strong></td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [paymentRef, setPaymentRef] = useState('')

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const finalDate = new Date(paymentDate + 'T12:00:00').toISOString()
      await updateReembolsoStatus(payDialog.id, 'pago', finalDate, paymentRef)
      toast({ title: 'Sucesso', description: 'Reembolso marcado como pago.' })
      setPayDialog(null)
      setSelectedIds((prev) => prev.filter((id) => id !== payDialog.id))
      setPaymentRef('')
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível confirmar o pagamento.',
        variant: 'destructive',
      })
    }
  }

  const openPayDialog = (r: any) => {
    setPayDialog(r)
    setPaymentDate(format(new Date(), 'yyyy-MM-dd'))
    setPaymentRef('')
  }

  const isReadOnly = userRole === 'auditor'

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Reembolsos</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">A Pagar</CardTitle>
            <Banknote className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                totalAPagar,
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total de reembolsos pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagos no Mês
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                totalPagosMes,
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {format(new Date(), 'MMMM', { locale: ptBR })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aguardando Financeiro
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Prestações para aprovação</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código ou colaborador..."
                  className="pl-8"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="a_pagar">A Pagar</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedIds.length > 0 && !isReadOnly && (
              <div className="flex items-center gap-2 animate-fade-in">
                <span className="text-sm text-muted-foreground mr-2">
                  {selectedIds.length} selecionados
                </span>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="mr-2 h-4 w-4" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <FileText className="mr-2 h-4 w-4" /> PDF
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {!isReadOnly && (
                    <TableHead className="w-[50px] text-center">
                      <Checkbox
                        checked={
                          filteredReembolsos.length > 0 &&
                          selectedIds.length === filteredReembolsos.length
                        }
                        onCheckedChange={handleToggleAll}
                      />
                    </TableHead>
                  )}
                  <TableHead>Código</TableHead>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Prestação</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aprovação</TableHead>
                  <TableHead>Pagamento</TableHead>
                  {!isReadOnly && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={isReadOnly ? 7 : 8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredReembolsos.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isReadOnly ? 7 : 8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum reembolso encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReembolsos.map((r) => (
                    <TableRow key={r.id}>
                      {!isReadOnly && (
                        <TableCell className="text-center">
                          <Checkbox
                            checked={selectedIds.includes(r.id)}
                            onCheckedChange={(c) => handleToggleRow(r.id, !!c)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{r.codigo || '-'}</TableCell>
                      <TableCell>
                        <div
                          className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 -ml-1 rounded-md transition-colors w-fit"
                          onClick={() =>
                            setHistoryDialog({
                              userId: r.usuario_id,
                              userName: r.expand?.usuario_id?.name,
                            })
                          }
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={
                                r.expand?.usuario_id?.avatar
                                  ? pb.files.getURL(r.expand.usuario_id, r.expand.usuario_id.avatar)
                                  : ''
                              }
                            />
                            <AvatarFallback className="text-[10px]">
                              {r.expand?.usuario_id?.name?.substring(0, 2).toUpperCase() || 'US'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {r.expand?.usuario_id?.name || 'Desconhecido'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {r.expand?.prestacao_id?.codigo ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {r.expand.prestacao_id.codigo}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(r.valor || 0)}
                      </TableCell>
                      <TableCell>
                        {r.status === 'pago' ? (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                            Pago
                          </Badge>
                        ) : r.status === 'a_pagar' ? (
                          <Badge
                            variant="secondary"
                            className="bg-orange-100 text-orange-800 hover:bg-orange-200"
                          >
                            A Pagar
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Cancelado</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {r.data_aprovacao ? format(new Date(r.data_aprovacao), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {r.data_pagamento ? format(new Date(r.data_pagamento), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      {!isReadOnly && (
                        <TableCell className="text-right">
                          {r.status === 'a_pagar' && (
                            <Button size="sm" variant="outline" onClick={() => openPayDialog(r)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Pagar
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pay Dialog */}
      <Dialog open={!!payDialog} onOpenChange={(o) => !o && setPayDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          {payDialog && (
            <form onSubmit={submitPayment} className="space-y-4 py-2">
              <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reembolso:</span>
                  <span className="font-medium">{payDialog.codigo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      payDialog.valor || 0,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Colaborador:</span>
                  <span>{payDialog.expand?.usuario_id?.name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Data do Pagamento</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Referência / Comprovante</Label>
                <Input
                  placeholder="Ex: TED #12345 Banco Itaú"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setPayDialog(null)}>
                  Cancelar
                </Button>
                <Button type="submit">Confirmar Pagamento</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={!!historyDialog} onOpenChange={(o) => !o && setHistoryDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Histórico de Reembolsos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-md border border-border/50">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {historyDialog?.userName?.substring(0, 2).toUpperCase() || 'US'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium leading-none">{historyDialog?.userName}</p>
                <p className="text-xs text-muted-foreground mt-1">Colaborador</p>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
              {reembolsos
                .filter((r) => r.usuario_id === historyDialog?.userId)
                .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
                .map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-md gap-2 text-sm"
                  >
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {r.codigo}
                        {r.status === 'pago' ? (
                          <Badge
                            variant="default"
                            className="h-5 bg-green-500 hover:bg-green-600 text-[10px]"
                          >
                            Pago
                          </Badge>
                        ) : r.status === 'a_pagar' ? (
                          <Badge
                            variant="secondary"
                            className="h-5 bg-orange-100 text-orange-800 hover:bg-orange-200 text-[10px]"
                          >
                            A Pagar
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="h-5 text-[10px]">
                            Cancelado
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        Ref: {r.expand?.prestacao_id?.codigo || '-'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-primary">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(r.valor || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(r.created), 'dd/MM/yyyy')}
                      </div>
                    </div>
                  </div>
                ))}

              {reembolsos.filter((r) => r.usuario_id === historyDialog?.userId).length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum reembolso encontrado para este colaborador.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
