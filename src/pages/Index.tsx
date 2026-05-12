import { Link } from 'react-router-dom'
import { Plus, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { ExpensesChart } from '@/components/dashboard/ExpensesChart'
import { RecentActivities } from '@/components/dashboard/RecentActivities'
import { useAuth } from '@/hooks/use-auth'

export default function Index() {
  const { user } = useAuth()
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-in-bottom">
        <div>
          <h2 className="text-display-lg text-foreground">Olá, {user?.name || 'Usuário'}</h2>
          <p className="text-body-md text-muted-foreground mt-1">
            Aqui está o resumo das suas viagens e despesas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="shadow-subtle">
            <Link to="/despesas">
              <Receipt className="w-4 h-4 mr-2" />
              Registrar Despesa
            </Link>
          </Button>
          <Button asChild className="shadow-elevation">
            <Link to="/viagens">
              <Plus className="w-4 h-4 mr-2" />
              Nova Viagem
            </Link>
          </Button>
        </div>
      </div>

      <SummaryCards />

      <div className="grid gap-6 lg:grid-cols-2">
        <ExpensesChart />
        <RecentActivities />
      </div>
    </div>
  )
}
