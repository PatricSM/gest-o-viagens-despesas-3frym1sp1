import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Trips from './pages/Trips'
import Expenses from './pages/Expenses'
import PlaceholderPage from './pages/PlaceholderPage'
import Layout from './components/Layout'
import { AuthProvider } from './hooks/use-auth'

const App = () => (
  <AuthProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/viagens" element={<Trips />} />
            <Route path="/despesas" element={<Expenses />} />
            <Route path="/adiantamentos" element={<PlaceholderPage title="Adiantamentos" />} />
            <Route path="/relatorios" element={<PlaceholderPage title="Relatórios" />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App
