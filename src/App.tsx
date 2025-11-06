import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import DefaultLayout from './layout/DefaultLayout'
import Game from './pages/Game'

function App() {
  return (

    <Routes>
      <Route path="/" element={<DefaultLayout />}>
        <Route path="/" element={<Home />} />
        <Route path='/game/:id' element={<Game />} />
      </Route>
    </Routes>
  )
}

export default App
