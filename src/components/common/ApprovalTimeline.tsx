import { Send, CheckCircle2, XCircle, Clock, RotateCcw, MinusCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/common/StatusBadge'

export interface TimelineStep {
  id: string
  approverName: string
  approverRole: string
  status: 'aprovado' | 'rejeitado' | 'devolvido' | 'pendente' | 'pulado' | string
  decidedAt?: string
  comentario?: string
}

interface ApprovalTimelineProps {
  steps: TimelineStep[]
  submittedBy: string
  submittedAt: string
}

export function ApprovalTimeline({ steps, submittedBy, submittedAt }: ApprovalTimelineProps) {
  return (
    <div className="relative pl-12">
      <div className="absolute top-2 bottom-0 left-4 w-0.5 bg-outline-variant -ml-px" />

      {/* Submission Step */}
      <div className="relative pb-6">
        <div className="absolute -left-12 top-0 flex items-center justify-center w-8 h-8 rounded-full ring-2 ring-primary bg-primary text-primary-foreground z-10">
          <Send className="w-4 h-4 ml-0.5" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{submittedBy}</p>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status="enviada" />
            <span className="text-xs text-muted-foreground">
              Enviado para aprovação · há{' '}
              {formatDistanceToNow(new Date(submittedAt), { locale: ptBR })}
            </span>
          </div>
        </div>
      </div>

      {/* Approval Steps */}
      {steps.map((step) => {
        let Icon = Clock
        let ringColor = 'ring-zinc-300'
        let fgColor = 'text-zinc-500'

        switch (step.status) {
          case 'aprovado':
            Icon = CheckCircle2
            ringColor = 'ring-emerald-500'
            fgColor = 'text-emerald-500'
            break
          case 'rejeitado':
            Icon = XCircle
            ringColor = 'ring-red-500'
            fgColor = 'text-red-500'
            break
          case 'devolvido':
            Icon = RotateCcw
            ringColor = 'ring-amber-500'
            fgColor = 'text-amber-500'
            break
          case 'pendente':
            Icon = Clock
            ringColor = 'ring-primary'
            fgColor = 'text-primary'
            break
          case 'pulado':
            Icon = MinusCircle
            ringColor = 'ring-zinc-300'
            fgColor = 'text-zinc-500'
            break
        }

        const timeText = step.decidedAt
          ? `há ${formatDistanceToNow(new Date(step.decidedAt), { locale: ptBR })}`
          : step.status === 'pendente'
            ? `aguardando há ${formatDistanceToNow(new Date(submittedAt), { locale: ptBR })}`
            : ''

        return (
          <div key={step.id} className="relative pb-6 last:pb-0">
            <div
              className={cn(
                'absolute -left-12 top-0 flex items-center justify-center w-8 h-8 rounded-full ring-2 bg-surface z-10',
                ringColor,
                fgColor,
              )}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {step.approverName || 'Aguardando atribuição'}
                <span className="text-muted-foreground font-normal ml-1">
                  • {step.approverRole?.replace('_', ' ') || 'Aprovador'}
                </span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={step.status} />
                {timeText && <span className="text-xs text-muted-foreground">{timeText}</span>}
              </div>
              {step.comentario && (
                <blockquote className="mt-2 text-sm text-on-surface-variant border-l-2 border-outline-variant pl-3 italic">
                  {step.comentario}
                </blockquote>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
