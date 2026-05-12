import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const GROUPS = [
  { label: 'Tempo', items: [{ id: 'gasto-por-periodo', name: 'Gasto por Período' }] },
  {
    label: 'Organização',
    items: [
      { id: 'gasto-por-departamento', name: 'Gasto por Departamento' },
      { id: 'gasto-por-centro-custo', name: 'Por Centro de Custo' },
      { id: 'gasto-por-projeto', name: 'Por Projeto' },
    ],
  },
  {
    label: 'Despesa',
    items: [
      { id: 'gasto-por-categoria', name: 'Por Categoria' },
      { id: 'top-fornecedores', name: 'Top Fornecedores' },
    ],
  },
  {
    label: 'Pessoas',
    items: [
      { id: 'top-viajantes', name: 'Top Viajantes' },
      { id: 'ranking-aprovadores', name: 'Ranking de Aprovadores' },
    ],
  },
  { label: 'Destino', items: [{ id: 'top-destinos', name: 'Top Destinos' }] },
  { label: 'Orçamento', items: [{ id: 'orcado-vs-realizado', name: 'Orçado x Realizado' }] },
  { label: 'Compliance', items: [{ id: 'desvios-politica', name: 'Desvios de Política' }] },
  { label: 'Pagamento', items: [{ id: 'por-forma-pagamento', name: 'Forma de Pagamento' }] },
]

export function ReportSidebar({
  active,
  onSelect,
}: {
  active: string
  onSelect: (id: string) => void
}) {
  return (
    <Card className="w-64 h-full flex flex-col shrink-0 overflow-hidden bg-background">
      <div className="p-4 border-b font-semibold bg-muted/30">Tipos de Relatório</div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {GROUPS.map((g) => (
            <div key={g.label}>
              <h4 className="px-2 pt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                {g.label}
              </h4>
              <div className="space-y-1">
                {g.items.map((item) => (
                  <Button
                    key={item.id}
                    variant={active === item.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start h-8 text-sm px-2 font-normal"
                    onClick={() => onSelect(item.id)}
                  >
                    {item.name}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )
}
