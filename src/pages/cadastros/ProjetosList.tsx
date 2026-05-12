import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { PageLayout } from '@/components/cadastros/PageLayout'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import useRealtime from '@/hooks/use-realtime'
import { formatCurrency, formatDate } from '@/lib/formatters'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export default function ProjetosList() {
  const { currentEmpresa, userRole } = useAuth()
  const isReadOnly = userRole === 'auditor'

  const [items, setItems] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const [users, setUsers] = useState<any[]>([])
  const [costCenters, setCostCenters] = useState<any[]>([])

  const load = async () => {
    if (!currentEmpresa) return
    let filter = `empresa_id = "${currentEmpresa.id}"`
    if (search) filter += ` && (nome ~ "${search}" || codigo ~ "${search}")`
    if (statusFilter !== 'all') filter += ` && status = "${statusFilter}"`
    try {
      const res = await pb
        .collection('projetos')
        .getList(page, 20, { filter, expand: 'responsavel_id,centro_custo_padrao_id' })
      setItems(res.items)
      setTotalPages(res.totalPages)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    load()
  }, [currentEmpresa, page, search, statusFilter])
  useRealtime('projetos', load)

  useEffect(() => {
    if (!currentEmpresa) return
    Promise.all([
      pb.collection('users').getFullList({ filter: `empresa_id="${currentEmpresa.id}"` }),
      pb.collection('centros_custo').getFullList({ filter: `empresa_id="${currentEmpresa.id}"` }),
    ]).then(([u, c]) => {
      setUsers(u)
      setCostCenters(c)
    })
  }, [currentEmpresa])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este projeto?')) return
    try {
      await pb.collection('projetos').delete(id)
      toast({ title: 'Excluído com sucesso' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())
    data.empresa_id = currentEmpresa?.id
    data.orcamento_total = Number(data.orcamento_total) || 0
    data.active = formData.get('active') === 'on'
    try {
      if (editing) await pb.collection('projetos').update(editing.id, data)
      else await pb.collection('projetos').create(data)
      setOpen(false)
      toast({ title: 'Salvo com sucesso' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <PageLayout
      title="Projetos"
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
      onSearch={setSearch}
      filters={
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-background">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="pausado">Pausado</SelectItem>
            <SelectItem value="encerrado">Encerrado</SelectItem>
          </SelectContent>
        </Select>
      }
      action={
        !isReadOnly && (
          <Button
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Projeto
          </Button>
        )
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Orçamento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>C. Custo</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((d) => (
            <TableRow key={d.id} className={!d.active ? 'opacity-50' : ''}>
              <TableCell className="text-data-tabular">{d.codigo}</TableCell>
              <TableCell className="font-medium">{d.nome}</TableCell>
              <TableCell className="text-sm">
                {d.data_inicio ? formatDate(d.data_inicio) : '-'} a{' '}
                {d.data_fim ? formatDate(d.data_fim) : '-'}
              </TableCell>
              <TableCell>{d.orcamento_total ? formatCurrency(d.orcamento_total) : '-'}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    d.status === 'ativo'
                      ? 'default'
                      : d.status === 'encerrado'
                        ? 'secondary'
                        : 'outline'
                  }
                  className="capitalize"
                >
                  {d.status || 'ativo'}
                </Badge>
              </TableCell>
              <TableCell>{d.expand?.centro_custo_padrao_id?.nome || '-'}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!isReadOnly && (
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(d)
                          setOpen(true)
                        }}
                      >
                        Editar
                      </DropdownMenuItem>
                    )}
                    {!isReadOnly && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(d.id)}
                      >
                        Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Código</label>
              <Input name="codigo" defaultValue={editing?.codigo} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input name="nome" defaultValue={editing?.nome} required />
            </div>
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input name="descricao" defaultValue={editing?.descricao} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Input
                type="date"
                name="data_inicio"
                defaultValue={editing?.data_inicio?.substring(0, 10)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                name="data_fim"
                defaultValue={editing?.data_fim?.substring(0, 10)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Orçamento Total</label>
              <Input
                type="number"
                step="0.01"
                name="orcamento_total"
                defaultValue={editing?.orcamento_total}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                name="status"
                defaultValue={editing?.status || 'ativo'}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="ativo">Ativo</option>
                <option value="pausado">Pausado</option>
                <option value="encerrado">Encerrado</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">C. Custo Padrão</label>
              <select
                name="centro_custo_padrao_id"
                defaultValue={editing?.centro_custo_padrao_id}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione...</option>
                {costCenters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Responsável</label>
              <select
                name="responsavel_id"
                defaultValue={editing?.responsavel_id}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1 md:col-span-2 flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="active"
                name="active"
                defaultChecked={editing ? editing.active : true}
                className="w-4 h-4 rounded border-input"
              />
              <label htmlFor="active" className="text-sm">
                Ativo
              </label>
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
