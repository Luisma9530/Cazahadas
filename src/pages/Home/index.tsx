import { useNavigate } from 'react-router-dom'
import socket from '../../socket'
import { useEffect, useState } from 'react'
import homeBackground from '../../assets/images/fondo.png';
import useBackgroundStore from "../../store/BackgroundStore";
import { useAuthStore } from '../../store/LoginStore';

/**
 * Página de inicio de la aplicación.
 * Presenta las opciones de crear una nueva partida o unirse a una existente
 * mediante un modal con campo de texto para introducir el código de sala.
 * Gestiona la conexión Socket.IO y los eventos de respuesta del servidor
 * para validar la sala antes de navegar a la vista de juego.
 *
 * No recibe props. Obtiene el estado de sesión de LoginStore y el fondo
 * de BackgroundStore.
 */
export default function Home() {
  const navigate = useNavigate()
  const [playerName, setPlayerName] = useState<string>('')
  const [gameId, setGameId] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const { setBackground } = useBackgroundStore();
  const [logedUser] = useAuthStore((state) => [state.logedUser]);
  const [showJoinModal, setShowJoinModal] = useState(false);

  /**
   * Efecto de registro de listeners Socket.IO para la fase de unión a partida.
   * Registra handlers para los eventos "game-busy" (sala completa),
   * "game-not-found" (código inválido) y "game-found" (sala encontrada).
   * Ante "game-found", navega a la ruta de juego y emite "join-game" con el
   * nombre del jugador. Si hay sesión activa, usa el nombre de usuario
   * autenticado. Limpia los listeners al desmontar el componente.
   */
  useEffect(() => {
    socket.on('game-busy', () => {
      setErrorMessage('Esta sala ya está completa')
    })

    socket.on('game-not-found', () => {
      setErrorMessage('Sala no encontrada')
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

  /**
   * Genera un identificador UUID v4 compatible con todos los navegadores
   * mediante la API Web Crypto. Utiliza crypto.getRandomValues para garantizar
   * aleatoriedad criptográficamente segura sin dependencias externas.
   *
   * @returns {string} UUID v4 en formato estándar xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx.
   */
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (crypto.getRandomValues(new Uint8Array(1))[0] % 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  /**
   * Gestiona la creación de una nueva partida.
   * Genera un UUID como identificador de sala, navega a la ruta de juego,
   * establece el fondo de pantalla, conecta el socket y emite el evento
   * "start-game-info" al servidor con el nombre del jugador y el código de sala.
   * Si hay sesión activa, usa el nombre de usuario autenticado como nombre
   * de jugador.
   */
  const handleStartGame = () => {
    if (logedUser) {
      setPlayerName(logedUser)
    }
    const randomGameId = generateUUID()
    navigate(`/game/${randomGameId}`)
    setBackground(homeBackground)
    socket.connect()
    socket.emit('start-game-info', {
      playerName,
      gameId: randomGameId
    })
  }

  /**
   * Gestiona el intento de unión a una partida existente.
   * Conecta el socket y emite el evento "attempt-to-join-game" al servidor
   * con el código de sala introducido por el usuario. La respuesta del servidor
   * se procesa en los listeners registrados en el useEffect de inicialización.
   */
  const handleJoinGame = () => {
    socket.connect()
    socket.emit('attempt-to-join-game', {
      gameId
    })
  }

  /**
   * Actualiza el estado local gameId con el valor introducido en el campo
   * de texto del modal de unión, eliminando espacios en blanco en los extremos.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - Evento de cambio del input.
   */
  const handleChangeGameIdInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGameId(e.target.value.trim())
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
                placeholder="Introduce el ID de la sala"
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
                    Unirse
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
                    Cancelar
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