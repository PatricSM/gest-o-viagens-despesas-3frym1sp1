import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, FileText } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getPrestacoes } from '@/services/prestacoes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'

const statusMap: Record<string, { label: string; variant: any }> = {
  rascunho: { label: 'Rascunho', variant: 'secondary' },
  enviada: { label: 'Enviada', variant: 'default' },
  em_aprovacao_gestor: { label: 'Aprovação Gestor', variant: 'outline' },
  em_aprovacao_financeiro: { label: 'Aprovação Fin.', variant: 'outline' },
  aprovada: { label: 'Aprovada', variant: 'default' },
  paga: { label: 'Paga', variant: 'default' },
  rejeitada: { label: 'Rejeitada', variant: 'destructive' },
  devolvida: { label: 'Devolvida', variant: 'destructive' },
}

export default function ListaPrestacoes() {
  const { currentEmpresa, userRole, user } = useAuth()
  const [prestacoes, setPrestacoes] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (currentEmpresa) {
      getPrestacoes(currentEmpresa.id).then((data) => {
        let filtered = data
        if (userRole === 'viajante') {
          filtered = data.filter((p) => p.usuario_id === user?.id)
        }
        setPrestacoes(filtered)
      })
    }
  }, [currentEmpresa, userRole, user?.id])

  const filteredData = prestacoes.filter(
    (p) =>
      p.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (p.codigo && p.codigo.toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Prestações de Contas</h2>
          <p className="text-muted-foreground">Gerencie relatórios de despesas e adiantamentos.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="pl-8 w-[250px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button asChild>
            <Link to="/prestacoes/nova">
              <Plus className="mr-2 h-4 w-4" /> Nova Prestação
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Criação</TableHead>
                <TableHead className="text-right">Despesas</TableHead>
                <TableHead className="text-right">Adiantamentos</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto text-muted mb-2" />
                    Nenhuma prestação de contas encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.codigo || '-'}</TableCell>
                    <TableCell>{p.titulo}</TableCell>
                    <TableCell>
                      <Badge variant={statusMap[p.status]?.variant || 'secondary'}>
                        {statusMap[p.status]?.label || p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(p.created), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-right">
                      {p.total_despesas?.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: p.expand?.moeda_id?.codigo || 'BRL',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.total_adiantamento?.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: p.expand?.moeda_id?.codigo || 'BRL',
                      })}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <span
                        className={
                          p.saldo > 0 ? 'text-primary' : p.saldo < 0 ? 'text-destructive' : ''
                        }
                      >
                        {p.saldo?.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: p.expand?.moeda_id?.codigo || 'BRL',
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/prestacoes/${p.id}`}>Detalhes</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
