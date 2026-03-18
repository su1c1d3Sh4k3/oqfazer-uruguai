import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  Compass,
  Heart,
  Map as MapIcon,
  Menu,
  Award,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import logoUrl from '@/assets/favicon-bnu-9afaa.jpg'

export function Layout() {
  const location = useLocation()

  const navItems = [
    { name: 'Explorar', path: '/', icon: Compass },
    { name: 'Mapa', path: '/map', icon: MapIcon },
    { name: 'Favoritos', path: '/favorites', icon: Heart },
    { name: 'Progresso', path: '/profile', icon: Award },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 overflow-hidden rounded-full shadow-sm group-hover:scale-105 transition-transform border border-border/50 bg-white shrink-0">
              <img
                src={logoUrl}
                alt="Brasileiros no Uruguai"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-none text-primary sm:text-xl tracking-tight">
                O que Fazer no Uruguai?
              </span>
              <span className="text-[0.65rem] sm:text-[0.7rem] font-semibold text-muted-foreground uppercase tracking-wider mt-1">
                por Brasileiros no Uruguai
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Button
                  key={item.path}
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  asChild
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 transition-all duration-300',
                    isActive
                      ? 'bg-secondary text-secondary-foreground shadow-sm'
                      : 'hover:bg-primary/10 hover:text-primary text-muted-foreground',
                  )}
                >
                  <Link to={item.path}>
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                </Button>
              )
            })}

            <Button
              asChild
              size="sm"
              className="ml-2 flex items-center gap-2 rounded-full px-4 transition-all duration-300 bg-primary text-white hover:bg-secondary border-b-2 border-brand-yellow shadow-sm"
            >
              <Link to="/admin">
                <ShieldCheck className="h-4 w-4 text-brand-yellow" />
                <span className="font-bold">Painel Admin</span>
              </Link>
            </Button>
          </nav>

          {/* Mobile Nav */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary hover:bg-primary/10 rounded-full"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                <SheetDescription className="sr-only">
                  Navegue pelas páginas do aplicativo
                </SheetDescription>
                <div className="flex flex-col gap-8 py-6">
                  <div className="flex items-center gap-3 px-2">
                    <div className="h-12 w-12 overflow-hidden rounded-full shadow-sm border border-border/50 bg-white shrink-0">
                      <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-lg leading-tight text-primary tracking-tight">
                        O que Fazer no Uruguai?
                      </span>
                      <span className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider mt-1">
                        por Brasileiros no Uruguai
                      </span>
                    </div>
                  </div>
                  <nav className="flex flex-col gap-2">
                    {navItems.map((item) => {
                      const Icon = item.icon
                      const isActive = location.pathname === item.path
                      return (
                        <SheetTrigger asChild key={item.path}>
                          <Button
                            variant={isActive ? 'secondary' : 'ghost'}
                            className={cn(
                              'w-full justify-start gap-3 rounded-xl h-12 transition-all',
                              isActive
                                ? 'bg-secondary text-secondary-foreground shadow-sm'
                                : 'hover:bg-primary/10 hover:text-primary text-muted-foreground',
                            )}
                            asChild
                          >
                            <Link to={item.path}>
                              <Icon className="h-5 w-5" />
                              <span className="font-medium text-base">{item.name}</span>
                            </Link>
                          </Button>
                        </SheetTrigger>
                      )
                    })}

                    <SheetTrigger asChild>
                      <Button
                        asChild
                        className="mt-2 w-full justify-start gap-3 rounded-xl h-12 transition-all bg-primary text-white hover:bg-secondary border-l-4 border-brand-yellow shadow-sm"
                      >
                        <Link to="/admin">
                          <ShieldCheck className="h-5 w-5 text-brand-yellow" />
                          <span className="font-bold text-base">Painel Admin</span>
                        </Link>
                      </Button>
                    </SheetTrigger>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full bg-slate-50/50 dark:bg-slate-900/50">
        <Outlet />
      </main>

      <footer className="border-t py-6 bg-card mt-auto">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 overflow-hidden rounded-full grayscale opacity-70 bg-white shrink-0">
                <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                © {new Date().getFullYear()} Brasileiros no Uruguai.
              </p>
            </div>
            <a
              href="https://www.brasileirosnouruguai.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-primary hover:text-secondary hover:underline transition-colors inline-flex items-center gap-1.5"
            >
              www.brasileirosnouruguai.com.br <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
            Feito com <Heart className="h-4 w-4 text-destructive fill-current animate-pulse" /> para
            a comunidade
          </div>
        </div>
      </footer>
    </div>
  )
}
