import { useEffect, useState } from 'react'
import { Plus, ArrowRight, ArrowLeft, Save, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import * as adminService from '@/services/admin'
import { cn } from '@/lib/utils'

import StageModal from './StageModal'
import SimulatorModal from './SimulatorModal'

export default function WorkflowEditor({
  workflow,
  onBack,
}: {
  workflow: any
  onBack: () => void
}) {
  const [etapas, setEtapas] = useState<any[]>([])
  const [nome, setNome] = useState(workflow.nome)
  const [simulatedValue, setSimulatedValue] = useState<number | null>(null)
  const { currentEmpresa, user } = useAuth()
  const { toast } = useToast()

  const loadData = async () => setEtapas(await adminService.getEtapas(workflow.id))
  useEffect(() => {
    loadData()
  }, [workflow.id])

  const handleSave = async () => {
    await adminService.updateWorkflow(workflow.id, { nome })
    for (let i = 0; i < etapas.length; i++) {
      await adminService.updateEtapa(etapas[i].id, { ordem: i + 1 })
    }
    toast({ title: 'Workflow salvo com sucesso' })
    onBack()
  }

  const handleClone = async () => {
    if (!currentEmpresa?.empresa_id || !user?.id) return
    await adminService.cloneWorkflow(workflow.id, currentEmpresa.empresa_id, user.id)
    toast({ title: 'Nova versão criada' })
    onBack()
  }

  const moveCard = (from: number, to: number) => {
    const arr = [...etapas]
    const [item] = arr.splice(from, 1)
    arr.splice(to, 0, item)
    setEtapas(arr)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-headline-md flex items-center gap-3">
              Editor de Workflow <Badge variant="outline">v{workflow.versao}</Badge>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SimulatorModal onSimulate={setSimulatedValue} onClear={() => setSimulatedValue(null)} />
          <Button variant="outline" onClick={handleClone}>
            <Copy className="w-4 h-4 mr-2" /> Nova Versão
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" /> Salvar
          </Button>
        </div>
      </div>

      <Card className="p-4 flex items-center gap-4 border-none shadow-elevation">
        <Input
          className="max-w-sm font-medium"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do Workflow"
        />
      </Card>

      <div className="bg-secondary/10 p-8 rounded-xl border border-dashed flex gap-6 overflow-x-auto min-h-[350px] items-center">
        {etapas.map((etapa, idx) => {
          const isHighlighted =
            simulatedValue !== null &&
            simulatedValue >= (etapa.alcada_valor_min || 0) &&
            (!etapa.alcada_valor_max || simulatedValue <= etapa.alcada_valor_max)

          return (
            <div className="flex items-center gap-6" key={etapa.id}>
              <Card
                draggable
                onDragStart={(e) => e.dataTransfer.setData('idx', idx.toString())}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => moveCard(parseInt(e.dataTransfer.getData('idx')), idx)}
                className={cn(
                  'min-w-[280px] cursor-move transition-all duration-300 relative',
                  isHighlighted && 'ring-2 ring-primary border-primary scale-105 shadow-xl',
                )}
              >
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <Badge className="bg-muted text-foreground">Etapa {idx + 1}</Badge>
                    {etapa.paralela && <Badge variant="secondary">Paralela</Badge>}
                  </div>
                  <div className="font-semibold text-lg capitalize">
                    {etapa.tipo_aprovador.replace('_', ' ')}
                  </div>
                  {etapa.cargo_alvo && (
                    <div className="text-sm text-muted-foreground">Cargo: {etapa.cargo_alvo}</div>
                  )}
                  {etapa.expand?.custom_user_id?.name && (
                    <div className="text-sm text-muted-foreground">
                      Usuário: {etapa.expand.custom_user_id.name}
                    </div>
                  )}
                  <div className="text-xs font-medium bg-primary/5 text-primary p-2 rounded-md mt-2">
                    R$ {etapa.alcada_valor_min || 0} a{' '}
                    {etapa.alcada_valor_max ? `R$ ${etapa.alcada_valor_max}` : 'Ilimitado'}
                  </div>
                  <StageModal
                    etapa={etapa}
                    workflowId={workflow.id}
                    onSave={loadData}
                    onDelete={loadData}
                  />
                </CardContent>
              </Card>
              {idx < etapas.length - 1 && (
                <ArrowRight className="text-muted-foreground w-6 h-6 shrink-0" />
              )}
            </div>
          )
        })}
        <div className="shrink-0 flex items-center gap-6">
          {etapas.length > 0 && (
            <ArrowRight className="text-muted-foreground/30 w-6 h-6 shrink-0" />
          )}
          <StageModal workflowId={workflow.id} order={etapas.length + 1} onSave={loadData}>
            <Button
              variant="outline"
              className="h-32 w-32 border-dashed flex flex-col gap-2 rounded-xl text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5"
            >
              <Plus className="w-8 h-8" />
              <span>Adicionar</span>
            </Button>
          </StageModal>
        </div>
      </div>
    </div>
  )
}
