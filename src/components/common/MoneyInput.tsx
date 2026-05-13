import { useState, useEffect, ChangeEvent } from 'react'
import { Input } from '@/components/ui/input'

/**
 * MoneyInput Component
 * Input configured specifically for capturing currency values.
 * Includes a mask for formatted currency display and supports conversion previews.
 * @param value - The numeric value.
 * @param onChange - Callback with the raw numeric value.
 * @param placeholder - Input placeholder.
 * @param className - Optional CSS classes.
 * @param conversionRate - Optional rate multiplier for a secondary display.
 * @param conversionCurrency - The secondary currency code to display.
 */
export function MoneyInput({
  value,
  onChange,
  placeholder = '0,00',
  className,
  conversionRate,
  conversionCurrency,
}: {
  value?: number
  onChange: (val: number) => void
  placeholder?: string
  className?: string
  conversionRate?: number
  conversionCurrency?: string
}) {
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(
        new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value),
      )
    } else {
      setDisplayValue('')
    }
  }, [value])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (!raw) {
      setDisplayValue('')
      onChange(0)
      return
    }
    const numericValue = parseInt(raw, 10) / 100
    setDisplayValue(
      new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        numericValue,
      ),
    )
    onChange(numericValue)
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-2.5 text-muted-foreground text-sm font-medium">R$</div>
      <Input
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`pl-9 text-right ${className || ''}`}
      />
      {conversionRate && conversionCurrency && (value || 0) > 0 && (
        <div className="text-xs text-muted-foreground mt-1 text-right">
          ≈{' '}
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: conversionCurrency,
          }).format((value || 0) * conversionRate)}
        </div>
      )}
    </div>
  )
}
