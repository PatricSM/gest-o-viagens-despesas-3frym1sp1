import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Send, FileText } from 'lucide-react'

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
import { useAuth } from '@/hooks/use-auth'
import { createPrestacao } from '@/services/prestacoes'
import { getMoedas, getViagens } from '@/services/despesas'
import { toast } from 'sonner'

const formSchema = z.object({
  titulo: z.string().min(3, 'O título é obrigatório'),
  descricao: z.string().optional(),
  viagem_id: z.string().optional(),
  moeda_id: z.string().min(1, 'A moeda é obrigatória'),
})

export default function NovaPrestacao() {
  const navigate = useNavigate()
  const { user, currentEmpresa } = useAuth()

  const [moedas, setMoedas] = useState<any[]>([])
  const [viagens, setViagens] = useState<any[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      viagem_id: '',
      moeda_id: '',
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
        status: 'rascunho',
        viagem_id: values.viagem_id || null,
      }

      const prestacao = await createPrestacao(payload)
      toast.success('Prestação de contas criada com sucesso!')
      navigate(`/prestacoes/${prestacao.id}`)
    } catch (err: any) {
      toast.error('Erro ao criar prestação. ' + err.message)
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in h-full">
      <div>
        <h2 className="text-headline-md">Nova Prestação de Contas</h2>
        <p className="text-body-md text-muted-foreground mt-1">
          Crie um novo relatório para consolidar despesas e adiantamentos.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Informações Iniciais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Viagem São Paulo - Nov/2023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="viagem_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Viagem Associada (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a viagem..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhuma</SelectItem>
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
                  name="moeda_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moeda Base</FormLabel>
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
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="Informações adicionais..."
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
                  onClick={() => navigate('/prestacoes')}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  <Send className="w-4 h-4 mr-2" /> Salvar Rascunho
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
