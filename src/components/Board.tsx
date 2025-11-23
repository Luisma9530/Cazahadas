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

  // Validación para colocar carta en zona de juego
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
              (tiles[2][0].type === 'deck' && tiles[2][0].cards.length > 0)
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


  // Al hacer clic en una celda de la zona de juego (fila 1, columnas 0 a 2)
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
    setTiles(newTiles);
    resetSelectedCard();
    socket.emit("place-card", { tiles: newTiles, gameId: gameId, isBattle: isBattle, selectedCard: selectedCard });
  }

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
                image: "/cartasPNG/Hada_encarada.png"

              };
              break;

            case 1: // Hada en posición 1 (Hada Malhablada)
              fairySpecificCard = {
                name: "Hada Malhablada",
                type: CardType.CATCH,
                text: "Hada Malhablada",
                image: "/cartasPNG/Hada_malhablada.png"
              };
              break;

            case 2: // Hada en posición 2 (Hada Resabiada)
              fairySpecificCard = {
                name: "Hada Resabiada",
                type: CardType.CATCH,
                text: "Hada Resabiada",
                image: "/cartasPNG/Hada_resabiada.png"
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

    return newTiles
  }

  // 1. Declarar los refs al inicio del componente (antes del useEffect)
  const amIP1Ref = useRef(amIP1);
  const logedUserRef = useRef(logedUser);
  const tilesRef = useRef(tiles);
  const gameIdRef = useRef(gameId);

  // 2. useEffect para mantener los refs actualizados
  useEffect(() => {
    amIP1Ref.current = amIP1;
    logedUserRef.current = logedUser;
    tilesRef.current = tiles;
    gameIdRef.current = gameId;
  }, [amIP1, logedUser, tiles, gameId]);

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
        console.log("Battle modal shown");
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

    // ⚠️ IMPORTANTE: Remover TODOS los listeners anteriores antes de registrar
    console.log("🧹 Limpiando todos los listeners anteriores");
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

  useEffect(() => {
    if (isBattle) {
      setIsMyFirstTurnBattle(true);
    }
  }, [isBattle]);

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


  // Función para transformar el tablero al colocar una carta en la zona de juego.
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

  // Método para verificar si una casilla específica es válida
  const isCellValid = (row: number, col: number, selectedCards: CardUnity[]): boolean => {
    const validCells = getValidCellsFlexible(selectedCards);
    return validCells[row] && validCells[row][col];
  };

  // Método para obtener las clases CSS de una casilla según si es válida o no
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

  // Método adicional para personalizar las reglas de validación fácilmente
  const updateValidationRules = (): { [key: string]: number[][] } => {
    const rules = {
      CATCH: [[1, 0], [1, 1], [1, 2]], // Casillas de hadas
      MAGIC: [[1, 4]], // Casilla de magia del jugador
      SHIELD: [[2, 0]], // Casilla de defensa del jugador
      DISCARD: [[2, 2]], // Zona de descarte
    };

    return rules;
  };

  // Versión alternativa más flexible del método getValidCells
  // Versión alternativa más flexible del método getValidCells
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

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
      {/* Contenedor del tablero */}
      <div
        className="relative pointer-events-auto"
        style={{
          width: "1280px",
          height: "720px",
          transform: "scale(var(--board-scale))",
          transformOrigin: "center center",
          left: "-7%"
        }}
      >

        {/* HADAS CAPTURADAS - RIVAL (Esquina superior izquierda) */}
        <div className="absolute top-[-10%] left-[-20%] w-[120px] h-[150px] sm:w-[150px] sm:h-[186px]">
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
        <div className="absolute top-[10%] left-[8%] w-[100px] h-[150px] sm:w-[146px] sm:h-[217px]">
          <div className="rival-cell-3d defense-cell-castle game-cell flex items-center justify-center hover-container w-full h-full">
            <div className="defense-shield-icon"></div>
            {tiles[0][0].type === 'deck' && tiles[0][0].cards.length > 0 && (
              <div className="relative w-full h-full">
                {tiles[0][0].cards.slice(-3).map((card, i) => (
                  <div
                    key={i}
                    className="absolute top-0 left-0 group"
                    style={{ top: `${i * 4}px`, left: `${i * 2}px`, zIndex: i }}
                  >
                    <div className="w-20 h-28 sm:w-28 sm:h-40 overflow-hidden">
                      <Card placed card={card} amIP1={amIP1} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* HADAS - RIVAL (Centro superior) */}
        <div className="absolute top-[20%] left-1/2 transform -translate-x-1/2 flex gap-2 sm:gap-4">
          {/* Hada 1 - Encarada */}
          <div
            className={getCellHighlightClasses(
              1,
              0,
              selectedCard,
              `middle-cell-3d game-cell relative flex items-center justify-center border cursor-pointer overflow-hidden w-[240px] h-[341px]
              ${tiles[1][0].type === 'fairy' && tiles[1][0].captured ? 'bg-gray-500' : 'bg-gray-200'}`
            )}
            onClick={() => handleCellClick(tiles[1][0], 1, 0)}
          >
            {tiles[1][0].type === 'fairy' && !tiles[1][0].captured && (
              <img
                src="/cartasPNG/Hada_encarada.png"
                alt="Fairy background"
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
            )}
            <div className="relative z-10">
              {tiles[1][0].type === 'fairy' && tiles[1][0].card && (
                <div className="w-16 h-24 sm:w-24 sm:h-36">
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
              `middle-cell-3d game-cell relative flex items-center justify-center border cursor-pointer overflow-hidden w-[240px] h-[341px]
              ${tiles[1][1].type === 'fairy' && tiles[1][1].captured ? 'bg-gray-500' : 'bg-gray-200'}`
            )}
            onClick={() => handleCellClick(tiles[1][1], 1, 1)}
          >
            {tiles[1][1].type === 'fairy' && !tiles[1][1].captured && (
              <img
                src="/cartasPNG/Hada_malhablada.png"
                alt="Fairy background"
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
            )}
            <div className="relative z-10">
              {tiles[1][1].type === 'fairy' && tiles[1][1].card && (
                <div className="w-16 h-24 sm:w-24 sm:h-36">
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
              `middle-cell-3d game-cell relative flex items-center justify-center border cursor-pointer overflow-hidden w-[240px] h-[341px]
              ${tiles[1][2].type === 'fairy' && tiles[1][2].captured ? 'bg-gray-500' : 'bg-gray-200'}`
            )}
            onClick={() => handleCellClick(tiles[1][2], 1, 2)}
          >
            {tiles[1][2].type === 'fairy' && !tiles[1][2].captured && (
              <img
                src="/cartasPNG/Hada_resabiada.png"
                alt="Fairy background"
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
            )}
            <div className="relative z-10">
              {tiles[1][2].type === 'fairy' && tiles[1][2].card && (
                <div className="w-16 h-24 sm:w-24 sm:h-36">
                  <Card placed card={tiles[1][2].card} amIP1={amIP1} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* VARIABLE X (Derecha del centro de las hadas) */}
        <div className="absolute top-[30%] right-[3%] w-[215px] h-[210px]">
          <div
            className="middle-cell-3d game-cell bg-transparent flex items-center justify-center border-0 cursor-pointer w-full h-full"
            onClick={() => handleCellClick(tiles[1][3], 1, 3)}
          >
            <span className="text-6xl sm:text-7xl font-bold text-green-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              style={{ fontFamily: "'MedievalSharp', 'cursive'" }}>
              {tiles[1][3].type === 'variableX' ? `X= ${tiles[1][3].value}` : "X"}
            </span>
          </div>
        </div>

        {/* MAGIA (Más a la derecha) */}
        <div className="absolute top-[29%] right-[-10%] w-[147px] h-[218px]">
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
                    <div className="w-16 h-24 sm:w-24 sm:h-36 overflow-hidden">
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
        <div className="absolute top-[55%] left-[8%] w-[100px] h-[150px] sm:w-[146px] sm:h-[217px]">
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
            {tiles[2][0].type === 'deck' && tiles[2][0].cards.length > 0 ? (
              <div className="relative w-full h-full">
                {tiles[2][0].cards.slice(-3).map((card, i) => (
                  <div
                    key={i}
                    className="absolute top-0 left-0 group"
                    style={{ top: `${i * 4}px`, left: `${i * 2}px`, zIndex: i }}
                  >
                    <div className="w-20 h-28 sm:w-28 sm:h-40 overflow-hidden">
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
        <div className="absolute top-[75%] left-[-20%] w-[120px] h-[150px] sm:w-[150px] sm:h-[186px]">
          <div className="player-cell-3d game-cell captured-fairies-cell flex items-center justify-center hover-container w-full h-full">
            <div className="fairy-particles"></div>
            <div className="fairy-capture-icon"></div>
            {tiles[2][1].type === 'capturedFairies' && (
              <span className="text-6xl sm:text-7xl font-bold text-green-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                style={{ fontFamily: "'MedievalSharp', 'cursive'" }}>
                {tiles[2][1].cards.length}
              </span>
            )}
          </div>
        </div>

        {/* CALDERO - DESCARTES (Esquina inferior derecha) */}
        <div className="absolute bottom-[5%] right-[-10%] w-[140px] h-[130px] sm:w-[192px] sm:h-[178px]">
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
        <div className="fixed bottom-[17%] left-1/2 transform -translate-x-1/2 z-50"
          style={{ transform: 'translateX(-40%) scale(1)' }}>
          <Hand />
        </div>
      </div>
    </div>
  );
}