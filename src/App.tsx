import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import DefaultLayout from './layout/DefaultLayout'
import Game from './pages/Game'

/**
 * Componente raíz de la aplicación que define la estructura de rutas
 * mediante React Router. Todas las rutas quedan anidadas bajo DefaultLayout,
 * que proporciona la cabecera y los modales globales comunes a toda la
 * aplicación. La ruta raíz renderiza la página de inicio y la ruta
 * /game/:id renderiza la página de juego con el identificador de sala
 * como parámetro de URL.
 */
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
