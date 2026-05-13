import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const maskCnpj = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18)
}

const signupSchema = z.object({
  razao_social: z.string().min(1, 'Razão social é obrigatória'),
  cnpj: z.string().optional(),
  nome_fantasia: z.string().optional(),
  name_admin: z.string().min(1, 'Nome do administrador é obrigatório'),
  email_admin: z.string().email('Email inválido'),
  senha_admin: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
})

type SignupForm = z.infer<typeof signupSchema>

export default function SignupEmpresa() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      razao_social: '',
      cnpj: '',
      nome_fantasia: '',
      name_admin: '',
      email_admin: '',
      senha_admin: '',
    },
  })

  const onSubmit = async (data: SignupForm) => {
    try {
      setLoading(true)
      const res = await pb.send('/backend/v1/signup-empresa', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      pb.authStore.save(res.token, res.record)
      toast.success('Empresa registrada com sucesso!')
      navigate('/onboarding')
    } catch (err: any) {
      const fieldErrs = extractFieldErrors(err)
      if (Object.keys(fieldErrs).length > 0) {
        Object.entries(fieldErrs).forEach(([field, msg]) => {
          toast.error(`${field}: ${msg}`)
        })
      } else {
        toast.error(err.message || 'Erro ao registrar empresa')
      }
    } finally {
      setLoading(false)
    }
  }

  const { onChange: onCnpjChange, ...cnpjRest } = register('cnpj')

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-2xl shadow-lg animate-fade-in-up">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl tracking-tight">Cadastrar Empresa</CardTitle>
          <CardDescription className="text-base mt-2">
            Crie a conta corporativa e comece a gerenciar viagens e despesas em minutos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Dados da Empresa</h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="razao_social">
                    Razão Social <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="razao_social"
                    placeholder="Sua Empresa LTDA"
                    {...register('razao_social')}
                  />
                  {errors.razao_social && (
                    <p className="text-sm text-destructive">{errors.razao_social.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                  <Input
                    id="nome_fantasia"
                    placeholder="Nome Fantasia"
                    {...register('nome_fantasia')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    {...cnpjRest}
                    onChange={(e) => {
                      e.target.value = maskCnpj(e.target.value)
                      onCnpjChange(e)
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Administrador da Conta</h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name_admin">
                    Nome Completo <span className="text-destructive">*</span>
                  </Label>
                  <Input id="name_admin" placeholder="João da Silva" {...register('name_admin')} />
                  {errors.name_admin && (
                    <p className="text-sm text-destructive">{errors.name_admin.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_admin">
                    E-mail Corporativo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email_admin"
                    type="email"
                    placeholder="joao@empresa.com.br"
                    {...register('email_admin')}
                  />
                  {errors.email_admin && (
                    <p className="text-sm text-destructive">{errors.email_admin.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha_admin">
                    Senha de Acesso <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="senha_admin"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    {...register('senha_admin')}
                  />
                  {errors.senha_admin && (
                    <p className="text-sm text-destructive">{errors.senha_admin.message}</p>
                  )}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Processando Cadastro...' : 'Criar Conta e Iniciar Setup'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center bg-muted/20 border-t py-4">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Faça login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
