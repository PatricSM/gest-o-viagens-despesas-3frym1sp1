import { ReactNode } from 'react'

export interface TimelineItem {
  id: string
  title: string
  description?: string
  time?: string
  icon?: ReactNode
  status?: 'completed' | 'current' | 'upcoming' | 'error'
}

/**
 * Timeline Component
 * A vertical timeline display suitable for rendering historical audit trails or step-by-step progress.
 * @param items - The array of timeline nodes to display.
 */
export function Timeline({ items }: { items: TimelineItem[] }) {
  if (!items || items.length === 0) return null

  return (
    <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
      {items.map((item) => {
        let borderColor = 'border-background'
        let bgColor = 'bg-muted text-muted-foreground'

        if (item.status === 'completed') {
          bgColor = 'bg-green-500 text-white'
        } else if (item.status === 'error') {
          bgColor = 'bg-red-500 text-white'
        } else if (item.status === 'current') {
          bgColor = 'bg-primary text-primary-foreground'
          borderColor = 'border-primary/20'
        }

        return (
          <div
            key={item.id}
            className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group"
          >
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-[3px] ${borderColor} ${bgColor} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10`}
            >
              {item.icon}
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                <h4 className="font-medium text-sm text-foreground">{item.title}</h4>
                {item.time && (
                  <span className="text-xs text-muted-foreground font-mono">{item.time}</span>
                )}
              </div>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
