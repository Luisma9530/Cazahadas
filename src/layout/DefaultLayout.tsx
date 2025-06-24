import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import socket from "../socket";
import useBoardStore from "../store/BoardStore";
import { useGameStore } from "../store/GameStore";
import { useModalStore } from "../store/ModalStore";
import { usePointStore } from "../store/PointsStore";
import useTurnStore from "../store/TurnStore";
import useNeoHandStore from "../store/NeoHandStore";
import homeBackground from '../assets/images/homeBackground.png';
import createGameBackground from '../assets/images/createGameBackground.png';
import gameBackground from '../assets/images/gameBackground.png';
import waitingRoomBackground from '../assets/images/waitingRoomBackground.png';
import useBackgroundStore from "../store/BackgroundStore";
import GameRulesModal from "../components/Modals/GameRulesModal";
import { Sparkles } from "lucide-react";


export default function DefaultLayout() {

  const navigate = useNavigate()
  const [resetBoardStore] = useBoardStore((state) => [state.resetStore])
  const [resetGameStore] = useGameStore((state) => [state.resetStore])
  const [resetPointsStore] = usePointStore((state) => [state.resetStore])
  const [resetTurnStore] = useTurnStore((state) => [state.resetStore])
  const [resetModalStore] = useModalStore((state) => [state.resetStore])
  const [resetNeoHandStore] = useNeoHandStore((state) => [state.resetStore])
  const { background, resetBackground } = useBackgroundStore();
  const [showRules, setShowRules] = useState(false);

  const location = useLocation();

  const getBackgroundImage = () => {
    if (location.pathname === "/") {
      return `url(${homeBackground})`;
    } else if (location.pathname.startsWith("/creating-game")) {
      return `url(${homeBackground})`;
    } else if (location.pathname.startsWith("/game")) {
      return `url(${homeBackground})`;
    } else if (location.pathname.startsWith("/waiting-room")) {
      return `url(${waitingRoomBackground})`;
    }
    return "none";
  };


  const resetAllStores = () => {
    resetBoardStore()
    resetGameStore()
    resetPointsStore()
    resetTurnStore()
    resetModalStore()
    resetNeoHandStore()
    resetBackground()
  }


  const handleTitleClick = () => {
    socket.disconnect()
    resetAllStores()
    navigate('/')
  }


  return (
    <div className="h-full overflow-x-hidden overflow-y-hidden"
      style={{
        backgroundImage: background != "none" ? background : getBackgroundImage(),
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100vh",
      }}
    >
      {/* Botón de Información */}
      <button
        onClick={() => setShowRules(true)}
        className="absolute top-4 right-4 z-50 bg-gradient-to-r from-pink-400 to-purple-500 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
        title="Ver reglas del juego"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Modal */}
      {showRules &&
        <GameRulesModal
          isOpen={showRules}
          onClose={() => setShowRules(false)}
        />
      }

      <div className="flex flex-col justify-center items-center mt-2 h-full w-full">
        {!showRules && (
          <h1
            className="font-light z-50 text-5xl hover:cursor-pointer font-title text-white drop-shadow-lg"
            onClick={handleTitleClick}
          >
            Cazahadas
          </h1>
        )}
        <Outlet />
      </div>
    </div>
  )
}