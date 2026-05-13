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
import ListaViagens from './pages/viagens/ListaViagens'
import NovaViagem from './pages/viagens/NovaViagem'
import DetalheViagem from './pages/viagens/DetalheViagem'
import ListaDespesas from './pages/despesas/ListaDespesas'
import NovaDespesa from './pages/despesas/NovaDespesa'
import DetalheDespesa from './pages/despesas/DetalheDespesa'
import ListaAdiantamentos from './pages/adiantamentos/ListaAdiantamentos'
import NovoAdiantamento from './pages/adiantamentos/NovoAdiantamento'
import DetalheAdiantamento from './pages/adiantamentos/DetalheAdiantamento'

import ListaPrestacoes from './pages/prestacoes/ListaPrestacoes'
import NovaPrestacao from './pages/prestacoes/NovaPrestacao'
import DetalhePrestacao from './pages/prestacoes/DetalhePrestacao'

import Aprovacoes from './pages/aprovacoes/Aprovacoes'
import Reembolsos from './pages/reembolsos/Reembolsos'
import Relatorios from './pages/relatorios/Relatorios'
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
import Auditoria from './pages/admin/Auditoria'
import AuditoriaDuplicadas from './pages/admin/AuditoriaDuplicadas'
import Configuracoes from './pages/admin/Configuracoes'
import Perfil from './pages/Perfil'
import Notificacoes from './pages/Notificacoes'

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
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/notificacoes" element={<Notificacoes />} />

              <Route element={<RoleGuard allowed={['viajante', 'gestor', 'admin']} />}>
                <Route path="/viagens" element={<ListaViagens />} />
                <Route path="/viagens/nova" element={<NovaViagem />} />
                <Route path="/viagens/:id" element={<DetalheViagem />} />
                <Route path="/despesas" element={<ListaDespesas />} />
                <Route path="/despesas/nova" element={<NovaDespesa />} />
                <Route path="/despesas/:id" element={<DetalheDespesa />} />
                <Route path="/prestacoes" element={<ListaPrestacoes />} />
                <Route path="/prestacoes/nova" element={<NovaPrestacao />} />
                <Route path="/prestacoes/:id" element={<DetalhePrestacao />} />
                <Route path="/adiantamentos" element={<ListaAdiantamentos />} />
                <Route path="/adiantamentos/novo" element={<NovoAdiantamento />} />
                <Route path="/adiantamentos/:id" element={<DetalheAdiantamento />} />
              </Route>

              <Route element={<RoleGuard allowed={['gestor', 'financeiro', 'admin']} />}>
                <Route path="/aprovacoes" element={<Aprovacoes />} />
              </Route>

              <Route element={<RoleGuard allowed={['gestor', 'financeiro', 'admin', 'auditor']} />}>
                <Route path="/relatorios" element={<Relatorios />} />
              </Route>

              <Route element={<RoleGuard allowed={['financeiro', 'admin', 'auditor']} />}>
                <Route path="/reembolsos" element={<Reembolsos />} />
              </Route>

              <Route element={<RoleGuard allowed={['admin', 'financeiro', 'auditor']} />}>
                <Route path="/auditoria-duplicadas" element={<AuditoriaDuplicadas />} />
              </Route>

              <Route element={<RoleGuard allowed={['admin', 'auditor']} />}>
                <Route path="/auditoria" element={<Auditoria />} />
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
                <Route path="/configuracoes" element={<Configuracoes />} />
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
