import { useState, useEffect } from 'react'
import { Plus, Eye, Wallet } from 'lucide-react'
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

export default function ListaAdiantamentos() {
  const [items, setItems] = useState<any[]>([])
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

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-headline-md text-foreground">Adiantamentos</h2>
          <p className="text-body-md text-muted-foreground mt-1">
            Gerencie solicitações de fundos para viagens.
          </p>
        </div>
        <Button asChild className="shadow-sm">
          <Link to="/adiantamentos/novo">
            <Plus className="w-4 h-4 mr-2" />
            Novo Adiantamento
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b flex items-center gap-4 bg-muted/30">
            <Input
              placeholder="Buscar por código ou justificativa..."
              className="max-w-sm bg-background"
            />
            <Button variant="outline">Filtros</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Viajante</TableHead>
                <TableHead>Viagem</TableHead>
                <TableHead>Data Solicitação</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Wallet className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    Nenhum adiantamento encontrado.
                  </TableCell>
                </TableRow>
              )}
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.codigo || '-'}</TableCell>
                  <TableCell className="font-medium text-sm">
                    {item.expand?.usuario_id?.name || 'Usuário'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.expand?.viagem_id?.codigo || '-'}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDate(item.created)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.valor)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={
                        item.status === 'aprovado' || item.status === 'pago'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : item.status === 'rejeitado' || item.status === 'cancelado'
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-amber-100 text-amber-700 border-amber-200'
                      }
                    >
                      {item.status.toUpperCase()}
                    </Badge>
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
  )
}
