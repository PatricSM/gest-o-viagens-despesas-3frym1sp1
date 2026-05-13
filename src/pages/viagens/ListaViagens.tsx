import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Plus, Filter, Download, Eye, Pencil, Trash2, Copy } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/common/StatusBadge'
import { MoneyDisplay } from '@/components/common/MoneyDisplay'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  getViagens,
  deleteViagem,
  updateViagem,
  createViagem,
  getTrechos,
} from '@/services/viagens'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

export default function ListaViagens() {
  const [viagens, setViagens] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [destinos, setDestinos] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getViagens()
      setViagens(data)

      const destMap: Record<string, string> = {}
      for (const v of data) {
        const trechos = await getTrechos(v.id)
        if (trechos.length > 0) {
          destMap[v.id] = trechos[0].destino
        }
      }
      setDestinos(destMap)
    } catch (err) {
      toast.error('Não foi possível carregar as viagens')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('viagens', () => {
    loadData()
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja cancelar/excluir esta viagem?')) return
    try {
      const v = viagens.find((v) => v.id === id)
      if (v.status === 'rascunho') {
        await deleteViagem(id)
      } else {
        await updateViagem(id, { status: 'cancelada' })
      }
      toast.success('Operação realizada com sucesso.')
    } catch (err) {
      toast.error('Erro na operação.')
    }
  }

  const handleDuplicate = async (v: any) => {
    try {
      const novaViagem = await createViagem({
        ...v,
        id: undefined,
        codigo: undefined,
        status: 'rascunho',
        data_envio: undefined,
        data_aprovacao: undefined,
        workflow_run_id: undefined,
      })
      toast.success('Viagem duplicada como rascunho.')
      navigate(`/viagens/${novaViagem.id}/editar`)
    } catch (err) {
      toast.error('Erro ao duplicar.')
    }
  }

  const filteredViagens = viagens.filter((v) => {
    const term = searchTerm.toLowerCase()
    return (
      v.motivo?.toLowerCase().includes(term) ||
      v.codigo?.toLowerCase().includes(term) ||
      destinos[v.id]?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Viagens</h2>
          <p className="text-muted-foreground mt-1">Gerencie requisições de viagem.</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => toast.success('Exportação de CSV iniciada')}>
                Exportar como CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success('Exportação de PDF iniciada')}>
                Exportar como PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild className="shadow-sm">
            <Link to="/viagens/nova">
              <Plus className="w-4 h-4 mr-2" /> Nova Viagem
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, motivo ou destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card shadow-sm w-full md:max-w-md"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto">
              <Filter className="w-4 h-4 mr-2" /> Filtros
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium">Filtros Avançados</h4>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Todos</option>
                  <option value="rascunho">Rascunho</option>
                  <option value="em_aprovacao">Em Aprovação</option>
                  <option value="aprovada">Aprovada</option>
                </select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Card className="shadow-sm border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Viajante</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Estimativa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-12 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredViagens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Nenhuma viagem encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredViagens.map((v) => (
                  <TableRow key={v.id} className="group hover:bg-muted/30">
                    <TableCell className="font-medium">
                      {v.codigo || <span className="text-muted-foreground text-xs">Rascunho</span>}
                      <div
                        className="text-xs text-muted-foreground truncate max-w-[200px] mt-1"
                        title={v.motivo}
                      >
                        {v.motivo}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage
                            src={
                              v.expand?.usuario_id?.avatar
                                ? pb.files.getURL(v.expand.usuario_id, v.expand.usuario_id.avatar)
                                : undefined
                            }
                          />
                          <AvatarFallback className="text-[10px]">
                            {v.expand?.usuario_id?.name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{v.expand?.usuario_id?.name || 'Usuário'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{destinos[v.id] || '-'}</TableCell>
                    <TableCell className="text-sm font-medium">
                      <MoneyDisplay value={v.total_estimado || 0} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={v.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" asChild title="Ver Detalhes">
                          <Link to={`/viagens/${v.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        {v.status === 'rascunho' && (
                          <Button variant="ghost" size="icon" asChild title="Editar">
                            <Link to={`/viagens/${v.id}/editar`}>
                              <Pencil className="w-4 h-4" />
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(v)}
                          title="Duplicar"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(v.id)}
                          className="text-destructive"
                          title="Cancelar/Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
