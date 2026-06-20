import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

const PublicNavbar: React.FC = () => {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo — upper left */}
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">A</div>
          <span className="font-bold text-gray-900 text-lg">Amdox <span className="text-blue-600">ERP</span></span>
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
          <a href="#features" className="hover:text-blue-600">Features</a>
          <a href="#modules" className="hover:text-blue-600">Modules</a>
          <a href="#why" className="hover:text-blue-600">Why Amdox</a>
        </nav>

        {/* Sign in / Get started — upper right */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-700 hover:text-blue-600">
            Sign in
          </button>
          <button
            onClick={() => navigate('/register')}
            className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            Get started
          </button>
        </div>
      </div>
    </header>
  )
}

export default PublicNavbar
