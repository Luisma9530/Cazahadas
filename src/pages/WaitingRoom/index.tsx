import { useNavigate, useParams } from "react-router-dom"
import socket from "../../socket"
import { useState } from "react"
import { useAuthStore } from "../../store/LoginStore"

export function WaitingRoom() {
  const [playerName, setPlayerName] = useState<string>('')
  const navigate = useNavigate()
  const { id: gameId } = useParams<{ id: string }>()
  const [logedUser] = useAuthStore((state) => [state.logedUser]);

  const handleJoinGame = () => {
    if (logedUser) {
      setPlayerName(logedUser)
    }
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
    <div className="flex justify-center items-center gap-6 sm:gap-10 px-4 sm:px-0">

      {/* Formulario para unirse - Responsivo */}
      <div className="border border-black rounded-lg bg-white w-full max-w-sm sm:max-w-none sm:w-auto">
        <div className="flex flex-col items-center justify-center gap-6 p-6 sm:p-10">
          {!logedUser && (
            <input
              value={playerName}
              onChange={handleChangePlayerNameInput}
              className="text-sm w-full sm:w-72 py-2 px-1 text-center 
                         border border-gray-400 rounded-md
                         focus:outline-none focus:ring-2 focus:ring-gray-500 
                         focus:border-gray-500"
              placeholder="Your name"
            />
          )}
          {logedUser && (
            <span className="text-sm w-full sm:w-72 py-2 px-1 text-center 
                           border border-gray-400 rounded-md bg-gray-50">
              {logedUser}
            </span>
          )}
          <button
            onClick={handleJoinGame}
            className="rounded-md w-full sm:w-72 px-4 py-3 sm:py-2 
                       border text-black border-black 
                       hover:bg-gray-700 hover:border-gray-700 
                       group active:translate-y-1 sm:active:translate-y-2
                       transition-all duration-200"
          >
            <span className="text-lg sm:text-2xl font-medium text-black group-hover:text-white">
              Join Game
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}