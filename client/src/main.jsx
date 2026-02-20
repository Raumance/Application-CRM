import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './firebase'
import { ToastProvider } from './contexts/ToastContext'
import { ConfirmProvider } from './contexts/ConfirmContext'
import { ToastContainer } from './components/Toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <ConfirmProvider>
        <App />
        <ToastContainer />
      </ConfirmProvider>
    </ToastProvider>
  </StrictMode>,
)
