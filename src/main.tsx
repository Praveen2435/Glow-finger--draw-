import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  // StrictMode removed: it double-invokes effects in dev which causes
  // two concurrent MediaPipe Hands instances fighting over the WebGL context
  <App />
)
