import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ApprovalFiltersState, formatCurrency } from '../types'

interface ApprovalFiltersProps {
  filters: ApprovalFiltersState
  setFilters: React.Dispatch<React.SetStateAction<ApprovalFiltersState>>
  availableUsers: { id: string; name: string }[]
}

export function ApprovalFilters({ filters, setFilters, availableUsers }: ApprovalFiltersProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Valor Máximo: {formatCurrency(filters.maxValue, 'BRL')}</Label>
        <Slider
          value={[filters.maxValue]}
          min={0}
          max={100000}
          step={500}
          onValueChange={([val]) => setFilters((f) => ({ ...f, maxValue: val }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Viajante / Solicitante</Label>
        <Select
          value={filters.requesterId}
          onValueChange={(val) => setFilters((f) => ({ ...f, requesterId: val }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {availableUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Apenas urgentes (Em atraso)</Label>
        <div className="flex items-center gap-2 mt-2">
          <Switch
            checked={filters.urgencyOnly}
            onCheckedChange={(val) => setFilters((f) => ({ ...f, urgencyOnly: val }))}
          />
          <span className="text-sm text-muted-foreground">Ocultar dentro do prazo</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Ordenação</Label>
        <Select
          value={filters.sortBy}
          onValueChange={(val) => setFilters((f) => ({ ...f, sortBy: val }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_asc">Mais antigos primeiro</SelectItem>
            <SelectItem value="date_desc">Mais recentes primeiro</SelectItem>
            <SelectItem value="value_desc">Maior valor</SelectItem>
            <SelectItem value="urgency">Urgência</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
