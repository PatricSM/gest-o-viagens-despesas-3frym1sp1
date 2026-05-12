import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, FileText, CheckCircle2 } from 'lucide-react'
import { getViagem, getTrechos, getEstimativas, submitParaAprovacao } from '@/services/viagens'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { formatCurrency, formatDate } from '@/lib/formatters'
import pb from '@/lib/pocketbase/client'

export function Step7Review({
  viagemId,
  onNext,
  onPrev,
}: {
  viagemId: string
  onNext: () => void
  onPrev: () => void
}) {
  const { user, currentEmpresa } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [violacoes, setViolacoes] = useState<string[]>([])

  useEffect(() => {
    Promise.all([
      getViagem(viagemId),
      getTrechos(viagemId),
      getEstimativas(viagemId),
      currentEmpresa
        ? pb
            .collection('politicas')
            .getFirstListItem(`empresa_id="${currentEmpresa.id}" && active=true`)
            .catch(() => null)
        : Promise.resolve(null),
    ]).then(async ([v, trechos, ests, pol]) => {
      setData({ v, trechos, ests })

      const vls: string[] = []
      if (pol) {
        const diarias = await pb
          .collection('politica_diarias')
          .getFullList({ filter: `politica_id="${pol.id}"` })
          .catch(() => [])
        const dmax = diarias[0]?.hospedagem_max || 0
        if (dmax > 0) {
          ests.forEach((e) => {
            if (e.tipo === 'hospedagem' && (e.valor_diaria || 0) > dmax) {
              vls.push(
                `Teto de hospedagem excedido em ${e.descricao}. Máximo: ${formatCurrency(dmax)}.`,
              )
            }
          })
        }
      }
      setViolacoes(vls)
    })
  }, [viagemId, currentEmpresa])

  const handleSubmit = async () => {
    if (!user || !currentEmpresa) return
    setLoading(true)
    try {
      await submitParaAprovacao(viagemId, currentEmpresa.id, user.id)
      toast({ title: 'Sucesso!', description: 'Sua viagem foi enviada para aprovação.' })
      onNext()
    } catch (err) {
      toast({ title: 'Erro', description: 'Não foi possível enviar.', variant: 'destructive' })
      setLoading(false)
    }
  }

  if (!data)
    return <div className="p-8 text-center text-muted-foreground">Carregando resumo...</div>

  return (
    <div className="space-y-6">
      {violacoes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 text-amber-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Avisos de Política</h4>
            <ul className="text-sm list-disc pl-4 mt-1">
              {violacoes.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
            <p className="text-xs mt-2 opacity-80">Sua viagem passará por aprovação de exceção.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-muted/30 p-4 rounded-lg border">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">Geral</h4>
          <p className="text-sm font-medium mb-1">{data.v.motivo}</p>
          <div className="text-xs text-muted-foreground flex gap-4 mt-2">
            <span>Centro Custo: {data.v.expand?.centro_custo_id?.nome}</span>
            {data.v.expand?.projeto_id && <span>Projeto: {data.v.expand.projeto_id.nome}</span>}
          </div>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg border">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">
            Estimativa Total
          </h4>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(data.v.total_estimado || 0)}
          </p>
        </div>
      </div>

      <div className="bg-card p-4 rounded-lg border shadow-sm">
        <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">
          Trechos ({data.trechos.length})
        </h4>
        <div className="space-y-2">
          {data.trechos.map((t: any, i: number) => (
            <div
              key={i}
              className="flex justify-between items-center text-sm p-2 bg-muted/20 rounded"
            >
              <span>
                {t.origem} → {t.destino}
              </span>
              <span className="text-muted-foreground">{formatDate(t.data_ida)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <Button variant="ghost" onClick={onPrev} disabled={loading}>
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onNext} disabled={loading}>
            Salvar Rascunho e Sair
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="gap-2">
            <CheckCircle2 className="w-4 h-4" /> Enviar Solicitação
          </Button>
        </div>
      </div>
    </div>
  )
}
