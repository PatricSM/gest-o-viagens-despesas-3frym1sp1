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

export default function FiliaisList() {
  const { currentEmpresa, userRole } = useAuth()
  const isReadOnly = userRole === 'auditor'

  const [items, setItems] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])

  const load = async () => {
    if (!currentEmpresa) return
    let filter = `empresa_id = "${currentEmpresa.id}"`
    if (search) filter += ` && (nome ~ "${search}" || codigo ~ "${search}")`
    try {
      const res = await pb.collection('filiais').getList(page, 20, { filter, expand: 'gestor_id' })
      setItems(res.items)
      setTotalPages(res.totalPages)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    load()
  }, [currentEmpresa, page, search])
  useRealtime('filiais', load)

  useEffect(() => {
    if (!currentEmpresa) return
    pb.collection('users')
      .getFullList({ filter: `empresa_id="${currentEmpresa.id}"` })
      .then(setUsers)
  }, [currentEmpresa])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta filial?')) return
    try {
      await pb.collection('filiais').delete(id)
      toast({ title: 'Excluída com sucesso' })
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
      if (editing) await pb.collection('filiais').update(editing.id, data)
      else await pb.collection('filiais').create(data)
      setOpen(false)
      toast({ title: 'Salvo com sucesso' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <PageLayout
      title="Filiais"
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
            <Plus className="w-4 h-4 mr-2" /> Nova Filial
          </Button>
        )
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Endereço</TableHead>
            <TableHead>Gestor</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="text-data-tabular">{d.codigo}</TableCell>
              <TableCell className="font-medium">{d.nome}</TableCell>
              <TableCell>
                <div className="text-sm">
                  {d.endereco_logradouro}, {d.endereco_numero} {d.endereco_complemento}
                </div>
                <div className="text-xs text-muted-foreground">
                  {d.endereco_cidade} - {d.endereco_estado} | {d.endereco_cep}
                </div>
              </TableCell>
              <TableCell>{d.expand?.gestor_id?.name || '-'}</TableCell>
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
            <DialogTitle>{editing ? 'Editar Filial' : 'Nova Filial'}</DialogTitle>
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

            <div className="col-span-1 md:col-span-2 text-sm font-semibold mt-4 border-b pb-2">
              Endereço
            </div>
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-sm font-medium">Logradouro (Rua)</label>
              <Input name="endereco_logradouro" defaultValue={editing?.endereco_logradouro} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Número</label>
              <Input name="endereco_numero" defaultValue={editing?.endereco_numero} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Complemento</label>
              <Input name="endereco_complemento" defaultValue={editing?.endereco_complemento} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cidade</label>
              <Input name="endereco_cidade" defaultValue={editing?.endereco_cidade} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado (UF)</label>
              <Input name="endereco_estado" defaultValue={editing?.endereco_estado} maxLength={2} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CEP</label>
              <Input name="endereco_cep" defaultValue={editing?.endereco_cep} />
            </div>

            <div className="col-span-1 md:col-span-2 text-sm font-semibold mt-4 border-b pb-2">
              Gestão
            </div>
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-sm font-medium">Gestor da Filial</label>
              <select
                name="gestor_id"
                defaultValue={editing?.gestor_id}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione...</option>
                {users.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
