import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Plane, Loader2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [terms, setTerms] = useState(false)
  const [loading, setLoading] = useState(false)

  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      toast({
        title: 'Link inválido',
        description: 'O link de recuperação não possui um token válido.',
        variant: 'destructive',
      })
      navigate('/login')
    }
  }, [token, navigate, toast])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== passwordConfirm) {
      toast({ title: 'Senhas não conferem', variant: 'destructive' })
      return
    }
    if (!terms) {
      toast({ title: 'Você deve aceitar os termos de uso', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm)
      toast({
        title: 'Senha redefinida',
        description: 'Sua senha foi redefinida com sucesso. Você já pode fazer login.',
      })
      navigate('/login')
    } catch (err: any) {
      const fieldErrs = extractFieldErrors(err)
      toast({
        title: 'Erro ao redefinir senha',
        description: fieldErrs?.password || err.message || 'O token pode estar expirado.',
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
          <h1 className="text-4xl font-extrabold mb-4">Nova Senha</h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Crie sua nova senha de acesso ou finalize o seu primeiro acesso à plataforma.
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
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Definir senha</h2>
            <p className="text-muted-foreground mt-2">Crie uma senha forte e segura</p>
          </div>

          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Confirmar Senha</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={terms}
                onCheckedChange={(c) => setTerms(c as boolean)}
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm leading-normal text-muted-foreground">
                Li e concordo com os Termos de Uso e a Política de Privacidade da empresa.
              </Label>
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={loading || !token}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Confirmar e acessar
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
