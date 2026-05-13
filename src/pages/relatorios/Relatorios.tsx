import { useState } from 'react'
import { FileText } from 'lucide-react'
import { ReportSidebar } from './ReportSidebar'
import { ReportContent } from './ReportContent'
import { SavedReports } from './SavedReports'
import { Button } from '@/components/ui/button'
import { exportRelatorioPDF } from '@/lib/pdf-export'
import { useAuth } from '@/hooks/use-auth'

export default function Relatorios() {
  const [activeReport, setActiveReport] = useState('gasto-por-periodo')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const { currentEmpresa } = useAuth()

  const handleExportPDF = () => {
    let colunas: string[] = []
    let linhas: any[][] = []

    const table = document.querySelector('table')
    if (table) {
      colunas = Array.from(table.querySelectorAll('th')).map((th) => th.textContent?.trim() || '')
      linhas = Array.from(table.querySelectorAll('tbody tr')).map((tr) =>
        Array.from(tr.querySelectorAll('td')).map((td) => td.textContent?.trim() || ''),
      )
    } else {
      colunas = ['Aviso']
      linhas = [['Nenhum dado tabular visível para exportação.']]
    }

    const reportTitle = activeReport
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')

    exportRelatorioPDF({
      titulo: `Relatório: ${reportTitle}`,
      empresa_nome: currentEmpresa?.nome_fantasia || currentEmpresa?.razao_social || 'Empresa',
      filtros_aplicados: filters,
      colunas,
      linhas,
    })
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Relatórios Analíticos</h1>
        <Button variant="outline" onClick={handleExportPDF}>
          <FileText className="w-4 h-4 mr-2" /> Exportar PDF
        </Button>
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
