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
import { formatCurrency } from '@/lib/formatters'

export default function CentrosCustoList() {
  const { currentEmpresa, userRole } = useAuth()
  const isReadOnly = userRole === 'auditor'

  const [items, setItems] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const [users, setUsers] = useState<any[]>([])
  const [depts, setDepts] = useState<any[]>([])

  const load = async () => {
    if (!currentEmpresa) return
    let filter = `empresa_id = "${currentEmpresa.id}"`
    if (search) filter += ` && (nome ~ "${search}" || codigo ~ "${search}")`
    try {
      const res = await pb
        .collection('centros_custo')
        .getList(page, 20, { filter, expand: 'responsavel_id,departamento_id' })
      setItems(res.items)
      setTotalPages(res.totalPages)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    load()
  }, [currentEmpresa, page, search])
  useRealtime('centros_custo', load)

  useEffect(() => {
    if (!currentEmpresa) return
    Promise.all([
      pb.collection('users').getFullList({ filter: `empresa_id="${currentEmpresa.id}"` }),
      pb.collection('departamentos').getFullList({ filter: `empresa_id="${currentEmpresa.id}"` }),
    ]).then(([u, d]) => {
      setUsers(u)
      setDepts(d)
    })
  }, [currentEmpresa])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este centro de custo?')) return
    try {
      await pb.collection('centros_custo').delete(id)
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
    data.orcamento_mensal = Number(data.orcamento_mensal) || 0
    data.active = formData.get('active') === 'on'
    try {
      if (editing) await pb.collection('centros_custo').update(editing.id, data)
      else await pb.collection('centros_custo').create(data)
      setOpen(false)
      toast({ title: 'Salvo com sucesso' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <PageLayout
      title="Centros de Custo"
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
      onSearch={setSearch}
      action={
        !isReadOnly && (
          <Button
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Centro de Custo
          </Button>
        )
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Orçamento</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((d) => (
            <TableRow key={d.id} className={!d.active ? 'opacity-50' : ''}>
              <TableCell className="text-data-tabular">{d.codigo}</TableCell>
              <TableCell className="font-medium">{d.nome}</TableCell>
              <TableCell>{d.expand?.departamento_id?.nome || '-'}</TableCell>
              <TableCell>{d.expand?.responsavel_id?.name || '-'}</TableCell>
              <TableCell>{d.orcamento_mensal ? formatCurrency(d.orcamento_mensal) : '-'}</TableCell>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Código</label>
                <Input name="codigo" defaultValue={editing?.codigo} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <Input name="nome" defaultValue={editing?.nome} required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Departamento</label>
              <select
                name="departamento_id"
                defaultValue={editing?.departamento_id}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione...</option>
                {depts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Orçamento Mensal</label>
              <Input
                type="number"
                step="0.01"
                name="orcamento_mensal"
                defaultValue={editing?.orcamento_mensal}
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
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

            <div className="flex justify-end gap-2 pt-4">
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
