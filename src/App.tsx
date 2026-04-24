import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/context/AuthContext'
import { FavoritesProvider } from '@/context/FavoritesContext'
import { AccessProvider } from '@/context/AccessContext'
import { GeoProvider } from '@/context/GeoContext'
import { PlacesProvider } from '@/context/PlacesContext'

import { Layout } from '@/components/Layout'
import { ProximityAlerts } from '@/components/ProximityAlerts'
import Index from '@/pages/Index'
import PlaceDetails from '@/pages/PlaceDetails'
import Favorites from '@/pages/Favorites'
import MapView from '@/pages/MapView'
import Admin from '@/pages/Admin'
import EstablishmentAdmin from '@/pages/EstablishmentAdmin'
import NotFound from '@/pages/NotFound'
import Profile from '@/pages/Profile'
import UserProfile from '@/pages/UserProfile'
import Auth from '@/pages/Auth'
import ResetPassword from '@/pages/ResetPassword'
import TopRestaurants from '@/pages/TopRestaurants'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <AccessProvider>
        <GeoProvider>
          <PlacesProvider>
            <FavoritesProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <ProximityAlerts />
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/place/:id" element={<PlaceDetails />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/map" element={<MapView />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/perfil" element={<UserProfile />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/empresa" element={<EstablishmentAdmin />} />
                    <Route path="/top" element={<TopRestaurants />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </FavoritesProvider>
          </PlacesProvider>
        </GeoProvider>
      </AccessProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
