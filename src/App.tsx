import { Routes, Route, Navigate } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import Markets from './pages/Markets'
import Leaders from './pages/Leaders'
import Macro from './pages/Macro'
import Chain from './pages/Chain'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/leaders" element={<Leaders />} />
        <Route path="/macro" element={<Macro />} />
        <Route path="/chain" element={<Chain />} />
      </Routes>
    </Layout>
  )
}
