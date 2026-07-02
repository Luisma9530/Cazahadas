import socket from "../socket"
import { useGameStore } from "../store/GameStore"
import useBoardStore from "../store/BoardStore";
import { AnimatePresence, motion } from 'framer-motion'
import useTurnStore from "../store/TurnStore"
import { useParams } from "react-router-dom"
import { useMemo } from "react";
import { Tile } from "../@types/Tile";

/**
 * Componente que muestra el botón de rendición cuando el jugador local
 * va perdiendo la partida. El botón solo es visible cuando el jugador tiene
 * menos hadas capturadas que el rival, la partida no ha finalizado, y no
 * hay ningún modal de batalla o de tablas activo. Al pulsarlo, emite el
 * evento Socket.IO "surrender" al servidor, que declara ganador al rival
 * y notifica el resultado a ambos jugadores.
 *
 * No recibe props. Obtiene el estado del tablero de BoardStore, el estado
 * del juego de GameStore, el estado de los modales de TurnStore, y el
 * identificador de sala de los parámetros de la URL.
 */
export default function SurrenderButton() {

    const [showDrawModal, showBattleModal] = useTurnStore((state) => [state.showDrawModal, state.showBattleModal])
    const [board] = useBoardStore((state) => [state.board])

    const [gameOver, amIP1] = useGameStore((state) => [state.gameOver, state.amIP1])

    const { id: gameId } = useParams<{ id: string }>()

    let casillasRelevantes: {
        casilla01: Tile;
        casilla21: Tile;
    } | null = null;

    /**
     * Extrae y memoriza las casillas de hadas capturadas de ambos jugadores
     * del tablero. Se recalcula únicamente cuando cambia el número de cartas
     * en dichas casillas, evitando recálculos innecesarios del resto del
     * componente.
     */
    if (board[0]?.[1].type == 'capturedFairies' && board[2]?.[1].type == 'capturedFairies') {
        casillasRelevantes = useMemo(() => ({
            casilla01: board[0]?.[1],
            casilla21: board[2]?.[1]
        }), [board[0]?.[1]?.cards?.length,
        board[2]?.[1]?.cards?.length]);
    }

    /**
     * Determina si el jugador local va perdiendo la partida comparando el número
     * de hadas capturadas por cada jugador. Recorre la fila central del tablero
     * contando las hadas capturadas según el valor de placedByPlayerOne y compara
     * los totales en función de la identidad del jugador local.
     * Se recalcula únicamente cuando cambia el número de hadas capturadas en las
     * casillas relevantes.
     *
     * @returns {boolean} True si el jugador local tiene menos hadas que el rival,
     *   false en caso contrario.
     */
    const imLosing = useMemo((): boolean => {
        let puntosP1 = 0;
        let puntosP2 = 0;

        for (let col = 0; col < board[1].length; col++) {
            const tile = board[1][col];

            // Verificar que sea una casilla de hada y esté capturada
            if (tile.type === 'fairy' && tile.captured) {
                if (tile.placedByPlayerOne === true) {
                    puntosP1++;
                } else if (tile.placedByPlayerOne === false) {
                    puntosP2++;
                }
            }
        }

        if (amIP1) {
            return puntosP1 < puntosP2;
        } else {
            return puntosP2 < puntosP1;
        }
    }, [casillasRelevantes]);

    /**
     * Emite al servidor la rendición del jugador local.
     * Envía el identificador de sala, la identidad del jugador y el estado
     * actual del tablero mediante el evento Socket.IO "surrender".
     */
    function handleSurrender() {
        socket.emit('surrender', { gameId, amIP1, board })
    }

    return (
        <div className="flex items-center justify-end relative pointer-events-none" style={{ width: '200px', height: '80px' }}>
            <AnimatePresence>
                {imLosing && !gameOver && !showBattleModal && !showDrawModal && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`rounded-full bg-blue-50 hover:bg-blue-200 transition duration-200
                       shadow-xl cursor-pointer text-black border-4 border-blue-400
                       pointer-events-auto relative`}
                        style={{
                            fontSize: '20px',      // Reducido de text-4xl (36px)
                            padding: '8px 48px',   // py-1 px-12 → valores fijos
                            marginTop: '-80px',    // -mt-20 → valor fijo
                            zIndex: 101
                        }}
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