import { Plus, Search, GitMerge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function WorkflowsList() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-headline-md">Workflows de Aprovação</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Configure os fluxos e etapas de aprovação para as requisições.
          </p>
        </div>
        <Button className="shadow-elevation">
          <Plus className="w-4 h-4 mr-2" />
          Novo Workflow
        </Button>
      </div>

      <Card className="border-none shadow-elevation">
        <CardContent className="p-0">
          <div className="p-4 border-b flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar fluxos..." className="pl-9 bg-secondary/20" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-label-caps">Nome do Fluxo</TableHead>
                <TableHead className="text-label-caps">Módulo</TableHead>
                <TableHead className="text-label-caps">Versão</TableHead>
                <TableHead className="text-label-caps">Status</TableHead>
                <TableHead className="text-label-caps text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-primary" />
                  Aprovação Padrão de Despesas
                </TableCell>
                <TableCell className="text-body-sm text-muted-foreground capitalize">
                  Despesa
                </TableCell>
                <TableCell className="text-body-sm">v1.0</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Ativo
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
