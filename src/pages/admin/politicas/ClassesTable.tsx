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

export default function ClassesTable({ politicaId }: { politicaId: string }) {
  const [data, setData] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [nivel, setNivel] = useState('')
  const [classe, setClasse] = useState('econômica')

  const loadData = async () => setData(await adminService.getClasses(politicaId))
  useEffect(() => {
    loadData()
  }, [politicaId])

  const handleAdd = async () => {
    await adminService.createClasse({
      politica_id: politicaId,
      nivel_hierarquico: nivel,
      classe_aerea: classe,
    })
    setOpen(false)
    loadData()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" /> Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Classe de Viagem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nível Hierárquico</Label>
                <Input
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value)}
                  placeholder="Ex: Diretor"
                />
              </div>
              <div className="space-y-2">
                <Label>Classe Aérea</Label>
                <Select value={classe} onValueChange={setClasse}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="econômica">Econômica</SelectItem>
                    <SelectItem value="executiva">Executiva</SelectItem>
                    <SelectItem value="primeira">Primeira</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nível Hierárquico</TableHead>
            <TableHead>Classe Aérea</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.nivel_hierarquico}</TableCell>
              <TableCell className="capitalize">{item.classe_aerea}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    adminService.deleteClasse(item.id)
                    loadData()
                  }}
                >
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
