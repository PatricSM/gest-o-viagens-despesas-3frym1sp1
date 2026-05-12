import { useState } from 'react'
import { Play, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function SimulatorModal({
  onSimulate,
  onClear,
}: {
  onSimulate: (val: number) => void
  onClear: () => void
}) {
  const [val, setVal] = useState('')
  const [open, setOpen] = useState(false)

  const handleSimulate = () => {
    if (val) {
      onSimulate(Number(val))
      setOpen(false)
    }
  }

  const handleClear = () => {
    setVal('')
    onClear()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200"
        >
          <Play className="w-4 h-4 mr-2" /> Simular Fluxo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Simular Caminho de Aprovação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Valor da Despesa (R$)</Label>
            <Input
              type="number"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="Ex: 5000"
            />
            <p className="text-xs text-muted-foreground">
              O editor destacará quais etapas serão acionadas para este valor.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleClear}>
              <X className="w-4 h-4 mr-2" /> Limpar
            </Button>
            <Button onClick={handleSimulate}>Simular</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
