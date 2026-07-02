import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import socket from "../socket";
import useBoardStore from "../store/BoardStore";
import { useGameStore } from "../store/GameStore";
import { useModalStore } from "../store/ModalStore";
import useTurnStore from "../store/TurnStore";
import useNeoHandStore from "../store/NeoHandStore";
import homeBackground from '../assets/images/fondo.png';
import useBackgroundStore from "../store/BackgroundStore";
import GameRulesModal from "../components/Modals/GameRulesModal";
import ScoreboardModal from "../components/Modals/ScoreBoardModal";
import { Sparkles, Trophy } from "lucide-react";
import AuthModal from '../components/Modals/AuthModal';
import { User } from 'lucide-react';
import { useAuthStore } from "../store/LoginStore";

/**
 * Componente de layout principal de la aplicación.
 * Envuelve todas las rutas mediante React Router y proporciona la estructura
 * común de cabecera, fondo y modales globales. Gestiona la visualización
 * de los modales de reglas, ranking y autenticación, así como el estado
 * de sesión del usuario. Al navegar al inicio, desconecta el socket y
 * reinicia todos los stores de la aplicación.
 *
 * No recibe props. Renderiza el contenido de la ruta activa mediante Outlet.
 */
export default function DefaultLayout() {
  const navigate = useNavigate()
  const [resetBoardStore] = useBoardStore((state) => [state.resetStore])
  const [resetGameStore] = useGameStore((state) => [state.resetStore])
  const [resetTurnStore] = useTurnStore((state) => [state.resetStore])
  const [resetModalStore] = useModalStore((state) => [state.resetStore])
  const [resetNeoHandStore] = useNeoHandStore((state) => [state.resetStore])
  const { background, resetBackground } = useBackgroundStore();
  const [showRules, setShowRules] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [logedUser, setLogedUser, setPassword] = useAuthStore((state) => [state.logedUser, state.setLogedUser, state.setToken]);
  const [scores, setScores] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL;

  const location = useLocation();

  /**
   * Determina la imagen de fondo a aplicar en función de la ruta activa.
   * Todas las rutas principales de la aplicación comparten el mismo fondo.
   * Si la ruta no coincide con ninguna de las rutas conocidas, devuelve "none".
   *
   * @returns {string} Valor CSS para la propiedad backgroundImage.
   */
  const getBackgroundImage = () => {
    if (location.pathname === "/") {
      return `url(${homeBackground})`;
    } else if (location.pathname.startsWith("/creating-game")) {
      return `url(${homeBackground})`;
    } else if (location.pathname.startsWith("/game")) {
      return `url(${homeBackground})`;
    } else if (location.pathname.startsWith("/waiting-room")) {
      return `url(${homeBackground})`;
    }
    return "none";
  };

  /**
   * Obtiene la lista de puntuaciones del ranking desde el proxy FastAPI
   * mediante una petición GET al endpoint /get-scores y actualiza el estado
   * local scores con los datos recibidos. En caso de error de red, lo registra
   * en consola sin interrumpir el flujo de la aplicación.
   */
  const fetchScores = async () => {
    try {
      const response = await fetch(`${API_URL}/get-scores`);
      const data = await response.json();
      setScores(data);
    } catch (error) {
      console.error("Error al obtener puntuaciones:", error);
    }
  };

  /**
   * Reinicia el estado de todos los stores de la aplicación a sus valores
   * iniciales. Se invoca al volver a la pantalla de inicio para garantizar
   * que una nueva partida comienza con un estado limpio.
   */
  const resetAllStores = () => {
    resetBoardStore()
    resetGameStore()
    resetTurnStore()
    resetModalStore()
    resetNeoHandStore()
    resetBackground()
  }

  /**
   * Gestiona el clic sobre el título de la aplicación en la cabecera.
   * Desconecta el socket activo, reinicia todos los stores mediante
   * resetAllStores y navega a la ruta raíz.
   */
  const handleTitleClick = () => {
    socket.disconnect()
    resetAllStores()
    navigate('/')
  }

  /**
   * Gestiona el clic sobre el botón de ranking.
   * Obtiene las puntuaciones actualizadas mediante fetchScores y activa
   * la visibilidad del modal de ranking.
   */
  const handleScoreboardClick = () => {
    fetchScores();
    setShowScoreboard(true);
  };

  /**
   * Cierra la sesión del usuario autenticado eliminando el nombre de usuario
   * y el token JWT almacenados en LoginStore.
   */
  const closeSesion = () => {
    setLogedUser(null);
    setPassword(null);
  }

  return (
    <div className="h-full overflow-x-hidden overflow-y-hidden flex flex-col"
      style={{
        backgroundImage: background != "none" ? background : getBackgroundImage(),
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100vh",
      }}
    >
      {/* Header - Ocupa espacio real, no absolute */}
      <div className="relative z-50 p-2 flex-shrink-0">
        {(!showRules && !showAuth && !showScoreboard) && (
          <div className="flex justify-between items-center">
            {/* Título en el header */}
            <h1
              className="font-light z-40 text-xl sm:text-2xl md:text-3xl hover:cursor-pointer 
                   font-title text-white drop-shadow-lg"
              onClick={handleTitleClick}
            >
              Cazahadas
            </h1>

            {/* Botones agrupados a la derecha */}
            <div className="flex items-center gap-2">
              {/* Botón de Inicio/Cierre de Sesión */}
              {!logedUser ? (
                <button
                  onClick={() => setShowAuth(true)}
                  className="bg-gradient-to-r from-purple-400 to-pink-500 text-white 
                       p-2 rounded-full shadow-lg hover:scale-110 transition-transform
                       w-10 h-10 flex items-center justify-center"
                  title="Iniciar sesión"
                >
                  <User className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => closeSesion()}
                  className="bg-gradient-to-r from-purple-400 to-pink-500 text-white 
                       px-3 py-2 rounded-full shadow-lg hover:scale-110 transition-transform
                       text-xs font-medium whitespace-nowrap"
                  title="Cerrar sesión"
                >
                  <span className="hidden sm:inline">Cerrar sesión</span>
                  <span className="sm:hidden">Salir</span>
                </button>
              )}

              {/* Botón de Scoreboard */}
              <button
                onClick={() => handleScoreboardClick()}
                className="bg-gradient-to-r from-green-400 to-blue-500 text-white 
                     p-2 rounded-full shadow-lg hover:scale-110 transition-transform
                     w-10 h-10 flex items-center justify-center"
                title="Ver puntuaciones"
              >
                <Trophy className="w-4 h-4" />
              </button>

              {/* Botón de Reglas */}
              <button
                onClick={() => setShowRules(true)}
                className="bg-gradient-to-r from-pink-400 to-purple-500 text-white 
                     p-2 rounded-full shadow-lg hover:scale-110 transition-transform
                     w-10 h-10 flex items-center justify-center"
                title="Ver reglas del juego"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Reglas */}
      {showRules &&
        <GameRulesModal
          isOpen={showRules}
          onClose={() => setShowRules(false)}
        />
      }

      {/* Modal de Scoreboard */}
      {showScoreboard &&
        <ScoreboardModal
          isOpen={showScoreboard}
          onClose={() => setShowScoreboard(false)}
          scores={scores}
        />
      }

      {/* Modal de Autenticación */}
      {showAuth &&
        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
        />
      }

      {/* Contenido principal - Ocupa el resto del espacio */}
      <div className="flex-1 flex flex-col justify-center items-center overflow-hidden px-4">
        <Outlet />
      </div>
    </div>
  )
}