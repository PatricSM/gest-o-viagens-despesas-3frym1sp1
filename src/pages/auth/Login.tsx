import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Plane, Loader2 } from 'lucide-react'
import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

export default function Login() {
  const { signIn, selectCompany } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [empresas, setEmpresas] = useState<RecordModel[]>([])
  const [requiresSelection, setRequiresSelection] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const result = await signIn(email, password)
    setLoading(false)

    if (result.error) {
      toast({
        title: 'Falha no login',
        description: 'E-mail ou senha incorretos',
        variant: 'destructive',
      })
      return
    }

    if (result.requiresSelection && result.empresas) {
      setEmpresas(result.empresas)
      setRequiresSelection(true)
    } else {
      navigate(from, { replace: true })
    }
  }

  const handleSelectCompany = (empresaId: string) => {
    selectCompany(empresaId)
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background">
      {/* Left side - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary to-blue-900 p-12 flex-col justify-between text-primary-foreground">
        <div className="flex items-center gap-3 font-bold text-2xl">
          <Plane className="w-8 h-8" />
          <span>Gestão V&D</span>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold mb-4">Bem-vindo à Gestão Corporativa</h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Plataforma corporativa de gestão de viagens, despesas, adiantamentos e prestações de
            contas.
          </p>
        </div>
        <div className="text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} Gestão V&D. Todos os direitos reservados.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {requiresSelection ? (
            <div className="animate-fade-in-up">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  Selecionar Empresa
                </h2>
                <p className="text-muted-foreground mt-2">Escolha o contexto que deseja acessar</p>
              </div>
              <div className="space-y-4">
                {empresas.map((emp) => (
                  <Button
                    key={emp.id}
                    variant="outline"
                    className="w-full justify-start h-14 text-left"
                    onClick={() => handleSelectCompany(emp.empresa_id)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      {emp.expand?.empresa_id?.logo ? (
                        <img
                          src={pb.files.getURL(emp.expand.empresa_id, emp.expand.empresa_id.logo)}
                          alt="Logo"
                          className="w-8 h-8 object-contain rounded-md"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-secondary rounded-md flex items-center justify-center text-xs font-medium">
                          {emp.expand?.empresa_id?.nome_fantasia?.substring(0, 2).toUpperCase() ||
                            'EM'}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold">
                          {emp.expand?.empresa_id?.nome_fantasia ||
                            emp.expand?.empresa_id?.razao_social}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">{emp.role}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              <div className="text-center md:text-left mb-8">
                <div className="md:hidden flex items-center justify-center gap-3 font-bold text-2xl text-primary mb-6">
                  <Plane className="w-8 h-8" />
                  <span>Gestão V&D</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Acessar conta</h2>
                <p className="text-muted-foreground mt-2">Insira suas credenciais para continuar</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail corporativo</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu.nome@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      <Link
                        to="/recuperar-senha"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Esqueceu a senha?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Lembrar deste dispositivo
                  </Label>
                </div>

                <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Entrar
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
