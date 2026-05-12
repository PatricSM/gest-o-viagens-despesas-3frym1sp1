import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { ReportFilters } from './ReportFilters'
import { ReportChart } from './ReportChart'
import { ReportTable } from './ReportTable'
import { fetchReportData } from '@/services/reports'

export function ReportContent({
  type,
  filters,
  onFilterChange,
}: {
  type: string
  filters: any
  onFilterChange: (f: any) => void
}) {
  const [data, setData] = useState<any[]>([])
  const { currentEmpresa, user } = useAuth()

  useEffect(() => {
    if (currentEmpresa) {
      fetchReportData(currentEmpresa.id, type, filters).then(setData)
    }
  }, [currentEmpresa, type, filters])

  const handleSave = async (name: string) => {
    if (!name.trim()) return toast.error('Nome é obrigatório')
    try {
      await pb.collection('relatorios_salvos').create({
        user_id: user.id,
        nome: name,
        tipo_relatorio: type,
        filtros: filters,
      })
      toast.success('Relatório salvo com sucesso!')
      window.dispatchEvent(new Event('reports-saved'))
    } catch (e) {
      toast.error('Erro ao salvar relatório')
    }
  }

  const handleSchedule = async (freq: string) => {
    try {
      const proximo = new Date()
      if (freq === 'weekly') proximo.setDate(proximo.getDate() + 7)
      else proximo.setMonth(proximo.getMonth() + 1)

      await pb.collection('relatorios_agendados').create({
        user_id: user.id,
        relatorio_tipo: type,
        filtros: filters,
        frequencia: freq,
        proximo_envio: proximo.toISOString(),
        active: true,
      })
      toast.success('Relatório agendado com sucesso!')
    } catch (e) {
      toast.error('Erro ao agendar')
    }
  }

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      <ReportFilters
        filters={filters}
        onChange={onFilterChange}
        onSave={handleSave}
        onSchedule={handleSchedule}
        data={data}
        type={type}
      />
      <div className="flex-1 overflow-y-auto flex flex-col gap-4">
        <ReportChart type={type} data={data} />
        <ReportTable type={type} data={data} />
      </div>
    </div>
  )
}
