import { useNavigate, useParams } from "react-router-dom"
import socket from "../../socket"
import { useState } from "react"
import Lottie from "lottie-react";
import mageIdle from "../../assets/animations/wizard.json";


export function WaitingRoom() {
  const [playerName, setPlayerName] = useState<string>('')
  const navigate = useNavigate()
  const { id: gameId } = useParams<{ id: string }>()

  const handleJoinGame = () => {
    navigate(`/game/${gameId}`)
    socket.emit('join-game', {
      playerName,
      gameId
    })
  }

  const handleChangePlayerNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(e.target.value)
  }

  return (
    <div className="flex justify-center items-center gap-10">
      {/* Animación del mago a la izquierda */}
      <div className="w-64">
        <Lottie animationData={mageIdle} loop autoplay />
      </div>

      {/* Formulario para unirse */}
      <div className="border border-black rounded-lg">
        <div className="flex flex-col items-center justify-center gap-6 p-10">
          <input
            value={playerName}
            onChange={handleChangePlayerNameInput}
            className="text-sm w-72 py-2 px-1 text-center border border-gray-400 rounded-md"
            placeholder="Your name"
          />
          <button
            onClick={handleJoinGame}
            className="rounded-md w-72 px-4 py-2 border text-black border-black hover:bg-gray-700 hover:border-gray-700 group active:translate-y-2"
          >
            <span className="text-2xl font-medium text-black group-hover:text-white">Join Game</span>
          </button>
        </div>
      </div>

      {/* Animación del mago a la izquierda */}
      <div className="w-64">
        <Lottie animationData={mageIdle} loop autoplay />
      </div>
    </div>
  )
}