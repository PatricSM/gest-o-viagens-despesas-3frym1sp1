import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Send, Wallet } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Combobox } from '@/components/common/Combobox'
import { useAuth } from '@/hooks/use-auth'
import { createAdiantamento } from '@/services/adiantamentos'
import { getMoedas, getViagens } from '@/services/despesas'
import { triggerWorkflow } from '@/services/workflows'
import { toast } from 'sonner'

const formSchema = z.object({
  viagem_id: z.string().min(1, 'Selecione uma viagem associada'),
  valor: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  moeda_id: z.string().min(1, 'Moeda é obrigatória'),
  justificativa: z.string().min(10, 'Justifique detalhadamente a necessidade do adiantamento'),
  data_pagamento: z.string().min(1, 'Data prevista de uso é obrigatória'),
})

export default function NovoAdiantamento() {
  const navigate = useNavigate()
  const { user, currentEmpresa } = useAuth()

  const [moedas, setMoedas] = useState<any[]>([])
  const [viagens, setViagens] = useState<any[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      valor: 0,
      justificativa: '',
      data_pagamento: '',
    },
  })

  useEffect(() => {
    if (!currentEmpresa || !user) return
    const load = async () => {
      try {
        const [mds, viags] = await Promise.all([
          getMoedas(currentEmpresa.id),
          getViagens(currentEmpresa.id, user.id),
        ])
        setMoedas(mds)
        setViagens(viags)
        const moedaPadrao = mds.find((m) => m.padrao)
        if (moedaPadrao) form.setValue('moeda_id', moedaPadrao.id)
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [currentEmpresa, user, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentEmpresa || !user) return
    try {
      const payload = {
        ...values,
        empresa_id: currentEmpresa.id,
        usuario_id: user.id,
        status: 'solicitado',
      }

      const adiantamento = await createAdiantamento(payload)
      await triggerWorkflow(
        currentEmpresa.id,
        'adiantamento',
        'adiantamentos',
        adiantamento.id,
        user.id,
      )

      toast.success('Adiantamento solicitado com sucesso!')
      navigate('/adiantamentos')
    } catch (err: any) {
      toast.error('Erro ao solicitar adiantamento. ' + err.message)
    }
  }

  return (
    <div className="flex gap-6 h-full animate-fade-in">
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Novo Adiantamento</h1>
            <p className="text-muted-foreground mt-1">
              Solicite fundos antecipados para despesas de viagem.
            </p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" /> Informações da Solicitação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="viagem_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Viagem Associada</FormLabel>
                      <FormControl>
                        <Combobox
                          options={viagens.map((v) => ({
                            value: v.id,
                            label: v.codigo,
                            description: v.motivo,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selecione a viagem..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Solicitado</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value || ''} />
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

                <FormField
                  control={form.control}
                  name="data_pagamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Prevista para Uso</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="justificativa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Justificativa</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Explique o motivo da necessidade do adiantamento..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    className="mr-3"
                    onClick={() => navigate('/adiantamentos')}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <Send className="w-4 h-4 mr-2" /> Enviar Solicitação
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
