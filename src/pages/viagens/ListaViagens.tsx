import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Plus, Filter, Download, Eye, Pencil, Trash2, Copy } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { formatCurrency } from '@/lib/formatters'
import {
  getViagens,
  deleteViagem,
  updateViagem,
  createViagem,
  getTrechos,
} from '@/services/viagens'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export default function ListaViagens() {
  const [viagens, setViagens] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [destinos, setDestinos] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const navigate = useNavigate()

  const loadData = async () => {
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
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar as viagens',
        variant: 'destructive',
      })
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
      toast({ title: 'Sucesso', description: 'Operação realizada com sucesso.' })
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro na operação.', variant: 'destructive' })
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
      toast({ title: 'Sucesso', description: 'Viagem duplicada como rascunho.' })
      navigate(`/viagens/${novaViagem.id}/editar`)
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro ao duplicar.', variant: 'destructive' })
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'bg-slate-100 text-slate-700'
      case 'aprovada':
        return 'bg-green-100 text-green-700'
      case 'em_aprovacao':
        return 'bg-blue-100 text-blue-700'
      case 'em_andamento':
        return 'bg-purple-100 text-purple-700'
      case 'rascunho':
        return 'bg-zinc-100 text-zinc-600'
      case 'rejeitada':
      case 'cancelada':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-amber-100 text-amber-700'
    }
  }

  const getStatusLabel = (status: string) =>
    status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())

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
              <DropdownMenuItem>Exportar como CSV</DropdownMenuItem>
              <DropdownMenuItem>Exportar como PDF</DropdownMenuItem>
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
              {filteredViagens.length === 0 ? (
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
                      {formatCurrency(v.total_estimado || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusColor(v.status)}>
                        {getStatusLabel(v.status)}
                      </Badge>
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
