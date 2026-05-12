import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Users,
  Building2,
  Wallet,
  Briefcase,
  Tags,
  ShoppingCart,
  MapPin,
  DollarSign,
} from 'lucide-react'

export default function CadastrosHub() {
  const modules = [
    {
      title: 'Usuários',
      description: 'Gestão de acessos e perfis',
      icon: Users,
      path: '/cadastros/usuarios',
    },
    {
      title: 'Departamentos',
      description: 'Estrutura hierárquica',
      icon: Building2,
      path: '/cadastros/departamentos',
    },
    {
      title: 'Centros de Custo',
      description: 'Agrupamento financeiro',
      icon: Wallet,
      path: '/cadastros/centros-custo',
    },
    {
      title: 'Projetos',
      description: 'Gestão de projetos e verbas',
      icon: Briefcase,
      path: '/cadastros/projetos',
    },
    {
      title: 'Categorias',
      description: 'Categorias de despesa',
      icon: Tags,
      path: '/cadastros/categorias',
    },
    {
      title: 'Fornecedores',
      description: 'Gestão de fornecedores',
      icon: ShoppingCart,
      path: '/cadastros/fornecedores',
    },
    {
      title: 'Filiais',
      description: 'Gestão de filiais',
      icon: MapPin,
      path: '/cadastros/filiais',
    },
    {
      title: 'Moedas',
      description: 'Moedas e cotações',
      icon: DollarSign,
      path: '/cadastros/moedas',
    },
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-headline-md">Cadastros Básicos</h1>
        <p className="text-body-sm text-muted-foreground mt-1">
          Gerencie a estrutura organizacional e operacional da empresa.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((mod) => (
          <Link key={mod.path} to={mod.path} className="block group outline-none">
            <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md cursor-pointer bg-card">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <mod.icon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-title-sm">{mod.title}</CardTitle>
                <CardDescription className="text-xs">{mod.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
