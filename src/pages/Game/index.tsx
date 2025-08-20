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

export default function Game() {
  const [loading, setLoading] = useState(true)
  const [gameBusy, setGameBusy] = useState(false)
  const [isCopied, setIsCopied] = useState(false);

  const [isMyTurn, toggleTurn, setPlayerSkippedTurn, setIsBattle, isBattle, setIsMyFirstTurnBattle] = useTurnStore((state) => [state.isMyTurn, state.toggleTurn, state.setPlayerSkippedTurn, state.setIsBattle, state.isBattle, state.setIsMyFirstTurnBattle]);
  const [setBoard] = useBoardStore((state) => [state.setBoard])
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
      if (data?.playerDisconnected) {
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
        var playe1Fairies = 0
        var player2Fairies = 0
        if (data.tiles[0][1].type === 'capturedFairies') {
          player2Fairies = data.tiles[0][1].cards.length;
        }
        if (data.tiles[2][1].type === 'capturedFairies') {
          playe1Fairies = data.tiles[2][1].cards.length;
        }
        if (playe1Fairies > player2Fairies) {
          setGameResult(Result.PLAYER1WIN)
        } else if (playe1Fairies < player2Fairies) {
          setGameResult(Result.PLAYER2WIN)
        } else {
          setGameResult(Result.DRAW)
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
    <div className="h-full w-full overflow-hidden">

      {/* Loading State - Mantiene diseño original pero responsive */}
      {loading && (
        <div className="flex flex-col items-center gap-6 sm:gap-10 px-4 sm:px-0">
          <p className="text-center text-white text-lg sm:text-xl">
            Waiting for another player...
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
            title={`${isCopied ? 'Copied!' : 'Copy'}`}>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white font-bold break-all sm:break-normal">
              {gameId}
            </h1>
            <button
              className="cursor-pointer text-white hover:text-gray-300 transition-colors"
              onClick={() => handleGameIdClick(gameId)}
            >
              <FontAwesomeIcon icon={faCopy} size={"xl"} />
            </button>
          </div>
        </div>
      )}

      {/* Game Board - Mantiene estructura EXACTA original */}
      {shouldShowBoard && (
        <div>
          <div>
            <TurnIndicator />
          </div>
          <div className="scale-[0.7] xs:scale-[0.8] sm:scale-[0.5] md:scale-[0.6] lg:scale-[0.65] 
                          -mt-4 xs:-mt-6 sm:-mt-12 md:-mt-14 lg:-mt-[13rem] min-w-fit">
            <Board amIP1={amIP1} />
          </div>
          <div className="-mt-[6rem] xs:-mt-[7rem] sm:-mt-[10rem] md:-mt-[12rem] lg:-mt-">
            <SkipTurn />
          </div>
          <div className="-mt-[2rem] xs:-mt-[2.5rem] sm:-mt-[4rem] md:-mt-[5rem] lg:-mt-[6rem] relative z-50">
            <Hand />
          </div>
        </div>
      )}

      {/* Game Busy - Mantiene diseño original */}
      {gameBusy && (
        <h1 className="text-center px-4">Game is busy. Please try again later.</h1>
      )}

      {/* Modales - Sin cambios */}
      {gameStartModal && !gameOver && <GameStartModal />}
      {turnModal && !gameOver && <TurnModal />}
      {battleModal && !gameOver && <BattleModal />}
      {gameOver && <EndGameModal amIP1={amIP1} winner={gameResult} />}
    </div>
  )
}