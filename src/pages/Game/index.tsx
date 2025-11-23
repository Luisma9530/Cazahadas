import { useEffect, useState } from "react";
import Board from "../../components/Board";
import socket from "../../socket";
import { Tile } from "../../@types/Tile";
import useBoardStore from "../../store/BoardStore";
import { Result, useGameStore } from "../../store/GameStore";
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
import { CardUnity } from "../../@types/Card";
import BattleConfirmModal from "../../components/Modals/BattleStartModal.tsx";
import DrawConfirmModal from "../../components/Modals/DrawConfirmModal.tsx";
import RequestDraw from "../../components/drawGame.tsx";
import GameWrapper from "../../utils/GameWrapper.tsx";

export default function Game() {
  const [loading, setLoading] = useState(true)
  const [gameBusy, setGameBusy] = useState(false)
  const [isCopied, setIsCopied] = useState(false);

  const [isMyTurn, toggleTurn, setPlayerSkippedTurn, setIsBattle, isBattle, setIsMyFirstTurnBattle, showBattleModal, setShowBattleModal, showDrawModal, setShowDrawModal] = useTurnStore((state) => [state.isMyTurn, state.toggleTurn, state.setPlayerSkippedTurn, state.setIsBattle, state.isBattle, state.setIsMyFirstTurnBattle, state.showBattleModal, state.setShowBattleModal, state.showDrawModal, state.setShowDrawModal]);
  const [setBoard, board] = useBoardStore((state) => [state.setBoard, state.board])
  const [amIP1, setAmIP1, gameOver, setGameOver, setPlayerOneName, setPlayerTwoName, setPlayerDisconnected, setGameResult, gameResult] = useGameStore((state) => [state.amIP1, state.setAmIP1, state.gameOver, state.setGameOver, state.setPlayerOneName, state.setPlayerTwoName, state.setPlayerDisconnected, state.setGameResult, state.gameResult])

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
          const tile = row[1]; // Columna 1
          if (tile.type === 'capturedFairies' && tile.cards) {
            // Contar según el propietario de la casilla
            const fairyCount = tile.cards.length;

            if (tile.owner === 'playerOne') {
              player1Fairies += fairyCount;
            } else if (tile.owner === 'playerTwo') {
              player2Fairies += fairyCount;
            }
          }
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
      console.log("Player Result:", gameResult);

      if (data?.playerDisconnected) {
        setPlayerDisconnected(true)
        console.log("El oponente se ha desconectado.");

        // Solo establecer victoria por desconexión si no hay resultado previo
        if (gameResult === Result.NONE) {
          setGameResult(Result.PLAYER1WIN)
        }
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

      {/* Loading State */}
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
              className="cursor-pointer text-white hover:text-gray-300 transition-colors p-2 z-[55]"
              onClick={() => handleGameIdClick(gameId)}
            >
              <FontAwesomeIcon icon={faCopy} size={"lg"} />
            </button>
          </div>
        </div>
      )}

      {<div className="absolute z-[60] w-full max-w-md">
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
      }
      {
        <div className="absolute z-[60] w-full max-w-md">
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
        </div>
      }

      <GameWrapper>
        {/* Game Board - Diseño original para desktop, optimizado para móvil */}
        {shouldShowBoard && (
          <>
            <div className="fixed inset-0 flex items-center justify-center overflow-hidden relative">
              {/* Indicador de turno - Esquina superior derecha, por delante del tablero */}
              <div className="absolute top-4 md:top-8 right-4 md:right-8 lg:right-12 z-[54]">
                <TurnIndicator />
              </div>

              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: "scale(var(--board-scale))",
                  transformOrigin: "center center"
                }}
              >
                <Board amIP1={amIP1} />
              </div>

              {/* Botones FUERA del contenedor con scale */}
              <div className="fixed top-[45vh] right-0 scale-[0.8] z-[54]">
                <RequestDraw />
              </div>

              <div className="fixed top-[60vh] right-0 scale-[0.8] z-[54]">
                <SkipTurn />
              </div>

            </div>
          </>
        )
        }
      </GameWrapper >

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
      {
        gameStartModal && !gameOver && (
          <div className="relative z-[60]">
            <GameStartModal />
          </div>
        )
      }
      {
        turnModal && !gameOver && (
          <div className="relative z-[60]">
            <TurnModal />
          </div>
        )
      }
      {
        battleModal && !gameOver && (
          <div className="relative z-[60]">
            <BattleModal />
          </div>
        )
      }
      {
        gameOver && (
          <div className="relative z-[60]">
            <EndGameModal amIP1={amIP1} winner={gameResult} />
          </div>
        )
      }
    </div >
  )
}