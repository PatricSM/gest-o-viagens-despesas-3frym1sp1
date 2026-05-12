import { useState, useEffect, useMemo } from 'react'
import { ListFilter } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useIsMobile } from '@/hooks/use-mobile'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

import { getPendingApprovals, getApprovalStats, processApprovalAction } from '@/services/aprovacoes'

import { ApprovalItem, ApprovalFiltersState, ModalState, isEmAtraso } from './types'
import { ApprovalStats } from './components/ApprovalStats'
import { ApprovalFilters } from './components/ApprovalFilters'
import { ApprovalList } from './components/ApprovalList'
import { ApprovalModals } from './components/ApprovalModals'

export default function Aprovacoes() {
  const { user, currentEmpresa } = useAuth()
  const { toast } = useToast()
  const isMobile = useIsMobile()

  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState<ApprovalItem[]>([])
  const [moedas, setMoedas] = useState<Record<string, string>>({})

  const [tab, setTab] = useState('viagens')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [stats, setStats] = useState({
    aprovadasMes: 0,
    tempoMedioDias: 0,
  })

  const [filters, setFilters] = useState<ApprovalFiltersState>({
    maxValue: 100000,
    requesterId: 'all',
    urgencyOnly: false,
    sortBy: 'date_asc',
  })

  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: null,
    targetId: null,
  })
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (currentEmpresa) {
      pb.collection('moedas')
        .getFullList({ filter: `empresa_id="${currentEmpresa.id}"` })
        .then((res) => {
          const m: Record<string, string> = {}
          res.forEach((x) => (m[x.id] = x.codigo))
          setMoedas(m)
        })
    }
  }, [currentEmpresa])

  useEffect(() => {
    if (user) loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const pendings = await getPendingApprovals(user.id)
      const mapped = pendings.map((item) => {
        const col = item.run.target_collection
        const t = item.target
        const u = item.run.expand?.submitted_by

        let val = 0
        if (col === 'viagens') val = t.total_estimado || 0
        if (col === 'despesas' || col === 'adiantamentos') val = t.valor || 0
        if (col === 'prestacoes_contas') val = t.saldo || t.total_despesas || 0

        const viol = t.politica_violacoes ? Object.keys(t.politica_violacoes).length > 0 : false

        return {
          id: item.step.id,
          runId: item.run.id,
          targetCollection: col,
          targetId: t.id,
          codigo: t.codigo || `REQ-${t.id.substring(0, 6).toUpperCase()}`,
          requesterName: u?.name || u?.email || 'Desconhecido',
          requesterAvatar: u?.avatar ? pb.files.getURL(u, u.avatar) : '',
          value: val,
          currencyId: t.moeda_id,
          date: item.run.submitted_at || item.run.created,
          policyViolations: viol || !!t.possivel_duplicidade,
          slaHours: item.step.expand?.etapa_id?.sla_horas || 0,
          rawTarget: t,
          rawStep: item.step,
        } as ApprovalItem
      })
      setItems(mapped)

      const statsData = await getApprovalStats(user.id)
      setStats(statsData)
    } catch (e) {
      toast({ title: 'Erro ao carregar aprovações', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const availableUsers = useMemo(() => {
    const map = new Map<string, string>()
    items.forEach((i) => {
      if (i.rawTarget.usuario_id) map.set(i.rawTarget.usuario_id, i.requesterName)
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [items])

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      viagens: 0,
      despesas: 0,
      adiantamentos: 0,
      prestacoes_contas: 0,
    }
    items.forEach((i) => (c[i.targetCollection] = (c[i.targetCollection] || 0) + 1))
    return c
  }, [items])

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (item.targetCollection !== tab) return false
        if (item.value > filters.maxValue) return false
        if (filters.requesterId !== 'all' && item.rawTarget.usuario_id !== filters.requesterId)
          return false
        if (filters.urgencyOnly && !isEmAtraso(item)) return false
        return true
      })
      .sort((a, b) => {
        if (filters.sortBy === 'date_asc')
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        if (filters.sortBy === 'date_desc')
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        if (filters.sortBy === 'value_desc') return b.value - a.value
        if (filters.sortBy === 'urgency') return (isEmAtraso(b) ? 1 : 0) - (isEmAtraso(a) ? 1 : 0)
        return 0
      })
  }, [items, tab, filters])

  const batchSummary = useMemo(() => {
    const selected = items.filter((i) => selectedIds.has(i.id))
    const count = selected.length
    const totalsByCurrency: Record<string, number> = {}
    selected.forEach((i) => {
      const curr = moedas[i.currencyId || ''] || 'BRL'
      totalsByCurrency[curr] = (totalsByCurrency[curr] || 0) + i.value
    })
    return { count, totalsByCurrency }
  }, [selectedIds, items, moedas])

  const pendentesHoje = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return items.filter((i) => new Date(i.rawStep.created) >= today).length
  }, [items])

  const emAtrasoCount = useMemo(() => items.filter((i) => isEmAtraso(i)).length, [items])

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds)
    if (checked) next.add(id)
    else next.delete(id)
    setSelectedIds(next)
  }

  const toggleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const openModal = (type: ModalState['type'], id: string) => {
    setModalState({ isOpen: true, type, targetId: id })
    setComment('')
  }

  const handleSingleAprovar = async (id: string) => {
    try {
      await processApprovalAction(id, 'aprovar')
      toast({ title: 'Solicitação aprovada com sucesso' })
      loadData()
    } catch (e) {
      toast({ title: 'Erro ao aprovar', variant: 'destructive' })
    }
  }

  const handleActionSubmit = async () => {
    if ((modalState.type === 'rejeitar' || modalState.type === 'devolver') && !comment.trim()) {
      toast({ title: 'O comentário é obrigatório', variant: 'destructive' })
      return
    }

    try {
      if (modalState.type === 'aprovar_batch') {
        await Promise.all(Array.from(selectedIds).map((id) => processApprovalAction(id, 'aprovar')))
        toast({ title: 'Itens aprovados com sucesso' })
        setSelectedIds(new Set())
      } else {
        await processApprovalAction(modalState.targetId!, modalState.type!, comment)
        toast({ title: 'Ação realizada com sucesso' })
      }
      loadData()
      setModalState({ isOpen: false, type: null, targetId: null })
    } catch (e) {
      toast({ title: 'Erro ao processar', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Central de Aprovações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie e processe as solicitações da sua equipe.
        </p>
      </div>

      <ApprovalStats
        pendentesHoje={pendentesHoje}
        emAtrasoCount={emAtrasoCount}
        aprovadasMes={stats.aprovadasMes}
        tempoMedioDias={stats.tempoMedioDias}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 shrink-0">
          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full mb-4">
                  <ListFilter className="mr-2 h-4 w-4" /> Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader className="mb-6">
                  <SheetTitle>Filtros Avançados</SheetTitle>
                </SheetHeader>
                <ApprovalFilters
                  filters={filters}
                  setFilters={setFilters}
                  availableUsers={availableUsers}
                />
              </SheetContent>
            </Sheet>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ListFilter className="h-5 w-5" /> Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ApprovalFilters
                  filters={filters}
                  setFilters={setFilters}
                  availableUsers={availableUsers}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <Tabs
            value={tab}
            onValueChange={(t) => {
              setTab(t)
              setSelectedIds(new Set())
            }}
            className="w-full"
          >
            <TabsList className="w-full justify-start overflow-x-auto h-12">
              <TabsTrigger value="viagens" className="flex-1 min-w-32">
                Viagens{' '}
                <Badge variant="secondary" className="ml-2">
                  {counts.viagens}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="despesas" className="flex-1 min-w-32">
                Despesas{' '}
                <Badge variant="secondary" className="ml-2">
                  {counts.despesas}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="adiantamentos" className="flex-1 min-w-32">
                Adiantamentos{' '}
                <Badge variant="secondary" className="ml-2">
                  {counts.adiantamentos}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="prestacoes_contas" className="flex-1 min-w-32">
                Prestações{' '}
                <Badge variant="secondary" className="ml-2">
                  {counts.prestacoes_contas}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {selectedIds.size > 0 && (
                <div className="bg-primary/10 border border-primary/20 text-primary-foreground p-3 rounded-lg flex items-center justify-between mb-4 animate-in fade-in slide-in-from-top-4">
                  <span className="text-primary font-medium">
                    {selectedIds.size} itens selecionados
                  </span>
                  <Button onClick={() => openModal('aprovar_batch', '')} size="sm">
                    Aprovar Selecionados
                  </Button>
                </div>
              )}

              <TabsContent value={tab} className="mt-0 outline-none">
                {isLoading ? (
                  <div className="py-12 text-center text-muted-foreground">
                    Carregando aprovações...
                  </div>
                ) : (
                  <ApprovalList
                    items={filteredItems}
                    selectedIds={selectedIds}
                    toggleSelect={toggleSelect}
                    toggleSelectAll={toggleSelectAll}
                    openModal={openModal}
                    handleSingleAprovar={handleSingleAprovar}
                    moedas={moedas}
                  />
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      <ApprovalModals
        modalState={modalState}
        setModalState={setModalState}
        comment={comment}
        setComment={setComment}
        handleActionSubmit={handleActionSubmit}
        batchSummary={batchSummary}
      />
    </div>
  )
}
