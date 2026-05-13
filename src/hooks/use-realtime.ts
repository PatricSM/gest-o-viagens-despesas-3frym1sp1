import { useEffect, useRef } from 'react'
import type { RecordModel, RecordSubscription } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'

/**
 * Hook for real-time subscriptions to a PocketBase collection.
 * Automatically applies filters for the current company and user role.
 */
export function useRealtime<TRecord extends RecordModel = RecordModel>(
  collectionName: string,
  callback: (data: RecordSubscription<TRecord>) => void,
  enabled: boolean = true,
  additionalFilter?: string,
) {
  const { currentEmpresa, user, userRole } = useAuth()
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled || !currentEmpresa) return

    let unsubscribeFn: (() => Promise<void>) | undefined
    let cancelled = false

    let baseFilter = `empresa_id = "${currentEmpresa.id}"`
    if (collectionName === 'notificacoes' && user) {
      baseFilter += ` && user_id = "${user.id}"`
    } else if (
      collectionName === 'workflow_run_steps' &&
      userRole !== 'admin' &&
      userRole !== 'auditor'
    ) {
      baseFilter += ` && aprovador_id = "${user?.id}"`
    } else if (
      userRole === 'viajante' &&
      user &&
      ['viagens', 'despesas', 'prestacoes_contas', 'adiantamentos'].includes(collectionName)
    ) {
      baseFilter += ` && usuario_id = "${user.id}"`
    }

    if (additionalFilter) {
      baseFilter = `(${baseFilter}) && (${additionalFilter})`
    }

    pb.collection<TRecord>(collectionName)
      .subscribe(
        '*',
        (e) => {
          callbackRef.current(e)
        },
        { filter: baseFilter },
      )
      .then((fn) => {
        if (cancelled) {
          fn().catch(() => {})
        } else {
          unsubscribeFn = fn
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
      if (unsubscribeFn) {
        unsubscribeFn().catch(() => {})
      }
    }
  }, [collectionName, enabled, currentEmpresa?.id, user?.id, userRole, additionalFilter])
}

export default useRealtime
