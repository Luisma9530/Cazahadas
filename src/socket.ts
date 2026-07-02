import { io } from "socket.io-client";

const URL =
  process.env.NODE_ENV === "production"
    ? "https://cazahadas.onrender.com" // reemplaza con tu dominio real
    : "http://localhost:4000";

/**
 * Instancia singleton del cliente Socket.IO compartida por toda la aplicación.
 * La URL de conexión se determina automáticamente según el entorno de ejecución:
 * en producción apunta al servicio desplegado en Render, y en desarrollo apunta
 * al servidor local en el puerto 4000. La conexión automática está desactivada
 * para que cada componente pueda establecerla explícitamente en el momento
 * adecuado mediante socket.connect(), evitando conexiones prematuras antes
 * de que el usuario inicie o se una a una partida.
 */
const socket = io(URL, {
  autoConnect: false,
});

export default socket;
