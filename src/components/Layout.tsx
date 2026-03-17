import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, Heart, Map as MapIcon, Search, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Layout() {
  const location = useLocation()
  const isDetailsPage = location.pathname.startsWith('/restaurant/')

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r bg-white px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-slate-900">
            Savor<span className="text-primary">Discount</span>
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          <NavItem to="/" icon={<Home />} label="Início" />
          <NavItem to="/favorites" icon={<Heart />} label="Favoritos" />
          <NavItem to="/map" icon={<MapIcon />} label="Mapa" />
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden pb-16 md:pb-0">
        {/* Mobile Header (Hidden on details page to allow full images) */}
        {!isDetailsPage && (
          <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-white/80 px-4 py-3 backdrop-blur-md md:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-slate-900">
                Savor<span className="text-primary">Discount</span>
              </span>
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <Search className="h-5 w-5" />
            </button>
          </header>
        )}

        {/* Desktop Topbar (Search/Profile) */}
        <header className="sticky top-0 z-40 hidden h-16 items-center justify-end border-b bg-white/80 px-8 backdrop-blur-md md:flex">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar restaurantes..."
              className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </header>

        <main className="flex-1 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-white px-2 pb-safe md:hidden">
        <MobileNavItem to="/" icon={<Home />} label="Início" />
        <MobileNavItem to="/favorites" icon={<Heart />} label="Favoritos" />
        <MobileNavItem to="/map" icon={<MapIcon />} label="Mapa" />
      </nav>
    </div>
  )
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn('[&>svg]:h-5 [&>svg]:w-5', isActive ? '[&>svg]:stroke-[2.5px]' : '')}>
            {icon}
          </span>
          {label}
        </>
      )}
    </NavLink>
  )
}

function MobileNavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center gap-1 p-2 text-[10px] font-medium transition-colors',
          isActive ? 'text-primary' : 'text-slate-500',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn('[&>svg]:h-6 [&>svg]:w-6', isActive ? '[&>svg]:stroke-[2.5px]' : '')}>
            {icon}
          </span>
          {label}
        </>
      )}
    </NavLink>
  )
}
