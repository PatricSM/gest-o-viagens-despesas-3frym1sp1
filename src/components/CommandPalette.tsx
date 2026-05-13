import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plane, Receipt, FileText, User } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useAuth } from '@/hooks/use-auth'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const { currentEmpresa, userRole } = useAuth()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{
    viagens: any[]
    despesas: any[]
    prestacoes: any[]
    users: any[]
  }>({
    viagens: [],
    despesas: [],
    prestacoes: [],
    users: [],
  })

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const fetchResults = useCallback(
    async (q: string) => {
      if (!q || q.length < 2 || !currentEmpresa) {
        setResults({ viagens: [], despesas: [], prestacoes: [], users: [] })
        return
      }

      try {
        const qLower = q.toLowerCase()
        const viagens = await pb.collection('viagens').getList(1, 5, {
          filter: `empresa_id = "${currentEmpresa.id}" && (motivo ~ "${qLower}" || codigo ~ "${qLower}")`,
        })
        const despesas = await pb.collection('despesas').getList(1, 5, {
          filter: `empresa_id = "${currentEmpresa.id}" && descricao ~ "${qLower}"`,
        })
        const prestacoes = await pb.collection('prestacoes_contas').getList(1, 5, {
          filter: `empresa_id = "${currentEmpresa.id}" && (titulo ~ "${qLower}" || codigo ~ "${qLower}")`,
        })

        let users = { items: [] as any[] }
        if (userRole === 'admin') {
          users = await pb.collection('users').getList(1, 5, {
            filter: `empresa_id = "${currentEmpresa.id}" && (name ~ "${qLower}" || email ~ "${qLower}")`,
          })
        }

        setResults({
          viagens: viagens.items,
          despesas: despesas.items,
          prestacoes: prestacoes.items,
          users: users.items,
        })
      } catch (err) {
        console.error(err)
      }
    },
    [currentEmpresa, userRole],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, fetchResults])

  const onSelect = (path: string) => {
    navigate(path)
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar viagens, despesas, etc..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        {results.viagens.length > 0 && (
          <CommandGroup heading="Viagens">
            {results.viagens.map((v) => (
              <CommandItem key={v.id} onSelect={() => onSelect(`/viagens/${v.id}`)}>
                <Plane className="mr-2 h-4 w-4" />
                <span>
                  {v.codigo ? `${v.codigo} - ` : ''}
                  {v.motivo}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.despesas.length > 0 && (
          <CommandGroup heading="Despesas">
            {results.despesas.map((d) => (
              <CommandItem key={d.id} onSelect={() => onSelect(`/despesas/${d.id}`)}>
                <Receipt className="mr-2 h-4 w-4" />
                <span>
                  Despesa {d.descricao || ''} - {d.valor}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.prestacoes.length > 0 && (
          <CommandGroup heading="Prestações de Contas">
            {results.prestacoes.map((p) => (
              <CommandItem key={p.id} onSelect={() => onSelect(`/prestacoes/${p.id}`)}>
                <FileText className="mr-2 h-4 w-4" />
                <span>
                  {p.codigo ? `${p.codigo} - ` : ''}
                  {p.titulo}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.users.length > 0 && (
          <CommandGroup heading="Usuários">
            {results.users.map((u) => (
              <CommandItem key={u.id} onSelect={() => onSelect(`/cadastros/usuarios`)}>
                <User className="mr-2 h-4 w-4" />
                <span>{u.name || u.email}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
