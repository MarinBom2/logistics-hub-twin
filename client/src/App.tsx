import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/landing/LandingPage'
import { ROUTES } from './routes'
import { loadDashboardPage, loadLoginPage, loadWorkspacePage } from './routeChunks'
import { AuthProvider } from './shared/auth/AuthContext'
import { AppHeader } from './shared/ui/layout/AppHeader'
import { ScrollToHash } from './shared/ui/layout/ScrollToHash'

const DashboardPage = lazy(loadDashboardPage)
const LoginPage = lazy(loadLoginPage)
const WorkspacePage = lazy(loadWorkspacePage)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToHash />
        <AppHeader />
        <Suspense fallback={<div className="page-loading" aria-busy="true" />}>
          <Routes>
            <Route path={ROUTES.SCR00_LANDING} element={<LandingPage />} />
            <Route path={ROUTES.SCR01_DEMO} element={<DashboardPage />} />
            <Route path={ROUTES.SCR02_LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.SCR03_WORKSPACE} element={<WorkspacePage />} />
            <Route path="*" element={<Navigate to={ROUTES.SCR00_LANDING} replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
