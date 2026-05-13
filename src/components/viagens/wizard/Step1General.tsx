import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
import { getViagem, createViagem, updateViagem } from '@/services/viagens'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

const schema = z.object({
  motivo: z.string().min(20, 'O motivo deve ter pelo menos 20 caracteres'),
  projeto_id: z.string().optional(),
  centro_custo_id: z.string().min(1, 'Centro de custo é obrigatório'),
  departamento_id: z.string().min(1, 'Departamento é obrigatório'),
})

type FormValues = z.infer<typeof schema>

export function Step1General({
  viagemId,
  onNext,
}: {
  viagemId: string | null
  onNext: (id: string) => void
  onPrev: () => void
}) {
  const { user, currentEmpresa } = useAuth()
  const { toast } = useToast()
  const [projetos, setProjetos] = useState<any[]>([])
  const [centros, setCentros] = useState<any[]>([])
  const [departamentos, setDepartamentos] = useState<any[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      motivo: '',
      projeto_id: '',
      centro_custo_id: '',
      departamento_id: user?.departamento_id || '',
    },
  })

  useEffect(() => {
    if (!currentEmpresa) return
    pb.collection('projetos')
      .getFullList({ filter: `empresa_id="${currentEmpresa.id}"` })
      .then(setProjetos)
    pb.collection('centros_custo')
      .getFullList({ filter: `empresa_id="${currentEmpresa.id}"` })
      .then(setCentros)
    pb.collection('departamentos')
      .getFullList({ filter: `empresa_id="${currentEmpresa.id}"` })
      .then(setDepartamentos)
  }, [currentEmpresa])

  useEffect(() => {
    if (viagemId) {
      getViagem(viagemId).then((v) => {
        form.reset({
          motivo: v.motivo,
          projeto_id: v.projeto_id || '',
          centro_custo_id: v.centro_custo_id,
          departamento_id: v.departamento_id || '',
        })
      })
    }
  }, [viagemId, form])

  const onSubmit = async (data: FormValues) => {
    try {
      if (viagemId) {
        await updateViagem(viagemId, data)
        onNext(viagemId)
      } else {
        const payload = {
          ...data,
          empresa_id: currentEmpresa!.id,
          usuario_id: user!.id,
          status: 'rascunho' as const,
        }
        const res = await createViagem(payload)
        onNext(res.id)
      }
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o rascunho.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="motivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo da Viagem *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva detalhadamente o motivo comercial desta viagem..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="centro_custo_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Centro de Custo *</FormLabel>
                <FormControl>
                  <Combobox
                    options={centros.map((c) => ({
                      value: c.id,
                      label: c.nome,
                      description: c.codigo,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecione..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="departamento_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Departamento *</FormLabel>
                <FormControl>
                  <Combobox
                    options={departamentos.map((d) => ({ value: d.id, label: d.nome }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecione..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projeto_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Projeto (Opcional)</FormLabel>
                <FormControl>
                  <Combobox
                    options={projetos.map((p) => ({ value: p.id, label: p.nome }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Nenhum projeto"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit">Próximo</Button>
        </div>
      </form>
    </Form>
  )
}
