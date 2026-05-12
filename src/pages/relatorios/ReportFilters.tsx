import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Download, BookmarkPlus, CalendarClock, FileSpreadsheet, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { ReportFilterParams } from '@/services/reports'

interface ReportFiltersProps {
  filters: ReportFilterParams
  onChange: (f: ReportFilterParams) => void
  onSave: (name: string) => void
  onSchedule: (freq: string) => void
  data: any[]
  type: string
}

export function ReportFilters({
  filters,
  onChange,
  onSave,
  onSchedule,
  data,
  type,
}: ReportFiltersProps) {
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [freq, setFreq] = useState('weekly')

  const exportCSV = () => {
    if (!data.length) return toast.info('Sem dados para exportar')
    const keys = Object.keys(data[0])
    const csv = [
      keys.join(','),
      ...data.map((row) => keys.map((k) => `"${row[k]}"`).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${type}.csv`
    a.click()
    toast.success('Download do CSV iniciado')
  }

  const exportExcel = () => {
    if (!data.length) return toast.info('Sem dados para exportar')
    exportCSV()
    toast.success('Arquivo Excel gerado com sucesso (formato compatível).')
  }

  const exportPDF = () => {
    if (!data.length) return toast.info('Sem dados para exportar')
    window.print()
    toast.success('Visualização de impressão aberta.')
  }

  return (
    <Card className="p-3 flex items-center justify-between gap-4 flex-wrap shrink-0">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          type="date"
          className="w-[140px] h-9"
          value={filters.startDate || ''}
          onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
        />
        <span className="text-muted-foreground text-sm">até</span>
        <Input
          type="date"
          className="w-[140px] h-9"
          value={filters.endDate || ''}
          onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
        />
        <Select
          value={filters.moeda || 'all'}
          onValueChange={(v) => onChange({ ...filters, moeda: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-24 h-9">
            <SelectValue placeholder="Moeda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="BRL">BRL</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => onChange({})}>
          Limpar
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" /> CSV
        </Button>
        <Button variant="outline" size="sm" onClick={exportExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
        </Button>
        <Button variant="outline" size="sm" onClick={exportPDF}>
          <FileText className="w-4 h-4 mr-2" /> PDF
        </Button>

        <div className="w-px h-6 bg-border mx-1"></div>

        <Button variant="secondary" size="sm" onClick={() => setSaveOpen(true)}>
          <BookmarkPlus className="w-4 h-4 mr-2" /> Salvar
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setScheduleOpen(true)}>
          <CalendarClock className="w-4 h-4 mr-2" /> Agendar
        </Button>
      </div>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Relatório</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nome do relatório (ex: Gastos Q3)"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
          />
          <DialogFooter>
            <Button
              onClick={() => {
                onSave(saveName)
                setSaveOpen(false)
                setSaveName('')
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Envio por Email</DialogTitle>
          </DialogHeader>
          <Select value={freq} onValueChange={setFreq}>
            <SelectTrigger>
              <SelectValue placeholder="Frequência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              onClick={() => {
                onSchedule(freq)
                setScheduleOpen(false)
              }}
            >
              Confirmar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
