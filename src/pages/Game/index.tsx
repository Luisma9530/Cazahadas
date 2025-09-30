import { useEffect, useState } from "react";
import Board from "../../components/Board";
import Hand from "../../components/Hand";
import socket from "../../socket";
import { Tile } from "../../@types/Tile";
import useBoardStore from "../../store/BoardStore";
import { Result, useGameStore } from "../../store/GameStore";
import { usePointStore } from "../../store/PointsStore";
import SkipTurn from "../../components/SkipTurn";
import TurnIndicator from "../../components/TurnIndicator.tsx";
import { useModalStore } from "../../store/ModalStore";
import { GameStartModal } from "../../components/Modals/GameStartModal";
import { TurnModal } from "../../components/Modals/TurnModal";
import { BattleModal } from "../../components/Modals/BattleModal";
import useTurnStore from "../../store/TurnStore";
import { EndGameModal } from "../../components/Modals/EndGameModal";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-regular-svg-icons";
import useBackgroundStore from "../../store/BackgroundStore";
import homeBackground from '../../assets/images/homeBackground.png';
import { CardUnity } from "../../@types/Card";
import BattleConfirmModal from "../../components/Modals/BattleStartModal.tsx";
import DrawConfirmModal from "../../components/Modals/DrawConfirmModal.tsx";
import RequestDraw from "../../components/drawGame.tsx";

export default function Game() {
  const [loading, setLoading] = useState(true)
  const [gameBusy, setGameBusy] = useState(false)
  const [isCopied, setIsCopied] = useState(false);

  const [isMyTurn, toggleTurn, setPlayerSkippedTurn, setIsBattle, isBattle, setIsMyFirstTurnBattle, showBattleModal, setShowBattleModal, showDrawModal, setShowDrawModal] = useTurnStore((state) => [state.isMyTurn, state.toggleTurn, state.setPlayerSkippedTurn, state.setIsBattle, state.isBattle, state.setIsMyFirstTurnBattle, state.showBattleModal, state.setShowBattleModal, state.showDrawModal, state.setShowDrawModal]);
  const [setBoard, board] = useBoardStore((state) => [state.setBoard, state.board])
  const [amIP1, setAmIP1, gameOver, setGameOver, setPlayerOneName, setPlayerTwoName, setPlayerDisconnected, setGameResult, gameResult] = useGameStore((state) => [state.amIP1, state.setAmIP1, state.gameOver, state.setGameOver, state.setPlayerOneName, state.setPlayerTwoName, state.setPlayerDisconnected, state.setGameResult, state.gameResult])
  const [setPoints] = usePointStore((state) => [state.setPoints])
  const { setBackground } = useBackgroundStore();

  const { id: gameId } = useParams<{ id: string }>()

  const [gameStartModal, toggleGameStartModal, turnModal, toggleTurnModal, battleModal, toggleBattleModal] = useModalStore((state) => [state.gameStartModal, state.toggleGameStartModal, state.turnModal, state.toggleTurnModal, state.battleModal, state.toggleBattleModal])

  useEffect(() => {
    if (isBattle) {
      toggleBattleModal()
    }
  }, [isBattle]);

  function mirrorBoard(tiles: Tile[][]): Tile[][] {
    // Cambia filas: 0 <-> 2, mantiene columnas
    return [
      tiles[2].map((col) => ({ ...col })), // fila 0 <- antes fila 2
      tiles[1].map((col) => ({ ...col })), // fila 1 igual
      tiles[0].map((col) => ({ ...col })), // fila 2 <- antes fila 0
    ];
  }

  useEffect(() => {
    socket.on('player-connected', (data: { firstPlayer: boolean }) => {
      setAmIP1(data.firstPlayer)
    })

    socket.on('game-start', (data) => {
      setLoading(false)
      toggleGameStartModal()
      if (amIP1) {
        toggleTurn()
      }
      setBackground(homeBackground)
      setPlayerOneName(data[0])
      setPlayerTwoName(data[1])
    })

    socket.on('new-turn', (data: { tiles: Tile[][], playerSkippedTurn: boolean, endBattle: boolean, selectedCard: CardUnity }) => {
      if (isBattle && data.endBattle) { // Si es una batalla y se terminó, se reinicia el estado de batalla
        setPlayerSkippedTurn(false)
        setIsBattle(false)
        setIsMyFirstTurnBattle(false);
      } else { // Si no es una batalla o no se terminó, se actualiza el estado de si el jugador saltó su turno
        setPlayerSkippedTurn(data.playerSkippedTurn)
      }
      setPoints(data.tiles)
      toggleTurnModal()
      if (!isMyTurn) {
        const mirroredTiles = mirrorBoard(data.tiles);
        setBoard(mirroredTiles);
      } else {
        setBoard(data.tiles);
      }
      toggleTurn()
    })

    socket.on('game-end', (data: { tiles: Tile[][], playerDisconnected: boolean, winner: boolean, reason: string }) => {
      setPlayerSkippedTurn(false)
      if (data?.playerDisconnected && !gameOver) {
        setPlayerDisconnected(true)
        if (amIP1) {
          setGameResult(Result.PLAYER1WIN)
        } else {
          setGameResult(Result.PLAYER2WIN)
        }
      }
      if (data?.reason === 'captured-two-fairies') {
        if (data.winner) {
          setGameResult(Result.PLAYER1WIN)
        } else {
          setGameResult(Result.PLAYER2WIN)
        }
      }
      if (data?.reason === 'player-skipped-turn') {
        var player1Fairies = 0
        var player2Fairies = 0
        data.tiles.forEach(row => {
          row.forEach(tile => {
            if (tile.type === 'capturedFairies' && tile.cards) {
              // Contar cartas por propietario
              tile.cards.forEach(card => {
                if (card.placedByPlayerOne) {
                  player1Fairies++;
                } else {
                  player2Fairies++;
                }
              });
            }
          });
        });
        if (player1Fairies > player2Fairies) {
          setGameResult(Result.PLAYER1WIN)
        } else if (player1Fairies < player2Fairies) {
          setGameResult(Result.PLAYER2WIN)
        } else {
          setGameResult(Result.DRAW)
        }
      }
      if (data?.reason === 'draw-request') {
        setGameResult(Result.DRAW)
      }
      setGameOver(true)
    })

    socket.on('game-busy', () => {
      setLoading(false)
      setGameBusy(true)
    })

    return () => {
      socket.off('player-connected');
      socket.off('game-start');
      socket.off('new-turn');
      socket.off('game-end');
      socket.off('game-busy');
    }
  }, [isMyTurn, amIP1]);

  const handleGameIdClick = (gameId?: string) => {
    if (!gameId) return;

    const textArea = document.createElement("textarea");
    textArea.value = gameId;
    document.body.appendChild(textArea);
    textArea.select();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(gameId)
        .then(() => setIsCopied(true))
        .catch(err => console.error("Error al copiar:", err));
    } else {
      // Fallback en navegadores antiguos o sin HTTPS
      try {
        document.execCommand("copy");
        setIsCopied(true);
      } catch (err) {
        console.error("No se pudo copiar usando execCommand:", err);
      }
    }

    document.body.removeChild(textArea);
  };

  const shouldShowBoard = !loading && !gameBusy

  return (
    <div className={`h-full w-full overflow-hidden ${gameOver ? 'pointer-events-none' : ''}`}>

      {/* Loading State - Optimizado para móvil */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-full gap-4 sm:gap-6 px-4">
          <p className="text-center text-white text-base sm:text-lg md:text-xl">
            Waiting for another player...
          </p>
          <div className="flex flex-col items-center gap-3 sm:gap-4 w-full max-w-sm"
            title={`${isCopied ? 'Copied!' : 'Copy'}`}>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white font-bold break-all text-center">
              {gameId}
            </h1>
            <button
              className="cursor-pointer text-white hover:text-gray-300 transition-colors p-2"
              onClick={() => handleGameIdClick(gameId)}
            >
              <FontAwesomeIcon icon={faCopy} size={"lg"} />
            </button>
          </div>
        </div>
      )}

      {/* Game Board - Diseño original para desktop, optimizado para móvil */}
      {shouldShowBoard && (
        <>
          {/* Layout para móvil (sm y menor) */}
          <div className="block sm:hidden h-full flex flex-col">
            {/* Battle Modal */}
            {showBattleModal &&
              <BattleConfirmModal
                isOpen={showBattleModal}
                onAccept={() => {
                  console.log("Battle confirmed");
                  setShowBattleModal(false);
                }}
                onReject={() => {
                  console.log("Battle rejected");
                  socket.emit("end-battle", { gameId: gameId, tiles: board });
                  setShowBattleModal(false);
                }}
              />
            }

            {showDrawModal &&
              <DrawConfirmModal
                isOpen={showDrawModal}
                onAccept={() => {
                  socket.emit('draw-game', { gameId: gameId });
                  setShowDrawModal(false);
                }}
                onReject={() => {

                  setShowDrawModal(false);
                }}
              />
            }


            {/* Turn Indicator */}
            <div className="flex-shrink-0 py-1 z-[51]">
              <TurnIndicator />
            </div>

            {/* Board Container optimizado para móvil */}
            <div className="flex-1 flex items-center justify-center min-h-0">
              <div className="w-full h-full flex items-center justify-center">
                <div className="scale-[0.7] xs:scale-[0.95] origin-center">
                  <Board amIP1={amIP1} />
                </div>
              </div>
            </div>

            {/* Skip Turn */}
            <div className="flex-shrink-0 z-[52] flex flex-col justify-end items-end pr-4 -space-y-2">
              <div className="scale-[0.4] xs:scale-[0.8] origin-right">
                <SkipTurn />
              </div>
              <div className="scale-[0.4] xs:scale-[0.8] origin-right">
                <RequestDraw />
              </div>
            </div>

            {/* Hand - Escalado proporcional manteniendo diseño original */}
            <div className="flex-shrink-0 pb-2 z-[50]">
              <div className="scale-[0.45] xs:scale-[0.8] origin-top">
                <Hand />
              </div>
            </div>
          </div>

          {/* Layout original para desktop (sm y mayor) */}
          <div className="hidden sm:block">
            <div className="-mt-[2rem] xs:-mt-[2.5rem] sm:-mt-[4rem] md:-mt-[5rem] lg:-mt-[6rem] relative z-[53]">
              {showBattleModal &&
                <BattleConfirmModal
                  isOpen={showBattleModal}
                  onAccept={() => {
                    console.log("Battle confirmed");
                    setShowBattleModal(false);
                  }}
                  onReject={() => {
                    console.log("Battle rejected");
                    socket.emit("end-battle", { gameId: gameId, tiles: board });
                    setShowBattleModal(false);
                  }}
                />
              }
              {showDrawModal &&
                <DrawConfirmModal
                  isOpen={showDrawModal}
                  onAccept={() => {
                    socket.emit('draw-game', { gameId: gameId });
                    setShowDrawModal(false);
                  }}
                  onReject={() => {
                    setShowDrawModal(false);
                  }}
                />
              }
            </div>

            <div>
              <TurnIndicator />
            </div>

            <div className="scale-[0.7] xs:scale-[0.8] sm:scale-[0.5] md:scale-[0.6] lg:scale-[0.65] 
                            -mt-4 xs:-mt-6 sm:-mt-12 md:-mt-14 lg:-mt-[13rem] min-w-fit z-[52]">
              <Board amIP1={amIP1} />
            </div>
            <div className="scale-[0.7] xs:scale-[0.7] origin-right -mt-[6rem] xs:-mt-[7rem] sm:-mt-[10rem] md:-mt-[12rem] lg:-mt- z-[52]">
              <SkipTurn />
            </div>
            <div className="-mt-[2rem] xs:-mt-[2.5rem] sm:-mt-[4rem] md:-mt-[5rem] lg:-mt-[6rem] relative z-[50]">
              <div className="scale-[1] xs:scale-[1] origin-center">
                <Hand />
              </div>
            </div>
            <div className="scale-[0.7] xs:scale-[0.7] md:-mt-[15rem] origin-right z-[52]">
              <RequestDraw />
            </div>
          </div>
        </>
      )
      }

      {/* Game Busy - Centrado */}
      {
        gameBusy && (
          <div className="flex items-center justify-center h-full">
            <h1 className="text-center text-white px-4 text-lg">
              Game is busy. Please try again later.
            </h1>
          </div>
        )
      }

      {/* Modales - Sin cambios en funcionalidad */}
      {gameStartModal && !gameOver && (
        <div className="relative z-[60]">
          <GameStartModal />
        </div>
      )}
      {turnModal && !gameOver && (
        <div className="relative z-[60]">
          <TurnModal />
        </div>
      )}
      {battleModal && !gameOver && (
        <div className="relative z-[60]">
          <BattleModal />
        </div>
      )}
      {gameOver && (
        <div className="relative z-[60]">
          <EndGameModal amIP1={amIP1} winner={gameResult} />
        </div>
      )}
    </div >
  )
}