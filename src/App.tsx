import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { Home } from './pages/Home'
import { WatchDemo } from './pages/WatchDemo'
import { GlassesDemo } from './pages/GlassesDemo'

function basenameFromViteBase(): string | undefined {
  const b = import.meta.env.BASE
  if (b === '/') return undefined
  return b.endsWith('/') ? b.slice(0, -1) : b
}

export default function App() {
  return (
    <BrowserRouter basename={basenameFromViteBase()}>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="watch" element={<WatchDemo />} />
          <Route path="glasses" element={<GlassesDemo />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
