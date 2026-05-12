import { Link, Outlet, useLocation } from 'react-router-dom'
import { Plane, Receipt, Wallet, FileText, Home, Bell } from 'lucide-react'
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
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  { title: 'Início', url: '/', icon: Home },
  { title: 'Viagens', url: '/viagens', icon: Plane },
  { title: 'Despesas', url: '/despesas', icon: Receipt },
  { title: 'Adiantamentos', url: '/adiantamentos', icon: Wallet },
  { title: 'Relatórios', url: '/relatorios', icon: FileText },
]

export default function Layout() {
  const location = useLocation()
  const currentNav = NAV_ITEMS.find((item) => item.url === location.pathname) || NAV_ITEMS[0]

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="h-16 px-4 flex items-center border-b">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <Plane className="w-6 h-6" />
            <span>Gestão V&D</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 py-4">
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.url}
                  tooltip={item.title}
                >
                  <Link to={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="h-16 flex items-center justify-between px-6 bg-background border-b border-border/40 shrink-0">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-title-sm font-semibold sm:text-headline-md">{currentNav.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-transparent hover:ring-primary transition-all">
              <AvatarImage src="https://img.usecurling.com/ppl/thumbnail?gender=female&seed=1" />
              <AvatarFallback>US</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto bg-secondary/30">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
