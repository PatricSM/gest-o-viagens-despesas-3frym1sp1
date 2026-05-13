import { useAuth } from '@/hooks/use-auth'

export function useEmpresaSwitcher() {
  const { currentEmpresa, userEmpresas, selectCompany } = useAuth()

  const switchEmpresa = (empresaId: string) => {
    selectCompany(empresaId)
    // State Invalidation: Trigger a reload of the context/providers
    // to fetch data specific to the new company cleanly without leaks.
    window.location.href = '/dashboard'
  }

  return {
    currentEmpresa,
    userEmpresas,
    switchEmpresa,
  }
}
