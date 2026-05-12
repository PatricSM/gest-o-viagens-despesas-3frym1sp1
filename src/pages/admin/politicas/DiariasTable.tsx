import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import * as adminService from '@/services/admin'
import { useToast } from '@/hooks/use-toast'

export default function DiariasTable({ politicaId }: { politicaId: string }) {
  const [data, setData] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const [form, setForm] = useState({
    cidade: '',
    estado: '',
    regiao: '',
    valor: '',
    hosp: '',
    ali: '',
  })

  const loadData = async () => setData(await adminService.getDiarias(politicaId))
  useEffect(() => {
    loadData()
  }, [politicaId])

  const handleAdd = async () => {
    try {
      await adminService.createDiaria({
        politica_id: politicaId,
        cidade: form.cidade,
        estado: form.estado,
        regiao: form.regiao,
        valor_diaria: Number(form.valor),
        hospedagem_max: Number(form.hosp),
        alimentacao_max: Number(form.ali),
      })
      toast({ title: 'Diária adicionada' })
      setOpen(false)
      loadData()
    } catch {
      toast({ title: 'Erro ao adicionar', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    await adminService.deleteDiaria(id)
    loadData()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" /> Adicionar diária
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Diária</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Região</Label>
                <Input
                  value={form.regiao}
                  onChange={(e) => setForm({ ...form, regiao: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Total (R$)</Label>
                <Input
                  type="number"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Máx. Hospedagem</Label>
                <Input
                  type="number"
                  value={form.hosp}
                  onChange={(e) => setForm({ ...form, hosp: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Máx. Alimentação</Label>
                <Input
                  type="number"
                  value={form.ali}
                  onChange={(e) => setForm({ ...form, ali: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleAdd}>Salvar</Button>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Local</TableHead>
            <TableHead>Valor Diária</TableHead>
            <TableHead>Máx. Hospedagem</TableHead>
            <TableHead>Máx. Alimentação</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {[item.cidade, item.estado, item.regiao].filter(Boolean).join(', ') || 'Geral'}
              </TableCell>
              <TableCell>R$ {item.valor_diaria?.toFixed(2)}</TableCell>
              <TableCell>R$ {item.hospedagem_max?.toFixed(2)}</TableCell>
              <TableCell>R$ {item.alimentacao_max?.toFixed(2)}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
