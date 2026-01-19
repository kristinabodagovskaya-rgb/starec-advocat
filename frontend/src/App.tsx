import { Routes, Route } from 'react-router-dom'

// TODO: Import pages when created
// import LoginPage from './pages/auth/LoginPage'
// import DashboardPage from './pages/dashboard/DashboardPage'
// import CaseDetailPage from './pages/cases/CaseDetailPage'
// etc...

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Authentication */}
        <Route path="/login" element={<div>Login Page - TODO</div>} />
        <Route path="/register" element={<div>Register Page - TODO</div>} />

        {/* Dashboard */}
        <Route path="/" element={<div>Dashboard - TODO</div>} />

        {/* Case Management */}
        <Route path="/cases/:id" element={<div>Case Detail - TODO</div>} />
        <Route path="/cases/:id/volumes" element={<div>Volumes - TODO</div>} />
        <Route path="/cases/:id/documents" element={<div>Documents - TODO</div>} />
        <Route path="/cases/:id/analysis" element={<div>Analysis - TODO</div>} />
        <Route path="/cases/:id/strategy" element={<div>Strategy - TODO</div>} />

        {/* Document Detail */}
        <Route path="/documents/:id" element={<div>Document Detail - TODO</div>} />

        {/* 404 */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </div>
  )
}

export default App
