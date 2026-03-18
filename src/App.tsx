import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { FavoritesProvider } from '@/context/FavoritesContext'
import { AccessProvider } from '@/context/AccessContext'
import { GeoProvider } from '@/context/GeoContext'
import { PlacesProvider } from '@/context/PlacesContext'

import { Layout } from '@/components/Layout'
import Index from '@/pages/Index'
import PlaceDetails from '@/pages/PlaceDetails'
import Favorites from '@/pages/Favorites'
import MapView from '@/pages/MapView'
import Admin from '@/pages/Admin'
import NotFound from '@/pages/NotFound'
import Profile from '@/pages/Profile'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AccessProvider>
      <GeoProvider>
        <PlacesProvider>
          <FavoritesProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/place/:id" element={<PlaceDetails />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/map" element={<MapView />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<Admin />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </FavoritesProvider>
        </PlacesProvider>
      </GeoProvider>
    </AccessProvider>
  </BrowserRouter>
)

export default App
