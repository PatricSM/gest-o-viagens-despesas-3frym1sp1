import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { PageLayout } from '@/components/cadastros/PageLayout'
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
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import * as Icons from 'lucide-react'

const toPascal = (str: string) =>
  str
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')

export default function CategoriasList() {
  const { currentEmpresa, userRole } = useAuth()
  const isReadOnly = userRole === 'auditor'

  const [items, setItems] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const load = async () => {
    if (!currentEmpresa) return
    let filter = `empresa_id = "${currentEmpresa.id}"`
    if (search) filter += ` && (nome ~ "${search}")`
    try {
      const res = await pb.collection('categorias_despesa').getList(page, 20, { filter })
      setItems(res.items)
      setTotalPages(res.totalPages)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    load()
  }, [currentEmpresa, page, search])
  useRealtime('categorias_despesa', load)

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta categoria?')) return
    try {
      await pb.collection('categorias_despesa').delete(id)
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
    data.reembolsavel_padrao = formData.get('reembolsavel_padrao') === 'on'
    data.exige_justificativa = formData.get('exige_justificativa') === 'on'
    try {
      if (editing) await pb.collection('categorias_despesa').update(editing.id, data)
      else await pb.collection('categorias_despesa').create(data)
      setOpen(false)
      toast({ title: 'Salvo com sucesso' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <PageLayout
      title="Categorias de Despesa"
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
            <Plus className="w-4 h-4 mr-2" /> Nova Categoria
          </Button>
        )
      }
    >
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((cat) => {
          const IconComp = (Icons as any)[toPascal(cat.icone || 'tags')] || Icons.Tags
          const parent = items.find((i) => i.id === cat.categoria_pai_id)
          return (
            <Card key={cat.id} className="relative overflow-hidden group bg-background">
              <div
                className="absolute top-0 left-0 w-1.5 h-full transition-all group-hover:w-2"
                style={{ backgroundColor: cat.cor || '#ccc' }}
              />
              <CardHeader className="pl-6 pb-4">
                <div className="flex justify-between items-start">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white mb-2 shadow-sm"
                    style={{ backgroundColor: cat.cor || '#ccc' }}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>
                  {!isReadOnly && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(cat)
                            setOpen(true)
                          }}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(cat.id)}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <CardTitle className="text-title-sm">{cat.nome}</CardTitle>
                <CardDescription className="text-xs line-clamp-2 mt-1">
                  {cat.descricao || 'Sem descrição'}
                </CardDescription>
                {parent && (
                  <div className="text-[10px] text-muted-foreground mt-2 border-t pt-1">
                    Subcategoria de: {parent.nome}
                  </div>
                )}
              </CardHeader>
            </Card>
          )
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input name="nome" defaultValue={editing?.nome} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input name="descricao" defaultValue={editing?.descricao} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ícone (Lucide)</label>
                <Input
                  name="icone"
                  defaultValue={editing?.icone || 'tags'}
                  placeholder="ex: coffee, plane"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cor</label>
                <Input
                  type="color"
                  name="cor"
                  defaultValue={editing?.cor || '#00288e'}
                  className="h-10 px-2 w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria Pai</label>
              <select
                name="categoria_pai_id"
                defaultValue={editing?.categoria_pai_id}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Nenhuma (Raiz)</option>
                {items
                  .filter((r) => r.id !== editing?.id)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reembolsavel"
                  name="reembolsavel_padrao"
                  defaultChecked={editing ? editing.reembolsavel_padrao : true}
                  className="w-4 h-4 rounded border-input"
                />
                <label htmlFor="reembolsavel" className="text-sm">
                  Reembolsável por padrão
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="justificativa"
                  name="exige_justificativa"
                  defaultChecked={editing?.exige_justificativa}
                  className="w-4 h-4 rounded border-input"
                />
                <label htmlFor="justificativa" className="text-sm">
                  Exige justificativa
                </label>
              </div>
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
