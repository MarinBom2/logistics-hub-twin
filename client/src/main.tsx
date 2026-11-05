import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/ibm-plex-sans-kr/400.css'
import '@fontsource/ibm-plex-sans-kr/500.css'
import '@fontsource/ibm-plex-sans-kr/600.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/600.css'
import './styles/index.css'
import App from './App.tsx'

// 배포 직후 열려 있던 화면이 이전 해시의 청크를 못 받으면 새로고침한다 (md/runtime-structure.md §6)
window.addEventListener('vite:preloadError', () => window.location.reload())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
