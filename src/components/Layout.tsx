import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, Heart, Map as MapIcon, Search, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Layout() {
  const location = useLocation()
  const isDetailsPage = location.pathname.startsWith('/place/')

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 md:flex-row">
      <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r bg-white px-4 py-6 md:flex">
        <div className="mb-8 flex items-center justify-center px-2">
          <div className="relative flex h-14 w-full items-center justify-center">
            <img
              src="/logo.png"
              alt="Brasileiros no Uruguai"
              className="h-full w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <div className="hidden flex-col justify-center text-center">
              <span className="font-display text-xl font-black leading-none tracking-tight text-secondary">
                BRASILEIROS
              </span>
              <span className="font-display text-sm font-bold leading-none tracking-widest text-primary mt-1">
                NO URUGUAI
              </span>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          <NavItem to="/" icon={<Home />} label="Início" />
          <NavItem to="/favorites" icon={<Heart />} label="Favoritos" />
          <NavItem to="/map" icon={<MapIcon />} label="Mapa" />
        </nav>

        <nav className="mt-4 flex flex-col gap-2 border-t pt-4">
          <NavItem to="/admin" icon={<Settings />} label="Admin" />
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden pb-16 md:pb-0">
        {!isDetailsPage && (
          <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md md:hidden">
            <div className="flex items-center gap-2">
              <div className="relative flex h-8 items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Brasileiros no Uruguai"
                  className="h-full w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <div className="hidden flex-col justify-center">
                  <span className="font-display text-[15px] font-black leading-none tracking-tight text-secondary">
                    BRASILEIROS
                  </span>
                  <span className="font-display text-[10px] font-bold leading-none tracking-widest text-primary mt-[2px]">
                    NO URUGUAI
                  </span>
                </div>
              </div>
            </div>
            <NavLink
              to="/admin"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"
            >
              <Settings className="h-4 w-4" />
            </NavLink>
          </header>
        )}

        <header className="sticky top-0 z-40 hidden h-16 items-center justify-end border-b bg-white/80 px-8 backdrop-blur-md md:flex">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar atividades..."
              className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </header>

        <main className="flex-1 animate-fade-in">
          <Outlet />
        </main>
      </div>

      <nav className="pb-safe fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-white px-2 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] md:hidden">
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
