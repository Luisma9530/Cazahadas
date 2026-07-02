import { useRef, useEffect } from "react";
import socket from "../socket";
import { Tile } from "../@types/Tile";
import Hand from "../components/Hand";
import useBoardStore from "../store/BoardStore";
import useNeoHandStore from "../store/NeoHandStore";
import useTurnStore from "../store/TurnStore";
import useCardStore from "../store/CardStore"; // Para la carta seleccionada
import Card from "../components/Card";
import { CardInfo, CardType, CardUnity } from "../@types/Card";
import { useParams } from "react-router-dom";
import { useAuthStore } from '../store/LoginStore';
import './BoardCss/main-styles.css';

/**
 * Componente principal del tablero de juego.
 * Gestiona la representación visual del tablero 3x5, la interacción del jugador
 * con las casillas, la lógica de colocación de cartas, y la comunicación con el
 * servidor mediante eventos Socket.IO. Sincroniza el estado del juego con BoardStore,
 * TurnStore, CardStore y NeoHandStore, y registra los listeners de Socket.IO
 * necesarios para recibir actualizaciones del servidor.
 *
 * @param {boolean} amIP1 - Indica si el jugador local es el Jugador 1.
 *   Determina la perspectiva visual del tablero y la lógica de captura de hadas.
 */
export default function Board({ amIP1 }: { amIP1: boolean }) {
  // Obtenemos el estado del tablero (estructura 3x4) desde el store
  const [tiles, setTiles, clearDeckAndMagic, resetVariableX] = useBoardStore((state) => [state.board, state.setBoard, state.clearDeckAndMagic, state.resetVariableX]);
  // Carta seleccionada para colocar en la zona de juego
  const [selectedCard, resetSelectedCard] = useCardStore((state) => [
    state.selectedCards,
    state.resetSelectedCards,
  ]);
  const [isMyTurn, isMyFirstTurn, isBattle, setIsBattle, setIsMyFirstTurn, isMyFirstTurnBattle, setIsMyFirstTurnBattle, showBattleModal, setShowBattleModal, setShowDrawModal] = useTurnStore((state) => [state.isMyTurn, state.isMyFirstTurn, state.isBattle, state.setIsBattle, state.setIsMyFirstTurn, state.isMyFirstTurnBattle, state.setIsMyFirstTurnBattle, state.showBattleModal, state.setShowBattleModal, state.setShowDrawModal]);

  const [placeCard, drawCard] = useNeoHandStore((state) => [state.placeCard, state.drawCard]);

  const [logedUser, token] = useAuthStore((state) => [state.logedUser, state.token]);

  const { id: gameId } = useParams<{ id: string }>();
  const API_URL = import.meta.env.VITE_API_URL;

  /**
   * Determina si una carta seleccionada puede colocarse en una posición concreta
   * del tablero según las reglas del juego y el estado actual de la partida.
   * Valida el turno activo, el tipo de carta, el estado de batalla, y las
   * restricciones específicas de cada tipo de casilla.
   *
   * @param {CardUnity[]} selectedCards - Array de cartas actualmente seleccionadas.
   * @param {Tile} position - Casilla del tablero sobre la que se intenta colocar la carta.
   * @param {number} rowIndex - Índice de fila de la casilla (0: rival, 1: central, 2: jugador).
   * @returns {boolean} True si la carta puede colocarse en la posición indicada,
   *   false en caso contrario.
   */
  function canAddCardToPosition(selectedCards: CardUnity[], position: Tile, rowIndex: number): boolean {
    if (!isMyTurn) {
      return false
    }
    if (selectedCards.length === 1) {
      const card = selectedCards[0];
      if (!card || !isMyTurn || showBattleModal) return false;
      if (isMyFirstTurnBattle) {
        return card.type == CardType.SHIELD && position.type != 'discard'; // Solo se pueden colocar cartas de defensa en el primer turno de batalla
      }
      if (rowIndex == 2) {
        switch (card.type) {
          case CardType.SHIELD:
            var defensePlaced = false;
            if ((tiles[0][0].type === 'deck' && tiles[0][0].cards.length > 0) ||
              (tiles[2][0].type === 'deck' && tiles[2][0].cards.length > 0 ||
                myDefenseCards.length > 0 || rivalDefenseCards.length > 0)
            ) {
              defensePlaced = true;
            }
            return (position.type === 'deck' && isBattle && !defensePlaced && !haveIStartedBattle()) || position.type === 'discard';
          case CardType.MAGIC:
            return position.type === 'discard';
          default:
            return false; // Si no conocemos el tipo no dejamos colocar
        }
      } else if (position.type === 'magic' && CardType.MAGIC === card.type) {
        return (isBattle);
      } else {
        if (CardType.CATCH === card.type) {
          return position.type === 'fairy' && !position.marked && !position.captured && !isBattle;
        } else {
          return false;
        }
      }
    } else if (selectedCards.length > 1) {
      return rowIndex == 2 && position.type === 'discard'
    } else { return false; } // Si no hay cartas seleccionadas, no se puede colocar nada
  }

  /**
   * Comprueba si el jugador local ha iniciado la batalla actual.
   * Recorre las casillas de hadas de la fila central buscando alguna marcada
   * por el jugador local, lo que indica que fue él quien colocó la carta de captura.
   *
   * @returns {boolean} True si el jugador local inició la batalla, false en caso contrario.
   */
  function haveIStartedBattle() {
    // Recorremos las casillas de hadas para ver si alguna está marcada por mí
    for (let colIndex = 0; colIndex < tiles[1].length - 1; colIndex++) {
      const tile = tiles[1][colIndex];
      if (tile.type === 'fairy' && tile.marked && tile.placedByPlayerOne === amIP1) {
        return true;
      }
    }
    return false;
  }

  let isAddingScore = false;

  /**
   * Envía una petición al proxy FastAPI para incrementar el contador de hadas
   * capturadas del jugador autenticado. Incluye un mecanismo de guardia para
   * evitar peticiones concurrentes duplicadas, liberando el bloqueo tras 1 segundo.
   * Solo se invoca cuando el jugador local está autenticado y captura un hada.
   */
  async function sendCapturedFairies() {
    if (isAddingScore) {
      console.log("⏳ Ya hay una petición en curso, ignorando...");
      return;
    }

    isAddingScore = true;

    try {
      const response = await fetch(`${API_URL}/add-score`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      console.log("Add-score response:", response);

      if (!response.ok) {
        console.error("❌ Error al guardar puntos en la base de datos:", await response.json());
      } else {
        console.log("✅ Puntos añadidos correctamente");
      }
    } catch (error) {
      console.error("❌ Error de red al enviar puntos:", error);
    } finally {
      setTimeout(() => {
        isAddingScore = false;
      }, 1000);
    }
  }


  /**
   * Gestiona el clic sobre una casilla del tablero.
   * Valida si la carta seleccionada puede colocarse en la posición indicada
   * mediante canAddCardToPosition. Si la validación es correcta, transforma
   * el tablero mediante mapPawns, actualiza BoardStore y NeoHandStore, y emite
   * el evento Socket.IO "place-card" al servidor con el nuevo estado del tablero.
   *
   * @param {Tile} position - Casilla del tablero sobre la que se ha hecho clic.
   * @param {number} rowIndex - Índice de fila de la casilla.
   * @param {number} colIndex - Índice de columna de la casilla.
   */
  function handleCellClick(position: Tile, rowIndex: number, colIndex: number) {
    console.log(tiles)
    console.log("Is battle:", isBattle);
    console.log("Im player 1:", amIP1);
    console.log("Is first turn battle:", isMyFirstTurnBattle);
    if (!selectedCard || !canAddCardToPosition(selectedCard, position, rowIndex)) return;
    // Lógica para colocar la carta. Se asume que mapPawns transforma la celda y actualiza el estado.
    const newTiles = mapPawns(selectedCard, rowIndex, colIndex, tiles, amIP1);
    for (const card of selectedCard) {
      placeCard(card);
    }
    console.log(newTiles)
    setTiles(newTiles);
    resetSelectedCard();
    socket.emit("place-card", { tiles: newTiles, gameId: gameId, isBattle: isBattle, selectedCard: selectedCard });
  }

  /**
   * Comprueba el estado de captura de las hadas marcadas en la fila central
   * y distribuye las cartas de hada capturadas en las casillas correspondientes
   * de cada jugador. Si el jugador local acumula dos o más hadas capturadas,
   * emite el evento Socket.IO "all-fairy-captured" para notificar la victoria.
   *
   * @param {Tile[][]} tiles - Estado actual del tablero.
   * @param {boolean} amIP1 - Indica si el jugador local es el Jugador 1.
   * @returns {Tile[][]} Nuevo estado del tablero con las casillas de hadas
   *   capturadas actualizadas.
   */
  function checkMarkedFairiesForCapture(
    tiles: Tile[][],
    amIP1: boolean
  ): Tile[][] {
    const newTiles = tiles.map((row) => row.map((tile) => ({ ...tile })));
    const cardsTop: CardInfo[] = [];    // Para casilla [0][1]
    const cardsBottom: CardInfo[] = []; // Para casilla [2][1]
    for (let colIndex = 0; colIndex < newTiles[1].length - 1; colIndex++) {
      const tile = newTiles[1][colIndex];
      if (tile.type === 'fairy') {
        if (
          !tile.marked &&
          tile.captured) {
          let fairySpecificCard: CardInfo;

          switch (colIndex) {
            case 0: // Hada en posición 0 (Hada Encarada)
              fairySpecificCard = {
                // Propiedades de la carta específica para hada 0
                name: "Hada Encarada",
                type: CardType.CATCH,
                text: "Hada Encarada",
                image: "/cartasPNG/Hada_encarada.jpg"

              };
              break;

            case 1: // Hada en posición 1 (Hada Malhablada)
              fairySpecificCard = {
                name: "Hada Malhablada",
                type: CardType.CATCH,
                text: "Hada Malhablada",
                image: "/cartasPNG/Hada_malhablada.jpg"
              };
              break;

            case 2: // Hada en posición 2 (Hada Resabiada)
              fairySpecificCard = {
                name: "Hada Resabiada",
                type: CardType.CATCH,
                text: "Hada Resabiada",
                image: "/cartasPNG/Hada_resabiada.jpg"
              };
              break;

            default:
              fairySpecificCard = tile.card!; // Fallback a la carta original
          }
          if (tile.placedByPlayerOne === amIP1) {
            if (newTiles[2][1].type === 'capturedFairies' && tile.card) {
              cardsBottom.push(fairySpecificCard);
            }
          } else {
            if (newTiles[0][1].type === 'capturedFairies' && tile.card) {
              cardsTop.push(fairySpecificCard);
            }
          }
        }
      }
    }
    if (newTiles[0][1].type === 'capturedFairies' && newTiles[2][1].type === 'capturedFairies') {
      newTiles[0][1].cards = cardsTop;
      newTiles[2][1].cards = cardsBottom;
    }

    if (cardsBottom.length >= 2) {
      socket.emit('all-fairy-captured', {
        reason: 'captured-two-fairies',
        winner: amIP1,
        gameId: gameId,
      });
    }

    return newTiles
  }

  // 1. Declarar los refs al inicio del componente (antes del useEffect)
  const amIP1Ref = useRef(amIP1);
  const logedUserRef = useRef(logedUser);
  const tilesRef = useRef(tiles);
  const gameIdRef = useRef(gameId);

  // 2. useEffect para mantener los refs actualizados
  /**
   * Efecto que mantiene actualizados los refs de las variables más relevantes
   * del componente. Se utiliza para evitar closures obsoletos en los listeners
   * de Socket.IO, garantizando que siempre accedan a los valores más recientes
   * de amIP1, logedUser, tiles y gameId.
   */
  useEffect(() => {
    amIP1Ref.current = amIP1;
    logedUserRef.current = logedUser;
    tilesRef.current = tiles;
    gameIdRef.current = gameId;
  }, [amIP1, logedUser, tiles, gameId]);

  /**
   * Efecto de inicialización del componente y registro de listeners de Socket.IO.
   * Se ejecuta una única vez al montar el componente. Roba la mano inicial de cartas,
   * elimina listeners previos para evitar duplicados, y registra los handlers para
   * los eventos: "update-tiles" (actualización del tablero tras finalizar batalla),
   * "request-draw-player" (solicitud de tablas del rival), "start-battle-player"
   * (inicio de batalla), "captured-fairy" (captura de hada) y
   * "end-first-turn-battle" (fin del primer turno de batalla).
   * Limpia todos los listeners al desmontar el componente.
   */
  useEffect(() => {
    // Ejecutar drawCard una vez al cargar el componente por primera vez
    drawCard(false);
    setIsMyFirstTurnBattle(false);

    const handleUpdateTiles = (data: { tiles: Tile[][] }) => {
      var updatedTiles = data.tiles.map((row) => row.map((tile) => ({ ...tile })));
      updatedTiles = checkMarkedFairiesForCapture(data.tiles, amIP1Ref.current);
      setTiles(updatedTiles);
      setIsBattle(false);
      setIsMyFirstTurnBattle(false);
      clearDeckAndMagic();
      resetVariableX();
    };

    const handleDrawRequest = (data: { amIP1: boolean }) => {
      setShowDrawModal(false)
      if (data.amIP1 != null && amIP1Ref.current != null && data.amIP1 !== amIP1Ref.current) {
        setShowDrawModal(true)
      }
    };

    const handleBattleStart = (data: { amIP1: boolean }) => {
      setIsBattle(true);
      setIsMyFirstTurnBattle(true);
      console.log("Battle started");
      console.log("amIP1:", data.amIP1, " | I am:", amIP1Ref.current);
      if (data.amIP1 !== amIP1Ref.current) {
        setShowBattleModal(true)
      } else {
        setIsMyFirstTurnBattle(false);
      }
    };

    const handleCapturedFairy = (data: { player: boolean }) => {
      if (amIP1Ref.current == data.player) {
        if (logedUserRef.current) {
          sendCapturedFairies()
        }
        if (tilesRef.current[2][1].type == "capturedFairies" && tilesRef.current[2][1].cards.length >= 2) {
          socket.emit('all-fairy-captured', {
            reason: 'captured-two-fairies',
            winner: amIP1Ref.current,
            gameId: gameIdRef.current,
          });
        }
      }
    };

    const handleEndFirstTurnBattle = () => {
      setIsMyFirstTurnBattle(false);
    };

    //Remover TODOS los listeners anteriores antes de registrar
    console.log("Limpiando todos los listeners anteriores");
    socket.off('update-tiles');
    socket.off('request-draw-player');
    socket.off('start-battle-player');
    socket.off('captured-fairy');
    socket.off('end-first-turn-battle');

    // Registrar los nuevos listeners
    socket.on('update-tiles', handleUpdateTiles);
    socket.on("request-draw-player", handleDrawRequest);
    socket.on("start-battle-player", handleBattleStart);
    socket.on("captured-fairy", handleCapturedFairy);
    socket.on("end-first-turn-battle", handleEndFirstTurnBattle);

    return () => {
      socket.off('update-tiles', handleUpdateTiles);
      socket.off("request-draw-player", handleDrawRequest);
      socket.off("start-battle-player", handleBattleStart);
      socket.off("captured-fairy", handleCapturedFairy);
      socket.off("end-first-turn-battle", handleEndFirstTurnBattle);
    };
  }, []);

  /**
   * Efecto que activa el indicador de primer turno de batalla cuando el estado
   * de batalla cambia a activo. Garantiza que isMyFirstTurnBattle se establezca
   * correctamente al inicio de cada nueva batalla.
   */
  useEffect(() => {
    if (isBattle) {
      setIsMyFirstTurnBattle(true);
    }
  }, [isBattle]);

  /**
   * Efecto que se ejecuta al cambiar el turno activo.
   * Actualiza el estado de captura de hadas en el tablero, gestiona el robo
   * de cartas según el estado de batalla, y marca el primer turno como completado
   * si corresponde.
   */
  useEffect(() => {
    var updatedTiles = tiles.map((row) => row.map((tile) => ({ ...tile })));

    updatedTiles = checkMarkedFairiesForCapture(tiles, amIP1);

    setTiles(updatedTiles);

    // Ejecutar la lógica de captura al iniciar turno
    if (!isMyFirstTurn) {
      drawCard(isBattle);
    } else {
      drawCard(isBattle)
      setIsMyFirstTurn(false)
    }
  }, [isMyTurn]);


  /**
   * Transforma el estado del tablero al colocar una carta en una casilla.
   * Aplica la lógica específica de cada tipo de carta: las cartas mágicas
   * se añaden a la casilla de magia y aplican su operación sobre la variable X;
   * las cartas defensivas se añaden a la casilla de defensa del jugador; las
   * cartas de captura marcan el hada como en disputa e inician la batalla
   * emitiendo el evento Socket.IO "start-battle".
   *
   * @param {CardUnity[]} cards - Array de cartas a colocar, se procesa solo la primera.
   * @param {number} rowIndex - Índice de fila de la casilla destino.
   * @param {number} colIndex - Índice de columna de la casilla destino.
   * @param {Tile[][]} currentTiles - Estado actual del tablero.
   * @param {boolean} amIP1 - Indica si el jugador local es el Jugador 1.
   * @returns {Tile[][]} Nuevo estado del tablero con la carta colocada.
   */
  function mapPawns(
    cards: CardUnity[],
    rowIndex: number,
    colIndex: number,
    currentTiles: Tile[][],
    amIP1: boolean
  ): Tile[][] {
    const newTiles = currentTiles.map((row) => row.slice());
    const currentTile = newTiles[rowIndex][colIndex];

    if (cards.length === 1) {
      const card = cards[0];
      switch (card.type) {
        case CardType.MAGIC:
          if (currentTile.type === 'magic') {
            newTiles[rowIndex][colIndex] = {
              ...currentTile,
              cards: [...(currentTile.cards || []), { ...card, placedByPlayerOne: amIP1 }],
            };
            if (newTiles[1][3].type === 'variableX' && newTiles[rowIndex][colIndex].type !== 'discard') {
              newTiles[1][3].value = card.operation(newTiles[1][3].value); // Aplicar la operación de la carta mágica a la variable X
            }
          }
          break;
        case CardType.SHIELD:
          if (currentTile.type === 'deck') {
            newTiles[rowIndex][colIndex] = {
              ...currentTile,
              cards: [...(currentTile.cards || []), { ...card, placedByPlayerOne: amIP1 }],
            };
          }
          break;

        case CardType.CATCH:
          if (currentTile.type === 'fairy') {
            if (!currentTile.captured && !currentTile.marked) { // Si la hada no ha sido capturada y no está marcada, se puede colocar la carta
              currentTile.marked = true; // Marcar la hada como seleccionada
              currentTile.placedByPlayerOne = amIP1; // Marcar la hada como seleccionada por el jugador 1 o 2
              newTiles[rowIndex][colIndex] = {
                ...currentTile,
                card: { ...card, placedByPlayerOne: amIP1 }, // Colocar la carta en la celda
              };
              setIsBattle(true); // Cambiar el estado de batalla a verdadero
              socket.emit("start-battle", {
                gameId: gameId,
                amIP1: amIP1
              });
            }
          }
          break;

        default:
          console.warn(`Tipo de carta no reconocido: ${(card as any).type}`);
          break;
      }
    }

    return newTiles;
  }

  /**
   * Determina si una casilla específica del tablero es una posición válida
   * para colocar la carta actualmente seleccionada.
   *
   * @param {number} row - Índice de fila de la casilla.
   * @param {number} col - Índice de columna de la casilla.
   * @param {CardUnity[]} selectedCards - Array de cartas actualmente seleccionadas.
   * @returns {boolean} True si la casilla es una posición válida, false en caso contrario.
   */
  const isCellValid = (row: number, col: number, selectedCards: CardUnity[]): boolean => {
    const validCells = getValidCellsFlexible(selectedCards);
    return validCells[row] && validCells[row][col];
  };

  /**
   * Genera las clases CSS de una casilla del tablero añadiendo el resaltado
   * visual cuando es una posición válida para colocar la carta seleccionada.
   * Las casillas válidas reciben efectos de brillo, animación y borde naranja.
   *
   * @param {number} row - Índice de fila de la casilla.
   * @param {number} col - Índice de columna de la casilla.
   * @param {CardUnity[]} selectedCards - Array de cartas actualmente seleccionadas.
   * @param {string} baseClasses - Clases CSS base de la casilla sin resaltado.
   * @returns {string} Cadena de clases CSS con o sin resaltado según validez.
   */
  const getCellHighlightClasses = (row: number, col: number, selectedCards: CardUnity[], baseClasses: string): string => {
    const isValid = isCellValid(row, col, selectedCards);

    if (isValid) {
      return `${baseClasses} relative  before:absolute before:-top-2 before:-right-2 before:text-2xl before:animate-bounce 
            after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r after:from-yellow-300 after:via-orange-300 after:to-yellow-300 
            after:opacity-30 after:animate-pulse after:rounded 
            ring-6 ring-orange-400 shadow-[0_0_30px_rgba(255,165,0,0.8)] transform scale-110 transition-all duration-300 z-20 
            border-4 border-yellow-300 animate-[wiggle_1s_ease-in-out_infinite]`;
    }

    return baseClasses;
  };

  /**
   * Define las reglas de posicionamiento válido para cada tipo de carta.
   * Devuelve un mapa con las coordenadas de fila y columna permitidas para
   * cartas de captura, magia, defensa y descarte.
   *
   * @returns {{ [key: string]: number[][] }} Mapa de tipo de carta a lista
   *   de coordenadas [fila, columna] permitidas.
   */
  const updateValidationRules = (): { [key: string]: number[][] } => {
    const rules = {
      CATCH: [[1, 0], [1, 1], [1, 2]], // Casillas de hadas
      MAGIC: [[1, 4]], // Casilla de magia del jugador
      SHIELD: [[2, 0]], // Casilla de defensa del jugador
      DISCARD: [[2, 2]], // Zona de descarte
    };

    return rules;
  };

  /**
   * Calcula una matriz de booleanos indicando qué casillas del tablero son
   * posiciones válidas para colocar la carta actualmente seleccionada.
   * Aplica las reglas de validación definidas en updateValidationRules y
   * verifica cada posición candidata mediante canAddCardToPosition.
   * La zona de descarte solo se marca como válida fuera de batalla.
   *
   * @param {CardUnity[]} selectedCards - Array de cartas actualmente seleccionadas.
   * @returns {boolean[][]} Matriz 3xN donde true indica que la casilla es
   *   una posición válida para colocar la carta.
   */
  const getValidCellsFlexible = (selectedCards: CardUnity[]): boolean[][] => {
    const validCells = Array(3).fill(null).map(() => Array(4).fill(false));

    if (selectedCards.length === 0) {
      return validCells;
    }

    const rules = updateValidationRules();

    // La zona de descarte solo es válida cuando NO estamos en batalla
    if (!isBattle) {
      rules.DISCARD.forEach(([row, col]) => {
        validCells[row][col] = true;
      });
    }

    // Si hay exactamente una carta, aplicar reglas específicas
    if (selectedCards.length === 1) {
      const card = selectedCards[0];
      const cardRules = rules[card.type.toUpperCase()];

      if (cardRules) {
        cardRules.forEach(([row, col]) => {
          if (canAddCardToPosition(selectedCards, tiles[row][col], row)) {
            validCells[row][col] = true;
          }
        });
      }
    }

    return validCells;
  };

  /**
   * Distribuye las cartas defensivas de ambas casillas de defensa del tablero
   * en dos arrays separados según quién las colocó: myDefenseCards contiene
   * las cartas del jugador local y rivalDefenseCards las del rival.
   * Esta separación permite renderizar cada carta en la casilla visual correcta
   * independientemente de su posición real en el array de tiles.
   */
  var myDefenseCards: CardInfo[] = [];
  var rivalDefenseCards: CardInfo[] = [];

  if (tiles[0][0].type === 'deck' && tiles[2][0].type === 'deck') {
    myDefenseCards = [
      ...(tiles[0][0].cards ?? []),
      ...(tiles[2][0].cards ?? [])
    ].filter(card => card.placedByPlayerOne === amIP1);


    rivalDefenseCards = [
      ...(tiles[0][0].cards ?? []),
      ...(tiles[2][0].cards ?? [])
    ].filter(card => card.placedByPlayerOne !== amIP1);
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Contenedor del tablero */}
      <div
        className="relative pointer-events-auto"
        style={{
          width: "1280px",
          height: "720px",
        }}
      >

        {/* HADAS CAPTURADAS - RIVAL (Esquina superior izquierda) */}
        <div className="absolute" style={{ top: '-72px', left: '-256px', width: '150px', height: '186px' }}>
          <div className="rival-cell-3d game-cell captured-fairies-cell flex items-center justify-center hover-container w-full h-full">
            <div className="fairy-particles"></div>
            <div className="fairy-capture-icon"></div>
            {tiles[0][1].type === 'capturedFairies' && (
              <span className="text-6xl sm:text-7xl font-bold text-green-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                style={{ fontFamily: "'MedievalSharp', 'cursive'" }}>
                {tiles[0][1].cards.length}
              </span>
            )}
          </div>
        </div>

        {/* DEFENSA RIVAL (Izquierda, arriba del centro) */}
        <div className="absolute" style={{ top: '15px', left: '10px', width: '219px', height: '325.5px' }}>
          <div className="rival-cell-3d defense-cell-castle game-cell flex items-center justify-center hover-container w-full h-full">
            <div className="defense-shield-icon"></div>
            {tiles[0][0].type === 'deck' && rivalDefenseCards.length > 0 && (
              <div className="relative w-full h-full">
                {rivalDefenseCards.slice(-3).map((card, i) => (
                  <div
                    key={i}
                    className="absolute top-0 left-0 group"
                    style={{ top: `${i * 4}px`, left: `${i * 2}px`, zIndex: i }}
                  >
                    <div className="w-48 h-64 overflow-hidden">
                      <Card placed card={card} amIP1={amIP1} />
                    </div>
                    {/* Zoom al hacer hover */}
                    <div className="absolute hidden group-hover:block z-[100]"
                      style={{
                        top: '0px',
                        left: '220px',
                        width: '300px',
                        height: '420px'
                      }}
                    >
                      <Card placed card={card} amIP1={amIP1} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* HADAS - RIVAL (Centro superior) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex gap-4" style={{ top: '144px' }}>
          {/* Hada 1 - Encarada */}
          <div
            className={getCellHighlightClasses(
              1,
              0,
              selectedCard,
              `middle-cell-3d game-cell relative flex items-center justify-center border cursor-pointer overflow-hidden
            ${tiles[1][0].type === 'fairy' && tiles[1][0].captured ? 'bg-gray-500' : 'bg-gray-200'}`
            )}
            style={{ width: '240px', height: '341px' }}
            onClick={() => handleCellClick(tiles[1][0], 1, 0)}
          >
            {tiles[1][0].type === 'fairy' && (
              <img
                src="/cartasPNG/Hada_encarada.jpg"
                alt="Fairy background"
                className={`absolute inset-0 w-full h-full object-cover z-0 ${tiles[1][0].captured ? 'grayscale opacity-50' : ''
                  }`}
              />
            )}
            <div className="relative z-10">
              {tiles[1][0].type === 'fairy' && tiles[1][0].card && !tiles[1][0].captured && (
                <div className="w-24 h-36">
                  <Card placed card={tiles[1][0].card} amIP1={amIP1} />
                </div>
              )}
            </div>
          </div>

          {/* Hada 2 - Malhablada */}
          <div
            className={getCellHighlightClasses(
              1,
              1,
              selectedCard,
              `middle-cell-3d game-cell relative flex items-center justify-center border cursor-pointer overflow-hidden
            ${tiles[1][1].type === 'fairy' && tiles[1][1].captured ? 'bg-gray-500' : 'bg-gray-200'}`
            )}
            style={{ width: '240px', height: '341px' }}
            onClick={() => handleCellClick(tiles[1][1], 1, 1)}
          >
            {tiles[1][1].type === 'fairy' && (
              <img
                src="/cartasPNG/Hada_malhablada.jpg"
                alt="Fairy background"
                className={`absolute inset-0 w-full h-full object-cover z-0 ${tiles[1][1].captured ? 'grayscale opacity-50' : ''
                  }`}
              />
            )}
            <div className="relative z-10">
              {tiles[1][1].type === 'fairy' && tiles[1][1].card && !tiles[1][1].captured && (
                <div className="w-24 h-36">
                  <Card placed card={tiles[1][1].card} amIP1={amIP1} />
                </div>
              )}
            </div>
          </div>

          {/* Hada 3 - Resabiada */}
          <div
            className={getCellHighlightClasses(
              1,
              2,
              selectedCard,
              `middle-cell-3d game-cell relative flex items-center justify-center border cursor-pointer overflow-hidden
            ${tiles[1][2].type === 'fairy' && tiles[1][2].captured ? 'bg-gray-500' : 'bg-gray-200'}`
            )}
            style={{ width: '240px', height: '341px' }}
            onClick={() => handleCellClick(tiles[1][2], 1, 2)}
          >
            {tiles[1][2].type === 'fairy' && (
              <img
                src="/cartasPNG/Hada_resabiada.jpg"
                alt="Fairy background"
                className={`absolute inset-0 w-full h-full object-cover z-0 ${tiles[1][2].captured ? 'grayscale opacity-50' : ''
                  }`}
              />
            )}
            <div className="relative z-10">
              {tiles[1][2].type === 'fairy' && tiles[1][2].card && !tiles[1][2].captured && (
                <div className="w-24 h-36">
                  <Card placed card={tiles[1][2].card} amIP1={amIP1} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* VARIABLE X (Derecha del centro de las hadas) */}
        <div className="absolute" style={{ top: '216px', right: '38px', width: '215px', height: '210px' }}>
          <div
            className="middle-cell-3d game-cell bg-transparent flex items-center justify-center border-0 cursor-pointer w-full h-full"
            onClick={() => handleCellClick(tiles[1][3], 1, 3)}
          >
            <span className="text-7xl font-bold text-green-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              style={{ fontFamily: "'MedievalSharp', 'cursive'" }}>
              {tiles[1][3].type === 'variableX' ? `X= ${tiles[1][3].value}` : "X"}
            </span>
          </div>
        </div>

        {/* MAGIA (Más a la derecha) */}
        <div className="absolute" style={{ top: '209px', right: '-128px', width: '147px', height: '218px' }}>
          <div
            className={getCellHighlightClasses(
              1,
              4,
              selectedCard,
              "player-cell-3d game-cell player-magic-cell magic-cell-background bg-blue-500 flex items-center justify-center border cursor-pointer hover-container w-full h-full"
            )}
            onClick={() => handleCellClick(tiles[1][4], 1, 4)}
          >
            {tiles[1][4].type === 'magic' && tiles[1][4].cards.length > 0 ? (
              <div className="relative w-full h-full">
                {tiles[1][4].cards.slice(-3).map((card, i) => (
                  <div
                    key={i}
                    className="absolute top-0 left-0"
                    style={{ top: `${i * 4}px`, left: `${i * 2}px`, zIndex: i }}
                  >
                    <div className="w-24 h-36 overflow-hidden">
                      <Card placed card={card} amIP1={amIP1} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div />
            )}
          </div>
        </div>

        {/* DEFENSA JUGADOR (Izquierda, abajo del centro) */}
        <div className="absolute" style={{ top: '350px', left: '10px', width: '219px', height: '325.5px' }}>
          <div
            className={getCellHighlightClasses(
              2,
              0,
              selectedCard,
              "player-cell-3d defense-cell-castle game-cell flex items-center justify-center cursor-pointer hover-container w-full h-full"
            )}
            onClick={() => handleCellClick(tiles[2][0], 2, 0)}
          >
            <div className="defense-shield-icon"></div>
            {tiles[2][0].type === 'deck' && myDefenseCards.length > 0 ? (
              <div className="relative w-full h-full">
                {myDefenseCards.slice(-3).map((card, i) => (
                  <div
                    key={i}
                    className="absolute top-0 left-0 group"
                    style={{ top: `${i * 4}px`, left: `${i * 2}px`, zIndex: i }}
                  >
                    <div className="w-48 h-64 overflow-hidden">
                      <Card placed card={card} amIP1={amIP1} />
                    </div>
                    {/* Zoom al hacer hover */}
                    <div className="absolute hidden group-hover:block z-[100]"
                      style={{
                        top: '0px',
                        left: '220px',
                        width: '300px',
                        height: '420px'
                      }}
                    >
                      <Card placed card={card} amIP1={amIP1} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div />
            )}
          </div>
        </div>

        {/* HADAS CAPTURADAS - JUGADOR (Esquina inferior izquierda) */}
        <div className="absolute" style={{ top: '540px', left: '-256px', width: '150px', height: '186px' }}>
          <div className="player-cell-3d game-cell captured-fairies-cell flex items-center justify-center hover-container w-full h-full">
            <div className="fairy-particles"></div>
            <div className="fairy-capture-icon"></div>
            {tiles[2][1].type === 'capturedFairies' && (
              <span className="text-7xl font-bold text-green-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                style={{ fontFamily: "'MedievalSharp', 'cursive'" }}>
                {tiles[2][1].cards.length}
              </span>
            )}
          </div>
        </div>

        {/* CALDERO - DESCARTES (Esquina inferior derecha) */}
        <div className="absolute" style={{ bottom: '36px', right: '-128px', width: '192px', height: '178px' }}>
          <div
            className={getCellHighlightClasses(
              2,
              2,
              selectedCard,
              "player-cell-3d discard-cell-cauldron flex items-center justify-center cursor-pointer hover-container w-full h-full"
            )}
            onClick={() => handleCellClick(tiles[2][2], 2, 2)}
          >
            <div className="discard-magical-smoke"></div>
            <div className="discard-magic-icon"></div>
            {tiles[2][2].type === 'discard' && tiles[2][2].cards.length > 0 ? (
              <div className="relative w-full h-full">
                {tiles[2][2].cards.slice(-3).map((card, i) => (
                  <div
                    key={i}
                    className="absolute top-0 left-0 discard-card-animation"
                    style={{ top: `${i * 2}px`, left: `${i * 2}px`, zIndex: i }}
                  >
                    <div className="w-full h-full overflow-hidden">
                      <Card placed card={card} amIP1={amIP1} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div />
            )}
          </div>
        </div>

        {/* Mano de cartas - Abajo fijo */}
        <div className="absolute left-1/2 -translate-x-1/2 z-50" style={{ bottom: '-30px' }}>
          <Hand />
        </div>
      </div>
    </div>
  );
}