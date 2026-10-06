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
import { lazy, Suspense } from 'react'
import Index from '@/pages/Index'

// Só a home entra no bundle inicial; as demais páginas carregam sob demanda
const PlaceDetails = lazy(() => import('@/pages/PlaceDetails'))
const Favorites = lazy(() => import('@/pages/Favorites'))
const MapView = lazy(() => import('@/pages/MapView'))
const Admin = lazy(() => import('@/pages/Admin'))
const EstablishmentAdmin = lazy(() => import('@/pages/EstablishmentAdmin'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const Profile = lazy(() => import('@/pages/Profile'))
const UserProfile = lazy(() => import('@/pages/UserProfile'))
const Auth = lazy(() => import('@/pages/Auth'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const TopRestaurants = lazy(() => import('@/pages/TopRestaurants'))

const PageFallback = () => (
  <div className="flex flex-1 items-center justify-center py-20">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
  </div>
)

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
                <Suspense fallback={<PageFallback />}>
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
                </Suspense>
              </TooltipProvider>
            </FavoritesProvider>
          </PlacesProvider>
        </GeoProvider>
      </AccessProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
