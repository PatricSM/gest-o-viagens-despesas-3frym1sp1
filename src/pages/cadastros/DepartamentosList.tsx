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
import { EmptyState } from '@/components/common/EmptyState'
import { Search, Network } from 'lucide-react'
import { Combobox } from '@/components/common/Combobox'

export default function DepartamentosList() {
  const { currentEmpresa, userRole } = useAuth()
  const isReadOnly = userRole === 'auditor'

  const [items, setItems] = useState<any[]>([])
  const [raw, setRaw] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const [users, setUsers] = useState<any[]>([])
  const [filiais, setFiliais] = useState<any[]>([])
  const [selectedParent, setSelectedParent] = useState('')
  const [selectedManager, setSelectedManager] = useState('')
  const [selectedFilial, setSelectedFilial] = useState('')

  const load = async () => {
    if (!currentEmpresa) return
    const res = await pb.collection('departamentos').getFullList({
      filter: `empresa_id = "${currentEmpresa.id}"`,
      expand: 'responsavel_id,filial_id',
      sort: 'nome',
    })
    setRaw(res)
  }

  useEffect(() => {
    load()
  }, [currentEmpresa])
  useRealtime('departamentos', load)

  useEffect(() => {
    if (!currentEmpresa) return
    Promise.all([
      pb.collection('users').getFullList({ filter: `empresa_id="${currentEmpresa.id}"` }),
      pb.collection('filiais').getFullList({ filter: `empresa_id="${currentEmpresa.id}"` }),
    ]).then(([u, f]) => {
      setUsers(u)
      setFiliais(f)
    })
  }, [currentEmpresa])

  useEffect(() => {
    let filtered = raw
    if (search)
      filtered = raw.filter(
        (r) =>
          r.nome.toLowerCase().includes(search.toLowerCase()) ||
          r.codigo?.toLowerCase().includes(search.toLowerCase()),
      )

    const map = new Map(filtered.map((i) => [i.id, { ...i, children: [] }]))
    const roots: any[] = []
    map.forEach((item) => {
      if (item.departamento_pai_id && map.has(item.departamento_pai_id)) {
        map.get(item.departamento_pai_id).children.push(item)
      } else {
        roots.push(item)
      }
    })
    const flatten = (nodes: any[], depth = 0): any[] =>
      nodes.flatMap((n) => [{ ...n, depth }, ...flatten(n.children, depth + 1)])
    setItems(flatten(roots))
  }, [raw, search])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este departamento?')) return
    try {
      await pb.collection('departamentos').delete(id)
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
    data.active = true
    try {
      if (editing) await pb.collection('departamentos').update(editing.id, data)
      else await pb.collection('departamentos').create(data)
      setOpen(false)
      toast({ title: 'Salvo com sucesso' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <PageLayout
      title="Departamentos"
      description="Gerencie a hierarquia de departamentos."
      onSearch={setSearch}
      action={
        !isReadOnly && (
          <Button
            onClick={() => {
              setEditing(null)
              setSelectedParent('')
              setSelectedManager('')
              setSelectedFilial('')
              setOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Departamento
          </Button>
        )
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Filial</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="p-0">
                {search ? (
                  <EmptyState
                    variant="filter"
                    icon={Search}
                    title="Nenhum departamento encontrado"
                    description="Sua busca não retornou resultados."
                    secondary={{ label: 'Limpar busca', onClick: () => setSearch('') }}
                  />
                ) : (
                  <EmptyState
                    variant="default"
                    icon={Network}
                    title="Nenhum departamento"
                    description="Cadastre o primeiro departamento."
                    action={
                      !isReadOnly
                        ? {
                            label: 'Novo Departamento',
                            onClick: () => {
                              setEditing(null)
                              setOpen(true)
                            },
                          }
                        : undefined
                    }
                  />
                )}
              </TableCell>
            </TableRow>
          )}
          {items.map((d) => (
            <TableRow key={d.id}>
              <TableCell style={{ paddingLeft: `${d.depth * 1.5 + 1}rem` }}>
                <div className="flex items-center gap-2 font-medium">
                  {d.depth > 0 && <span className="text-muted-foreground opacity-50">↳</span>}
                  {d.codigo && (
                    <span className="text-muted-foreground text-xs font-normal">[{d.codigo}]</span>
                  )}
                  {d.nome}
                </div>
              </TableCell>
              <TableCell>{d.expand?.responsavel_id?.name || '-'}</TableCell>
              <TableCell>{d.expand?.filial_id?.nome || '-'}</TableCell>
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
                          setEditing(null)
                          setSelectedParent('')
                          setSelectedManager('')
                          setSelectedFilial('')
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
            <DialogTitle>{editing ? 'Editar Departamento' : 'Novo Departamento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Código</label>
              <Input name="codigo" defaultValue={editing?.codigo} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input name="nome" defaultValue={editing?.nome} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Departamento Pai</label>
              <input type="hidden" name="departamento_pai_id" value={selectedParent} />
              <Combobox
                options={raw
                  .filter((r) => r.id !== editing?.id)
                  .map((r) => ({ value: r.id, label: r.nome }))}
                value={selectedParent}
                onChange={setSelectedParent}
                placeholder="Nenhum (Raiz)"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Responsável</label>
              <input type="hidden" name="responsavel_id" value={selectedManager} />
              <Combobox
                options={users.map((u) => ({ value: u.id, label: u.name || u.email }))}
                value={selectedManager}
                onChange={setSelectedManager}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Filial</label>
              <input type="hidden" name="filial_id" value={selectedFilial} />
              <Combobox
                options={filiais.map((f) => ({ value: f.id, label: f.nome }))}
                value={selectedFilial}
                onChange={setSelectedFilial}
              />
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
