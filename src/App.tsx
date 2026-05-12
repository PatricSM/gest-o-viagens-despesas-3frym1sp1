import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import { AuthProvider } from './hooks/use-auth'
import { ProtectedRoute, RoleGuard } from './components/Guards'
import Layout from './components/Layout'

import Login from './pages/auth/Login'
import RecoverPassword from './pages/auth/RecoverPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Dashboard from './pages/Dashboard'
import Trips from './pages/Trips'
import Expenses from './pages/Expenses'
import PlaceholderPage from './pages/PlaceholderPage'
import NotFound from './pages/NotFound'

import CadastrosHub from './pages/cadastros/CadastrosHub'
import UsuariosList from './pages/cadastros/UsuariosList'
import DepartamentosList from './pages/cadastros/DepartamentosList'
import CentrosCustoList from './pages/cadastros/CentrosCustoList'
import ProjetosList from './pages/cadastros/ProjetosList'
import CategoriasList from './pages/cadastros/CategoriasList'
import FornecedoresList from './pages/cadastros/FornecedoresList'
import FiliaisList from './pages/cadastros/FiliaisList'
import MoedasList from './pages/cadastros/MoedasList'
import PoliticasList from './pages/admin/PoliticasList'
import WorkflowsList from './pages/admin/WorkflowsList'

const App = () => (
  <AuthProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/recuperar-senha" element={<RecoverPassword />} />
          <Route path="/resetar-senha" element={<ResetPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/perfil" element={<PlaceholderPage title="Meu Perfil" />} />
              <Route path="/notificacoes" element={<PlaceholderPage title="Notificações" />} />

              <Route element={<RoleGuard allowed={['viajante', 'gestor', 'admin']} />}>
                <Route path="/viagens" element={<Trips />} />
                <Route path="/despesas" element={<Expenses />} />
                <Route
                  path="/prestacoes"
                  element={<PlaceholderPage title="Prestações de Contas" />}
                />
                <Route path="/adiantamentos" element={<PlaceholderPage title="Adiantamentos" />} />
              </Route>

              <Route element={<RoleGuard allowed={['gestor', 'financeiro', 'admin']} />}>
                <Route path="/aprovacoes" element={<PlaceholderPage title="Aprovações" />} />
                <Route
                  path="/relatorios"
                  element={<PlaceholderPage title="Relatórios Analíticos" />}
                />
              </Route>

              <Route element={<RoleGuard allowed={['financeiro', 'admin']} />}>
                <Route path="/reembolsos" element={<PlaceholderPage title="Reembolsos" />} />
              </Route>

              <Route element={<RoleGuard allowed={['admin', 'auditor']} />}>
                <Route path="/auditoria" element={<PlaceholderPage title="Logs de Auditoria" />} />
                <Route path="/cadastros" element={<CadastrosHub />} />
                <Route path="/cadastros/usuarios" element={<UsuariosList />} />
                <Route path="/cadastros/departamentos" element={<DepartamentosList />} />
                <Route path="/cadastros/centros-custo" element={<CentrosCustoList />} />
                <Route path="/cadastros/projetos" element={<ProjetosList />} />
                <Route path="/cadastros/categorias" element={<CategoriasList />} />
                <Route path="/cadastros/fornecedores" element={<FornecedoresList />} />
                <Route path="/cadastros/filiais" element={<FiliaisList />} />
                <Route path="/cadastros/moedas" element={<MoedasList />} />
              </Route>

              <Route element={<RoleGuard allowed={['admin']} />}>
                <Route path="/politica" element={<PoliticasList />} />
                <Route path="/workflows" element={<WorkflowsList />} />
                <Route path="/configuracoes" element={<PlaceholderPage title="Configurações" />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App
