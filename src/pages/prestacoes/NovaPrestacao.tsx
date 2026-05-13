import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronRight, Send, Save, ArrowLeft, Trash2, Upload } from 'lucide-react'
import { format } from 'date-fns'

import { useAuth } from '@/hooks/use-auth'
import {
  createPrestacao,
  getDespesasDisponiveis,
  getAdiantamentosDisponiveis,
  vincularDespesa,
  vincularAdiantamento,
  uploadPrestacaoAnexo,
  updatePrestacao,
} from '@/services/prestacoes'
import { getMoedas, getViagens } from '@/services/despesas'
import { triggerWorkflow } from '@/services/workflows'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Combobox } from '@/components/common/Combobox'

const steps = [
  { id: 1, name: 'Informações Básicas' },
  { id: 2, name: 'Seleção de Despesas' },
  { id: 3, name: 'Adiantamentos' },
  { id: 4, name: 'Resumo e Anexos' },
]

export default function NovaPrestacao() {
  const navigate = useNavigate()
  const { user, currentEmpresa } = useAuth()

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Options
  const [moedas, setMoedas] = useState<any[]>([])
  const [viagens, setViagens] = useState<any[]>([])
  const [dispDespesas, setDispDespesas] = useState<any[]>([])
  const [dispAdiantamentos, setDispAdiantamentos] = useState<any[]>([])

  // Form State
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [viagemId, setViagemId] = useState('')
  const [moedaId, setMoedaId] = useState('')

  const [selectedDespesas, setSelectedDespesas] = useState<Set<string>>(new Set())
  const [selectedAdiantamentos, setSelectedAdiantamentos] = useState<Set<string>>(new Set())
  const [anexos, setAnexos] = useState<File[]>([])

  useEffect(() => {
    if (!currentEmpresa || !user) return
    const loadOpts = async () => {
      try {
        const [mds, viags] = await Promise.all([
          getMoedas(currentEmpresa.id),
          getViagens(currentEmpresa.id, user.id),
        ])
        setMoedas(mds)
        setViagens(viags)
        const moedaPadrao = mds.find((m) => m.padrao)
        if (moedaPadrao) setMoedaId(moedaPadrao.id)
      } catch (err) {
        console.error(err)
      }
    }
    loadOpts()
  }, [currentEmpresa, user])

  const loadDespesas = async () => {
    if (!currentEmpresa || !user) return
    const d = await getDespesasDisponiveis(currentEmpresa.id, user.id)
    // Filter by viagem if selected
    const filtered = viagemId
      ? d.filter((item: any) => item.viagem_id === viagemId || !item.viagem_id)
      : d
    setDispDespesas(filtered)
  }

  const loadAdiantamentos = async () => {
    if (!currentEmpresa || !user) return
    const a = await getAdiantamentosDisponiveis(currentEmpresa.id, user.id, viagemId || undefined)
    setDispAdiantamentos(a)
    // auto select all if they belong to the selected trip
    if (viagemId) {
      const tripAdvs = new Set(
        a.filter((item: any) => item.viagem_id === viagemId).map((item: any) => item.id),
      )
      setSelectedAdiantamentos(tripAdvs)
    }
  }

  useEffect(() => {
    if (currentStep === 2) loadDespesas()
    if (currentStep === 3) loadAdiantamentos()
  }, [currentStep, viagemId])

  const toggleDespesa = (id: string) => {
    const next = new Set(selectedDespesas)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedDespesas(next)
  }

  const toggleAdiantamento = (id: string) => {
    const next = new Set(selectedAdiantamentos)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedAdiantamentos(next)
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!titulo.trim()) return toast.error('O título é obrigatório.')
      if (!moedaId) return toast.error('Selecione uma moeda.')
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length))
  }
  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 1))

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAnexos([...anexos, ...Array.from(e.target.files)])
    }
  }

  const totalDespesas = dispDespesas
    .filter((d) => selectedDespesas.has(d.id))
    .reduce((acc, d) => acc + (d.valor_convertido || d.valor), 0)
  const totalAdiantamentos = dispAdiantamentos
    .filter((a) => selectedAdiantamentos.has(a.id))
    .reduce((acc, a) => acc + a.valor, 0)
  const saldoFinal = totalDespesas - totalAdiantamentos

  const handleSubmit = async (enviarAprovacao: boolean) => {
    if (!currentEmpresa || !user) return
    setIsSubmitting(true)
    try {
      // 1. Create Prestacao
      const prestacao = await createPrestacao({
        titulo,
        descricao,
        viagem_id: viagemId || null,
        moeda_id: moedaId,
        empresa_id: currentEmpresa.id,
        usuario_id: user.id,
        status: 'rascunho',
      })

      // 2. Link Despesas
      for (const dId of selectedDespesas) {
        await vincularDespesa(dId, prestacao.id)
      }

      // 3. Link Adiantamentos
      for (const aId of selectedAdiantamentos) {
        await vincularAdiantamento(aId, prestacao.id)
      }

      // 4. Upload Anexos
      for (const file of anexos) {
        await uploadPrestacaoAnexo(prestacao.id, file, file.name, user.id)
      }

      // 5. Send to Approval if requested
      if (enviarAprovacao) {
        await updatePrestacao(prestacao.id, {
          status: 'enviada',
          data_envio: new Date().toISOString(),
        })
        await triggerWorkflow(
          currentEmpresa.id,
          'prestacao',
          'prestacoes_contas',
          prestacao.id,
          user.id,
        )
        toast.success('Prestação enviada para aprovação!')
      } else {
        toast.success('Rascunho salvo com sucesso!')
      }

      navigate(`/prestacoes/${prestacao.id}`)
    } catch (err: any) {
      toast.error('Erro ao salvar prestação: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 animate-fade-in-up">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Relatório Comercial - Março 2024"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Viagem Associada (Opcional)</Label>
                <Combobox
                  options={viagens.map((v) => ({
                    value: v.id,
                    label: v.codigo,
                    description: v.motivo,
                  }))}
                  value={viagemId}
                  onChange={setViagemId}
                  placeholder="Selecione..."
                />
              </div>
              <div className="space-y-2">
                <Label>Moeda Base *</Label>
                <Select value={moedaId} onValueChange={setMoedaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {moedas.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.codigo} - {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes adicionais..."
                rows={3}
              />
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex justify-between items-end">
              <div>
                <h4 className="font-semibold text-lg">Selecione as Despesas</h4>
                <p className="text-sm text-muted-foreground">
                  Despesas disponíveis para prestação de contas.
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">Total Selecionado:</span>
                <div className="text-xl font-bold text-primary">
                  {totalDespesas.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: moedas.find((m) => m.id === moedaId)?.codigo || 'BRL',
                  })}
                </div>
              </div>
            </div>

            <div className="border rounded-md divide-y overflow-hidden">
              {dispDespesas.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhuma despesa pendente encontrada.
                </div>
              ) : (
                dispDespesas.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 flex items-center gap-4 hover:bg-muted/30 transition-colors"
                  >
                    <Checkbox
                      checked={selectedDespesas.has(d.id)}
                      onCheckedChange={() => toggleDespesa(d.id)}
                      id={`d-${d.id}`}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`d-${d.id}`} className="font-medium cursor-pointer">
                        {d.expand?.categoria_id?.nome}
                      </Label>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(d.data_despesa), 'dd/MM/yyyy')}{' '}
                        {d.descricao ? `- ${d.descricao}` : ''}
                      </div>
                    </div>
                    <div className="font-semibold">
                      {(d.valor_convertido || d.valor).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: d.expand?.moeda_id?.codigo || 'BRL',
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex justify-between items-end">
              <div>
                <h4 className="font-semibold text-lg">Abater Adiantamentos</h4>
                <p className="text-sm text-muted-foreground">
                  Adiantamentos recebidos e não prestados.
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">Total a Abater:</span>
                <div className="text-xl font-bold text-destructive">
                  -{' '}
                  {totalAdiantamentos.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: moedas.find((m) => m.id === moedaId)?.codigo || 'BRL',
                  })}
                </div>
              </div>
            </div>

            <div className="border rounded-md divide-y overflow-hidden">
              {dispAdiantamentos.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum adiantamento pendente.
                </div>
              ) : (
                dispAdiantamentos.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 flex items-center gap-4 hover:bg-muted/30 transition-colors"
                  >
                    <Checkbox
                      checked={selectedAdiantamentos.has(a.id)}
                      onCheckedChange={() => toggleAdiantamento(a.id)}
                      id={`a-${a.id}`}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`a-${a.id}`} className="font-medium cursor-pointer">
                        {a.justificativa}
                      </Label>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(a.created), 'dd/MM/yyyy')}
                      </div>
                    </div>
                    <div className="font-semibold text-destructive">
                      -{' '}
                      {a.valor.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: a.expand?.moeda_id?.codigo || 'BRL',
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-sm text-muted-foreground">Total Despesas</span>
                  <span className="text-2xl font-bold">
                    {totalDespesas.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: moedas.find((m) => m.id === moedaId)?.codigo || 'BRL',
                    })}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-sm text-muted-foreground">Adiantamentos</span>
                  <span className="text-2xl font-bold text-destructive">
                    -{' '}
                    {totalAdiantamentos.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: moedas.find((m) => m.id === moedaId)?.codigo || 'BRL',
                    })}
                  </span>
                </CardContent>
              </Card>
              <Card
                className={cn(
                  saldoFinal > 0
                    ? 'border-primary bg-primary/5'
                    : saldoFinal < 0
                      ? 'border-destructive bg-destructive/5'
                      : '',
                )}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-semibold">
                    {saldoFinal > 0 ? 'A Receber' : saldoFinal < 0 ? 'A Devolver' : 'Saldo Zero'}
                  </span>
                  <span
                    className={cn(
                      'text-3xl font-bold',
                      saldoFinal > 0 ? 'text-primary' : saldoFinal < 0 ? 'text-destructive' : '',
                    )}
                  >
                    {saldoFinal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: moedas.find((m) => m.id === moedaId)?.codigo || 'BRL',
                    })}
                  </span>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <Label>Anexos Adicionais</Label>
              <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors relative">
                <Input
                  type="file"
                  multiple
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileDrop}
                />
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Arraste arquivos ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDFs, Imagens (Max 5MB por arquivo)
                </p>
              </div>
              {anexos.length > 0 && (
                <div className="flex flex-col gap-2 mt-4">
                  {anexos.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 border rounded text-sm bg-background"
                    >
                      <span className="truncate max-w-[80%]">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => setAnexos(anexos.filter((_, idx) => idx !== i))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 h-full pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-headline-md">Nova Prestação de Contas</h2>
          <p className="text-body-md text-muted-foreground mt-1">
            Consolide despesas e adiantamentos em um único relatório.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between relative mb-4">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full"></div>
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((s) => (
          <div key={s.id} className="flex flex-col items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-2',
                currentStep === s.id
                  ? 'bg-background border-primary text-primary'
                  : currentStep > s.id
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-background border-muted text-muted-foreground',
              )}
            >
              {currentStep > s.id ? <Check className="w-4 h-4" /> : s.id}
            </div>
            <span
              className={cn(
                'text-xs font-medium hidden sm:block',
                currentStep >= s.id ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {s.name}
            </span>
          </div>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">{renderStepContent()}</CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? () => navigate('/prestacoes') : handlePrev}
          disabled={isSubmitting}
        >
          {currentStep === 1 ? (
            'Cancelar'
          ) : (
            <>
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </>
          )}
        </Button>

        <div className="flex gap-2">
          {currentStep === steps.length ? (
            <>
              <Button variant="outline" onClick={() => handleSubmit(false)} disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-2" /> Salvar Rascunho
              </Button>
              <Button onClick={() => handleSubmit(true)} disabled={isSubmitting}>
                <Send className="w-4 h-4 mr-2" /> Enviar para Aprovação
              </Button>
            </>
          ) : (
            <Button onClick={handleNext}>
              Próximo <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
