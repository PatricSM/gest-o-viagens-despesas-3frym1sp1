import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, FileText, Filter, X } from 'lucide-react'
import { format } from 'date-fns'

import { useAuth } from '@/hooks/use-auth'
import { getPrestacoes, getUsuariosPorEmpresa, getViagensPorEmpresa } from '@/services/prestacoes'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'

const statusOptions = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'em_aprovacao_gestor', label: 'Aprovação Gestor' },
  { value: 'em_aprovacao_financeiro', label: 'Aprovação Fin.' },
  { value: 'aprovada', label: 'Aprovada' },
  { value: 'paga', label: 'Paga' },
  { value: 'rejeitada', label: 'Rejeitada' },
  { value: 'devolvida', label: 'Devolvida' },
]

export default function ListaPrestacoes() {
  const { currentEmpresa, userRole, user } = useAuth()
  const navigate = useNavigate()
  const [prestacoes, setPrestacoes] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [viagens, setViagens] = useState<any[]>([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [usuarioFilter, setUsuarioFilter] = useState<string>('all')
  const [viagemFilter, setViagemFilter] = useState<string>('all')
  const [dataInicio, setDataInicio] = useState<string>('')
  const [dataFim, setDataFim] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    if (!currentEmpresa) return
    setIsLoading(true)
    try {
      const filters: any = {}
      if (statusFilter !== 'all') filters.status = [statusFilter]
      if (usuarioFilter !== 'all') filters.usuario_id = usuarioFilter
      else if (userRole === 'viajante') filters.usuario_id = user?.id
      if (viagemFilter !== 'all') filters.viagem_id = viagemFilter
      if (dataInicio) filters.dataInicio = dataInicio
      if (dataFim) filters.dataFim = dataFim

      const data = await getPrestacoes(currentEmpresa.id, filters)
      setPrestacoes(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentEmpresa) {
      loadData()
      if (userRole !== 'viajante') {
        getUsuariosPorEmpresa(currentEmpresa.id).then(setUsuarios)
      }
      getViagensPorEmpresa(currentEmpresa.id).then((v) => {
        if (userRole === 'viajante') {
          setViagens(v.filter((vi: any) => vi.usuario_id === user?.id))
        } else {
          setViagens(v)
        }
      })
    }
  }, [
    currentEmpresa,
    userRole,
    user?.id,
    statusFilter,
    usuarioFilter,
    viagemFilter,
    dataInicio,
    dataFim,
  ])

  const filteredData = prestacoes.filter(
    (p) =>
      p.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (p.codigo && p.codigo.toLowerCase().includes(search.toLowerCase())) ||
      p.expand?.usuario_id?.name?.toLowerCase().includes(search.toLowerCase()),
  )

  const clearFilters = () => {
    setStatusFilter('all')
    setUsuarioFilter('all')
    setViagemFilter('all')
    setDataInicio('')
    setDataFim('')
    setSearch('')
  }

  const activeFiltersCount = [
    statusFilter !== 'all',
    usuarioFilter !== 'all',
    viagemFilter !== 'all',
    dataInicio !== '',
    dataFim !== '',
  ].filter(Boolean).length

  return (
    <div className="space-y-6 animate-fade-in print:hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Prestações de Contas</h2>
          <p className="text-muted-foreground">Gerencie relatórios de despesas e adiantamentos.</p>
        </div>
        <Button asChild>
          <Link to="/prestacoes/nova">
            <Plus className="mr-2 h-4 w-4" /> Nova Prestação
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, título ou viajante..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Filtros Avançados</h4>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {statusOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {userRole !== 'viajante' && (
                    <div className="space-y-2">
                      <Label>Viajante</Label>
                      <Select value={usuarioFilter} onValueChange={setUsuarioFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {usuarios.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name || u.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Viagem</Label>
                    <Select value={viagemFilter} onValueChange={setViagemFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {viagens.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.codigo} - {v.motivo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Período de Envio</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        title="Data Início"
                      />
                      <Input
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        title="Data Fim"
                      />
                    </div>
                  </div>

                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground"
                      onClick={clearFilters}
                    >
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-surface-container transition-colors">
                <TableHead className="text-label-caps text-on-surface-variant h-10">
                  Código
                </TableHead>
                <TableHead className="text-label-caps text-on-surface-variant h-10">
                  Título
                </TableHead>
                <TableHead className="text-label-caps text-on-surface-variant h-10">
                  Viajante
                </TableHead>
                <TableHead className="text-label-caps text-on-surface-variant h-10 text-right">
                  Total Despesas
                </TableHead>
                <TableHead className="text-label-caps text-on-surface-variant h-10">
                  Status
                </TableHead>
                <TableHead className="text-label-caps text-on-surface-variant h-10 text-right">
                  Data Envio
                </TableHead>
                <TableHead className="text-label-caps text-on-surface-variant h-10 w-[100px] text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-surface-container transition-colors">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredData.length === 0 ? (
                <TableRow className="hover:bg-surface-container transition-colors">
                  <TableCell colSpan={7} className="p-0">
                    {activeFiltersCount > 0 || search ? (
                      <EmptyState
                        variant="filter"
                        icon={Filter}
                        title="Nenhuma prestação encontrada"
                        description="Os filtros atuais não retornaram resultados."
                        secondary={{ label: 'Limpar filtros', onClick: clearFilters }}
                      />
                    ) : (
                      <EmptyState
                        variant="default"
                        icon={FileText}
                        title="Nenhuma prestação de contas"
                        description="Você ainda não possui prestações de contas."
                        action={{
                          label: 'Nova Prestação',
                          onClick: () => navigate('/prestacoes/nova'),
                        }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((p) => (
                  <TableRow key={p.id} className="hover:bg-surface-container transition-colors">
                    <TableCell className="text-body-sm font-medium">{p.codigo || '-'}</TableCell>
                    <TableCell className="text-body-sm">
                      <div>
                        <div className="font-medium">{p.titulo}</div>
                        {p.expand?.viagem_id && (
                          <div className="text-muted-foreground mt-1">
                            Viagem: {p.expand.viagem_id.codigo}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-body-sm">
                      {p.expand?.usuario_id?.name || p.expand?.usuario_id?.email || '-'}
                    </TableCell>
                    <TableCell className="text-data-tabular tabular-nums text-right font-medium">
                      {p.total_despesas?.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: p.expand?.moeda_id?.codigo || 'BRL',
                      })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-data-tabular text-on-surface-variant whitespace-nowrap text-right">
                      {p.data_envio ? format(new Date(p.data_envio), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/prestacoes/${p.id}`}>Detalhes</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
