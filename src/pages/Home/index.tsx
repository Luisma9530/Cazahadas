import { useNavigate } from 'react-router-dom'
import socket from '../../socket'
import { useEffect, useState } from 'react'
import waitingRoomBackground from '../../assets/images/waitingRoomBackground.png';
import useBackgroundStore from "../../store/BackgroundStore";
import { useAuthStore } from '../../store/LoginStore';

export default function Home() {
  const navigate = useNavigate()
  const [playerName, setPlayerName] = useState<string>('')
  const [gameId, setGameId] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const { setBackground } = useBackgroundStore();
  const [logedUser] = useAuthStore((state) => [state.logedUser]);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    socket.on('game-busy', () => {
      setErrorMessage('Game is busy')
    })

    socket.on('game-not-found', () => {
      setErrorMessage('Game not found')
    })

    socket.on('game-found', (data: {
      gameIdFound: string
    }) => {
      if (logedUser) {
        setPlayerName(logedUser)
      }
      console.log('Joining game', data.gameIdFound)
      navigate(`/game/${data.gameIdFound}`)
      socket.emit('join-game', {
        playerName,
        gameId: data.gameIdFound
      })
    })

    return () => {
      socket.off('game-found')
      socket.off('game-not-found')
      socket.off('game-busy')
    }
  }, [])

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (crypto.getRandomValues(new Uint8Array(1))[0] % 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  const handleStartGame = () => {
    if (logedUser) {
      setPlayerName(logedUser)
    }
    const randomGameId = generateUUID()
    navigate(`/game/${randomGameId}`)
    setBackground(waitingRoomBackground)
    socket.connect()
    socket.emit('start-game-info', {
      playerName,
      gameId: randomGameId
    })
  }

  const handleJoinGame = () => {
    socket.connect()
    socket.emit('attempt-to-join-game', {
      gameId
    })
  }

  const handleChangePlayerNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(e.target.value)
  }

  const handleChangeGameIdInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGameId(e.target.value)
  }

  return (
    <>
      {/* Container principal con escalado viewport */}
      <div className="flex flex-col lg:flex-row items-center justify-center 
                      w-full max-w-7xl mx-auto 
                      mt-[8vh] sm:mt-[12vh] lg:mt-[20vh]
                      px-[4vw] sm:px-[6vw] lg:px-[8vw]
                      gap-[2vh] sm:gap-[3vh]">

        {/* Botón Join Game */}
        <div className="border-2 border-black rounded-xl bg-white shadow-lg
                        w-full sm:w-[40vw] lg:w-[25vw] max-w-sm
                        min-h-[15vh]">
          <div className="flex flex-col items-center justify-center 
                          p-[3vh] sm:p-[4vh] lg:p-[5vh]">
            <button
              onClick={() => setShowJoinModal(true)}
              className="rounded-lg w-full 
                         px-[2vw] py-[2vh] sm:py-[1.5vh]
                         border-2 text-black border-black 
                         hover:bg-gray-700 hover:border-gray-700 
                         group active:translate-y-1 sm:active:translate-y-2
                         transition-all duration-200
                         min-h-[8vh] flex items-center justify-center"
            >
              <span className="text-[4vw] sm:text-[3vw] lg:text-[1.8vw] xl:text-[1.5vw] 
                             font-medium text-black group-hover:text-white
                             min-[1600px]:text-2xl">
                Unirse a partida
              </span>
            </button>
          </div>
        </div>

        {/* Botón Start Game */}
        <div className="border-2 border-black rounded-xl bg-white shadow-lg
                        w-full sm:w-[40vw] lg:w-[25vw] max-w-sm
                        min-h-[15vh]">
          <div className="flex flex-col items-center justify-center 
                          p-[3vh] sm:p-[4vh] lg:p-[5vh]">
            <button
              onClick={handleStartGame}
              className="rounded-lg w-full 
                         px-[2vw] py-[2vh] sm:py-[1.5vh]
                         border-2 text-black border-black 
                         hover:bg-gray-700 hover:border-gray-700 
                         group active:translate-y-1 sm:active:translate-y-2
                         transition-all duration-200
                         min-h-[8vh] flex items-center justify-center"
            >
              <span className="text-[4vw] sm:text-[3vw] lg:text-[1.8vw] xl:text-[1.5vw] 
                             font-medium text-black group-hover:text-white
                             min-[1600px]:text-2xl">
                Crear Partida
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal para Join Game - Escalado viewport */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 
                        flex items-center justify-center z-50 
                        px-[4vw] sm:px-[6vw]">
          <div className="bg-white border-2 border-black rounded-xl shadow-2xl
                          p-[4vh] sm:p-[5vh]
                          w-full max-w-[90vw] sm:max-w-[70vw] lg:max-w-[40vw] xl:max-w-[35vw]
                          min-[1600px]:max-w-lg
                          mx-4">
            <div className="flex flex-col items-center gap-[3vh] sm:gap-[4vh]">
              <h2 className="text-[5vw] sm:text-[4vw] lg:text-[2.5vw] xl:text-[2vw]
                           min-[1600px]:text-3xl
                           font-medium text-black text-center">
                Unirse a partida
              </h2>

              <input
                value={gameId}
                onChange={handleChangeGameIdInput}
                className="text-[3.5vw] sm:text-[2.5vw] lg:text-[1.5vw] xl:text-[1.2vw]
                          min-[1600px]:text-lg
                          w-full py-[2vh] sm:py-[1.5vh] px-[2vw] text-center 
                          border-2 border-gray-400 rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-gray-500 
                          focus:border-gray-500"
                placeholder="Enter Game ID"
              />

              <div className="flex flex-col sm:flex-row gap-[2vh] sm:gap-[2vw] w-full">
                <button
                  onClick={handleJoinGame}
                  className="rounded-lg flex-1 
                           px-[2vw] py-[2vh] sm:py-[1.5vh]
                           border-2 text-white bg-black border-black 
                           hover:bg-gray-700 hover:border-gray-700 
                           active:translate-y-1
                           transition-all duration-200
                           min-h-[6vh] flex items-center justify-center"
                >
                  <span className="text-[3.5vw] sm:text-[2.5vw] lg:text-[1.5vw] xl:text-[1.2vw]
                                 min-[1600px]:text-lg 
                                 font-medium">
                    Join
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setErrorMessage('');
                  }}
                  className="rounded-lg flex-1 
                           px-[2vw] py-[2vh] sm:py-[1.5vh]
                           border-2 text-black border-gray-400 
                           hover:bg-gray-100 active:translate-y-1
                           transition-all duration-200
                           min-h-[6vh] flex items-center justify-center"
                >
                  <span className="text-[3.5vw] sm:text-[2.5vw] lg:text-[1.5vw] xl:text-[1.2vw]
                                 min-[1600px]:text-lg 
                                 font-medium">
                    Cancel
                  </span>
                </button>
              </div>

              {!!errorMessage && (
                <span className="text-red-500 text-[3vw] sm:text-[2vw] lg:text-[1.2vw] xl:text-[1vw]
                               min-[1600px]:text-base 
                               text-center">
                  {errorMessage}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}