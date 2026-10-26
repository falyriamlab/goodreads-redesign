import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { seedFirstVisit } from './lib/firstVisit'
import { router } from './router'
import './index.css'

// First visit from the shared link: start with the full demo (seed + demo clock)
seedFirstVisit()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
