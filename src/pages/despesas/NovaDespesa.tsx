import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Save, Send, UploadCloud, X, FileText, Plus } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import {
  createDespesa,
  getCategorias,
  getMoedas,
  getViagens,
  getCentrosCusto,
  getFornecedores,
} from '@/services/despesas'
import { triggerWorkflow } from '@/services/workflows'
import { toast } from 'sonner'

const formSchema = z
  .object({
    data_despesa: z.string().min(1, 'Data é obrigatória'),
    categoria_id: z.string().min(1, 'Categoria é obrigatória'),
    valor: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
    moeda_id: z.string().min(1, 'Moeda é obrigatória'),
    descricao: z.string().optional(),
    viagem_id: z.string().optional(),
    fornecedor_id: z.string().optional(),
    modo_km: z.boolean().default(false),
    km_origem: z.string().optional(),
    km_destino: z.string().optional(),
    km_percorridos: z.coerce.number().optional(),
    km_valor_por_km: z.coerce.number().optional(),
    dividir_custo: z.boolean().default(false),
    splits: z
      .array(
        z.object({
          centro_custo_id: z.string().min(1, 'Centro de custo é obrigatório'),
          porcentagem: z.coerce.number().min(1).max(100),
        }),
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.dividir_custo && data.splits) {
        const total = data.splits.reduce((acc, curr) => acc + (curr.porcentagem || 0), 0)
        return total === 100
      }
      return true
    },
    {
      message: 'A soma das porcentagens deve ser exatamente 100%',
      path: ['splits'],
    },
  )

export default function NovaDespesa() {
  const navigate = useNavigate()
  const { user, currentEmpresa } = useAuth()
  const [arquivos, setArquivos] = useState<File[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [categorias, setCategorias] = useState<any[]>([])
  const [moedas, setMoedas] = useState<any[]>([])
  const [viagens, setViagens] = useState<any[]>([])
  const [centrosCusto, setCentrosCusto] = useState<any[]>([])
  const [fornecedores, setFornecedores] = useState<any[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data_despesa: new Date().toISOString().split('T')[0],
      valor: 0,
      modo_km: false,
      dividir_custo: false,
      splits: [{ centro_custo_id: '', porcentagem: 100 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'splits',
  })

  useEffect(() => {
    if (!currentEmpresa || !user) return
    const load = async () => {
      try {
        const [cats, mds, viags, ccs, forns] = await Promise.all([
          getCategorias(currentEmpresa.id),
          getMoedas(currentEmpresa.id),
          getViagens(currentEmpresa.id, user.id),
          getCentrosCusto(currentEmpresa.id),
          getFornecedores(currentEmpresa.id),
        ])
        setCategorias(cats)
        setMoedas(mds)
        setViagens(viags)
        setCentrosCusto(ccs)
        setFornecedores(forns)

        const moedaPadrao = mds.find((m) => m.padrao)
        if (moedaPadrao) form.setValue('moeda_id', moedaPadrao.id)
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [currentEmpresa, user, form])

  const modoKm = form.watch('modo_km')
  const dividirCusto = form.watch('dividir_custo')
  const kmPercorridos = form.watch('km_percorridos')
  const kmValor = form.watch('km_valor_por_km')

  useEffect(() => {
    if (modoKm && kmPercorridos && kmValor) {
      form.setValue('valor', Number((kmPercorridos * kmValor).toFixed(2)))
    }
  }, [modoKm, kmPercorridos, kmValor, form])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setArquivos([file])
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const removeFile = () => {
    setArquivos([])
    setPreviewUrl(null)
  }

  const onSubmit = async (
    values: z.infer<typeof formSchema>,
    submitType: 'rascunho' | 'em_aprovacao',
  ) => {
    if (!currentEmpresa || !user) return
    try {
      const payload: any = {
        ...values,
        empresa_id: currentEmpresa.id,
        usuario_id: user.id,
        status: submitType,
        splits: values.dividir_custo ? values.splits : null,
      }

      if (!values.viagem_id || values.viagem_id === 'none') delete payload.viagem_id
      if (!values.fornecedor_id || values.fornecedor_id === 'none') delete payload.fornecedor_id

      const novaDespesa = await createDespesa(payload, arquivos)

      if (submitType === 'em_aprovacao') {
        await triggerWorkflow(currentEmpresa.id, 'despesa', 'despesas', novaDespesa.id, user.id)
      }

      toast.success(
        submitType === 'rascunho' ? 'Rascunho salvo!' : 'Despesa enviada para aprovação!',
      )
      navigate('/despesas')
    } catch (err: any) {
      toast.error('Erro ao salvar despesa. ' + err.message)
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-headline-md">Nova Despesa</h2>
          <p className="text-body-md text-muted-foreground mt-1">
            Preencha os dados e anexe o comprovante.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={form.handleSubmit((v) => onSubmit(v, 'rascunho'))}>
            <Save className="w-4 h-4 mr-2" /> Salvar Rascunho
          </Button>
          <Button onClick={form.handleSubmit((v) => onSubmit(v, 'em_aprovacao'))}>
            <Send className="w-4 h-4 mr-2" /> Enviar para Aprovação
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        {/* Formulário */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <Form {...form}>
              <form className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="data_despesa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data da Despesa</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="categoria_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categorias.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                <div className="flex items-center gap-2">
                                  {c.cor && (
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: c.cor }}
                                    />
                                  )}
                                  {c.nome}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Detalhes da despesa..."
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Modo Quilometragem</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Calcular valor por distância percorrida.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={modoKm}
                      onCheckedChange={(val) => form.setValue('modo_km', val)}
                    />
                  </FormControl>
                </div>

                {modoKm ? (
                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
                    <FormField
                      control={form.control}
                      name="km_origem"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Origem</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="km_destino"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destino</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="km_percorridos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Km Percorridos</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} value={field.value || ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="km_valor_por_km"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor por Km</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} value={field.value || ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Total</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            disabled={modoKm}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="moeda_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moeda</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {moedas.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.codigo} - {m.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="viagem_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vincular a Viagem (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Nenhuma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {viagens.map((v) => (
                              <SelectItem key={v.id} value={v.id}>
                                {v.codigo} - {v.motivo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fornecedor_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornecedor (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Nenhum" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {fornecedores.map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Dividir Custo</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Ratear a despesa entre múltiplos centros de custo.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={dividirCusto}
                      onCheckedChange={(val) => form.setValue('dividir_custo', val)}
                    />
                  </FormControl>
                </div>

                {dividirCusto && (
                  <div className="space-y-4 p-4 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-4">
                        <FormField
                          control={form.control}
                          name={`splits.${index}.centro_custo_id`}
                          render={({ field: selectField }) => (
                            <FormItem className="flex-1">
                              {index === 0 && <FormLabel>Centro de Custo</FormLabel>}
                              <Select
                                onValueChange={selectField.onChange}
                                value={selectField.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {centrosCusto.map((cc) => (
                                    <SelectItem key={cc.id} value={cc.id}>
                                      {cc.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`splits.${index}.porcentagem`}
                          render={({ field: pctField }) => (
                            <FormItem className="w-24">
                              {index === 0 && <FormLabel>%</FormLabel>}
                              <FormControl>
                                <Input type="number" {...pctField} value={pctField.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mb-0.5 text-destructive"
                            onClick={() => remove(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {form.formState.errors.splits?.root && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.splits.root.message}
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ centro_custo_id: '', porcentagem: 0 })}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Adicionar Rateio
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Upload & Preview */}
        <div className="flex flex-col gap-6">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Comprovante</h3>
                {previewUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                  >
                    Remover
                  </Button>
                )}
              </div>

              {!previewUrl ? (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/50 transition-colors border-muted-foreground/25">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">Clique para enviar</span> ou
                      arraste o arquivo
                    </p>
                    <p className="text-xs text-muted-foreground/70">PDF, JPG, PNG (Max 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,image/jpeg,image/png"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="w-full h-[600px] border rounded-lg overflow-hidden bg-muted/10 relative flex items-center justify-center">
                  {arquivos[0].type.startsWith('image/') ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : arquivos[0].type === 'application/pdf' ? (
                    <iframe src={previewUrl} className="w-full h-full" title="PDF Preview" />
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-16 h-16 text-muted-foreground" />
                      <span className="text-sm font-medium">{arquivos[0].name}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
