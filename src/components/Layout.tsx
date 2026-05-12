import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Plane,
  Receipt,
  Wallet,
  FileText,
  User,
  Bell,
  CheckSquare,
  BarChart,
  Landmark,
  History,
  Settings,
  Scale,
  Network,
  LogOut,
  Building,
  Search,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const getNavGroups = (role: string | null) => {
  const groups = [
    {
      label: 'Principal',
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: LayoutDashboard,
          roles: ['admin', 'financeiro', 'gestor', 'viajante', 'auditor'],
        },
        {
          title: 'Meu Perfil',
          url: '/perfil',
          icon: User,
          roles: ['admin', 'financeiro', 'gestor', 'viajante', 'auditor'],
        },
        {
          title: 'Notificações',
          url: '/notificacoes',
          icon: Bell,
          roles: ['admin', 'financeiro', 'gestor', 'viajante', 'auditor'],
        },
      ],
    },
    {
      label: 'Operacional',
      items: [
        { title: 'Viagens', url: '/viagens', icon: Plane, roles: ['admin', 'gestor', 'viajante'] },
        {
          title: 'Despesas',
          url: '/despesas',
          icon: Receipt,
          roles: ['admin', 'gestor', 'viajante'],
        },
        {
          title: 'Prestações de Contas',
          url: '/prestacoes',
          icon: FileText,
          roles: ['admin', 'gestor', 'viajante'],
        },
        {
          title: 'Adiantamentos',
          url: '/adiantamentos',
          icon: Wallet,
          roles: ['admin', 'gestor', 'viajante'],
        },
      ],
    },
    {
      label: 'Gestão',
      items: [
        {
          title: 'Aprovações',
          url: '/aprovacoes',
          icon: CheckSquare,
          roles: ['admin', 'gestor', 'financeiro'],
        },
        {
          title: 'Reembolsos',
          url: '/reembolsos',
          icon: Landmark,
          roles: ['admin', 'financeiro', 'auditor'],
        },
        {
          title: 'Relatórios Analíticos',
          url: '/relatorios',
          icon: BarChart,
          roles: ['admin', 'gestor', 'financeiro'],
        },
      ],
    },
    {
      label: 'Administração',
      items: [
        { title: 'Auditoria', url: '/auditoria', icon: History, roles: ['admin', 'auditor'] },
        { title: 'Cadastros', url: '/cadastros', icon: Settings, roles: ['admin'] },
        { title: 'Políticas', url: '/politica', icon: Scale, roles: ['admin'] },
        { title: 'Workflows', url: '/workflows', icon: Network, roles: ['admin'] },
        { title: 'Configurações', url: '/configuracoes', icon: Settings, roles: ['admin'] },
      ],
    },
  ]

  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => role && item.roles.includes(role)),
    }))
    .filter((g) => g.items.length > 0)
}

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, currentEmpresa, userRole, userEmpresas, switchEmpresa, signOut } = useAuth()

  const [showSwitchCompany, setShowSwitchCompany] = useState(false)

  const navGroups = getNavGroups(userRole)
  const currentNavTitle =
    navGroups
      .flatMap((g) => g.items)
      .find((i) => location.pathname === i.url || location.pathname.startsWith(i.url + '/'))
      ?.title || 'Dashboard'

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  const handleSwitchCompany = (empId: string) => {
    switchEmpresa(empId)
    setShowSwitchCompany(false)
    navigate('/dashboard')
  }

  return (
    <SidebarProvider>
      <Sidebar className="bg-surface-container-low border-r border-border/40">
        <SidebarHeader className="h-16 px-4 flex items-center border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            {currentEmpresa?.logo ? (
              <img
                src={pb.files.getURL(currentEmpresa, currentEmpresa.logo)}
                alt="Logo"
                className="w-8 h-8 object-contain rounded-md"
              />
            ) : (
              <Plane className="w-6 h-6" />
            )}
            <span className="truncate max-w-[180px]">
              {currentEmpresa?.nome_fantasia || currentEmpresa?.razao_social || 'Gestão V&D'}
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 py-4">
          {navGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={
                          location.pathname === item.url ||
                          location.pathname.startsWith(item.url + '/')
                        }
                        tooltip={item.title}
                        className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:data-[active=true]:bg-primary/90"
                      >
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="bg-background flex flex-col h-screen">
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-background border-b border-border/40 shrink-0">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="hidden md:flex items-center text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{currentNavTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden lg:flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Busca global (Cmd+K)"
                className="w-64 pl-9 bg-muted/50 border-none focus-visible:ring-1"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:bg-muted"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="w-9 h-9 cursor-pointer ring-2 ring-transparent hover:ring-primary/20 transition-all">
                  <AvatarImage
                    src={
                      user?.avatar
                        ? pb.files.getURL(user, user.avatar)
                        : `https://img.usecurling.com/ppl/thumbnail?gender=female&seed=${user?.id || 1}`
                    }
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'Usuário'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    <p className="text-xs leading-none text-primary mt-1 font-medium capitalize border border-primary/20 bg-primary/5 rounded-md px-2 py-0.5 inline-block w-fit">
                      {userRole}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/perfil" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Meu Perfil
                  </Link>
                </DropdownMenuItem>

                {userEmpresas.length > 1 && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setShowSwitchCompany(true)}
                  >
                    <Building className="mr-2 h-4 w-4" />
                    Trocar Empresa
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-muted/20 p-4 lg:p-8">
          <Outlet />
        </main>
      </SidebarInset>

      <Dialog open={showSwitchCompany} onOpenChange={setShowSwitchCompany}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Trocar de Empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {userEmpresas.map((emp) => (
              <Button
                key={emp.id}
                variant={currentEmpresa?.id === emp.empresa_id ? 'default' : 'outline'}
                className="w-full justify-start h-14"
                onClick={() => handleSwitchCompany(emp.empresa_id)}
              >
                <div className="flex items-center gap-3 w-full">
                  {emp.expand?.empresa_id?.logo ? (
                    <img
                      src={pb.files.getURL(emp.expand.empresa_id, emp.expand.empresa_id.logo)}
                      alt="Logo"
                      className="w-8 h-8 object-contain rounded-md bg-white"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-secondary/50 rounded-md flex items-center justify-center text-xs font-medium text-foreground">
                      {emp.expand?.empresa_id?.nome_fantasia?.substring(0, 2).toUpperCase() || 'EM'}
                    </div>
                  )}
                  <div className="text-left flex-1">
                    <div className="font-semibold">
                      {emp.expand?.empresa_id?.nome_fantasia ||
                        emp.expand?.empresa_id?.razao_social}
                    </div>
                    <div className="text-xs opacity-80 capitalize">{emp.role}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
