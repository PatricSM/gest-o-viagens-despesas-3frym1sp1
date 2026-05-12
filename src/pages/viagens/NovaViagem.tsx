import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Step1General } from '@/components/viagens/wizard/Step1General'
import { Step2Segments } from '@/components/viagens/wizard/Step2Segments'
import { Step3Estimates } from '@/components/viagens/wizard/Step3Estimates'
import { Step4Advance } from '@/components/viagens/wizard/Step4Advance'
import { Step5Companions } from '@/components/viagens/wizard/Step5Companions'
import { Step6Attachments } from '@/components/viagens/wizard/Step6Attachments'
import { Step7Review } from '@/components/viagens/wizard/Step7Review'
import { Card } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  'Dados Gerais',
  'Trechos',
  'Estimativas',
  'Adiantamento',
  'Acompanhantes',
  'Anexos',
  'Revisão',
]

export default function NovaViagem() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)

  const idFromUrl = searchParams.get('id')
  const [viagemId, setViagemId] = useState<string | null>(idFromUrl)

  useEffect(() => {
    if (idFromUrl && idFromUrl !== viagemId) {
      setViagemId(idFromUrl)
    }
  }, [idFromUrl])

  const handleNext = (id?: string) => {
    if (id && !viagemId) {
      setViagemId(id)
      setSearchParams({ id })
    }
    if (currentStep < 7) setCurrentStep((s) => s + 1)
  }

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1)
  }

  const handleFinish = () => {
    navigate('/viagens')
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-20">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Solicitação de Viagem</h2>
        <p className="text-muted-foreground">
          Preencha os dados passo a passo. O rascunho é salvo automaticamente.
        </p>
      </div>

      <div className="mb-8 relative hidden sm:block">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border/40 -translate-y-1/2 z-0"></div>
        <div className="relative z-10 flex justify-between">
          {STEPS.map((label, i) => {
            const stepNum = i + 1
            const isCompleted = stepNum < currentStep
            const isActive = stepNum === currentStep
            return (
              <div key={stepNum} className="flex flex-col items-center gap-2 bg-background px-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors border-2',
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isActive
                        ? 'bg-background border-primary text-primary'
                        : 'bg-background border-muted text-muted-foreground',
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <Card className="p-6 shadow-sm">
        {currentStep === 1 && (
          <Step1General viagemId={viagemId} onNext={handleNext} onPrev={handlePrev} />
        )}
        {currentStep === 2 && (
          <Step2Segments viagemId={viagemId!} onNext={handleNext} onPrev={handlePrev} />
        )}
        {currentStep === 3 && (
          <Step3Estimates viagemId={viagemId!} onNext={handleNext} onPrev={handlePrev} />
        )}
        {currentStep === 4 && (
          <Step4Advance viagemId={viagemId!} onNext={handleNext} onPrev={handlePrev} />
        )}
        {currentStep === 5 && (
          <Step5Companions viagemId={viagemId!} onNext={handleNext} onPrev={handlePrev} />
        )}
        {currentStep === 6 && (
          <Step6Attachments viagemId={viagemId!} onNext={handleNext} onPrev={handlePrev} />
        )}
        {currentStep === 7 && (
          <Step7Review viagemId={viagemId!} onNext={handleFinish} onPrev={handlePrev} />
        )}
      </Card>
    </div>
  )
}
