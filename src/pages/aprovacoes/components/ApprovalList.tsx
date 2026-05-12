import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Eye, AlertTriangle } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ApprovalItem, isEmAtraso, formatCurrency } from '../types'

interface ApprovalListProps {
  items: ApprovalItem[]
  selectedIds: Set<string>
  toggleSelect: (id: string, checked: boolean) => void
  toggleSelectAll: (checked: boolean | 'indeterminate') => void
  openModal: (type: 'rejeitar' | 'devolver', id: string) => void
  handleSingleAprovar: (id: string) => void
  moedas: Record<string, string>
}

const getDetailUrl = (collection: string, id: string) => {
  if (collection === 'prestacoes_contas') return `/prestacoes/${id}`
  return `/${collection}/${id}`
}

export function ApprovalList({
  items,
  selectedIds,
  toggleSelect,
  toggleSelectAll,
  openModal,
  handleSingleAprovar,
  moedas,
}: ApprovalListProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="relative overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
              <Checkbox
                checked={selectedIds.has(item.id)}
                onCheckedChange={(c) => toggleSelect(item.id, !!c)}
              />
            </div>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={item.requesterAvatar} />
                  <AvatarFallback>
                    {item.requesterName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{item.requesterName}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(item.date), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{item.codigo}</span>
                <span className="font-bold">
                  {formatCurrency(item.value, moedas[item.currencyId || ''] || 'BRL')}
                </span>
              </div>

              {item.policyViolations && (
                <Badge variant="destructive" className="mb-3">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Violação
                </Badge>
              )}
              {isEmAtraso(item) && (
                <Badge variant="outline" className="mb-3 ml-2 text-destructive border-destructive">
                  SLA Expirado
                </Badge>
              )}

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                <Button size="sm" onClick={() => handleSingleAprovar(item.id)}>
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openModal('rejeitar', item.id)}
                >
                  Rejeitar
                </Button>
                <Button size="sm" variant="outline" onClick={() => openModal('devolver', item.id)}>
                  Devolver
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link to={getDetailUrl(item.targetCollection, item.targetId)}>Detalhes</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum item pendente nesta categoria.
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={selectedIds.size === items.length && items.length > 0}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Solicitante</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Alertas</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(item.id)}
                  onCheckedChange={(c) => toggleSelect(item.id, !!c)}
                />
              </TableCell>
              <TableCell className="font-medium">{item.codigo}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={item.requesterAvatar} />
                    <AvatarFallback>
                      {item.requesterName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{item.requesterName}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">{format(new Date(item.date), 'dd/MM/yyyy')}</span>
                  {isEmAtraso(item) && <span className="text-xs text-destructive">Em atraso</span>}
                </div>
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatCurrency(item.value, moedas[item.currencyId || ''] || 'BRL')}
              </TableCell>
              <TableCell>
                {item.policyViolations ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    </TooltipTrigger>
                    <TooltipContent>Violação de política detectada</TooltipContent>
                  </Tooltip>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" onClick={() => handleSingleAprovar(item.id)}>
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => openModal('rejeitar', item.id)}
                  >
                    Rejeitar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openModal('devolver', item.id)}
                  >
                    Devolver
                  </Button>
                  <Button size="icon" variant="ghost" asChild title="Ver detalhes">
                    <Link to={getDetailUrl(item.targetCollection, item.targetId)}>
                      <Eye className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                Nenhum item pendente nesta categoria.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
