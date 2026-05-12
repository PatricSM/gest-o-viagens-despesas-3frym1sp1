import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText, ArrowLeft, Upload, Link as LinkIcon, Trash2, Send } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/use-auth'
import {
  getPrestacao,
  getDespesasPorPrestacao,
  getAdiantamentosPorPrestacao,
  getPrestacaoAnexos,
  uploadPrestacaoAnexo,
  deletePrestacaoAnexo,
  getDespesasDisponiveis,
  vincularDespesa,
  desvincularDespesa,
  getAdiantamentosDisponiveis,
  vincularAdiantamento,
  desvincularAdiantamento,
  updatePrestacao,
} from '@/services/prestacoes'
import pb from '@/lib/pocketbase/client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

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

export default function DetalhePrestacao() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, currentEmpresa } = useAuth()

  const [prestacao, setPrestacao] = useState<any>(null)
  const [despesas, setDespesas] = useState<any[]>([])
  const [adiantamentos, setAdiantamentos] = useState<any[]>([])
  const [anexos, setAnexos] = useState<any[]>([])

  const [dispDespesas, setDispDespesas] = useState<any[]>([])
  const [dispAdiantamentos, setDispAdiantamentos] = useState<any[]>([])

  const [uploading, setUploading] = useState(false)
  const [vincularOpen, setVincularOpen] = useState(false)

  const isOwner = user?.id === prestacao?.usuario_id
  const isDraft = prestacao?.status === 'rascunho'

  const loadData = async () => {
    if (!id || !currentEmpresa || !user) return
    try {
      const p = await getPrestacao(id)
      setPrestacao(p)

      const [d, a, ax] = await Promise.all([
        getDespesasPorPrestacao(id),
        getAdiantamentosPorPrestacao(id),
        getPrestacaoAnexos(id),
      ])
      setDespesas(d)
      setAdiantamentos(a)
      setAnexos(ax)

      if (user.id === p.usuario_id && p.status === 'rascunho') {
        const [dd, da] = await Promise.all([
          getDespesasDisponiveis(currentEmpresa.id, user.id),
          getAdiantamentosDisponiveis(currentEmpresa.id, user.id),
        ])
        setDispDespesas(dd)
        setDispAdiantamentos(da)
      }
    } catch (err) {
      toast.error('Erro ao carregar dados.')
    }
  }

  useEffect(() => {
    loadData()
  }, [id, currentEmpresa, user])

  const handleVincularDespesa = async (despId: string) => {
    if (!id) return
    try {
      await vincularDespesa(despId, id)
      toast.success('Despesa vinculada!')
      loadData()
    } catch (err) {
      toast.error('Erro ao vincular.')
    }
  }

  const handleDesvincularDespesa = async (despId: string) => {
    try {
      await desvincularDespesa(despId)
      toast.success('Despesa desvinculada!')
      loadData()
    } catch (err) {
      toast.error('Erro ao desvincular.')
    }
  }

  const handleVincularAdiantamento = async (adiantId: string) => {
    if (!id) return
    try {
      await vincularAdiantamento(adiantId, id)
      toast.success('Adiantamento vinculado!')
      loadData()
    } catch (err) {
      toast.error('Erro ao vincular.')
    }
  }

  const handleDesvincularAdiantamento = async (adiantId: string) => {
    try {
      await desvincularAdiantamento(adiantId)
      toast.success('Adiantamento desvinculado!')
      loadData()
    } catch (err) {
      toast.error('Erro ao desvincular.')
    }
  }

  const handleUploadAnexo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id || !user) return
    setUploading(true)
    try {
      await uploadPrestacaoAnexo(id, file, file.name, user.id)
      toast.success('Anexo enviado!')
      loadData()
    } catch (err) {
      toast.error('Erro ao enviar anexo.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAnexo = async (anexoId: string) => {
    try {
      await deletePrestacaoAnexo(anexoId)
      toast.success('Anexo removido!')
      loadData()
    } catch (err) {
      toast.error('Erro ao remover.')
    }
  }

  const handleEnviar = async () => {
    if (!id) return
    try {
      await updatePrestacao(id, {
        status: 'em_aprovacao_gestor',
        data_envio: new Date().toISOString(),
      })
      toast.success('Enviada para aprovação!')
      loadData()
    } catch (err) {
      toast.error('Erro ao enviar.')
    }
  }

  if (!prestacao) return null

  const currency = prestacao.expand?.moeda_id?.codigo || 'BRL'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/prestacoes')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{prestacao.titulo}</h2>
          <div className="text-sm text-muted-foreground flex gap-2 items-center mt-1">
            <span>{prestacao.codigo || '-'}</span>
            <span>•</span>
            <Badge variant={statusMap[prestacao.status]?.variant || 'secondary'}>
              {statusMap[prestacao.status]?.label || prestacao.status}
            </Badge>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          {isOwner && isDraft && (
            <Button onClick={handleEnviar} className="bg-primary">
              <Send className="w-4 h-4 mr-2" /> Enviar para Aprovação
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Descrição</p>
              <p className="mt-1">{prestacao.descricao || 'Sem descrição.'}</p>
            </div>
            {prestacao.expand?.viagem_id && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Viagem Relacionada</p>
                <p className="mt-1">
                  {prestacao.expand.viagem_id.codigo} - {prestacao.expand.viagem_id.motivo}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Totais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Despesas</span>
              <span className="font-medium">
                {prestacao.total_despesas?.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency,
                }) || (0).toLocaleString('pt-BR', { style: 'currency', currency })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adiantamentos</span>
              <span className="font-medium">
                {prestacao.total_adiantamento?.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency,
                }) || (0).toLocaleString('pt-BR', { style: 'currency', currency })}
              </span>
            </div>
            <div className="border-t pt-4 flex justify-between font-bold text-lg">
              <span>Saldo Final</span>
              <span
                className={
                  prestacao.saldo > 0
                    ? 'text-primary'
                    : prestacao.saldo < 0
                      ? 'text-destructive'
                      : ''
                }
              >
                {prestacao.saldo?.toLocaleString('pt-BR', { style: 'currency', currency }) ||
                  (0).toLocaleString('pt-BR', { style: 'currency', currency })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-right mt-1">
              {prestacao.saldo > 0
                ? 'A pagar ao colaborador'
                : prestacao.saldo < 0
                  ? 'A devolver à empresa'
                  : 'Sem saldo residual'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="despesas" className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="despesas">Despesas ({despesas.length})</TabsTrigger>
          <TabsTrigger value="adiantamentos">Adiantamentos ({adiantamentos.length})</TabsTrigger>
          <TabsTrigger value="anexos">Anexos Extras ({anexos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="despesas">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg">Despesas Vinculadas</CardTitle>
                <CardDescription>Gastos associados a esta prestação.</CardDescription>
              </div>
              {isOwner && isDraft && (
                <Dialog open={vincularOpen} onOpenChange={setVincularOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <LinkIcon className="w-4 h-4 mr-2" /> Vincular
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Vincular Despesa</DialogTitle>
                    </DialogHeader>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dispDespesas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center">
                              Nenhuma despesa disponível.
                            </TableCell>
                          </TableRow>
                        ) : (
                          dispDespesas.map((d) => (
                            <TableRow key={d.id}>
                              <TableCell>
                                {format(new Date(d.data_despesa), 'dd/MM/yyyy')}
                              </TableCell>
                              <TableCell>{d.expand?.categoria_id?.nome}</TableCell>
                              <TableCell>
                                {d.valor?.toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: d.expand?.moeda_id?.codigo || 'BRL',
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" onClick={() => handleVincularDespesa(d.id)}>
                                  Adicionar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {despesas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        Nenhuma despesa vinculada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    despesas.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{format(new Date(d.data_despesa), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{d.expand?.categoria_id?.nome}</TableCell>
                        <TableCell>{d.descricao || '-'}</TableCell>
                        <TableCell className="text-right">
                          {d.valor?.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: d.expand?.moeda_id?.codigo || 'BRL',
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {isOwner && isDraft && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDesvincularDespesa(d.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adiantamentos">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg">Adiantamentos Vinculados</CardTitle>
                <CardDescription>Valores recebidos antecipadamente.</CardDescription>
              </div>
              {isOwner && isDraft && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <LinkIcon className="w-4 h-4 mr-2" /> Vincular
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Vincular Adiantamento</DialogTitle>
                    </DialogHeader>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data Ref.</TableHead>
                          <TableHead>Justificativa</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dispAdiantamentos.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center">
                              Nenhum adiantamento disponível.
                            </TableCell>
                          </TableRow>
                        ) : (
                          dispAdiantamentos.map((a) => (
                            <TableRow key={a.id}>
                              <TableCell>{format(new Date(a.created), 'dd/MM/yyyy')}</TableCell>
                              <TableCell>{a.justificativa}</TableCell>
                              <TableCell>
                                {a.valor?.toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: a.expand?.moeda_id?.codigo || 'BRL',
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" onClick={() => handleVincularAdiantamento(a.id)}>
                                  Adicionar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Ref.</TableHead>
                    <TableHead>Justificativa</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adiantamentos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        Nenhum adiantamento vinculado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    adiantamentos.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{format(new Date(a.created), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{a.justificativa}</TableCell>
                        <TableCell className="text-right">
                          {a.valor?.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: a.expand?.moeda_id?.codigo || 'BRL',
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {isOwner && isDraft && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDesvincularAdiantamento(a.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anexos">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg">Anexos Adicionais</CardTitle>
                <CardDescription>
                  Documentação geral que não se enquadra em uma despesa específica.
                </CardDescription>
              </div>
              {isOwner && isDraft && (
                <div className="relative">
                  <Input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleUploadAnexo}
                    disabled={uploading}
                  />
                  <Button variant="outline" size="sm" disabled={uploading}>
                    <Upload className="w-4 h-4 mr-2" /> {uploading ? 'Enviando...' : 'Fazer Upload'}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Enviado por</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anexos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        Nenhum anexo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    anexos.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium text-primary">
                          <a
                            href={pb.files.getURL(a, a.arquivo)}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline"
                          >
                            {a.arquivo}
                          </a>
                        </TableCell>
                        <TableCell>{a.expand?.uploaded_by?.name || '-'}</TableCell>
                        <TableCell>{format(new Date(a.created), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-right">
                          {isOwner && isDraft && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAnexo(a.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
