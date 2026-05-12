import { useAuth } from '@/hooks/use-auth'
import { TravelerDashboard } from '@/components/dashboard/TravelerDashboard'
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard'
import { FinanceDashboard } from '@/components/dashboard/FinanceDashboard'
import { AdminDashboard } from '@/components/dashboard/AdminDashboard'

export default function Dashboard() {
  const { user } = useAuth()

  if (!user) return null

  switch (user.role) {
    case 'admin':
    case 'auditor':
      return <AdminDashboard />
    case 'financeiro':
      return <FinanceDashboard />
    case 'gestor':
      return <ManagerDashboard />
    case 'viajante':
    default:
      return <TravelerDashboard />
  }
}
