import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import CreateCasePage from './pages/cases/CreateCasePage'
import CaseDetailPage from './pages/cases/CaseDetailPage'
import VolumesPage from './pages/cases/VolumesPage'
import DocumentsPage from './pages/cases/DocumentsPage'
import AnalysisPage from './pages/cases/AnalysisPage'
import StrategyPage from './pages/cases/StrategyPage'
import DocumentDetailPage from './pages/documents/DocumentDetailPage'

// Protected Route wrapper
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        {/* Authentication */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<div>Register Page - TODO</div>} />

        {/* Dashboard */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />

        {/* Case Management */}
        <Route path="/cases/new" element={
          <ProtectedRoute>
            <CreateCasePage />
          </ProtectedRoute>
        } />
        <Route path="/cases/:id" element={
          <ProtectedRoute>
            <CaseDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/cases/:id/volumes" element={
          <ProtectedRoute>
            <VolumesPage />
          </ProtectedRoute>
        } />
        <Route path="/cases/:id/documents" element={
          <ProtectedRoute>
            <DocumentsPage />
          </ProtectedRoute>
        } />
        <Route path="/cases/:id/analysis" element={
          <ProtectedRoute>
            <AnalysisPage />
          </ProtectedRoute>
        } />
        <Route path="/cases/:id/strategy" element={
          <ProtectedRoute>
            <StrategyPage />
          </ProtectedRoute>
        } />

        {/* Document Detail */}
        <Route path="/documents/:id" element={
          <ProtectedRoute>
            <DocumentDetailPage />
          </ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="apple-glass-card p-8 text-center">
              <h1 className="text-6xl font-semibold text-[#1d1d1f] mb-4">404</h1>
              <p className="text-[#6e6e73] mb-4">Страница не найдена</p>
              <a href="/" className="text-[#1d1d1f] hover:text-[#1d1d1f] font-medium">
                Вернуться на главную
              </a>
            </div>
          </div>
        } />
      </Routes>
    </div>
  )
}

export default App
