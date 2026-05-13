import { useEffect, useState } from 'react'
import { Plus, History, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import * as adminService from '@/services/admin'
import { format } from 'date-fns'

import GeralForm from './politicas/GeralForm'
import TetosTable from './politicas/TetosTable'
import DiariasTable from './politicas/DiariasTable'
import ClassesTable from './politicas/ClassesTable'
import BloqueadasTable from './politicas/BloqueadasTable'

export default function PoliticasList() {
  const { currentEmpresa, user } = useAuth()
  const { toast } = useToast()
  const [active, setActive] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])

  const loadData = async () => {
    if (!currentEmpresa?.id) return
    const pols = await adminService.getPoliticas(currentEmpresa.id)
    setHistory(pols)
    setActive(pols.find((p) => p.active) || null)
  }

  useEffect(() => {
    loadData()
  }, [currentEmpresa])

  const handleNovaVersao = async () => {
    if (!currentEmpresa?.id || !user?.id) return
    try {
      if (active) {
        await adminService.clonePolitica(active.id, currentEmpresa.id, user.id)
      } else {
        await adminService.createPolitica({
          empresa_id: currentEmpresa.id,
          versao: 1,
          vigencia_inicio: new Date().toISOString(),
          active: true,
          created_by: user.id,
        })
      }
      toast({ title: 'Nova versão criada com sucesso' })
      loadData()
    } catch (e) {
      toast({ title: 'Erro ao criar versão', variant: 'destructive' })
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await adminService.clonePolitica(id, currentEmpresa.id, user.id)
      toast({ title: 'Versão restaurada com sucesso' })
      loadData()
    } catch {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  return (
    <div className="flex gap-6 h-full animate-fade-in">
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Políticas Corporativas</h1>
            <p className="text-muted-foreground mt-1">
              Regras de viagens, despesas e limites organizacionais.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <History className="w-4 h-4 mr-2" /> Ver Histórico
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Histórico de Políticas</DialogTitle>
                </DialogHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Versão</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Fim</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>v{p.versao}</TableCell>
                        <TableCell>{format(new Date(p.vigencia_inicio), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          {p.vigencia_fim ? format(new Date(p.vigencia_fim), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          {p.active ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                              Ativa
                            </Badge>
                          ) : (
                            <Badge variant="outline">Inativa</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestore(p.id)}
                            disabled={p.active}
                          >
                            Restaurar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DialogContent>
            </Dialog>
            <Button onClick={handleNovaVersao} className="shadow-elevation">
              <Plus className="w-4 h-4 mr-2" /> Nova Versão
            </Button>
          </div>
        </div>

        {!active ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma política ativa. Crie uma nova versão para começar.
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-elevation">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-secondary/10">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-lg">Versão {active.versao}</span>
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-700 border-green-200 gap-1.5"
                >
                  <CheckCircle2 className="w-3 h-3" /> Ativa
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                Vigência a partir de {format(new Date(active.vigencia_inicio), 'dd/MM/yyyy')}
              </span>
            </div>
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12 px-6">
                <TabsTrigger
                  value="geral"
                  className="data-[state=active]:shadow-none data-[state=active]:border-b-2 border-primary rounded-none"
                >
                  Geral
                </TabsTrigger>
                <TabsTrigger
                  value="tetos"
                  className="data-[state=active]:shadow-none data-[state=active]:border-b-2 border-primary rounded-none"
                >
                  Tetos
                </TabsTrigger>
                <TabsTrigger
                  value="diarias"
                  className="data-[state=active]:shadow-none data-[state=active]:border-b-2 border-primary rounded-none"
                >
                  Diárias
                </TabsTrigger>
                <TabsTrigger
                  value="classes"
                  className="data-[state=active]:shadow-none data-[state=active]:border-b-2 border-primary rounded-none"
                >
                  Classes de viagem
                </TabsTrigger>
                <TabsTrigger
                  value="bloqueadas"
                  className="data-[state=active]:shadow-none data-[state=active]:border-b-2 border-primary rounded-none"
                >
                  Categorias bloqueadas
                </TabsTrigger>
              </TabsList>
              <div className="p-6">
                <TabsContent value="geral">
                  <GeralForm politica={active} />
                </TabsContent>
                <TabsContent value="tetos">
                  <TetosTable politicaId={active.id} empresaId={currentEmpresa.id} />
                </TabsContent>
                <TabsContent value="diarias">
                  <DiariasTable politicaId={active.id} />
                </TabsContent>
                <TabsContent value="classes">
                  <ClassesTable politicaId={active.id} />
                </TabsContent>
                <TabsContent value="bloqueadas">
                  <BloqueadasTable politicaId={active.id} empresaId={currentEmpresa.id} />
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        )}
      </div>
    </div>
  )
}
