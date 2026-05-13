import { useState, useEffect, useMemo } from 'react'
import { Plus, Eye, Wallet, Filter } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { getAdiantamentos } from '@/services/adiantamentos'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { EmptyState } from '@/components/common/EmptyState'

export default function ListaAdiantamentos() {
  const [items, setItems] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const { currentEmpresa } = useAuth()
  const navigate = useNavigate()

  const loadData = async () => {
    if (!currentEmpresa) return
    try {
      const data = await getAdiantamentos(currentEmpresa.id)
      setItems(data)
    } catch {
      toast.error('Erro ao carregar adiantamentos.')
    }
  }

  useEffect(() => {
    loadData()
  }, [currentEmpresa])

  useRealtime('adiantamentos', () => {
    loadData()
  })

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items
    const term = searchTerm.toLowerCase()
    return items.filter(
      (item) =>
        item.codigo?.toLowerCase().includes(term) ||
        item.expand?.viagem_id?.codigo?.toLowerCase().includes(term) ||
        item.expand?.usuario_id?.name?.toLowerCase().includes(term),
    )
  }, [items, searchTerm])

  return (
    <div className="flex gap-6 h-full animate-fade-in">
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Adiantamentos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie solicitações de fundos para viagens.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild className="shadow-sm">
              <Link to="/adiantamentos/novo">
                <Plus className="w-4 h-4 mr-2" />
                Novo Adiantamento
              </Link>
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <div className="p-4 border-b flex items-center gap-4 bg-muted/30">
              <Input
                placeholder="Buscar por código, viajante ou viagem..."
                className="max-w-sm bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline">Filtros</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-surface-container transition-colors">
                  <TableHead className="text-label-caps text-on-surface-variant h-10">
                    Código
                  </TableHead>
                  <TableHead className="text-label-caps text-on-surface-variant h-10">
                    Viajante
                  </TableHead>
                  <TableHead className="text-label-caps text-on-surface-variant h-10">
                    Viagem
                  </TableHead>
                  <TableHead className="text-label-caps text-on-surface-variant h-10 text-right">
                    Data Solicitação
                  </TableHead>
                  <TableHead className="text-label-caps text-on-surface-variant h-10 text-right">
                    Valor
                  </TableHead>
                  <TableHead className="text-label-caps text-on-surface-variant h-10 text-right">
                    Status
                  </TableHead>
                  <TableHead className="text-label-caps text-on-surface-variant h-10 text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 && (
                  <TableRow className="hover:bg-surface-container transition-colors">
                    <TableCell colSpan={7} className="p-0">
                      {searchTerm ? (
                        <EmptyState
                          variant="filter"
                          icon={Filter}
                          title="Nenhum adiantamento encontrado"
                          description="Sua busca não retornou resultados."
                          secondary={{ label: 'Limpar busca', onClick: () => setSearchTerm('') }}
                        />
                      ) : (
                        <EmptyState
                          variant="default"
                          icon={Wallet}
                          title="Nenhum adiantamento"
                          description="Você ainda não solicitou nenhum adiantamento."
                          action={{
                            label: 'Novo Adiantamento',
                            onClick: () => navigate('/adiantamentos/novo'),
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                )}
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-surface-container transition-colors">
                    <TableCell className="text-body-sm font-medium">{item.codigo || '-'}</TableCell>
                    <TableCell className="text-body-sm font-medium">
                      {item.expand?.usuario_id?.name || 'Usuário'}
                    </TableCell>
                    <TableCell className="text-body-sm text-muted-foreground">
                      {item.expand?.viagem_id?.codigo || '-'}
                    </TableCell>
                    <TableCell className="text-data-tabular text-on-surface-variant whitespace-nowrap text-right">
                      {formatDate(item.created)}
                    </TableCell>
                    <TableCell className="text-data-tabular tabular-nums text-right font-medium">
                      {formatCurrency(item.valor)}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/adiantamentos/${item.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
