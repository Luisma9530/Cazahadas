import socket from "../socket"
import { useGameStore } from "../store/GameStore"
import useBoardStore from "../store/BoardStore";
import { AnimatePresence, motion } from 'framer-motion'
import useTurnStore from "../store/TurnStore"
import { useParams } from "react-router-dom"
import { useMemo } from "react";
import { Tile } from "../@types/Tile";

export default function SurrenderButton() {

    const [showDrawModal, showBattleModal] = useTurnStore((state) => [state.showDrawModal, state.showBattleModal])
    const [board] = useBoardStore((state) => [state.board])

    const [gameOver, amIP1] = useGameStore((state) => [state.gameOver, state.amIP1])

    const { id: gameId } = useParams<{ id: string }>()

    let casillasRelevantes: {
        casilla01: Tile;
        casilla21: Tile;
    } | null = null;

    // Extraemos solo los datos relevantes de las casillas que nos 
    if (board[0]?.[1].type == 'capturedFairies' && board[2]?.[1].type == 'capturedFairies') {
        casillasRelevantes = useMemo(() => ({
            casilla01: board[0]?.[1],
            casilla21: board[2]?.[1]
        }), [board[0]?.[1]?.cards?.length, board[0]?.[1]?.owner,
        board[2]?.[1]?.cards?.length, board[2]?.[1]?.owner]);
    }


    const imLosing = useMemo((): boolean => {
        let puntosP1 = 0;
        let puntosP2 = 0;

        // Casilla [0][1]
        const tile01 = board[0][1];
        if (tile01?.type === 'capturedFairies' && tile01.cards) {
            if (tile01.owner === 'playerOne') {
                puntosP1 += tile01.cards.length;
            } else if (tile01.owner === 'playerTwo') {
                puntosP2 += tile01.cards.length;
            }
        }

        // Casilla [2][1]
        const tile21 = board[2]?.[1];
        if (tile21?.type === 'capturedFairies' && tile21.cards) {
            if (tile21.owner === 'playerOne') {
                puntosP1 += tile21.cards.length;
            } else if (tile21.owner === 'playerTwo') {
                puntosP2 += tile21.cards.length;
            }
        }

        console.log(`Puntos - P1: ${puntosP1}, P2: ${puntosP2}`);

        if (amIP1) {
            return puntosP1 < puntosP2;
        } else {
            return puntosP2 < puntosP1;
        }
    }, [casillasRelevantes, amIP1]);

    function handleSurrender() {
        socket.emit('surrender', { gameId, amIP1 })
    }

    return (
        <div className="flex w-11/12 items-center justify-end p-2 h-20 relative z-[52] pointer-events-none">
            <AnimatePresence>
                {imLosing && !gameOver && !showBattleModal && !showDrawModal && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`-mt-20 text-4xl rounded-full bg-blue-50 hover:bg-blue-200 transition duration-200
                       shadow-xl cursor-pointer text-black border-4 border-blue-400 py-1 px-12 
                       pointer-events-auto relative z-[101]`}
                        onClick={handleSurrender}
                        type="button"
                    >
                        Surrender
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    )
}