import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

interface AuthContextType {
  user: RecordModel | null
  currentEmpresa: RecordModel | null
  userRole: string | null
  userEmpresas: RecordModel[]
  switchEmpresa: (empresaId: string) => void
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error?: any; requiresSelection?: boolean; empresas?: RecordModel[] }>
  selectCompany: (empresaId: string) => void
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<RecordModel | null>(pb.authStore.record)
  const [userEmpresas, setUserEmpresas] = useState<RecordModel[]>([])
  const [currentEmpresa, setCurrentEmpresa] = useState<RecordModel | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadEmpresas = async (userId: string) => {
    try {
      const records = await pb.collection('user_empresas').getFullList({
        filter: `user_id = "${userId}" && active = true`,
        expand: 'empresa_id',
      })
      setUserEmpresas(records)

      const savedEmpresaId = localStorage.getItem('currentEmpresaId')
      let activeRecord = records.find((r) => r.empresa_id === savedEmpresaId)

      if (!activeRecord && records.length > 0) {
        activeRecord = records[0]
        localStorage.setItem('currentEmpresaId', activeRecord.empresa_id)
      }

      if (activeRecord && activeRecord.expand?.empresa_id) {
        setCurrentEmpresa(activeRecord.expand.empresa_id)
        setUserRole(activeRecord.role)
      } else {
        setCurrentEmpresa(null)
        setUserRole(null)
      }
    } catch (e) {
      console.error('Error loading companies', e)
    }
  }

  useEffect(() => {
    if (user) {
      loadEmpresas(user.id).finally(() => setLoading(false))
    } else {
      setUserEmpresas([])
      setCurrentEmpresa(null)
      setUserRole(null)
      setLoading(false)
    }

    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record)
      if (record) {
        setLoading(true)
        loadEmpresas(record.id).finally(() => setLoading(false))
      } else {
        setUserEmpresas([])
        setCurrentEmpresa(null)
        setUserRole(null)
        localStorage.removeItem('currentEmpresaId')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [user])

  const signIn = async (email: string, password: string) => {
    try {
      await pb.collection('users').authWithPassword(email, password)

      const records = await pb.collection('user_empresas').getFullList({
        filter: `user_id = "${pb.authStore.record?.id}" && active = true`,
        expand: 'empresa_id',
      })

      if (records.length > 1) {
        return { requiresSelection: true, empresas: records }
      } else if (records.length === 1) {
        localStorage.setItem('currentEmpresaId', records[0].empresa_id)
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const selectCompany = (empresaId: string) => {
    localStorage.setItem('currentEmpresaId', empresaId)
    const activeRecord = userEmpresas.find((r) => r.empresa_id === empresaId)
    if (activeRecord && activeRecord.expand?.empresa_id) {
      setCurrentEmpresa(activeRecord.expand.empresa_id)
      setUserRole(activeRecord.role)
    }
  }

  const switchEmpresa = (empresaId: string) => {
    selectCompany(empresaId)
  }

  const signOut = () => {
    pb.authStore.clear()
    localStorage.removeItem('currentEmpresaId')
    setUser(null)
    setUserEmpresas([])
    setCurrentEmpresa(null)
    setUserRole(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        currentEmpresa,
        userRole,
        userEmpresas,
        switchEmpresa,
        selectCompany,
        signIn,
        signOut,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
