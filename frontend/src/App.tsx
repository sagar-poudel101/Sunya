import { useState } from 'react'
import { LoginPage } from './pages/LoginPage'
import { AuthProvider } from './context/AuthContext' // 1. Import your provider
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <AuthProvider> {/* 2. Wrap your components here */}
      <LoginPage />
    </AuthProvider>
  )
}

export default App
