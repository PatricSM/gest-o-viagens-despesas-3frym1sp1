import { Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { StatCardWithTrend } from '@/components/common/StatCardWithTrend'

interface ApprovalStatsProps {
  pendentesHoje: number
  emAtrasoCount: number
  aprovadasMes: number
  tempoMedioDias: number
}

export function ApprovalStats({
  pendentesHoje,
  emAtrasoCount,
  aprovadasMes,
  tempoMedioDias,
}: ApprovalStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCardWithTrend
        label="Pendentes Hoje"
        icon={Clock}
        value={pendentesHoje}
        trend="down"
        trendValue="5%"
        trendText="vs ontem"
      />
      <StatCardWithTrend
        label="Em Atraso (>SLA)"
        icon={AlertTriangle}
        value={emAtrasoCount}
        trend={emAtrasoCount > 5 ? 'up' : 'down'}
        trendValue={emAtrasoCount > 5 ? '+2' : '-1'}
        trendText="vs ontem"
      />
      <StatCardWithTrend
        label="Aprovadas no Mês"
        icon={CheckCircle}
        value={aprovadasMes}
        trend="up"
        trendValue="12%"
        trendText="vs mês anterior"
      />
      <StatCardWithTrend
        label="Tempo Médio"
        icon={Clock}
        value={tempoMedioDias}
        valueFormatter={(v) => `${Number(v).toFixed(1)} dias`}
        trend="down"
        trendValue="8%"
        trendText="mais rápido"
      />
    </div>
  )
}
