import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: { background: '#16161D', color: '#fff', border: '1px solid #2A2A35', borderRadius: '12px', fontSize: '14px' },
        success: { iconTheme: { primary: '#00E5A0', secondary: '#0F0F13' } },
        error:   { iconTheme: { primary: '#FF4757', secondary: '#0F0F13' } },
      }}
    />
  </React.StrictMode>,
)
