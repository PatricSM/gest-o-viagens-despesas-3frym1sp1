import { Plus, Search, CheckCircle2 } from 'lucide-react'
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

export default function PoliticasList() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-headline-md">Políticas Corporativas</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Regras de viagens, despesas e limites organizacionais.
          </p>
        </div>
        <Button className="shadow-elevation">
          <Plus className="w-4 h-4 mr-2" />
          Nova Política
        </Button>
      </div>

      <Card className="border-none shadow-elevation">
        <CardContent className="p-0">
          <div className="p-4 border-b flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar políticas..." className="pl-9 bg-secondary/20" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-label-caps">Versão</TableHead>
                <TableHead className="text-label-caps">Vigência Inicial</TableHead>
                <TableHead className="text-label-caps">Vigência Final</TableHead>
                <TableHead className="text-label-caps">Status</TableHead>
                <TableHead className="text-label-caps text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">v1.0</TableCell>
                <TableCell className="text-body-sm">01/01/2024</TableCell>
                <TableCell className="text-body-sm">-</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-700 border-green-200 gap-1.5 pl-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Ativa
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
