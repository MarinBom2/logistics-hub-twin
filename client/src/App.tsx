import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import DashboardPage from './pages/dashboard/DashboardPage'
import { CENTER_CONFIGS } from './features/twin/sim/centers'
import { ROUTES, dashboardPath } from './routes'
import { loadLoginPage } from './routeChunks'
import { AuthProvider } from './shared/auth/AuthContext'
import { AppHeader } from './shared/ui/layout/AppHeader'

const LoginPage = lazy(loadLoginPage)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppHeader />
        <Suspense fallback={<div className="page-loading" aria-busy="true" />}>
          <Routes>
            <Route path={ROUTES.SCR01_DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.SCR02_LOGIN} element={<LoginPage />} />
            <Route path="*" element={<Navigate to={dashboardPath(CENTER_CONFIGS[0].id)} replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
