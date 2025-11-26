import './App.css'
import { Routes, Route, Link } from 'react-router-dom'
import { implementations } from './pages/Game'

export default function App() {
  return (
    <div className="app-shell">
      <nav className="top-nav">
        <Link to="/">Home</Link>
        {implementations.map(({ path, title }) => (
          <Link key={path} to={`/${path}`}>
            {title}
          </Link>
        ))}
      </nav>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<p>Select a Minesweeper implementation.</p>} />
          {implementations.map(({ path, Component }) => (
            <Route key={path} path={`/${path}`} element={<Component />} />
          ))}
        </Routes>
      </main>
    </div>
  )
}
