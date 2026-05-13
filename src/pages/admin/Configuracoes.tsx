import { useEffect, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Building2, Palette, Globe, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Configuracoes() {
  const { currentEmpresa } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [empresa, setEmpresa] = useState<any>(currentEmpresa)
  const [moedas, setMoedas] = useState<any[]>([])

  useEffect(() => {
    if (currentEmpresa) {
      setEmpresa(currentEmpresa)
    }
    pb.collection('moedas')
      .getFullList()
      .then(setMoedas)
      .catch(() => {})
  }, [currentEmpresa])

  const [smtpConfig, setSmtpConfig] = useState(
    empresa?.smtp_config || { host: '', port: '', user: '', pass: '', from: '' },
  )
  const [endereco, setEndereco] = useState(
    empresa?.endereco || { logradouro: '', numero: '', cidade: '', estado: '', cep: '' },
  )
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const handleSave = async (data: any, isFormData = false) => {
    if (!empresa) return
    setLoading(true)
    try {
      let updated
      if (isFormData) {
        updated = await pb.collection('empresas').update(empresa.id, data)
      } else {
        updated = await pb.collection('empresas').update(empresa.id, data)
      }
      setEmpresa(updated)
      toast({ title: 'Configurações salvas com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveData = () => {
    handleSave({
      razao_social: empresa.razao_social,
      cnpj: empresa.cnpj,
      endereco: endereco,
    })
  }

  const handleSaveBranding = () => {
    const fd = new FormData()
    fd.append('cor_primaria', empresa.cor_primaria || '#000000')
    if (logoFile) fd.append('logo', logoFile)
    handleSave(fd, true)
  }

  const handleSaveLoc = () => {
    handleSave({
      fuso_horario: empresa.fuso_horario,
      idioma_padrao: empresa.idioma_padrao,
      moeda_padrao: empresa.moeda_padrao,
    })
  }

  const handleSaveSmtp = () => {
    handleSave({ smtp_config: smtpConfig })
  }

  const testSmtp = async () => {
    try {
      const res = await pb.send('/backend/v1/test-smtp', {
        method: 'POST',
        body: JSON.stringify(smtpConfig),
      })
      toast({ title: 'Sucesso', description: res.message })
    } catch (e: any) {
      toast({ title: 'Erro no SMTP', description: e.message, variant: 'destructive' })
    }
  }

  const handleSaveLgpd = () => {
    handleSave({
      dpo_nome: empresa.dpo_nome,
      dpo_email: empresa.dpo_email,
      retencao_dias: empresa.retencao_dias,
      termos_uso: empresa.termos_uso,
      politica_privacidade: empresa.politica_privacidade,
    })
  }

  if (!empresa) return null

  return (
    <div className="flex gap-6 h-full">
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações da Empresa</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie políticas, marca e integrações do tenant corporativo.
            </p>
          </div>
        </div>

        <Tabs defaultValue="dados" className="space-y-4">
          <TabsList className="bg-muted border border-border/40 w-full justify-start h-auto p-1 flex-wrap">
            <TabsTrigger value="dados" className="gap-2">
              <Building2 className="w-4 h-4" /> Dados Cadastrais
            </TabsTrigger>
            <TabsTrigger value="marca" className="gap-2">
              <Palette className="w-4 h-4" /> Branding
            </TabsTrigger>
            <TabsTrigger value="local" className="gap-2">
              <Globe className="w-4 h-4" /> Localização
            </TabsTrigger>
            <TabsTrigger value="smtp" className="gap-2">
              <Mail className="w-4 h-4" /> Servidor de E-mail
            </TabsTrigger>
            <TabsTrigger value="lgpd" className="gap-2">
              <ShieldAlert className="w-4 h-4" /> Compliance & LGPD
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Razão Social</Label>
                    <Input
                      value={empresa.razao_social}
                      onChange={(e) => setEmpresa({ ...empresa, razao_social: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input
                      value={empresa.cnpj || ''}
                      onChange={(e) => setEmpresa({ ...empresa, cnpj: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Logradouro</Label>
                    <Input
                      value={endereco?.logradouro || ''}
                      onChange={(e) => setEndereco({ ...endereco, logradouro: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número / Complemento</Label>
                    <Input
                      value={endereco?.numero || ''}
                      onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <Input
                      value={endereco?.cep || ''}
                      onChange={(e) => setEndereco({ ...endereco, cep: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={endereco?.cidade || ''}
                      onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado (UF)</Label>
                    <Input
                      value={endereco?.estado || ''}
                      onChange={(e) => setEndereco({ ...endereco, estado: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveData} disabled={loading}>
                  Salvar Dados
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="marca">
            <Card>
              <CardHeader>
                <CardTitle>Identidade Visual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32 border rounded-md flex items-center justify-center bg-white overflow-hidden">
                    {logoFile ? (
                      <img
                        src={URL.createObjectURL(logoFile)}
                        alt="Logo"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : empresa.logo ? (
                      <img
                        src={pb.files.getURL(empresa, empresa.logo)}
                        alt="Logo"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">Sem Logo</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Logotipo Institucional</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor Primária (Interface)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      className="w-16 h-10 p-1"
                      value={empresa.cor_primaria || '#000000'}
                      onChange={(e) => setEmpresa({ ...empresa, cor_primaria: e.target.value })}
                    />
                    <Input
                      type="text"
                      className="w-32 uppercase"
                      value={empresa.cor_primaria || '#000000'}
                      onChange={(e) => setEmpresa({ ...empresa, cor_primaria: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveBranding} disabled={loading}>
                  Salvar Identidade Visual
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="local">
            <Card>
              <CardHeader>
                <CardTitle>Regionalização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Fuso Horário Base</Label>
                  <Select
                    value={empresa.fuso_horario || ''}
                    onValueChange={(v) => setEmpresa({ ...empresa, fuso_horario: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">America/Sao_Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/Manaus">America/Manaus (GMT-4)</SelectItem>
                      <SelectItem value="America/Rio_Branco">America/Rio_Branco (GMT-4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Idioma Padrão</Label>
                  <Select
                    value={empresa.idioma_padrao || ''}
                    onValueChange={(v) => setEmpresa({ ...empresa, idioma_padrao: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">Inglês (US)</SelectItem>
                      <SelectItem value="es-ES">Espanhol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Moeda Padrão</Label>
                  <Select
                    value={empresa.moeda_padrao || ''}
                    onValueChange={(v) => setEmpresa({ ...empresa, moeda_padrao: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a moeda..." />
                    </SelectTrigger>
                    <SelectContent>
                      {moedas.map((m) => (
                        <SelectItem key={m.id} value={m.codigo}>
                          {m.codigo} - {m.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveLoc} disabled={loading}>
                  Salvar Localização
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="smtp">
            <Card>
              <CardHeader>
                <CardTitle>Servidor de E-mail (SMTP)</CardTitle>
                <CardDescription>
                  Para o disparo de aprovações e convites usando seu domínio próprio.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Host / Servidor SMTP</Label>
                    <Input
                      value={smtpConfig?.host || ''}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                      placeholder="smtp.sendgrid.net"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Porta</Label>
                    <Input
                      type="number"
                      value={smtpConfig?.port || ''}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                      placeholder="587"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Usuário</Label>
                    <Input
                      value={smtpConfig?.user || ''}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <Input
                      type="password"
                      value={smtpConfig?.pass || ''}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>E-mail de Origem (From)</Label>
                    <Input
                      value={smtpConfig?.from || ''}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, from: e.target.value })}
                      placeholder="no-reply@suaempresa.com.br"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button onClick={handleSaveSmtp} disabled={loading}>
                  Salvar SMTP
                </Button>
                <Button variant="outline" onClick={testSmtp}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Testar Conexão
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="lgpd">
            <Card>
              <CardHeader>
                <CardTitle>Políticas, Retenção e LGPD</CardTitle>
                <CardDescription>
                  Define regras globais de compliance, dados do encarregado de dados (DPO) e textos
                  legais.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do DPO (Encarregado de Dados)</Label>
                    <Input
                      value={empresa.dpo_nome || ''}
                      onChange={(e) => setEmpresa({ ...empresa, dpo_nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail de Contato DPO</Label>
                    <Input
                      type="email"
                      value={empresa.dpo_email || ''}
                      onChange={(e) => setEmpresa({ ...empresa, dpo_email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Dias de Retenção de Logs (Audit Trail)</Label>
                    <Input
                      type="number"
                      min="30"
                      max="3650"
                      value={empresa.retencao_dias || 365}
                      onChange={(e) =>
                        setEmpresa({ ...empresa, retencao_dias: parseInt(e.target.value, 10) })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Recomendado: mínimo 5 anos (1825 dias) para compliance fiscal.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Termos de Uso do Sistema</Label>
                    <Textarea
                      className="min-h-[150px]"
                      value={empresa.termos_uso || ''}
                      onChange={(e) => setEmpresa({ ...empresa, termos_uso: e.target.value })}
                      placeholder="Cole o texto ou HTML dos termos de uso da corporação..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Política de Privacidade</Label>
                    <Textarea
                      className="min-h-[150px]"
                      value={empresa.politica_privacidade || ''}
                      onChange={(e) =>
                        setEmpresa({ ...empresa, politica_privacidade: e.target.value })
                      }
                      placeholder="Cole o texto ou HTML da política de privacidade..."
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveLgpd} disabled={loading}>
                  Salvar Regras
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
