import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Search, Download, Eye, FileJson, Calendar as CalendarIcon, FilterX } from 'lucide-react'

import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'

const JsonDiffViewer = ({ before, after }: { before: any; after: any }) => {
  const beforeStr = JSON.stringify(before || {}, null, 2)
  const afterStr = JSON.stringify(after || {}, null, 2)

  return (
    <div className="grid grid-cols-2 gap-4 h-full min-h-[300px] max-h-[500px]">
      <div className="border rounded-md flex flex-col bg-muted/10 shadow-sm">
        <div className="bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground border-b flex items-center justify-between">
          <span>Estado Anterior</span>
          <Badge variant="outline" className="text-[10px] bg-background">
            before_state
          </Badge>
        </div>
        <ScrollArea className="flex-1">
          <pre className="p-4 text-xs font-mono bg-red-500/5 text-red-700 dark:text-red-300 w-full min-h-full">
            {beforeStr === '{}' ? 'Vazio' : beforeStr}
          </pre>
        </ScrollArea>
      </div>
      <div className="border rounded-md flex flex-col bg-muted/10 shadow-sm">
        <div className="bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground border-b flex items-center justify-between">
          <span>Novo Estado</span>
          <Badge variant="outline" className="text-[10px] bg-background">
            after_state
          </Badge>
        </div>
        <ScrollArea className="flex-1">
          <pre className="p-4 text-xs font-mono bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 w-full min-h-full">
            {afterStr === '{}' ? 'Vazio' : afterStr}
          </pre>
        </ScrollArea>
      </div>
    </div>
  )
}

export default function Auditoria() {
  const { currentEmpresa } = useAuth()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: 'all',
    module: 'all',
    startDate: '',
    endDate: '',
    search: '',
  })
  const [selectedLog, setSelectedLog] = useState<any>(null)

  const loadLogs = async () => {
    if (!currentEmpresa) return
    setLoading(true)
    try {
      let queryParts = [`empresa_id = "${currentEmpresa.id}"`]

      if (filters.action && filters.action !== 'all') {
        queryParts.push(`action = "${filters.action}"`)
      }
      if (filters.module && filters.module !== 'all') {
        queryParts.push(`module = "${filters.module}"`)
      }
      if (filters.search) {
        queryParts.push(
          `(record_id ~ "${filters.search}" || ip ~ "${filters.search}" || user_id.name ~ "${filters.search}" || user_id.email ~ "${filters.search}")`,
        )
      }
      if (filters.startDate) {
        queryParts.push(`created >= "${filters.startDate} 00:00:00.000Z"`)
      }
      if (filters.endDate) {
        queryParts.push(`created <= "${filters.endDate} 23:59:59.999Z"`)
      }

      const res = await pb.collection('audit_log').getList(1, 100, {
        filter: queryParts.join(' && '),
        sort: '-created',
        expand: 'user_id',
      })
      setLogs(res.items)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delay = setTimeout(loadLogs, 300)
    return () => clearTimeout(delay)
  }, [filters, currentEmpresa])

  const exportCSV = () => {
    const headers = ['Data', 'Usuário', 'Ação', 'Módulo', 'ID Registro', 'IP']
    const rows = logs.map((l) => [
      format(new Date(l.created), 'dd/MM/yyyy HH:mm:ss'),
      l.expand?.user_id?.name || l.expand?.user_id?.email || 'Sistema',
      l.action,
      l.module,
      l.record_id || '',
      l.ip || '',
    ])
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(',')),
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `auditoria_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">
            CREATE
          </Badge>
        )
      case 'update':
        return (
          <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">
            UPDATE
          </Badge>
        )
      case 'delete':
        return (
          <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
            DELETE
          </Badge>
        )
      case 'login':
        return (
          <Badge className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-purple-500/20">
            LOGIN
          </Badge>
        )
      case 'falso_positivo':
        return (
          <Badge className="bg-warning/10 text-warning hover:bg-warning/20 border-warning/20">
            FALSO POSITIVO
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="uppercase">
            {action}
          </Badge>
        )
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h1>
          <p className="text-muted-foreground mt-1">
            Rastreamento completo de transações e mudanças de estado.
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="bg-background">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FilterX className="w-4 h-4 text-muted-foreground" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Data Inicial</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
                className="bg-background"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Data Final</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
                className="bg-background"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Ação</label>
              <Select
                value={filters.action}
                onValueChange={(v) => setFilters((f) => ({ ...f, action: v }))}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="create">Criar (CREATE)</SelectItem>
                  <SelectItem value="update">Atualizar (UPDATE)</SelectItem>
                  <SelectItem value="delete">Excluir (DELETE)</SelectItem>
                  <SelectItem value="login">Autenticação (LOGIN)</SelectItem>
                  <SelectItem value="falso_positivo">Falso Positivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Módulo</label>
              <Select
                value={filters.module}
                onValueChange={(v) => setFilters((f) => ({ ...f, module: v }))}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todos os módulos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os módulos</SelectItem>
                  <SelectItem value="viagens">Viagens</SelectItem>
                  <SelectItem value="despesas">Despesas</SelectItem>
                  <SelectItem value="prestacoes_contas">Prestações</SelectItem>
                  <SelectItem value="users">Usuários</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 md:col-span-4">
              <label className="text-xs font-medium">Buscar (Usuário, ID ou IP)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Busque por nome, ID ou IP..."
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  className="pl-9 bg-background"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <Table data-tabular>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow className="hover:bg-surface-container transition-colors">
                <TableHead className="text-label-caps text-on-surface-variant h-10 w-[180px]">
                  Data / Hora
                </TableHead>
                <TableHead className="text-label-caps text-on-surface-variant h-10">
                  Usuário
                </TableHead>
                <TableHead className="text-label-caps text-on-surface-variant h-10">Ação</TableHead>
                <TableHead className="text-label-caps text-on-surface-variant h-10">
                  Módulo
                </TableHead>
                <TableHead className="text-label-caps text-on-surface-variant h-10">
                  ID Registro
                </TableHead>
                <TableHead className="text-label-caps text-on-surface-variant h-10 text-right">
                  Detalhes
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="hover:bg-surface-container transition-colors">
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Carregando logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow className="hover:bg-surface-container transition-colors">
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Nenhum registro encontrado para os filtros atuais.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-surface-container transition-colors">
                    <TableCell className="text-data-tabular text-on-surface-variant whitespace-nowrap">
                      {format(new Date(log.created), 'dd/MM/yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell className="text-body-sm">
                      {log.expand?.user_id ? (
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {log.expand.user_id.name || 'Sem nome'}
                          </span>
                          <span className="text-muted-foreground">{log.expand.user_id.email}</span>
                        </div>
                      ) : (
                        <span className="italic text-muted-foreground">Sistema</span>
                      )}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="text-body-sm capitalize font-medium">
                      {log.module.replace('_', ' ')}
                    </TableCell>
                    <TableCell className="text-data-tabular tabular-nums">
                      <div className="flex flex-col">
                        <span className="truncate max-w-[120px]">{log.record_id || '-'}</span>
                        {log.ip && (
                          <span className="text-[10px] text-muted-foreground font-sans">
                            IP: {log.ip}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                        <FileJson className="w-4 h-4 mr-2" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Detalhes do Registro
            </DialogTitle>
            <DialogDescription>
              Comparação de estado (JSON Diff) da ação{' '}
              <strong className="uppercase">{selectedLog?.action}</strong> no módulo{' '}
              <strong>{selectedLog?.module}</strong>
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="flex-1 overflow-hidden mt-4">
              <JsonDiffViewer before={selectedLog.before_state} after={selectedLog.after_state} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
