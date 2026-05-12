import { useState } from 'react'
import { ReportSidebar } from './ReportSidebar'
import { ReportContent } from './ReportContent'
import { SavedReports } from './SavedReports'

export default function Relatorios() {
  const [activeReport, setActiveReport] = useState('gasto-por-periodo')
  const [filters, setFilters] = useState({})

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Relatórios Analíticos</h1>
      </div>
      <div className="flex flex-1 gap-4 overflow-hidden">
        <ReportSidebar active={activeReport} onSelect={setActiveReport} />
        <ReportContent type={activeReport} filters={filters} onFilterChange={setFilters} />
        <SavedReports
          onSelect={(rep) => {
            setActiveReport(rep.tipo_relatorio)
            setFilters(rep.filtros || {})
          }}
        />
      </div>
    </div>
  )
}
