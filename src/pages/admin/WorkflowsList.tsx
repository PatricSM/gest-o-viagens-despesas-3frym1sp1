import { useEffect, useState } from 'react'
import { Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

import WorkflowEditor from './workflows/WorkflowEditor'

export default function WorkflowsList() {
  const { currentEmpresa, user } = useAuth()
  const { toast } = useToast()
  const [workflows, setWorkflows] = useState<any[]>([])
  const [tipo, setTipo] = useState('despesa')
  const [editing, setEditing] = useState<any>(null)

  const loadData = async () => {
    if (!currentEmpresa?.id) return
    const list = await adminService.getWorkflows(currentEmpresa.id)
    setWorkflows(list)
  }

  useEffect(() => {
    loadData()
  }, [currentEmpresa])

  const handleCreate = async () => {
    if (!currentEmpresa?.id || !user?.id) return
    try {
      const w = await adminService.createWorkflow({
        empresa_id: currentEmpresa.id,
        tipo,
        nome: `Workflow de ${tipo} padrão`,
        versao: 1,
        active: true,
        vigencia_inicio: new Date().toISOString(),
        created_by: user.id,
      })
      toast({ title: 'Workflow criado' })
      loadData()
      setEditing(w)
    } catch {
      toast({ title: 'Erro ao criar', variant: 'destructive' })
    }
  }

  if (editing) {
    return (
      <WorkflowEditor
        workflow={editing}
        onBack={() => {
          setEditing(null)
          loadData()
        }}
      />
    )
  }

  const filtered = workflows.filter((w) => w.tipo === tipo)

  return (
    <div className="flex gap-6 h-full animate-fade-in">
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workflows de Aprovação</h1>
            <p className="text-muted-foreground mt-1">
              Configure os fluxos e etapas de aprovação para as requisições.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleCreate} className="shadow-elevation">
              <Plus className="w-4 h-4 mr-2" /> Novo Workflow
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-elevation">
          <Tabs value={tipo} onValueChange={setTipo} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12 px-6">
              <TabsTrigger
                value="viagem"
                className="data-[state=active]:border-b-2 border-primary rounded-none"
              >
                Viagem
              </TabsTrigger>
              <TabsTrigger
                value="despesa"
                className="data-[state=active]:border-b-2 border-primary rounded-none"
              >
                Despesa
              </TabsTrigger>
              <TabsTrigger
                value="adiantamento"
                className="data-[state=active]:border-b-2 border-primary rounded-none"
              >
                Adiantamento
              </TabsTrigger>
              <TabsTrigger
                value="prestacao"
                className="data-[state=active]:border-b-2 border-primary rounded-none"
              >
                Prestação
              </TabsTrigger>
            </TabsList>
            <div className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.nome}</TableCell>
                      <TableCell>v{w.versao}</TableCell>
                      <TableCell>
                        {w.active ? (
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(w)}>
                          <Settings className="w-4 h-4 mr-2" /> Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum workflow encontrado para este módulo.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
