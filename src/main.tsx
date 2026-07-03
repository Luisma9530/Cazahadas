import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

/**
 * Punto de entrada de la aplicación React.
 * Monta el componente raíz App en el elemento DOM con identificador "root",
 * envuelto en BrowserRouter para habilitar el enrutamiento del lado del
 * cliente mediante React Router, y en React.StrictMode para activar
 * comprobaciones adicionales de desarrollo que detectan efectos secundarios
 * no intencionados y usos obsoletos de la API de React.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
