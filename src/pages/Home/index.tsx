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
      navigate(`/waiting-room/${data.gameIdFound}`)
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
      <div className="flex flex-row items-center justify-center w-1/3 mt-48 gap-5">
        <div className="border border-black border-solid-2 rounded-lg bg-white" >
          <div className="flex flex-col items-center justify-center gap-6 p-10 ">
            <button
              onClick={() => setShowJoinModal(true)}
              className="rounded-md w-72 px-4 py-2 border text-black border-black hover:bg-gray-700 hover:border-gray-700 group active:translate-y-2"
            >
              <span className="text-2xl font-medium text-black group-hover:text-white">Join Game</span>
            </button>
          </div>
        </div>
        <div className="border border-black border-solid-2 rounded-lg bg-white">
          <div className="flex flex-col items-center justify-center gap-6 p-10">
            <button
              onClick={handleStartGame}
              className="rounded-md w-72 px-4 py-2 border text-black border-black hover:bg-gray-700 hover:border-gray-700 group active:translate-y-2"
            >
              <span className="text-2xl font-medium text-black group-hover:text-white">Start Game</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal para Join Game */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border border-black border-solid-2 rounded-lg p-8 w-96">
            <div className="flex flex-col items-center gap-6">
              <h2 className="text-2xl font-medium text-black">Join Game</h2>
              <input
                value={gameId}
                onChange={handleChangeGameIdInput}
                className="text-sm w-full py-2 px-3 text-center border border-solid-1 border-gray-400 rounded-md"
                placeholder="Enter Game ID"
              />
              <div className="flex gap-4 w-full">
                <button
                  onClick={handleJoinGame}
                  className="rounded-md flex-1 px-4 py-2 border text-white bg-black border-black hover:bg-gray-700 hover:border-gray-700 active:translate-y-1"
                >
                  <span className="text-lg font-medium">Join</span>
                </button>
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setErrorMessage('');
                  }
                  }
                  className="rounded-md flex-1 px-4 py-2 border text-black border-gray-400 hover:bg-gray-100 active:translate-y-1"
                >
                  <span className="text-lg font-medium">Cancel</span>
                </button>
              </div>
              {!!errorMessage && (
                <span className='text-red-500 text-sm text-center'>
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
