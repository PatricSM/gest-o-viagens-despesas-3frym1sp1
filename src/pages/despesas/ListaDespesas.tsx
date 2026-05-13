import { useState, useEffect } from 'react'
import { Search, Plus, AlertTriangle, Receipt, Copy, Eye, Trash } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/common/StatusBadge'
import { MoneyDisplay } from '@/components/common/MoneyDisplay'
import { DateDisplay } from '@/components/common/DateDisplay'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EmptyState } from '@/components/common/EmptyState'
import { getDespesas, deleteDespesa } from '@/services/despesas'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export default function ListaDespesas() {
  const [despesas, setDespesas] = useState<any[]>([])
  const { currentEmpresa } = useAuth()
  const navigate = useNavigate()

  const loadData = async () => {
    if (!currentEmpresa) return
    try {
      const data = await getDespesas(currentEmpresa.id)
      setDespesas(data)
    } catch {
      toast.error('Erro ao carregar despesas.')
    }
  }

  useEffect(() => {
    loadData()
  }, [currentEmpresa])

  useRealtime('despesas', () => {
    loadData()
  })

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
      try {
        await deleteDespesa(id)
        toast.success('Despesa excluída com sucesso.')
        loadData()
      } catch {
        toast.error('Erro ao excluir despesa.')
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-headline-md text-foreground">Despesas</h2>
          <p className="text-body-md text-muted-foreground mt-1">
            Gerencie e registre seus gastos corporativos.
          </p>
        </div>
        <Button asChild className="shadow-sm">
          <Link to="/despesas/nova">
            <Plus className="w-4 h-4 mr-2" />
            Nova Despesa
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b flex items-center gap-4 bg-muted/30">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar despesas..." className="pl-9 bg-background" />
            </div>
            <Button variant="outline">Filtros</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Viagem</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Indicadores</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {despesas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center p-0">
                    <EmptyState
                      icon={Receipt}
                      title="Sem Despesas"
                      description="Nenhuma despesa registrada."
                    />
                  </TableCell>
                </TableRow>
              )}
              {despesas.map((exp) => {
                const isForaPolitica =
                  exp.politica_violacoes && Object.keys(exp.politica_violacoes).length > 0
                const comprovantes = exp.expand?.despesa_comprovantes_via_despesa_id || []
                const isSemComprovante = comprovantes.length === 0
                const isDuplicidade = exp.possivel_duplicidade

                return (
                  <TableRow key={exp.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      <DateDisplay date={exp.data_despesa} />
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate" title={exp.descricao}>
                      {exp.descricao || 'Despesa'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {exp.expand?.categoria_id?.cor && (
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: exp.expand.categoria_id.cor }}
                          />
                        )}
                        {exp.expand?.categoria_id?.nome || 'Outros'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {exp.expand?.viagem_id?.codigo || '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <MoneyDisplay value={exp.valor} moeda={exp.expand?.moeda_id?.codigo} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        {isForaPolitica && (
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            </TooltipTrigger>
                            <TooltipContent>Fora de política</TooltipContent>
                          </Tooltip>
                        )}
                        {isSemComprovante && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Receipt className="w-4 h-4 text-slate-400" />
                            </TooltipTrigger>
                            <TooltipContent>Sem comprovante</TooltipContent>
                          </Tooltip>
                        )}
                        {isDuplicidade && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Copy className="w-4 h-4 text-orange-500" />
                            </TooltipTrigger>
                            <TooltipContent>Possível duplicidade</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right flex justify-end">
                      <StatusBadge status={exp.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/despesas/${exp.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {exp.status === 'rascunho' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(exp.id)}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
