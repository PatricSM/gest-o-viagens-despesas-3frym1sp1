import { useEffect, useState } from 'react'
import { Settings, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import * as adminService from '@/services/admin'
import { useAuth } from '@/hooks/use-auth'

export default function StageModal({ etapa, workflowId, order, onSave, onDelete, children }: any) {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const { currentEmpresa } = useAuth()

  const [form, setForm] = useState({
    tipo_aprovador: 'gestor_direto',
    cargo_alvo: '',
    custom_user_id: '',
    alcada_valor_min: '0',
    alcada_valor_max: '',
    paralela: false,
    sla_horas: '24',
  })

  useEffect(() => {
    if (etapa) {
      setForm({
        tipo_aprovador: etapa.tipo_aprovador || 'gestor_direto',
        cargo_alvo: etapa.cargo_alvo || '',
        custom_user_id: etapa.custom_user_id || '',
        alcada_valor_min: etapa.alcada_valor_min?.toString() || '0',
        alcada_valor_max: etapa.alcada_valor_max?.toString() || '',
        paralela: etapa.paralela || false,
        sla_horas: etapa.sla_horas?.toString() || '24',
      })
    }
  }, [etapa])

  useEffect(() => {
    if (open && currentEmpresa?.id) {
      adminService.getUsers(currentEmpresa.id).then(setUsers)
    }
  }, [open, currentEmpresa])

  const handleSave = async () => {
    const data = {
      ...form,
      workflow_id: workflowId,
      alcada_valor_min: Number(form.alcada_valor_min),
      alcada_valor_max: form.alcada_valor_max ? Number(form.alcada_valor_max) : null,
      sla_horas: Number(form.sla_horas),
      custom_user_id: form.tipo_aprovador === 'custom_user' ? form.custom_user_id : null,
      cargo_alvo: form.tipo_aprovador === 'cargo' ? form.cargo_alvo : null,
    }

    if (etapa) {
      await adminService.updateEtapa(etapa.id, data)
    } else {
      await adminService.createEtapa({ ...data, ordem: order })
    }
    setOpen(false)
    onSave()
  }

  const handleDelete = async () => {
    if (etapa) {
      await adminService.deleteEtapa(etapa.id)
      setOpen(false)
      if (onDelete) onDelete()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="secondary" size="sm" className="w-full mt-2">
            <Settings className="w-4 h-4 mr-2" /> Configurar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{etapa ? 'Editar Etapa' : 'Nova Etapa'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Aprovador</Label>
            <Select
              value={form.tipo_aprovador}
              onValueChange={(v) => setForm({ ...form, tipo_aprovador: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gestor_direto">Gestor Direto</SelectItem>
                <SelectItem value="cargo">Por Cargo</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
                <SelectItem value="custom_user">Usuário Específico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.tipo_aprovador === 'cargo' && (
            <div className="space-y-2">
              <Label>Cargo Alvo</Label>
              <Input
                value={form.cargo_alvo}
                onChange={(e) => setForm({ ...form, cargo_alvo: e.target.value })}
              />
            </div>
          )}
          {form.tipo_aprovador === 'custom_user' && (
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Select
                value={form.custom_user_id}
                onValueChange={(v) => setForm({ ...form, custom_user_id: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Alçada Mínima (R$)</Label>
              <Input
                type="number"
                value={form.alcada_valor_min}
                onChange={(e) => setForm({ ...form, alcada_valor_min: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Alçada Máxima (R$)</Label>
              <Input
                type="number"
                value={form.alcada_valor_max}
                placeholder="Ilimitado"
                onChange={(e) => setForm({ ...form, alcada_valor_max: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>SLA para Aprovação (Horas)</Label>
            <Input
              type="number"
              value={form.sla_horas}
              onChange={(e) => setForm({ ...form, sla_horas: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Aprovação Paralela</p>
              <p className="text-xs text-muted-foreground">
                Pode ser aprovada junto com a etapa anterior.
              </p>
            </div>
            <Switch
              checked={form.paralela}
              onCheckedChange={(v) => setForm({ ...form, paralela: v })}
            />
          </div>
          <div className="flex justify-between mt-6">
            {etapa ? (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" /> Remover
              </Button>
            ) : (
              <div></div>
            )}
            <Button onClick={handleSave}>Salvar Etapa</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
