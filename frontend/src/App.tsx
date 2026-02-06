import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Home from './pages/Home'
import Player from './pages/Player'
import Motd from './pages/Motd'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/player/:steamid" element={<Player />} />
          <Route path="/motd/:steamid" element={<Motd />} />
          <Route path="/:steamid" element={<Player />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
