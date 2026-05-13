import { useEffect, useState } from 'react'
import { Plus, ArrowRight, ArrowLeft, Save, Copy, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import * as adminService from '@/services/admin'
import { cn } from '@/lib/utils'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import StageModal from './StageModal'
import SimulatorModal from './SimulatorModal'

function SortableStageCard({
  etapa,
  idx,
  total,
  isHighlighted,
  workflowId,
  loadData,
}: {
  etapa: any
  idx: number
  total: number
  isHighlighted: boolean
  workflowId: string
  loadData: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: etapa.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-6 z-10 relative">
      <Card
        {...attributes}
        {...listeners}
        className={cn(
          'min-w-[280px] transition-all duration-300 relative group outline-none',
          isHighlighted && 'ring-2 ring-primary border-primary scale-105 shadow-xl',
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
        )}
      >
        <CardContent className="p-5 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <GripVertical className="w-5 h-5 text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity" />
              <Badge className="bg-muted text-foreground">Etapa {idx + 1}</Badge>
            </div>
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
          <div onPointerDown={(e) => e.stopPropagation()}>
            <StageModal
              etapa={etapa}
              workflowId={workflowId}
              onSave={loadData}
              onDelete={loadData}
            />
          </div>
        </CardContent>
      </Card>
      {idx < total - 1 && <ArrowRight className="text-muted-foreground w-6 h-6 shrink-0" />}
    </div>
  )
}

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const loadData = async () => setEtapas(await adminService.getEtapas(workflow.id))
  useEffect(() => {
    loadData()
  }, [workflow.id])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = etapas.findIndex((e) => e.id === active.id)
      const newIndex = etapas.findIndex((e) => e.id === over.id)

      const newEtapas = arrayMove(etapas, oldIndex, newIndex)
      setEtapas(newEtapas)

      for (let i = 0; i < newEtapas.length; i++) {
        await adminService.updateEtapa(newEtapas[i].id, { ordem: i + 1 })
      }
    }
  }

  const handleSave = async () => {
    await adminService.updateWorkflow(workflow.id, { nome })
    for (let i = 0; i < etapas.length; i++) {
      await adminService.updateEtapa(etapas[i].id, { ordem: i + 1 })
    }
    toast({ title: 'Workflow salvo com sucesso' })
    onBack()
  }

  const handleClone = async () => {
    if (!currentEmpresa?.id || !user?.id) return
    await adminService.cloneWorkflow(workflow.id, currentEmpresa.id, user.id)
    toast({ title: 'Nova versão criada' })
    onBack()
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={etapas.map((e) => e.id)} strategy={horizontalListSortingStrategy}>
            {etapas.map((etapa, idx) => {
              const isHighlighted =
                simulatedValue !== null &&
                simulatedValue >= (etapa.alcada_valor_min || 0) &&
                (!etapa.alcada_valor_max || simulatedValue <= etapa.alcada_valor_max)

              return (
                <SortableStageCard
                  key={etapa.id}
                  etapa={etapa}
                  idx={idx}
                  total={etapas.length}
                  isHighlighted={isHighlighted}
                  workflowId={workflow.id}
                  loadData={loadData}
                />
              )
            })}
          </SortableContext>
        </DndContext>
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
