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

export default function MoedasList() {
  const { currentEmpresa, userRole } = useAuth()
  const isReadOnly = userRole === 'auditor'

  const [items, setItems] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [openRate, setOpenRate] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const load = async () => {
    if (!currentEmpresa) return
    let filter = `empresa_id = "${currentEmpresa.id}"`
    if (search) filter += ` && (nome ~ "${search}" || codigo ~ "${search}")`
    try {
      const res = await pb.collection('moedas').getList(page, 20, { filter })
      setItems(res.items)
      setTotalPages(res.totalPages)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    load()
  }, [currentEmpresa, page, search])
  useRealtime('moedas', load)

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta moeda?')) return
    try {
      await pb.collection('moedas').delete(id)
      toast({ title: 'Excluída com sucesso' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleSetDefault = async (moeda: any) => {
    if (isReadOnly) return
    const currentDefault = items.find((m) => m.padrao)
    try {
      if (currentDefault && currentDefault.id !== moeda.id) {
        await pb.collection('moedas').update(currentDefault.id, { padrao: false })
      }
      await pb.collection('moedas').update(moeda.id, { padrao: true })
      load()
      toast({ title: 'Moeda padrão atualizada' })
    } catch (e) {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  const handleRateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const val = Number(new FormData(e.currentTarget).get('valor'))
    try {
      await pb
        .collection('moedas')
        .update(editing.id, { cotacao_atual: val, cotacao_data: new Date().toISOString() })
      await pb.collection('cotacao_historico').create({
        moeda_id: editing.id,
        empresa_id: currentEmpresa?.id,
        valor: val,
        data: new Date().toISOString(),
      })
      setOpenRate(false)
      toast({ title: 'Cotação atualizada' })
      load()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())
    data.empresa_id = currentEmpresa?.id
    data.active = true
    data.cotacao_atual = Number(data.cotacao_atual) || 1
    if (!editing) data.cotacao_data = new Date().toISOString()

    try {
      let created
      if (editing) {
        await pb.collection('moedas').update(editing.id, data)
      } else {
        created = await pb.collection('moedas').create(data)
        await pb.collection('cotacao_historico').create({
          moeda_id: created.id,
          empresa_id: currentEmpresa?.id,
          valor: data.cotacao_atual,
          data: new Date().toISOString(),
        })
      }
      setOpen(false)
      toast({ title: 'Salvo com sucesso' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <PageLayout
      title="Moedas"
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
            <Plus className="w-4 h-4 mr-2" /> Nova Moeda
          </Button>
        )
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Padrão</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Símbolo</TableHead>
            <TableHead>Cotação Atual</TableHead>
            <TableHead>Data da Cotação</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((d) => (
            <TableRow key={d.id}>
              <TableCell>
                <input
                  type="radio"
                  name="default_moeda"
                  checked={d.padrao}
                  onChange={() => handleSetDefault(d)}
                  disabled={isReadOnly}
                  className="w-4 h-4 text-primary"
                />
              </TableCell>
              <TableCell className="text-data-tabular font-bold">{d.codigo}</TableCell>
              <TableCell className="font-medium">{d.nome}</TableCell>
              <TableCell>{d.simbolo}</TableCell>
              <TableCell>{d.cotacao_atual}</TableCell>
              <TableCell>{d.cotacao_data ? formatDate(d.cotacao_data) : '-'}</TableCell>
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
                          setOpenRate(true)
                        }}
                      >
                        Atualizar Cotação
                      </DropdownMenuItem>
                    )}
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
                    {!isReadOnly && !d.padrao && (
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
            <DialogTitle>{editing ? 'Editar Moeda' : 'Nova Moeda'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Código ISO</label>
                <Input
                  name="codigo"
                  defaultValue={editing?.codigo}
                  required
                  placeholder="BRL, USD"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Símbolo</label>
                <Input name="simbolo" defaultValue={editing?.simbolo} placeholder="R$, $" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                name="nome"
                defaultValue={editing?.nome}
                required
                placeholder="Real Brasileiro"
              />
            </div>
            {!editing && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Cotação Inicial</label>
                <Input
                  type="number"
                  step="0.00001"
                  name="cotacao_atual"
                  defaultValue={1}
                  required
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openRate} onOpenChange={setOpenRate}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Atualizar Cotação: {editing?.codigo}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRateSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nova Cotação</label>
              <Input
                type="number"
                step="0.00001"
                name="valor"
                defaultValue={editing?.cotacao_atual}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpenRate(false)}>
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
