import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

/**
 * PolicyViolationAlert Component
 * Distinct visual alert for displaying a list of policy violations found in a request.
 * @param violations - An object mapping violation keys/codes to descriptive strings.
 */
export function PolicyViolationAlert({
  violations,
}: {
  violations?: Record<string, string> | null
}) {
  if (!violations) return null
  const keys = Object.keys(violations)
  if (keys.length === 0) return null

  return (
    <Alert
      variant="destructive"
      className="bg-destructive/5 border-destructive/20 text-destructive mb-4"
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="font-semibold text-destructive">
        Violação de Política Identificada
      </AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          {keys.map((k) => (
            <li key={k} className="text-sm font-medium">
              {violations[k]}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
