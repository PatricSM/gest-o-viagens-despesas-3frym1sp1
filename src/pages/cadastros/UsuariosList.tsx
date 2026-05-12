import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { PageLayout } from '@/components/cadastros/PageLayout'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Plus, Upload, Check, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import useRealtime from '@/hooks/use-realtime'

export default function UsuariosList() {
  const { currentEmpresa, userRole } = useAuth()
  const isReadOnly = userRole === 'auditor'

  const [items, setItems] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const [depts, setDepts] = useState<any[]>([])
  const [costCenters, setCostCenters] = useState<any[]>([])
  const [managers, setManagers] = useState<any[]>([])

  const load = async () => {
    if (!currentEmpresa) return
    let filter = `empresa_id = "${currentEmpresa.id}"`
    if (search) filter += ` && (name ~ "${search}" || email ~ "${search}")`
    if (roleFilter !== 'all') filter += ` && role = "${roleFilter}"`
    try {
      const res = await pb
        .collection('users')
        .getList(page, 20, { filter, expand: 'departamento_id' })
      setItems(res.items)
      setTotalPages(res.totalPages)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    load()
  }, [currentEmpresa, page, search, roleFilter])
  useRealtime('users', load)

  useEffect(() => {
    if (!currentEmpresa) return
    Promise.all([
      pb.collection('departamentos').getFullList({ filter: `empresa_id="${currentEmpresa.id}"` }),
      pb.collection('centros_custo').getFullList({ filter: `empresa_id="${currentEmpresa.id}"` }),
      pb
        .collection('users')
        .getFullList({ filter: `empresa_id="${currentEmpresa.id}" && role="gestor"` }),
    ]).then(([d, c, m]) => {
      setDepts(d)
      setCostCenters(c)
      setManagers(m)
    })
  }, [currentEmpresa])

  const handleResetPassword = async (email: string) => {
    try {
      await pb.collection('users').requestPasswordReset(email)
      toast({ title: 'Email de reset enviado' })
    } catch (e) {
      toast({ title: 'Erro ao resetar senha', variant: 'destructive' })
    }
  }

  const handleToggleActive = async (user: any) => {
    try {
      await pb.collection('users').update(user.id, { active: !user.active })
      toast({ title: 'Status atualizado' })
    } catch (e) {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())
    data.empresa_id = currentEmpresa?.id
    data.active = formData.get('active') === 'on'
    try {
      if (editing) {
        await pb.collection('users').update(editing.id, data)
      } else {
        const pass = Math.random().toString(36).slice(-8)
        await pb
          .collection('users')
          .create({ ...data, password: pass, passwordConfirm: pass, emailVisibility: true })
        await pb.collection('users').requestPasswordReset(data.email as string)
      }
      setOpen(false)
      toast({ title: 'Salvo com sucesso' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <PageLayout
      title="Usuários"
      description="Gerencie os acessos e perfis da sua empresa."
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
      onSearch={setSearch}
      filters={
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40 bg-background">
            <SelectValue placeholder="Papel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="financeiro">Financeiro</SelectItem>
            <SelectItem value="gestor">Gestor</SelectItem>
            <SelectItem value="viajante">Viajante</SelectItem>
            <SelectItem value="auditor">Auditor</SelectItem>
          </SelectContent>
        </Select>
      }
      action={
        !isReadOnly && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast({ title: 'Em breve' })}>
              <Upload className="w-4 h-4 mr-2" /> Importar
            </Button>
            <Button
              onClick={() => {
                setEditing(null)
                setOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Novo Usuário
            </Button>
          </div>
        )
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Depto</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell className="capitalize">{u.role}</TableCell>
              <TableCell>{u.expand?.departamento_id?.nome || '-'}</TableCell>
              <TableCell>
                {u.active ? (
                  <Check className="text-green-500 w-4 h-4" />
                ) : (
                  <X className="text-red-500 w-4 h-4" />
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!isReadOnly && (
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(u)
                          setOpen(true)
                        }}
                      >
                        Editar
                      </DropdownMenuItem>
                    )}
                    {!isReadOnly && (
                      <DropdownMenuItem onClick={() => handleResetPassword(u.email)}>
                        Resetar Senha
                      </DropdownMenuItem>
                    )}
                    {!isReadOnly && (
                      <DropdownMenuItem onClick={() => handleToggleActive(u)}>
                        {u.active ? 'Desativar' : 'Ativar'}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input name="name" defaultValue={editing?.name} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" name="email" defaultValue={editing?.email} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CPF</label>
              <Input name="cpf" defaultValue={editing?.cpf} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">RG</label>
              <Input name="rg" defaultValue={editing?.rg} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <Input name="phone" defaultValue={editing?.phone} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Papel</label>
              <select
                name="role"
                defaultValue={editing?.role || 'viajante'}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="admin">Admin</option>
                <option value="financeiro">Financeiro</option>
                <option value="gestor">Gestor</option>
                <option value="viajante">Viajante</option>
                <option value="auditor">Auditor</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-2 text-sm font-semibold mt-4 border-b pb-2">
              Organização
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Departamento</label>
              <select
                name="departamento_id"
                defaultValue={editing?.departamento_id}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione...</option>
                {depts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Centro de Custo</label>
              <select
                name="centro_custo_id"
                defaultValue={editing?.centro_custo_id}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione...</option>
                {costCenters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Gestor Direto</label>
              <select
                name="gestor_id"
                defaultValue={editing?.gestor_id}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione...</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1 md:col-span-2 text-sm font-semibold mt-4 border-b pb-2">
              Dados Bancários
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Banco</label>
              <Input name="banco_nome" defaultValue={editing?.banco_nome} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Agência</label>
              <Input name="banco_agencia" defaultValue={editing?.banco_agencia} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Conta</label>
              <Input name="banco_conta" defaultValue={editing?.banco_conta} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Chave PIX</label>
              <Input name="banco_chave_pix" defaultValue={editing?.banco_chave_pix} />
            </div>

            <div className="col-span-1 md:col-span-2 flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="active"
                name="active"
                defaultChecked={editing ? editing.active : true}
                className="w-4 h-4 rounded border-input"
              />
              <label htmlFor="active" className="text-sm">
                Usuário Ativo
              </label>
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
