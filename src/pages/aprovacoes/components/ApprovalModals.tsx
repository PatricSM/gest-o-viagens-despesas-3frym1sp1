import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { ModalState, BatchSummary, formatCurrency } from '../types'

interface ApprovalModalsProps {
  modalState: ModalState
  setModalState: (s: ModalState) => void
  comment: string
  setComment: (s: string) => void
  handleActionSubmit: () => void
  batchSummary: BatchSummary
}

export function ApprovalModals({
  modalState,
  setModalState,
  comment,
  setComment,
  handleActionSubmit,
  batchSummary,
}: ApprovalModalsProps) {
  return (
    <Dialog
      open={modalState.isOpen}
      onOpenChange={(o) => !o && setModalState({ isOpen: false, type: null, targetId: null })}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {modalState.type === 'rejeitar' && 'Rejeitar Solicitação'}
            {modalState.type === 'devolver' && 'Devolver para Correção'}
            {modalState.type === 'aprovar_batch' && 'Aprovar Selecionados'}
          </DialogTitle>
          <DialogDescription>
            {modalState.type === 'rejeitar' &&
              'Informe o motivo da rejeição (obrigatório). Esta solicitação será encerrada.'}
            {modalState.type === 'devolver' &&
              'Informe o que precisa ser corrigido (obrigatório). O solicitante poderá editar e reenviar.'}
            {modalState.type === 'aprovar_batch' &&
              'Revise os valores antes de confirmar a aprovação em lote.'}
          </DialogDescription>
        </DialogHeader>

        {modalState.type === 'aprovar_batch' ? (
          <div className="py-4">
            <p>
              Você está prestes a aprovar <strong>{batchSummary.count}</strong> itens.
            </p>
            <div className="mt-4 space-y-2 border rounded-md p-4 bg-muted/30">
              {Object.entries(batchSummary.totalsByCurrency).map(([curr, total]) => (
                <div key={curr} className="flex justify-between items-center pb-1 last:pb-0">
                  <span className="text-muted-foreground font-medium">Total em {curr}</span>
                  <span className="font-bold text-lg">{formatCurrency(total, curr)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4">
            <Textarea
              placeholder="Digite seu comentário..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setModalState({ isOpen: false, type: null, targetId: null })}
          >
            Cancelar
          </Button>
          <Button
            variant={modalState.type === 'aprovar_batch' ? 'default' : 'destructive'}
            onClick={handleActionSubmit}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
