import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, UploadCloud, FileText } from 'lucide-react'
import { getAnexos, createAnexo, deleteAnexo, ViagemAnexo } from '@/services/viagens'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'

export function Step6Attachments({
  viagemId,
  onNext,
  onPrev,
}: {
  viagemId: string
  onNext: () => void
  onPrev: () => void
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [anexos, setAnexos] = useState<ViagemAnexo[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => getAnexos(viagemId).then(setAnexos)
  useEffect(() => {
    load()
  }, [viagemId])

  const handleUpload = async (file: File) => {
    try {
      if (!user) return
      await createAnexo(viagemId, file, file.name, user.id)
      load()
      toast({ title: 'Sucesso', description: 'Arquivo enviado.' })
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao enviar arquivo.', variant: 'destructive' })
    }
  }

  const remove = async (id: string) => {
    await deleteAnexo(id)
    load()
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0])
  }

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border/60 hover:bg-muted/50'}`}
        onClick={() => fileRef.current?.click()}
      >
        <UploadCloud
          className={`w-10 h-10 mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}
        />
        <h3 className="text-sm font-semibold">Clique ou arraste arquivos aqui</h3>
        <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (máx. 5MB)</p>
        <input
          type="file"
          className="hidden"
          ref={fileRef}
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
        />
      </div>

      {anexos.length > 0 && (
        <div className="space-y-2 mt-4">
          <h4 className="text-sm font-semibold mb-3">Arquivos Anexados</h4>
          {anexos.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-card shadow-sm"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <a
                  href={pb.files.getURL(a, a.arquivo)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium hover:underline truncate"
                >
                  {a.arquivo}
                </a>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => remove(a.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onPrev}>
          Voltar
        </Button>
        <Button onClick={onNext}>Próximo</Button>
      </div>
    </div>
  )
}
