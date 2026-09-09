import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import '../App.css'
import './lab.css'
import { CardLab } from './CardLab.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CardLab />
  </StrictMode>,
)
