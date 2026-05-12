import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plane, ArrowLeft, Loader2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

export default function RecoverPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await pb.collection('users').requestPasswordReset(email)
      toast({
        title: 'Recuperação de senha',
        description: 'Se o e-mail existir, um link foi enviado para você.',
      })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao tentar recuperar a senha.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-4xl font-extrabold mb-4">Recuperar Acesso</h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Siga as instruções para recuperar a sua senha e voltar a gerenciar suas despesas.
          </p>
        </div>
        <div className="text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} Gestão V&D. Todos os direitos reservados.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          <div className="text-center md:text-left mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Recuperar senha</h2>
            <p className="text-muted-foreground mt-2">Enviaremos um link para o seu e-mail</p>
          </div>

          <form onSubmit={handleRecover} className="space-y-6">
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

            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Enviar link de recuperação
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-primary hover:underline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para o login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
