import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { User, Shield, CreditCard, Bell, Download, QrCode, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function Perfil() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState(user?.name || '')
  const [cpf, setCpf] = useState(user?.cpf || '')
  const [rg, setRg] = useState(user?.rg || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [banco, setBanco] = useState(user?.banco_nome || '')
  const [agencia, setAgencia] = useState(user?.banco_agencia || '')
  const [conta, setConta] = useState(user?.banco_conta || '')
  const [pix, setPix] = useState(user?.banco_chave_pix || '')

  const [prefEmail, setPrefEmail] = useState(user?.pref_email ?? true)
  const [prefPush, setPrefPush] = useState(user?.pref_push ?? true)
  const [prefInApp, setPrefInApp] = useState(user?.pref_inapp ?? true)

  const [oldPassword, setOldPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [twoFaEnabled, setTwoFaEnabled] = useState(user?.twofa_enabled || false)

  const [loading, setLoading] = useState(false)

  const handleSavePersonal = async () => {
    if (!user) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('cpf', cpf)
      formData.append('rg', rg)
      formData.append('phone', phone)
      if (avatarFile) formData.append('avatar', avatarFile)

      await pb.collection('users').update(user.id, formData)
      toast({ title: 'Perfil atualizado com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar perfil', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBank = async () => {
    if (!user) return
    setLoading(true)
    try {
      await pb.collection('users').update(user.id, {
        banco_nome: banco,
        banco_agencia: agencia,
        banco_conta: conta,
        banco_chave_pix: pix,
      })
      toast({ title: 'Dados bancários atualizados!' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSavePrefs = async () => {
    if (!user) return
    setLoading(true)
    try {
      await pb.collection('users').update(user.id, {
        pref_email: prefEmail,
        pref_push: prefPush,
        pref_inapp: prefInApp,
      })
      toast({ title: 'Preferências salvas!' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSavePassword = async () => {
    if (!user) return
    setLoading(true)
    try {
      await pb.collection('users').update(user.id, {
        oldPassword,
        password,
        passwordConfirm,
      })
      toast({ title: 'Senha alterada com sucesso!' })
      setOldPassword('')
      setPassword('')
      setPasswordConfirm('')
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggle2FA = () => {
    setTwoFaEnabled(!twoFaEnabled)
    toast({ title: twoFaEnabled ? '2FA desativado' : '2FA ativado (Mock)' })
  }

  const handleExportData = async () => {
    try {
      const res = await pb.send('/backend/v1/export-lgpd', { method: 'POST' })
      toast({ title: 'Exportação iniciada', description: res.message })
    } catch (err: any) {
      toast({ title: 'Erro na exportação', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="flex gap-6 h-full">
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas informações pessoais, bancárias e de segurança.
            </p>
          </div>
        </div>

        <Tabs defaultValue="pessoal" className="space-y-4">
          <TabsList className="bg-surface-container-low border border-outline-variant/40 w-full justify-start h-auto p-1 flex-wrap">
            <TabsTrigger value="pessoal" className="gap-2">
              <User className="w-4 h-4" /> Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="banco" className="gap-2">
              <CreditCard className="w-4 h-4" /> Bancário
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="gap-2">
              <Bell className="w-4 h-4" /> Notificações
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="gap-2">
              <Shield className="w-4 h-4" /> Segurança
            </TabsTrigger>
            <TabsTrigger value="lgpd" className="gap-2">
              <Download className="w-4 h-4" /> LGPD
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pessoal">
            <Card className="bg-surface-container-lowest border-outline-variant">
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Estes dados serão usados em suas viagens e prestações de contas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="w-24 h-24 ring-2 ring-muted">
                    <AvatarImage
                      src={
                        avatarFile
                          ? URL.createObjectURL(avatarFile)
                          : user?.avatar
                            ? pb.files.getURL(user, user.avatar)
                            : `https://img.usecurling.com/ppl/large?seed=${user?.id || 1}`
                      }
                    />
                    <AvatarFallback className="text-2xl">
                      {user?.name?.substring(0, 2) || 'US'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Label htmlFor="avatar-upload">Alterar Foto</Label>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-muted-foreground">JPG, GIF ou PNG. Max 5MB.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail (Não editável)</Label>
                    <Input value={user?.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input value={cpf} onChange={(e) => setCpf(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>RG</Label>
                    <Input value={rg} onChange={(e) => setRg(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSavePersonal} disabled={loading}>
                  Salvar Alterações
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="banco">
            <Card className="bg-surface-container-lowest border-outline-variant">
              <CardHeader>
                <CardTitle>Dados Bancários</CardTitle>
                <CardDescription>
                  Onde você receberá seus adiantamentos e reembolsos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Banco / Código</Label>
                    <Input
                      value={banco}
                      onChange={(e) => setBanco(e.target.value)}
                      placeholder="Ex: 341 - Itaú"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Chave PIX</Label>
                    <Input
                      value={pix}
                      onChange={(e) => setPix(e.target.value)}
                      placeholder="E-mail, CPF ou Celular"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Agência (sem dígito)</Label>
                    <Input value={agencia} onChange={(e) => setAgencia(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Conta com dígito</Label>
                    <Input
                      value={conta}
                      onChange={(e) => setConta(e.target.value)}
                      placeholder="Ex: 12345-6"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveBank} disabled={loading}>
                  Salvar Dados Bancários
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notificacoes">
            <Card className="bg-surface-container-lowest border-outline-variant">
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>
                  Escolha como deseja ser avisado sobre o andamento das suas solicitações.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-4 border border-outline-variant rounded-lg p-4 bg-surface-container-low">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-sm">Notificações no App</p>
                    <p className="text-sm text-muted-foreground">
                      Alertas dentro do sistema pelo ícone do sino.
                    </p>
                  </div>
                  <Switch checked={prefInApp} onCheckedChange={setPrefInApp} />
                </div>
                <div className="flex items-center justify-between space-x-4 border border-outline-variant rounded-lg p-4 bg-surface-container-low">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-sm">E-mails</p>
                    <p className="text-sm text-muted-foreground">
                      Envio diário de resumos e aprovações importantes.
                    </p>
                  </div>
                  <Switch checked={prefEmail} onCheckedChange={setPrefEmail} />
                </div>
                <div className="flex items-center justify-between space-x-4 border border-outline-variant rounded-lg p-4 bg-surface-container-low">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-sm">Notificações Push / Celular</p>
                    <p className="text-sm text-muted-foreground">
                      Avisos urgentes diretamente no seu dispositivo.
                    </p>
                  </div>
                  <Switch checked={prefPush} onCheckedChange={setPrefPush} />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSavePrefs} disabled={loading}>
                  Salvar Preferências
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="seguranca">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-surface-container-lowest border-outline-variant">
                <CardHeader>
                  <CardTitle>Alterar Senha</CardTitle>
                  <CardDescription>Atualize sua senha de acesso regularmente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Senha Atual</Label>
                    <Input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nova Senha</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar Nova Senha</Label>
                    <Input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSavePassword} disabled={loading || !password}>
                    Atualizar Senha
                  </Button>
                </CardFooter>
              </Card>

              <div className="space-y-6">
                <Card className="bg-surface-container-lowest border-outline-variant">
                  <CardHeader>
                    <CardTitle>Autenticação em Dois Fatores (2FA)</CardTitle>
                    <CardDescription>
                      Adicione uma camada extra de segurança usando um app autenticador.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {twoFaEnabled ? (
                      <div className="flex flex-col items-center p-4 border rounded-md border-green-500/30 bg-green-500/5">
                        <Shield className="h-8 w-8 text-green-600 mb-2" />
                        <p className="font-medium text-green-700">2FA Ativado</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center p-4 border rounded-md bg-surface-container border-dashed border-outline-variant">
                        <QrCode className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-center text-muted-foreground">
                          Desativado no momento. Escaneie um QR code para habilitar.
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant={twoFaEnabled ? 'destructive' : 'default'}
                      className="w-full"
                      onClick={handleToggle2FA}
                    >
                      {twoFaEnabled ? 'Desativar 2FA' : 'Configurar 2FA'}
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-surface-container-lowest border-outline-variant">
                  <CardHeader>
                    <CardTitle>Sessões Ativas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-outline-variant rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Navegador Atual (MacOS / Chrome)</p>
                        <p className="text-xs text-green-600 mt-0.5">Ativa agora • São Paulo, BR</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-outline-variant rounded-lg bg-surface-container-low">
                      <div>
                        <p className="font-medium text-sm">Dispositivo Móvel (iOS / Safari)</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Último acesso há 2 dias • RJ, BR
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="lgpd">
            <Card className="bg-surface-container-lowest border-outline-variant">
              <CardHeader>
                <CardTitle>Privacidade e Exportação de Dados (LGPD)</CardTitle>
                <CardDescription>
                  De acordo com a Lei Geral de Proteção de Dados, você tem o direito de baixar uma
                  cópia de tudo o que temos sobre você.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-outline-variant rounded-lg bg-surface-container-low">
                  <h4 className="font-medium text-sm">O que será exportado?</h4>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside ml-4">
                    <li>Dados cadastrais e bancários</li>
                    <li>Histórico completo de viagens e despesas</li>
                    <li>Comprovantes e recibos em anexo</li>
                    <li>Logs de auditoria associados à sua conta</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleExportData}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Meus Dados (.ZIP)
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
