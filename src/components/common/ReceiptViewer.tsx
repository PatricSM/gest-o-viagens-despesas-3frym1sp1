import { useState } from 'react'
import { ZoomIn, ZoomOut, Maximize, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * ReceiptViewer Component
 * An embedded viewer for PDF and image files, supporting zoom capabilities for images.
 * @param url - The URL of the file to display.
 * @param isImage - Boolean indicating if the file is an image (enables zoom controls).
 */
export function ReceiptViewer({ url, isImage }: { url: string | null; isImage?: boolean }) {
  const [scale, setScale] = useState(1)

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground bg-muted/10 h-full w-full min-h-[400px] rounded-md border border-dashed">
        <FileText className="w-12 h-12 mb-3 opacity-20" />
        <p className="text-sm">Nenhum documento disponível</p>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-full w-full min-h-[400px] bg-muted/10 rounded-md border overflow-hidden">
      {isImage && (
        <div className="absolute top-2 right-2 flex gap-1 z-10 bg-background/80 p-1 rounded-md shadow-sm backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(1)}>
            <Maximize className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      )}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {isImage ? (
          <img
            src={url}
            alt="Documento"
            className="transition-transform duration-200 origin-center max-w-full"
            style={{ transform: `scale(${scale})` }}
          />
        ) : (
          <iframe
            src={url}
            className="w-full h-full min-h-[500px] border-0"
            title="Document Viewer"
          />
        )}
      </div>
    </div>
  )
}
