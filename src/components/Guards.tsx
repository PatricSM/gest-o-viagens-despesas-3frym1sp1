import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useEffect } from 'react'

export const ProtectedRoute = () => {
  const { user, currentEmpresa, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>

  if (!user || (!currentEmpresa && location.pathname !== '/selecionar-empresa')) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export const RoleGuard = ({ allowed }: { allowed: string[] }) => {
  const { userRole, loading } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!loading && userRole && !allowed.includes(userRole)) {
      // eslint-disable-next-line no-console
      console.warn(`[RoleGuard] blocked. userRole="${userRole}", allowed=[${allowed.join(', ')}]`)
      toast({
        title: 'Acesso Restrito',
        description: `Acesso restrito a ${allowed.join(', ')}`,
        variant: 'destructive',
      })
    } else if (!loading && !userRole) {
      // eslint-disable-next-line no-console
      console.warn(
        '[RoleGuard] userRole is null/undefined — verifique se o login carregou currentEmpresa + role corretamente (use-auth.tsx loadEmpresas).',
      )
    }
  }, [loading, userRole, allowed, toast])

  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>

  if (!userRole || !allowed.includes(userRole)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
