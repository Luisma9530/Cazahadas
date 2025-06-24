import { useEffect, useState } from "react";
import Board from "../../components/Board";
import Hand from "../../components/Hand";
import socket from "../../socket";
import { Tile } from "../../@types/Tile";
import useBoardStore from "../../store/BoardStore";
import { Result, useGameStore } from "../../store/GameStore";
import { usePointStore } from "../../store/PointsStore";
import SkipTurn from "../../components/SkipTurn";
import { useModalStore } from "../../store/ModalStore";
import { GameStartModal } from "../../components/Modals/GameStartModal";
import { TurnModal } from "../../components/Modals/TurnModal";
import useTurnStore from "../../store/TurnStore";
import { EndGameModal } from "../../components/Modals/EndGameModal";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-regular-svg-icons";
import useBackgroundStore from "../../store/BackgroundStore";
import homeBackground from '../../assets/images/homeBackground.png';
import wizard from "../../assets/images/wizard.png";


export default function Game() {
  const [loading, setLoading] = useState(true)
  const [gameBusy, setGameBusy] = useState(false)
  const [isCopied, setIsCopied] = useState(false);

  const [isMyTurn, toggleTurn, setPlayerSkippedTurn, setIsBattle, isBattle] = useTurnStore((state) => [state.isMyTurn, state.toggleTurn, state.setPlayerSkippedTurn, state.setIsBattle, state.isBattle])
  const [setBoard] = useBoardStore((state) => [state.setBoard])
  const [amIP1, setAmIP1, gameOver, setGameOver, setPlayerOneName, setPlayerTwoName, setPlayerDisconnected, setGameResult, gameResult] = useGameStore((state) => [state.amIP1, state.setAmIP1, state.gameOver, state.setGameOver, state.setPlayerOneName, state.setPlayerTwoName, state.setPlayerDisconnected, state.setGameResult, state.gameResult])
  const [setPoints] = usePointStore((state) => [state.setPoints])
  const { setBackground } = useBackgroundStore();

  const { id: gameId } = useParams<{ id: string }>()

  const [gameStartModal, toggleGameStartModal, turnModal, toggleTurnModal] = useModalStore((state) => [state.gameStartModal, state.toggleGameStartModal, state.turnModal, state.toggleTurnModal])

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

    socket.on('new-turn', (data: { tiles: Tile[][], playerSkippedTurn: boolean, endBattle: boolean }) => {
      if (isBattle && data.endBattle) {
        setPlayerSkippedTurn(false)
        setIsBattle(false)
      } else {
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

    socket.on('game-end', (data) => {
      if (data?.playerDisconnected) {
        setPlayerDisconnected(true)
      }
      if (data?.reason === 'captured-two-fairies') {
        console.log(`¡Ganó ${data.winner} capturando dos hadas!`);
        setGameResult(data.winner === amIP1 ? Result.PLAYER1WIN : Result.PLAYER2WIN)
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
    <div className="h-full overflow-x-hidden w-full">
      {
        loading && <div className="flex flex-col items-center gap-10">
          <p className="text-center text-white text-xl">Waiting for another player...</p>
          <div className="flex gap-6" title={`${isCopied ? 'Copied!' : 'Copy'}`}>
            <h1 className="text-5xl text-white font-bold">{gameId}</h1>
            <button className="cursor-pointer text-white hover:text-gray-300 transition-colors" onClick={() => handleGameIdClick(gameId)}>
              <FontAwesomeIcon icon={faCopy} size={"xl"} />
            </button>
          </div>
        </div>
      }
      {
        shouldShowBoard &&
        <div>
          <div className="scale-[0.65] -mt-16">
            <Board amIP1={amIP1} />
          </div>
          <div className="-mt-[13rem]">
            <SkipTurn />
          </div>
          <div className="-mt-[6rem]">
            <Hand />
          </div>
        </div>
      }
      {
        gameBusy && <h1 className="text-center">Game is busy. Please try again later.</h1>
      }
      {gameStartModal && !gameOver && <GameStartModal />}
      {turnModal && !gameOver && <TurnModal />}
      {gameOver && <EndGameModal amIP1={amIP1} winner={gameResult} />}
    </div>
  )
}
