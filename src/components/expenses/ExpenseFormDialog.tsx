import { useState, useEffect } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createDespesa, getCategorias, getMoedas } from '@/services/despesas'
import { useAuth } from '@/hooks/use-auth'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

interface ExpenseFormDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
}

export function ExpenseFormDialog({ children, onSuccess }: ExpenseFormDialogProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [categorias, setCategorias] = useState<any[]>([])
  const [moedas, setMoedas] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    data_despesa: '',
    categoria_id: '',
    valor: '',
    moeda_id: '',
    descricao: '',
  })

  useEffect(() => {
    if (open) {
      getCategorias().then(setCategorias).catch(console.error)
      getMoedas()
        .then((data) => {
          setMoedas(data)
          const padrao = data.find((m) => m.padrao)
          if (padrao) setFormData((prev) => ({ ...prev, moeda_id: padrao.id }))
        })
        .catch(console.error)
      setFile(null)
      setFormData({ data_despesa: '', categoria_id: '', valor: '', moeda_id: '', descricao: '' })
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    try {
      await createDespesa(
        {
          empresa_id: user.empresa_id,
          usuario_id: user.id,
          status: 'pendente',
          data_despesa: new Date(formData.data_despesa).toISOString(),
          categoria_id: formData.categoria_id,
          valor: parseFloat(formData.valor),
          moeda_id: formData.moeda_id,
          descricao: formData.descricao,
        },
        file || undefined,
      )

      toast({
        title: 'Despesa Registrada',
        description: 'A despesa foi registrada com sucesso.',
      })
      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      const fieldErrs = extractFieldErrors(err)
      toast({
        title: 'Erro',
        description: Object.values(fieldErrs)[0] || 'Falha ao registrar despesa',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nova Despesa</DialogTitle>
            <DialogDescription>
              Preencha os dados da despesa e anexe o comprovante.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Data da Despesa</Label>
              <Input
                id="date"
                type="date"
                required
                value={formData.data_despesa}
                onChange={(e) => setFormData({ ...formData, data_despesa: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  required
                  value={formData.categoria_id}
                  onValueChange={(v) => setFormData({ ...formData, categoria_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
              <div className="grid gap-2">
                <Label htmlFor="currency">Moeda</Label>
                <Select
                  required
                  value={formData.moeda_id}
                  onValueChange={(v) => setFormData({ ...formData, moeda_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {moedas.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Descrição</Label>
              <Input
                id="desc"
                placeholder="Detalhes da despesa"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Comprovante (Opcional)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-secondary/50 transition-colors cursor-pointer relative overflow-hidden">
                <Input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  accept="image/png,image/jpeg,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <div className="text-sm font-medium text-primary break-all">{file.name}</div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Clique ou arraste um arquivo</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG ou PDF (Máx. 10MB)</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Despesa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
