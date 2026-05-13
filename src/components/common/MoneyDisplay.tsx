/**
 * MoneyDisplay Component
 * Formats a number into a currency string (e.g. R$ 1.000,00).
 * @param value - The numeric value to format.
 * @param moeda - The ISO currency code (default: 'BRL').
 * @param className - Optional CSS classes to append.
 */
export function MoneyDisplay({
  value,
  moeda = 'BRL',
  className,
}: {
  value: number
  moeda?: string
  className?: string
}) {
  if (value === undefined || value === null) return null
  const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moeda }).format(
    value,
  )
  return <span className={className}>{formatted}</span>
}
