import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-slide-in-bottom">
      <h2 className="text-display-lg text-foreground mb-4">{title}</h2>
      <p className="text-body-md text-muted-foreground max-w-md mb-8">
        Esta seção está em desenvolvimento. Em breve você poderá acessar as funcionalidades
        completas de {title.toLowerCase()}.
      </p>
      <Button asChild>
        <Link to="/">Voltar ao Início</Link>
      </Button>
    </div>
  )
}
