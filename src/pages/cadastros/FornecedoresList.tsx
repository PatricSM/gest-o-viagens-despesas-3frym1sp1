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
import { Badge } from '@/components/ui/badge'

export default function FornecedoresList() {
  const { currentEmpresa, userRole } = useAuth()
  const isReadOnly = userRole === 'auditor'

  const [items, setItems] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [categorias, setCategorias] = useState<any[]>([])

  const load = async () => {
    if (!currentEmpresa) return
    let filter = `empresa_id = "${currentEmpresa.id}"`
    if (search) filter += ` && (nome ~ "${search}" || cnpj ~ "${search}")`
    try {
      const res = await pb
        .collection('fornecedores')
        .getList(page, 20, { filter, expand: 'categoria_id' })
      setItems(res.items)
      setTotalPages(res.totalPages)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    load()
  }, [currentEmpresa, page, search])
  useRealtime('fornecedores', load)

  useEffect(() => {
    if (!currentEmpresa) return
    pb.collection('categorias_despesa')
      .getFullList({ filter: `empresa_id="${currentEmpresa.id}"` })
      .then(setCategorias)
  }, [currentEmpresa])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este fornecedor?')) return
    try {
      await pb.collection('fornecedores').delete(id)
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
    data.preferencial = formData.get('preferencial') === 'on'
    try {
      if (editing) await pb.collection('fornecedores').update(editing.id, data)
      else await pb.collection('fornecedores').create(data)
      setOpen(false)
      toast({ title: 'Salvo com sucesso' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <PageLayout
      title="Fornecedores"
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
            <Plus className="w-4 h-4 mr-2" /> Novo Fornecedor
          </Button>
        )
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="font-medium">
                {d.nome}{' '}
                {d.preferencial && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30"
                  >
                    Preferencial
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-data-tabular">{d.cnpj || '-'}</TableCell>
              <TableCell>{d.expand?.categoria_id?.nome || '-'}</TableCell>
              <TableCell className="text-sm">
                <div>{d.contato_email || '-'}</div>
                <div className="text-muted-foreground">{d.contato_telefone}</div>
              </TableCell>
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input name="nome" defaultValue={editing?.nome} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CNPJ</label>
              <Input name="cnpj" defaultValue={editing?.cnpj} />
            </div>
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-sm font-medium">Categoria</label>
              <select
                name="categoria_id"
                defaultValue={editing?.categoria_id}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email de Contato</label>
              <Input type="email" name="contato_email" defaultValue={editing?.contato_email} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <Input name="contato_telefone" defaultValue={editing?.contato_telefone} />
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-sm font-medium">Observações</label>
              <Input name="observacoes" defaultValue={editing?.observacoes} />
            </div>

            <div className="col-span-1 md:col-span-2 flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="preferencial"
                name="preferencial"
                defaultChecked={editing?.preferencial}
                className="w-4 h-4 rounded border-input"
              />
              <label htmlFor="preferencial" className="text-sm">
                Fornecedor Preferencial
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
