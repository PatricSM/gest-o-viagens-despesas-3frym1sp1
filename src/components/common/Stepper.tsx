import { Check } from 'lucide-react'

export interface Step {
  id: string
  title: string
  status: 'complete' | 'current' | 'upcoming'
}

/**
 * Stepper Component
 * A horizontal layout for multi-step wizards or progress tracking.
 * @param steps - The ordered array of step definitions.
 */
export function Stepper({ steps }: { steps: Step[] }) {
  if (!steps || steps.length === 0) return null

  return (
    <nav aria-label="Progress" className="w-full">
      <ol role="list" className="space-y-4 md:flex md:space-y-0 md:space-x-4 w-full">
        {steps.map((step) => (
          <li key={step.id} className="md:flex-1">
            {step.status === 'complete' ? (
              <div className="group flex flex-col border-l-4 border-primary py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 transition-colors hover:border-primary/80">
                <span className="text-sm font-medium text-primary flex items-center gap-1.5">
                  <Check className="w-4 h-4 shrink-0" /> {step.title}
                </span>
              </div>
            ) : step.status === 'current' ? (
              <div
                className="flex flex-col border-l-4 border-primary py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
                aria-current="step"
              >
                <span className="text-sm font-semibold text-primary">{step.title}</span>
              </div>
            ) : (
              <div className="group flex flex-col border-l-4 border-border py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 transition-colors">
                <span className="text-sm font-medium text-muted-foreground">{step.title}</span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
