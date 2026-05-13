import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle2,
  ChevronRight,
  Building,
  Users,
  Wallet,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const { currentEmpresa, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Skeleton className="h-[400px] w-full max-w-4xl rounded-xl" />
      </div>
    )
  }

  if (!currentEmpresa) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <p className="text-muted-foreground">Nenhuma empresa encontrada.</p>
      </div>
    )
  }

  const steps = [
    { id: 1, title: 'Perfil da Empresa', icon: Building },
    { id: 2, title: 'Usuários', icon: Users },
    { id: 3, title: 'Financeiro', icon: Wallet },
    { id: 4, title: 'Governança', icon: ShieldCheck },
  ]

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
    else navigate('/dashboard')
  }

  const handleSkip = () => {
    if (step < 4) setStep(step + 1)
    else navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen bg-muted/20 flex-col md:flex-row">
      <div className="w-full md:w-72 bg-background p-6 border-r flex flex-col gap-8 shadow-sm z-10">
        <div className="space-y-1 pt-6">
          <h2 className="font-semibold text-xl tracking-tight">Setup Inicial</h2>
          <p className="text-sm text-muted-foreground">Configure sua empresa em poucos minutos.</p>
        </div>
        <div className="flex flex-col gap-6 relative">
          <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border -z-10" />
          {steps.map((s) => {
            const Icon = s.icon
            const isActive = s.id === step
            const isCompleted = s.id < step
            return (
              <div
                key={s.id}
                className={cn(
                  'flex items-center gap-4 text-sm relative bg-background py-1',
                  isActive
                    ? 'text-primary font-medium'
                    : isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCompleted
                        ? 'border-primary bg-background text-primary'
                        : 'border-muted-foreground/30 bg-background',
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className="text-base">{s.title}</span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex-1 flex items-start justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-3xl mt-4 animate-fade-in-up">
          {step === 1 && (
            <Step1Company empresaId={currentEmpresa.id} onNext={handleNext} onSkip={handleSkip} />
          )}
          {step === 2 && (
            <Step2Users empresaId={currentEmpresa.id} onNext={handleNext} onSkip={handleSkip} />
          )}
          {step === 3 && (
            <Step3Finance empresaId={currentEmpresa.id} onNext={handleNext} onSkip={handleSkip} />
          )}
          {step === 4 && <Step4Governance onNext={handleNext} />}
        </div>
      </div>
    </div>
  )
}

function Step1Company({
  empresaId,
  onNext,
  onSkip,
}: {
  empresaId: string
  onNext: () => void
  onSkip: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    logradouro: '',
    numero: '',
    complemento: '',
    cidade: '',
    estado: '',
    cep: '',
  })

  const handleSave = async () => {
    try {
      setLoading(true)
      const endereco = JSON.stringify(formData)
      await pb.collection('empresas').update(empresaId, { endereco })
      toast.success('Perfil da empresa atualizado')
      onNext()
    } catch (error) {
      toast.error('Erro ao atualizar empresa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Endereço da Matriz</CardTitle>
        <CardDescription className="text-base">
          Adicione o endereço principal para emissão de faturamento e relatórios.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label>Logradouro</Label>
            <Input
              value={formData.logradouro}
              onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
              placeholder="Ex: Av. Paulista"
            />
          </div>
          <div className="space-y-2">
            <Label>Número</Label>
            <Input
              value={formData.numero}
              onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              placeholder="Ex: 1000"
            />
          </div>
          <div className="col-span-1 md:col-span-3 space-y-2">
            <Label>Complemento</Label>
            <Input
              value={formData.complemento}
              onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
              placeholder="Sala, Andar, Bloco..."
            />
          </div>
          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label>Cidade</Label>
            <Input
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              placeholder="São Paulo"
            />
          </div>
          <div className="space-y-2">
            <Label>UF</Label>
            <Input
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              placeholder="SP"
              maxLength={2}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-6 border-t mt-4 bg-muted/20">
        <Button variant="ghost" onClick={onSkip}>
          Pular etapa
        </Button>
        <Button onClick={handleSave} disabled={loading} size="lg">
          Salvar e Continuar <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

function Step2Users({
  empresaId,
  onNext,
  onSkip,
}: {
  empresaId: string
  onNext: () => void
  onSkip: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [formData, setFormData] = useState({ name: '', email: '', role: 'viajante' })

  const handleAdd = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Preencha nome e e-mail')
      return
    }
    try {
      setLoading(true)
      const user = await pb.collection('users').create({
        name: formData.name,
        email: formData.email,
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        role: formData.role,
        empresa_id: empresaId,
        active: true,
      })
      await pb.collection('user_empresas').create({
        user_id: user.id,
        empresa_id: empresaId,
        role: formData.role,
        active: true,
      })
      setUsers([...users, { ...user, role: formData.role }])
      setFormData({ name: '', email: '', role: 'viajante' })
      toast.success('Usuário convidado com sucesso!')
    } catch (error) {
      toast.error('Erro ao adicionar usuário. Verifique se o e-mail já existe.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Convidar Equipe</CardTitle>
        <CardDescription className="text-base">
          Adicione os primeiros viajantes e gestores da sua empresa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-3 md:items-end bg-muted/50 p-4 rounded-lg border border-dashed">
          <div className="space-y-2 flex-1">
            <Label>Nome Completo</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="João Silva"
            />
          </div>
          <div className="space-y-2 flex-1">
            <Label>E-mail</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="joao@empresa.com.br"
            />
          </div>
          <div className="space-y-2 md:w-36">
            <Label>Perfil</Label>
            <Select
              value={formData.role}
              onValueChange={(v) => setFormData({ ...formData, role: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viajante">Viajante</SelectItem>
                <SelectItem value="gestor">Gestor</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
                <SelectItem value="auditor">Auditor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={loading} className="w-full md:w-auto mt-2 md:mt-0">
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
          </Button>
        </div>

        {users.length > 0 && (
          <div className="border rounded-lg divide-y overflow-hidden shadow-sm">
            {users.map((u, i) => (
              <div key={i} className="p-3 px-4 text-sm flex justify-between items-center bg-card">
                <div>
                  <div className="font-medium text-base">{u.name}</div>
                  <div className="text-muted-foreground text-xs mt-0.5">{u.email}</div>
                </div>
                <div className="capitalize bg-secondary px-2 py-1 rounded text-secondary-foreground text-xs font-medium">
                  {u.role}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-6 border-t mt-4 bg-muted/20">
        <Button variant="ghost" onClick={onSkip}>
          Pular etapa
        </Button>
        <Button onClick={onNext} size="lg">
          Continuar <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

function Step3Finance({
  empresaId,
  onNext,
  onSkip,
}: {
  empresaId: string
  onNext: () => void
  onSkip: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [catName, setCatName] = useState('')
  const [ccNome, setCcNome] = useState('')
  const [ccCod, setCcCod] = useState('')

  const [categorias, setCategorias] = useState<any[]>([])
  const [ccs, setCcs] = useState<any[]>([])

  const addCat = async () => {
    if (!catName) return
    try {
      setLoading(true)
      const res = await pb
        .collection('categorias_despesa')
        .create({ empresa_id: empresaId, nome: catName, active: true })
      setCategorias([...categorias, res])
      setCatName('')
    } catch (e) {
      toast.error('Erro ao adicionar categoria')
    } finally {
      setLoading(false)
    }
  }

  const addCc = async () => {
    if (!ccNome || !ccCod) return
    try {
      setLoading(true)
      const res = await pb
        .collection('centros_custo')
        .create({ empresa_id: empresaId, nome: ccNome, codigo: ccCod, active: true })
      setCcs([...ccs, res])
      setCcNome('')
      setCcCod('')
    } catch (e) {
      toast.error('Erro ao adicionar centro de custo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Estrutura Financeira</CardTitle>
        <CardDescription className="text-base">
          Cadastre as principais categorias de despesa e centros de custo da empresa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Categorias de Despesa
          </h4>
          <div className="flex gap-2 max-w-md">
            <Input
              placeholder="Ex: Alimentação, Hospedagem"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCat()}
            />
            <Button onClick={addCat} disabled={loading || !catName} variant="secondary">
              Adicionar
            </Button>
          </div>
          {categorias.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categorias.map((c) => (
                <div
                  key={c.id}
                  className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-md text-sm font-medium"
                >
                  {c.nome}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Centros de Custo
          </h4>
          <div className="flex gap-2">
            <Input
              className="w-24 shrink-0"
              placeholder="Código"
              value={ccCod}
              onChange={(e) => setCcCod(e.target.value)}
            />
            <Input
              className="flex-1 max-w-sm"
              placeholder="Ex: Comercial, Operações"
              value={ccNome}
              onChange={(e) => setCcNome(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCc()}
            />
            <Button onClick={addCc} disabled={loading || !ccNome || !ccCod} variant="secondary">
              Adicionar
            </Button>
          </div>
          {ccs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ccs.map((c) => (
                <div
                  key={c.id}
                  className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-md text-sm font-medium"
                >
                  {c.codigo} - {c.nome}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-6 border-t mt-4 bg-muted/20">
        <Button variant="ghost" onClick={onSkip}>
          Pular etapa
        </Button>
        <Button onClick={onNext} size="lg">
          Continuar <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

function Step4Governance({ onNext }: { onNext: () => void }) {
  return (
    <Card className="border-none shadow-md overflow-hidden">
      <div className="bg-primary/10 h-2 w-full" />
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Tudo Pronto!</CardTitle>
        <CardDescription className="text-base">
          A base do sistema foi provisionada automaticamente para você começar agora mesmo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border p-5 bg-card flex gap-4 items-start shadow-sm">
          <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-full mt-0.5 shrink-0">
            <ShieldCheck className="w-5 h-5 text-green-700 dark:text-green-400" />
          </div>
          <div>
            <h4 className="font-semibold text-base mb-1">Política de Viagens</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Uma política padrão foi criada com regras gerais de reembolso. Você poderá
              personalizá-la e adicionar tetos por cargo ou categoria na seção de Administração.
            </p>
          </div>
        </div>
        <div className="rounded-xl border p-5 bg-card flex gap-4 items-start shadow-sm">
          <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-full mt-0.5 shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-700 dark:text-green-400" />
          </div>
          <div>
            <h4 className="font-semibold text-base mb-1">Workflows de Aprovação</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              4 fluxos de aprovação foram criados (Viagens, Despesas, Adiantamentos e Prestações de
              Conta), contendo 2 etapas padrão sequenciais: Gestor Direto e Financeiro.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-6 border-t mt-4 bg-muted/20">
        <Button onClick={onNext} size="lg">
          Acessar meu Dashboard <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
