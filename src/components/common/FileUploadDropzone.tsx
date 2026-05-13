import { useState, useRef } from 'react'
import { UploadCloud, File as FileIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * FileUploadDropzone Component
 * Drag-and-drop file upload zone with validation and preview support.
 * @param onFileSelect - Callback returning the selected File or null if removed.
 * @param accept - Comma separated list of accepted MIME types.
 * @param maxSizeMB - Maximum allowed file size in Megabytes.
 */
export function FileUploadDropzone({
  onFileSelect,
  accept = 'image/*,application/pdf',
  maxSizeMB = 5,
}: {
  onFileSelect: (file: File | null) => void
  accept?: string
  maxSizeMB?: number
}) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setError('')
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`O arquivo excede o limite de ${maxSizeMB}MB.`)
      return
    }
    setSelectedFile(file)
    onFileSelect(file)
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors 
        ${dragActive ? 'border-primary bg-primary/5' : 'border-border'} 
        ${selectedFile ? 'bg-muted/30' : 'hover:bg-muted/10'}
      `}
      onDragOver={(e) => {
        e.preventDefault()
        setDragActive(true)
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFile(e.dataTransfer.files[0])
        }
      }}
    >
      <input
        type="file"
        accept={accept}
        className="hidden"
        ref={inputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0])
          }
        }}
      />

      {selectedFile ? (
        <div className="flex flex-col items-center gap-2">
          <FileIcon className="w-10 h-10 text-primary mb-2" />
          <span className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</span>
          <span className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedFile(null)
              onFileSelect(null)
              if (inputRef.current) inputRef.current.value = ''
            }}
            className="text-destructive mt-2 hover:bg-destructive/10"
          >
            Remover <X className="w-4 h-4 ml-1" />
          </Button>
        </div>
      ) : (
        <div
          className="flex flex-col items-center gap-2 cursor-pointer outline-none"
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="w-10 h-10 text-muted-foreground mb-2" />
          <span className="text-sm font-medium">Clique ou arraste o arquivo aqui</span>
          <span className="text-xs text-muted-foreground">
            Suporta PDF ou Imagens (Máx: {maxSizeMB}MB)
          </span>
          {error && (
            <span className="text-xs text-destructive mt-2 font-medium bg-destructive/10 px-2 py-1 rounded-md">
              {error}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
