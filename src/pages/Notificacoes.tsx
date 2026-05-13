import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CheckCheck,
  Settings,
  Check,
  MailOpen,
  Inbox,
  FileText,
  BadgeDollarSign,
  AlertCircle,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Notificacoes() {
  const { user, currentEmpresa } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const fetchNotifications = useCallback(async () => {
    if (!user || !currentEmpresa) return
    try {
      const filters = [`user_id = "${user.id}"`, `empresa_id = "${currentEmpresa.id}"`]
      if (filter === 'unread') filters.push(`lida = false`)
      if (typeFilter !== 'all') filters.push(`tipo = "${typeFilter}"`)

      const list = await pb.collection('notificacoes').getList(1, 50, {
        filter: filters.join(' && '),
        sort: '-created',
      })
      setNotifications(list.items)
    } catch (e) {
      console.error(e)
    }
  }, [user, currentEmpresa, filter, typeFilter])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useRealtime('notificacoes', () => {
    fetchNotifications()
  })

  const markAsRead = async (id: string) => {
    try {
      await pb.collection('notificacoes').update(id, { lida: true })
      fetchNotifications()
    } catch {
      /* intentionally ignored */
    }
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.lida)
    for (const n of unread) {
      await pb.collection('notificacoes').update(n.id, { lida: true })
    }
    fetchNotifications()
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'aprovacao_pendente':
        return <FileText className="h-5 w-5 text-amber-500" />
      case 'solicitacao_aprovada':
        return <Check className="h-5 w-5 text-green-500" />
      case 'solicitacao_rejeitada':
        return <AlertCircle className="h-5 w-5 text-destructive" />
      case 'reembolso_processado':
        return <BadgeDollarSign className="h-5 w-5 text-primary" />
      case 'lembrete_prestacao_atraso':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      default:
        return <Inbox className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <div className="flex gap-6 h-full">
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe atualizações e alertas do sistema.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/perfil">
                <Settings className="mr-2 h-4 w-4" />
                Preferências
              </Link>
            </Button>
            <Button variant="secondary" onClick={markAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Marcar todas lidas
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                <MailOpen className="w-5 h-5" /> Inbox
              </CardTitle>
              <div className="flex gap-2">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[140px] bg-background">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="unread">Não lidas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Tipos</SelectItem>
                    <SelectItem value="aprovacao_pendente">Aprovações</SelectItem>
                    <SelectItem value="solicitacao_aprovada">Aprovadas</SelectItem>
                    <SelectItem value="solicitacao_rejeitada">Rejeitadas</SelectItem>
                    <SelectItem value="reembolso_processado">Reembolsos</SelectItem>
                    <SelectItem value="lembrete_prestacao_atraso">Lembretes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <Inbox className="h-12 w-12 mb-3 text-muted-foreground/50" />
                <p>Nenhuma notificação encontrada.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 flex gap-4 transition-colors hover:bg-muted/30 ${!n.lida ? 'bg-primary/5' : ''}`}
                  >
                    <div className="mt-1">{getIcon(n.tipo)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4
                            className={`font-semibold ${!n.lida ? 'text-foreground' : 'text-foreground/80'}`}
                          >
                            {n.titulo}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">{n.mensagem}</p>
                          {n.link_url && (
                            <Button variant="link" className="px-0 h-auto text-xs mt-2" asChild>
                              <Link to={n.link_url}>Ver Detalhes</Link>
                            </Button>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(n.created), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                    {!n.lida && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markAsRead(n.id)}
                        className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
