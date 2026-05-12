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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import * as adminService from '@/services/admin'
import { useToast } from '@/hooks/use-toast'

export default function TetosTable({
  politicaId,
  empresaId,
}: {
  politicaId: string
  empresaId: string
}) {
  const [data, setData] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const [tipo, setTipo] = useState('categoria')
  const [categoriaId, setCategoriaId] = useState('')
  const [departamentoId, setDepartamentoId] = useState('')
  const [cargo, setCargo] = useState('')
  const [valor, setValor] = useState('')

  const loadData = async () => {
    const res = await adminService.getTetos(politicaId)
    setData(res)
  }

  useEffect(() => {
    loadData()
    adminService.getCategorias(empresaId).then(setCategorias)
    adminService.getDepartamentos(empresaId).then(setDepartamentos)
  }, [politicaId, empresaId])

  const handleAdd = async () => {
    try {
      await adminService.createTeto({
        politica_id: politicaId,
        tipo,
        categoria_id: tipo === 'categoria' ? categoriaId : null,
        departamento_id: tipo === 'departamento' ? departamentoId : null,
        cargo: tipo === 'cargo' ? cargo : null,
        valor_max: Number(valor),
      })
      toast({ title: 'Regra adicionada' })
      setOpen(false)
      loadData()
    } catch {
      toast({ title: 'Erro ao adicionar', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    await adminService.deleteTeto(id)
    loadData()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" /> Adicionar regra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Regra de Teto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="categoria">Categoria</SelectItem>
                    <SelectItem value="cargo">Cargo</SelectItem>
                    <SelectItem value="departamento">Departamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {tipo === 'categoria' && (
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={categoriaId} onValueChange={setCategoriaId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {tipo === 'departamento' && (
                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <Select value={departamentoId} onValueChange={setDepartamentoId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentos.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {tipo === 'cargo' && (
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input value={cargo} onChange={(e) => setCargo(e.target.value)} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Valor Máx (R$)</Label>
                <Input type="number" value={valor} onChange={(e) => setValor(e.target.value)} />
              </div>
              <Button onClick={handleAdd}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Alvo</TableHead>
            <TableHead>Valor Máx.</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="capitalize">{item.tipo}</TableCell>
              <TableCell>
                {item.tipo === 'categoria'
                  ? item.expand?.categoria_id?.nome
                  : item.tipo === 'departamento'
                    ? item.expand?.departamento_id?.nome
                    : item.cargo}
              </TableCell>
              <TableCell>R$ {item.valor_max?.toFixed(2)}</TableCell>
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
