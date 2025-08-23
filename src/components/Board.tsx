import { useEffect } from "react";
import socket from "../socket";
import { Tile } from "../@types/Tile";
import useBoardStore from "../store/BoardStore";
import useNeoHandStore from "../store/NeoHandStore";
import useTurnStore from "../store/TurnStore";
import useCardStore from "../store/CardStore"; // Para la carta seleccionada
import Card from "../components/Card";
import { CardInfo, CardType, CardUnity } from "../@types/Card";
import { useParams } from "react-router-dom";
import { useAuthStore } from '../store/LoginStore';

export default function Board({ amIP1 }: { amIP1: boolean }) {
  // Obtenemos el estado del tablero (estructura 3x4) desde el store
  const [tiles, setTiles, clearDeckAndMagic] = useBoardStore((state) => [state.board, state.setBoard, state.clearDeckAndMagic]);
  // Carta seleccionada para colocar en la zona de juego
  const [selectedCard, resetSelectedCard] = useCardStore((state) => [
    state.selectedCards,
    state.resetSelectedCards,
  ]);
  const [isMyTurn, isMyFirstTurn, isBattle, setIsBattle, setIsMyFirstTurn, isMyFirstTurnBattle, setIsMyFirstTurnBattle] = useTurnStore((state) => [state.isMyTurn, state.isMyFirstTurn, state.isBattle, state.setIsBattle, state.setIsMyFirstTurn, state.isMyFirstTurnBattle, state.setIsMyFirstTurnBattle]);

  const [placeCard, drawCard] = useNeoHandStore((state) => [state.placeCard, state.drawCard]);

  const [logedUser, password] = useAuthStore((state) => [state.logedUser, state.password]);

  const { id: gameId } = useParams<{ id: string }>();
  const API_URL = import.meta.env.VITE_API_URL;

  var count = 0


  // Validación para colocar carta en zona de juego
  function canAddCardToPosition(selectedCards: CardUnity[], position: Tile, rowIndex: number): boolean {
    if (selectedCards.length === 1) {
      const card = selectedCards[0];
      if (!card || !isMyTurn) return false;
      if (rowIndex == 2) {
        switch (card.type) {
          case CardType.SHIELD:
            return position.type === 'deck' || position.type === 'discard';
          case CardType.MAGIC:
            return (position.type === 'magic' && isBattle) || position.type === 'discard';
          default:
            return false; // Si no conocemos el tipo no dejamos colocar
        }
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

  socket.on("start-battle", () => {
    setIsBattle(true);
    setIsMyFirstTurnBattle(true);
    console.log("Battle started");
  });

  socket.on("captured-fairy", (data: { player: boolean }) => {
    if (amIP1 == data.player) {
      if (logedUser) {
        sendCapturedFairies()
      }
      if (tiles[2][1].type == "capturedFairies" && tiles[2][1].cards.length >= 2) {
        console.log('Fin del juego: Capturadas dos hadas');
        socket.emit('all-fairy-captured', {
          reason: 'captured-two-fairies',
          winner: amIP1,
          gameId: gameId,
        });
      }
    }
  });

  socket.on("end-battle", () => {
    setIsBattle(false);
    setIsMyFirstTurnBattle(false);
    clearDeckAndMagic();
    if (tiles[1][3].type === 'variableX') {
      tiles[1][3].value = 0; // Resetear el valor de la variable X al terminar la batalla
    }
    console.log("Battle ended");
  });

  function mirrorBoard(tiles: Tile[][]): Tile[][] {
    // Cambia filas: 0 <-> 2, mantiene columnas
    return [
      tiles[2].map((col) => ({ ...col })), // fila 0 <- antes fila 2
      tiles[1].map((col) => ({ ...col })), // fila 1 igual
      tiles[0].map((col) => ({ ...col })), // fila 2 <- antes fila 0
    ];
  }

  socket.on("end-first-turn-battle", () => {
    setIsMyFirstTurnBattle(false);
  });

  async function sendCapturedFairies() {
    try {
      const response = await fetch(`${API_URL}/add-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          logedUser,
          password,
        }),
      });

      if (!response.ok) {
        console.error("❌ Error al guardar puntos en la base de datos:", await response.json());
      } else {
        console.log("✅ Puntos añadidos correctamente");
      }
    } catch (error) {
      console.error("❌ Error de red al enviar puntos:", error);
    }
  }


  // Al hacer clic en una celda de la zona de juego (fila 1, columnas 0 a 2)
  function handleCellClick(position: Tile, rowIndex: number, colIndex: number) {
    console.log(tiles)
    console.log("Is battle:", isBattle);
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
          if (tile.placedByPlayerOne === amIP1) {
            if (newTiles[2][1].type === 'capturedFairies' && tile.card) {
              cardsBottom.push(tile.card);
            }
          } else {
            if (newTiles[0][1].type === 'capturedFairies' && tile.card) {
              cardsTop.push(tile.card);
            }
          }
        }
      }
    }
    if (newTiles[0][1].type === 'capturedFairies' && newTiles[2][1].type === 'capturedFairies') {
      newTiles[0][1].cards = cardsTop;
      newTiles[2][1].cards = cardsBottom;
      console.log("Captured fairies updated:", newTiles[0][1].cards, newTiles[2][1].cards);
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

  useEffect(() => {
    // Ejecutar drawCard una vez al cargar el componente por primera vez
    drawCard(false);
    setIsMyFirstTurnBattle(false);

    const handleUpdateTiles = (data: { tiles: Tile[][] }) => {
      var updatedTiles = data.tiles.map((row) => row.map((tile) => ({ ...tile })));

      updatedTiles = checkMarkedFairiesForCapture(data.tiles, amIP1);

      setTiles(updatedTiles);
      
      console.log("Tiles updated:", updatedTiles);
      count += 1;
      console.log("Update count:", count);
    };

    socket.on('update-tiles', handleUpdateTiles);

    return () => {
      socket.off('update-tiles', handleUpdateTiles);
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
              socket.emit("start-battle", { gameId: gameId });
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
      return `${baseClasses} relative before:content-['✨'] before:absolute before:-top-2 before:-right-2 before:text-2xl before:animate-bounce 
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
      MAGIC: [[2, 3]], // Casilla de magia del jugador
      SHIELD: [[2, 0]], // Casilla de defensa del jugador
      DISCARD: [[2, 2]], // Zona de descarte (siempre válida)
    };

    return rules;
  };

  // Versión alternativa más flexible del método getValidCells
  const getValidCellsFlexible = (selectedCards: CardUnity[]): boolean[][] => {
    const validCells = Array(3).fill(null).map(() => Array(4).fill(false));

    if (selectedCards.length === 0) {
      return validCells;
    }

    const rules = updateValidationRules();

    // La zona de descarte siempre es válida
    rules.DISCARD.forEach(([row, col]) => {
      validCells[row][col] = true
    });

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

  // Renderizamos el tablero con la estructura 3x4.
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center p-2 sm:p-4">
      {/* Mesa de fondo */}
      <div className="absolute inset-0 table-background"></div>

      {/* Tablero de juego */}
      <div className="relative z-10 grid grid-rows-3 gap-1 p-4 sm:p-8 w-full max-w-2xl sm:max-w-4xl mx-auto">
        {/* Fila 0: Zona del Rival - Grid normal (AHORA ARRIBA) */}
        <div className="grid grid-cols-4 gap-1 sm:gap-2 auto-rows-[60px] sm:auto-rows-[100px] auto-cols-[48px] sm:auto-cols-[80px]">
          <div className="rival-cell-3d defense-cell-castle game-cell flex items-center justify-center hover-container">
            <div className="defense-shield-icon"></div>
            {tiles[0][0].type === 'deck' ? (
              tiles[0][0].cards.length > 0 ? (
                <div className="relative h-[60px] sm:h-[100px] w-[48px] sm:w-[80px]">
                  {tiles[0][0].cards.slice(-3).map((card, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-0 group"
                      style={{ top: `${i * 4}px sm:${i * 8}px`, zIndex: i }}
                    >
                      <div className="w-[48px] sm:w-[80px] h-[51px] sm:h-[85px] overflow-hidden">
                        <Card placed={true} card={card} amIP1={amIP1} />
                      </div>
                      {/* Hover preview individual para cada carta */}
                      <div className="absolute z-[9999] hidden sm:group-hover:block top-[-10px] left-[54px] sm:left-[90px]">
                        <div className="w-[72px] sm:w-[120px] h-[90px] sm:h-[150px] border bg-white shadow-lg rounded p-1">
                          <Card placed={true} card={card} amIP1={amIP1} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[8px] sm:text-xs font-bold text-center text-stone-100">
                  DEFENSA<br />DEL HADA
                </div>
              )
            ) : (
              <div className="text-[8px] sm:text-xs font-bold text-center text-stone-100">
                DEFENSA<br />DEL HADA
              </div>
            )}
          </div>

          <div className="rival-cell-3d game-cell captured-fairies-cell rival-captured-fairies-cell flex items-center justify-center hover-container">
            <div className="fairy-particles"></div>
            <div className="fairy-capture-icon"></div>
            {tiles[0][1].type === 'capturedFairies' ? (
              tiles[0][1].cards.length > 0 ? (
                <div className="relative h-[60px] sm:h-[100px] w-[48px] sm:w-[80px]">
                  {tiles[0][1].cards.slice(-3).map((card, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-0 group"
                      style={{ top: `${i * 4}px sm:${i * 8}px`, zIndex: i }}
                    >
                      <div className="w-[48px] sm:w-[80px] h-[51px] sm:h-[85px] overflow-hidden">
                        <Card placed={true} card={card} amIP1={amIP1} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="captured-fairies-text text-[8px] sm:text-xs">Captured<br />Fairies</div>
              )
            ) : (
              <span className="text-[8px] sm:text-xs">Captured Fairies</span>
            )}
          </div>

          <div className="rival-cell-3d game-cell rival-magic-cell bg-red-500 flex items-center justify-center border hover-container">
            <div className="dark-particles"></div>
            <div className="magical-energy"></div>
            <div className="magic-runes"></div>
            <div className="grimoire-symbol"></div>
            <div className="magic-power-icon"></div>
            {tiles[0][3].type === 'magic' ? (
              tiles[0][3].cards.length > 0 ? (
                <div className="relative h-[60px] sm:h-[100px] w-[48px] sm:w-[80px]">
                  {tiles[0][3].cards.slice(-3).map((card, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-0 group hover-trigger"
                      style={{ top: `${i * 4}px sm:${i * 8}px`, zIndex: i }}
                    >
                      <div className="w-[48px] sm:w-[80px] h-[51px] sm:h-[85px] overflow-hidden">
                        <Card placed={true} card={card} amIP1={amIP1} />
                      </div>
                      {/* Hover preview individual para cada carta */}
                      <div className="absolute z-[9999] hidden sm:group-hover:block top-[-10px] left-[60px] sm:left-[100px]">
                        <div className="w-[72px] sm:w-[120px] h-[90px] sm:h-[150px] border bg-white shadow-lg rounded p-1">
                          <Card placed={true} card={card} amIP1={amIP1} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="magic-text text-[8px] sm:text-xs">
                  Dark<br />Magics
                </div>
              )
            ) : (
              <div className="magic-text text-[8px] sm:text-xs">
                Dark<br />Magics
              </div>
            )}
          </div>
        </div>

        {/* Fila 1: Zona de juego - CASILLAS MÁS GRANDES (SIGUE EN EL MEDIO) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 auto-rows-[84px] sm:auto-rows-[140px] auto-cols-[66px] sm:auto-cols-[110px] justify-center mb-2 sm:mb-4 -mt-4 sm:-mt-7">
          <div
            className={getCellHighlightClasses(1, 0, selectedCard,
              `middle-cell-3d game-cell flex items-center justify-center border cursor-pointer
              ${tiles[1][0].type === 'fairy' && tiles[1][0].captured
                ? 'bg-gray-500'
                : 'bg-gray-200'}`
            )}
            onClick={() => handleCellClick(tiles[1][0], 1, 0)}
          >
            {tiles[1][0].type === 'fairy' && tiles[1][0].card ? (
              <div className="w-[57px] sm:w-[95px] h-[75px] sm:h-[125px]">
                <Card placed={true} card={tiles[1][0].card} amIP1={amIP1} />
              </div>
            ) : (
              <span className="text-xs sm:text-base font-semibold">Fairy 1</span>
            )}
          </div>

          <div
            className={getCellHighlightClasses(1, 1, selectedCard,
              `middle-cell-3d game-cell flex items-center justify-center border cursor-pointer
              ${tiles[1][1].type === 'fairy' && tiles[1][1].captured
                ? 'bg-gray-500'
                : 'bg-gray-200'}`
            )}
            onClick={() => handleCellClick(tiles[1][1], 1, 1)}
          >
            {tiles[1][1].type === 'fairy' && tiles[1][1].card ? (
              <div className="w-[72px] sm:w-[120px] h-[96px] sm:h-[160px]">
                <Card placed={true} card={tiles[1][1].card} amIP1={amIP1} />
              </div>
            ) : (
              <span className="text-xs sm:text-base font-semibold">Fairy 2</span>
            )}
          </div>

          <div
            className={getCellHighlightClasses(1, 2, selectedCard,
              `middle-cell-3d game-cell flex items-center justify-center border cursor-pointer
              ${tiles[1][2].type === 'fairy' && tiles[1][2].captured
                ? 'bg-gray-500'
                : 'bg-gray-200'}`
            )}
            onClick={() => handleCellClick(tiles[1][2], 1, 2)}
          >
            {tiles[1][2].type === 'fairy' && tiles[1][2].card ? (
              <div className="w-[72px] sm:w-[120px] h-[96px] sm:h-[160px]">
                <Card placed={true} card={tiles[1][2].card} amIP1={amIP1} />
              </div>
            ) : (
              <span className="text-xs sm:text-base font-semibold">Fairy 3</span>
            )}
          </div>

          <div
            className="middle-cell-3d game-cell bg-yellow-300 flex items-center justify-center border cursor-pointer"
            onClick={() => handleCellClick(tiles[1][3], 1, 3)}
          >
            <span className="text-lg sm:text-xl font-bold">
              {tiles[1][3].type === 'variableX'
                ? tiles[1][3].value
                : "X"}
            </span>
          </div>
        </div>

        {/* Fila 2: Zona del Jugador - Grid normal (AHORA ABAJO) */}
        <div className="grid grid-cols-4 gap-1 sm:gap-2 auto-rows-[60px] sm:auto-rows-[100px] auto-cols-[48px] sm:auto-cols-[80px] -mt-3 sm:-mt-5">
          <div
            className={getCellHighlightClasses(2, 0, selectedCard,
              "player-cell-3d defense-cell-castle game-cell flex items-center justify-center cursor-pointer hover-container"
            )}
            onClick={() => handleCellClick(tiles[2][0], 2, 0)}
          >
            <div className="defense-shield-icon"></div>
            {tiles[2][0].type === 'deck' ? (
              tiles[2][0].cards.length > 0 ? (
                <div className="relative h-[60px] sm:h-[100px] w-[48px] sm:w-[80px]">
                  {tiles[2][0].cards.slice(-3).map((card, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-0 group hover-trigger"
                      style={{ top: `${i * 7}px sm:${i * 12}px`, zIndex: i }}
                    >
                      <div className="w-[48px] sm:w-[80px] h-[51px] sm:h-[85px] overflow-hidden">
                        <Card placed={true} card={card} amIP1={amIP1} />
                      </div>
                      {/* Hover preview individual para cada carta */}
                      <div className="absolute z-[9999] hidden sm:group-hover:block top-[-10px] left-[54px] sm:left-[90px]">
                        <div className="w-[72px] sm:w-[120px] h-[90px] sm:h-[150px] border bg-white shadow-lg rounded p-1">
                          <Card placed={true} card={card} amIP1={amIP1} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[8px] sm:text-xs font-bold text-center text-stone-100">
                  DEFENSA<br />DEL JUGADOR
                </div>
              )
            ) : (
              <div className="text-[8px] sm:text-xs font-bold text-center text-stone-100">
                DEFENSA<br />DEL JUGADOR
              </div>
            )}
          </div>

          <div className="player-cell-3d game-cell captured-fairies-cell player-captured-fairies-cell flex items-center justify-center hover-container">
            <div className="fairy-particles"></div>
            <div className="fairy-capture-icon"></div>
            {tiles[2][1].type === 'capturedFairies' ? (
              tiles[2][1].cards.length > 0 ? (
                <div className="relative h-[78px] sm:h-[130px] w-[60px] sm:w-[100px]">
                  {tiles[2][1].cards.slice(-3).map((card, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-0 group"
                      style={{ top: `${i * 4}px sm:${i * 8}px`, zIndex: i }}
                    >
                      <div className="w-[48px] sm:w-[80px] h-[51px] sm:h-[85px] overflow-hidden">
                        <Card placed={true} card={card} amIP1={amIP1} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="captured-fairies-text text-[8px] sm:text-xs">Captured<br />Fairies</div>
              )
            ) : (
              <div className="captured-fairies-text text-[8px] sm:text-xs">Captured<br />Fairies</div>
            )}
          </div>

          <div
            className={getCellHighlightClasses(2, 2, selectedCard,
              "player-cell-3d game-cell discard-cell-cauldron player-discard-cell flex items-center justify-center border cursor-pointer hover-container"
            )}
            onClick={() => handleCellClick(tiles[2][2], 2, 2)}
          >
            <div className="discard-magical-smoke"></div>
            <div className="discard-magic-icon"></div>
            {tiles[2][2].type === 'discard' ? (
              tiles[2][2].cards.length > 0 ? (
                <div className="relative h-[78px] sm:h-[130px] w-[60px] sm:w-[100px]">
                  {tiles[2][2].cards.slice(-3).map((card, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-0 group hover-trigger discard-card-animation"
                      style={{ top: `${i * 7}px sm:${i * 12}px`, zIndex: i }}
                    >
                      <div className="w-[60px] sm:w-[100px] h-[63px] sm:h-[105px] overflow-hidden">
                        <Card placed={true} card={card} amIP1={amIP1} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="discard-text text-[8px] sm:text-xs">Mi Caldero</span>
              )
            ) : (
              <span className="discard-text text-[8px] sm:text-xs">Mi Caldero</span>
            )}
          </div>

          <div
            className={getCellHighlightClasses(2, 3, selectedCard,
              "player-cell-3d game-cell player-magic-cell bg-blue-500 flex items-center justify-center border cursor-pointer hover-container"
            )}
            onClick={() => handleCellClick(tiles[2][3], 2, 3)}
          >
            <div className="player-light-particles"></div>
            <div className="player-magical-energy"></div>
            <div className="player-magic-runes"></div>
            <div className="player-grimoire-symbol"></div>
            <div className="player-magic-power-icon"></div>
            {tiles[2][3].type === 'magic' ? (
              tiles[2][3].cards.length > 0 ? (
                <div className="relative h-[78px] sm:h-[130px] w-[60px] sm:w-[100px]">
                  {tiles[2][3].cards.slice(-3).map((card, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-0 group hover-trigger"
                      style={{ top: `${i * 7}px sm:${i * 12}px`, zIndex: i }}
                    >
                      <div className="w-[60px] sm:w-[100px] h-[63px] sm:h-[105px] overflow-hidden">
                        <Card placed={true} card={card} amIP1={amIP1} />
                      </div>
                      {/* Hover preview individual para cada carta */}
                      <div className="absolute z-[9999] hidden sm:group-hover:block top-[-10px] left-[60px] sm:left-[100px]">
                        <div className="w-[72px] sm:w-[120px] h-[90px] sm:h-[150px] border bg-white shadow-lg rounded p-1">
                          <Card placed={true} card={card} amIP1={amIP1} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="player-magic-text text-[8px] sm:text-xs">
                  Sacred<br />Magics
                </div>
              )
            ) : (
              <div className="player-magic-text text-[8px] sm:text-xs">
                Sacred<br />Magics
              </div>
            )}
          </div>
        </div>


        {/* Estilos CSS actualizados */}
        <style>{`
      /* Mesa de fondo con textura de madera - AJUSTADA PARA ESTAR MÁS ARRIBA */
      .table-background {
        background: 
          /* Patas de la mesa (sombras en las esquinas) */
          radial-gradient(ellipse 100px 200px at 10% 90%, rgba(74, 44, 29, 0.8) 0%, transparent 60%),
          radial-gradient(ellipse 100px 200px at 90% 90%, rgba(74, 44, 29, 0.8) 0%, transparent 60%),
          radial-gradient(ellipse 80px 150px at 15% 85%, rgba(54, 32, 19, 0.6) 0%, transparent 50%),
          radial-gradient(ellipse 80px 150px at 85% 85%, rgba(54, 32, 19, 0.6) 0%, transparent 50%),
          
          /* Borde de la mesa visible */
          linear-gradient(
            180deg,
            transparent 0%,
            transparent 70%,
            rgba(74, 44, 29, 0.8) 80%,
            rgba(54, 32, 19, 1) 90%,
            rgba(74, 44, 29, 0.9) 100%
          ),
          
          /* Vetas de la madera con perspectiva */
          repeating-linear-gradient(
            75deg,
            #4A2C1D 0px,
            #5D2F1A 12px,
            #6B3621 24px,
            #5D2F1A 36px,
            #4A2C1D 48px
          ),
          
          /* Textura base de madera */
          linear-gradient(
            165deg,
            #8B4513 0%,
            #6B3621 25%,
            #5D2F1A 50%,
            #6B3621 75%,
            #A0522D 100%
          ),
          
          /* Nudos y marcas naturales */
          radial-gradient(ellipse 400px 150px at 30% 40%, rgba(139, 69, 19, 0.7) 0%, transparent 60%),
          radial-gradient(ellipse 250px 100px at 70% 60%, rgba(107, 54, 33, 0.5) 0%, transparent 50%),
          radial-gradient(ellipse 180px 80px at 50% 30%, rgba(93, 47, 26, 0.6) 0%, transparent 50%);
        
        background-size: 
          200px 300px,
          200px 300px,
          150px 250px,
          150px 250px,
          100% 100%,
          120px 100%,
          100% 100%,
          800px 500px,
          400px 300px,
          300px 200px;
        
        background-position:
          0% 100%,
          100% 100%,
          5% 95%,
          95% 95%,
          0 0,
          0 0,
          0 0,
          0 0,
          100% 100%,
          50% 80%;
        
        /* Perspectiva ajustada - menos inclinación y más arriba */
        transform: perspective(800px) rotateX(60deg) translateY(-50px);
        transform-origin: center center;
        
        /* Efectos de profundidad y realismo */
        box-shadow: 
          inset 0 0 300px rgba(74, 44, 29, 0.3),
          inset 0 -50px 100px rgba(54, 32, 19, 0.4),
          0 20px 40px rgba(0, 0, 0, 0.6);
        
        /* Acabado satinado */
        filter: contrast(1.15) brightness(0.9) saturate(1.1);
      }
      
      /* Bordes redondeados para todas las casillas */
      .game-cell {
        border-radius: 12px;
        border: 2px solid rgba(0,0,0,0.1);
        backdrop-filter: blur(1px);
        /* Sombra más sutil para integrar mejor con la mesa */
        box-shadow: 
          0 2px 8px rgba(0, 0, 0, 0.15),
          inset 0 1px 2px rgba(255, 255, 255, 0.1);
      }

      /* Eliminar el blur del backdrop cuando hay hover activo */
      .game-cell:hover {
        backdrop-filter: none;
      }
      
      /* SOLUCIÓN PARA EL HOVER - Contexto de apilamiento separado */
      .hover-container {
        /* Aislamos el contexto de apilamiento solo cuando hay hover */
        isolation: isolate;
      }
      
      .hover-container:hover {
        /* Elevamos solo cuando hay hover activo */
        z-index: 1000;
        position: relative;
      }
      
      /* Los previews de hover ahora usan un z-index muy alto */
      .hover-preview {
        z-index: 9999 !important;
        /* Añadimos una sombra más pronunciada para que destaque */
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3) !important;
        /* Aseguramos que el preview sea visible */
        pointer-events: none;
      }
      
      /* Activación del hover con CSS puro */
      .hover-trigger:hover + .hover-preview-container .hover-preview,
      .hover-trigger:hover ~ .hover-preview-container .hover-preview {
        display: block !important;
      }
      
      /* Perspectiva para la fila superior (rival) - ajustada */
      .rival-cell-3d {
        transform: perspective(600px) rotateX(15deg);
        transform-origin: bottom;
        transform-style: preserve-3d;
        transition: transform 0.3s ease;
      }
      
      .rival-cell-3d:hover {
        transform: perspective(1200px) rotateX(1deg) scale(1.02);
      }
      
      /* Perspectiva para la fila media (zona de juego) - menos inclinación */
      .middle-cell-3d {
        transform: perspective(1200px) rotateX(20deg);
        transform-origin: bottom center;
        transform-style: preserve-3d;
        transition: transform 0.3s ease;
      }
      
      .middle-cell-3d:hover {
        transform: perspective(1200px) rotateX(1deg) scale(1.02);
      }
      
      /* Perspectiva para la fila inferior (jugador) - moderada */
      .player-cell-3d {
        transform: perspective(800px) rotateX(25deg);
        transform-origin: bottom center;
        transform-style: preserve-3d;
        transition: transform 0.3s ease;
      }
      
      .player-cell-3d:hover {
        transform: perspective(1200px) rotateX(1deg) scale(1.02);
      }

      .defense-cell-castle {
        position: relative;
        border-radius: 8px;
    
        /* Marco de hierro forjado */
        border: 4px solid;
        [border-image]: linear-gradient(45deg, 
        #2c1810, #4a3728, #3d2f24, #2c1810, 
        #5a453a, #2c1810, #4a3728, #3d2f24
    ) 1;
    
    /* Fondo de muro de castillo */
    background: 
        /* Grietas y detalles */
        radial-gradient(ellipse 20px 5px at 20% 30%, rgba(0,0,0,0.3) 0%, transparent 70%),
        radial-gradient(ellipse 15px 3px at 70% 60%, rgba(0,0,0,0.2) 0%, transparent 70%),
        radial-gradient(ellipse 10px 8px at 85% 20%, rgba(0,0,0,0.25) 0%, transparent 60%),
        
        /* Patrón de bloques de piedra */
        repeating-linear-gradient(
            0deg,
            #8b7d6b 0px,
            #8b7d6b 25px,
            #756b5a 25px,
            #756b5a 27px
        ),
        repeating-linear-gradient(
            90deg,
            #8b7d6b 0px,
            #8b7d6b 40px,
            #756b5a 40px,
            #756b5a 42px
        ),
        
        /* Base de piedra */
        linear-gradient(135deg, 
            #a0927f 0%, 
            #8b7d6b 25%, 
            #756b5a 50%, 
            #8b7d6b 75%, 
            #9a8c79 100%
        );
    
    /* Sombras y profundidad */
    box-shadow: 
        0 0 0 2px #2c1810,
        0 0 0 4px #4a3728,
        inset 0 2px 4px rgba(0,0,0,0.3),
        inset 0 -2px 4px rgba(255,255,255,0.1),
        0 4px 12px rgba(0,0,0,0.4);
    
    transition: all 0.3s ease;
}

.defense-cell-castle:hover {
z-index: 9999 !important;
    transform: translateY(-2px);
    box-shadow: 
        0 0 0 2px #2c1810,
        0 0 0 4px #4a3728,
        inset 0 2px 4px rgba(0,0,0,0.3),
        inset 0 -2px 4px rgba(255,255,255,0.2),
        0 8px 20px rgba(0,0,0,0.5),
        0 0 15px rgba(218, 165, 32, 0.3);
}

.defense-cell-castle .hover-preview-container {
    /* Crear un contexto que permita salirse */
    position: static;
}

.defense-cell-castle .hover-preview-container .hover-preview {
    /* Posición absoluta respecto al documento, no a la casilla */
    position: fixed !important;
    z-index: 10000 !important;
}

/* Icono de escudo */
.defense-shield-icon {
    position: absolute;
    top: 8px;
    left: 8px;
    width: 32px;
    height: 32px;
    background: radial-gradient(ellipse at center, #daa520 30%, #b8860b 70%);
    border: 1px solid #8b7d6b;
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
    z-index: 10;
}

.defense-shield-icon::before {
    content: '🛡️';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 20px;
}

/* Casilla de descarte mágica - Caldero encantado */
.discard-cell-cauldron {
  position: relative;
  border-radius: 50%;
  overflow: visible;
  
  /* Fondo del caldero - metal oscuro encantado */
  background: 
    /* Brillo mágico interior */
    radial-gradient(ellipse 60% 40% at center 60%, 
      rgba(138, 43, 226, 0.4) 0%, 
      transparent 70%),
    
    /* Reflejos metálicos */
    radial-gradient(ellipse 30% 20% at 70% 30%, 
      rgba(255, 255, 255, 0.3) 0%, 
      transparent 60%),
    
    /* Oxidación y pátina */
    radial-gradient(ellipse 40% 30% at 20% 70%, 
      rgba(34, 139, 34, 0.2) 0%, 
      transparent 50%),
    
    /* Base metálica */
    linear-gradient(135deg, 
      #2c2c2c 0%, 
      #1a1a1a 25%, 
      #404040 50%, 
      #2c2c2c 75%, 
      #1a1a1a 100%);
  
  /* Sin borde - caldero liso */
  border: none;
  
  /* Sombras y profundidad */
  box-shadow: 
    /* Sombra exterior */
    0 8px 20px rgba(0, 0, 0, 0.6),
    /* Profundidad interior */
    inset 0 -10px 20px rgba(0, 0, 0, 0.8),
    inset 0 5px 15px rgba(255, 255, 255, 0.1),
    /* Brillo mágico sutil */
    0 0 20px rgba(138, 43, 226, 0.3);
  
  transition: all 0.4s ease;
}

.discard-cell-cauldron:hover {
  z-index: 9999 !important;
  transform: translateY(-3px) scale(1.05);
  
  /* Intensificar el brillo mágico al hacer hover */
  box-shadow: 
    0 12px 30px rgba(0, 0, 0, 0.7),
    inset 0 -10px 20px rgba(0, 0, 0, 0.8),
    inset 0 5px 15px rgba(255, 255, 255, 0.2),
    0 0 30px rgba(138, 43, 226, 0.6),
    0 0 50px rgba(75, 0, 130, 0.4);
}

/* Asas del caldero */
.discard-cell-cauldron::before,
.discard-cell-cauldron::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 30px;
  border: 3px solid #4a4a4a;
  border-radius: 50%;
  background: transparent;
  top: 25%;
  z-index: 10;
}

.discard-cell-cauldron::before {
  left: -15px;
  border-right: none;
}

.discard-cell-cauldron::after {
  right: -15px;
  border-left: none;
}

/* Vapor/humo mágico */
.discard-magical-smoke {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 40px;
  z-index: 5;
  pointer-events: none;
  opacity: 0.6;
}

.discard-magical-smoke::before {
  content: '✨';
  position: absolute;
  font-size: 16px;
  animation: float 3s ease-in-out infinite;
  color: #dda0dd;
}

.discard-magical-smoke::after {
  content: '🌟';
  position: absolute;
  font-size: 12px;
  right: 10px;
  top: 10px;
  animation: float 2s ease-in-out infinite reverse;
  color: #9370db;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(180deg); }
}

/* Icono de descarte mágico */
.discard-magic-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: radial-gradient(ellipse at center, #dda0dd 30%, #9370db 70%);
  border: 1px solid #4a4a4a;
  border-radius: 50%;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.discard-magic-icon::before {
  content: '🗑️';
  filter: hue-rotate(270deg) saturate(1.5);
}

/* Efecto de ondas mágicas al hover */
.discard-cell-cauldron:hover .discard-magical-smoke {
  opacity: 1;
  animation: magical-pulse 2s ease-in-out infinite;
}

@keyframes magical-pulse {
  0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.2); }
}

/* Texto de descarte */
.discard-text {
  color: #dda0dd;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(221, 160, 221, 0.5);
  font-size: 0.9rem;
  z-index: 15;
  position: relative;
}

/* Animación de las cartas cayendo en el caldero */
.discard-card-animation {
  animation: fall-into-cauldron 0.8s ease-in-out;
}

@keyframes fall-into-cauldron {
  0% { 
    transform: translateY(-20px) rotate(0deg);
    opacity: 1;
  }
  50% { 
    transform: translateY(10px) rotate(180deg);
    opacity: 0.7;
  }
  100% { 
    transform: translateY(0) rotate(360deg);
    opacity: 1;
  }
}

/* Hover preview container mejorado */
.discard-cell-cauldron .hover-preview-container {
  position: static;
}

.discard-cell-cauldron .hover-preview-container .hover-preview {
  position: fixed !important;
  z-index: 10000 !important;
  /* Fondo mágico para el preview */
  background: linear-gradient(135deg, 
    rgba(138, 43, 226, 0.95) 0%, 
    rgba(75, 0, 130, 0.95) 100%);
  border: 2px solid #dda0dd;
  border-radius: 12px;
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.8),
    0 0 20px rgba(138, 43, 226, 0.6);
}

/* Aplicar a la casilla rival también */
.rival-discard-cell {
  /* Mismo estilo pero con colores ligeramente diferentes para el rival */
  background: 
    radial-gradient(ellipse 60% 40% at center 60%, 
      rgba(220, 20, 60, 0.4) 0%, 
      transparent 70%),
    radial-gradient(ellipse 30% 20% at 70% 30%, 
      rgba(255, 255, 255, 0.3) 0%, 
      transparent 60%),
    radial-gradient(ellipse 40% 30% at 20% 70%, 
      rgba(139, 69, 19, 0.2) 0%, 
      transparent 50%),
    linear-gradient(135deg, 
      #2c2c2c 0%, 
      #1a1a1a 25%, 
      #404040 50%, 
      #2c2c2c 75%, 
      #1a1a1a 100%);
  
  box-shadow: 
    0 8px 20px rgba(0, 0, 0, 0.6),
    inset 0 -10px 20px rgba(0, 0, 0, 0.8),
    inset 0 5px 15px rgba(255, 255, 255, 0.1),
    0 0 20px rgba(220, 20, 60, 0.3);
}

.rival-discard-cell .discard-text {
  color: #ff6b6b;
  text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
}

/* Aplicar a la casilla del jugador también */
.player-discard-cell {
  /* Mismo estilo base con colores azul/verde para el jugador */
  background: 
    radial-gradient(ellipse 60% 40% at center 60%, 
      rgba(30, 144, 255, 0.4) 0%, 
      transparent 70%),
    radial-gradient(ellipse 30% 20% at 70% 30%, 
      rgba(255, 255, 255, 0.3) 0%, 
      transparent 60%),
    radial-gradient(ellipse 40% 30% at 20% 70%, 
      rgba(0, 191, 255, 0.2) 0%, 
      transparent 50%),
    linear-gradient(135deg, 
      #2c2c2c 0%, 
      #1a1a1a 25%, 
      #404040 50%, 
      #2c2c2c 75%, 
      #1a1a1a 100%);
  
  box-shadow: 
    0 8px 20px rgba(0, 0, 0, 0.6),
    inset 0 -10px 20px rgba(0, 0, 0, 0.8),
    inset 0 5px 15px rgba(255, 255, 255, 0.1),
    0 0 20px rgba(30, 144, 255, 0.3);
}

.player-discard-cell:hover {
  box-shadow: 
    0 12px 30px rgba(0, 0, 0, 0.7),
    inset 0 -10px 20px rgba(0, 0, 0, 0.8),
    inset 0 5px 15px rgba(255, 255, 255, 0.2),
    0 0 30px rgba(30, 144, 255, 0.6),
    0 0 50px rgba(0, 191, 255, 0.4);
}

.player-discard-cell .discard-text {
  color: #87ceeb;
  text-shadow: 0 0 10px rgba(135, 206, 235, 0.5);
}

/* Vapor mágico del jugador con colores azules */
.player-discard-cell .discard-magical-smoke::before {
  color: #87ceeb;
}

.player-discard-cell .discard-magical-smoke::after {
  color: #4682b4;
}

/* Casilla de hadas capturadas - Jaula mágica encantada */
.captured-fairies-cell {
  position: relative;
  border-radius: 16px;
  overflow: visible;
  
  /* Fondo de jaula encantada con cristales mágicos */
  background: 
    /* Brillo mágico interior - luz de hadas */
    radial-gradient(ellipse 70% 50% at center 40%, 
      rgba(255, 192, 203, 0.6) 0%, 
      rgba(221, 160, 221, 0.4) 40%,
      transparent 70%),
    
    /* Destellos de luz mágica */
    radial-gradient(ellipse 30% 20% at 20% 20%, 
      rgba(255, 255, 255, 0.8) 0%, 
      rgba(255, 215, 0, 0.4) 30%,
      transparent 60%),
    
    radial-gradient(ellipse 25% 15% at 80% 70%, 
      rgba(255, 182, 193, 0.7) 0%, 
      rgba(255, 105, 180, 0.3) 40%,
      transparent 60%),
    
    /* Polvo de hadas flotando */
    radial-gradient(ellipse 15% 10% at 60% 30%, 
      rgba(255, 215, 0, 0.5) 0%, 
      transparent 50%),
    
    radial-gradient(ellipse 12% 8% at 30% 80%, 
      rgba(255, 192, 203, 0.4) 0%, 
      transparent 50%),
    
    /* Base de cristal mágico */
    linear-gradient(135deg, 
      rgba(230, 230, 250, 0.9) 0%, 
      rgba(221, 160, 221, 0.8) 25%, 
      rgba(255, 192, 203, 0.7) 50%, 
      rgba(221, 160, 221, 0.8) 75%, 
      rgba(230, 230, 250, 0.9) 100%);
  
  /* Sin borde - solo efectos internos */
  border: none;
  
  /* Sombras y efectos mágicos */
  box-shadow: 
    /* Sombra exterior */
    0 8px 25px rgba(221, 160, 221, 0.4),
    /* Brillo mágico */
    0 0 30px rgba(255, 192, 203, 0.6),
    /* Profundidad interior */
    inset 0 2px 8px rgba(255, 255, 255, 0.8),
    inset 0 -2px 8px rgba(221, 160, 221, 0.3),
    /* Aura mágica sutil */
    0 0 50px rgba(255, 215, 0, 0.2);
  
  transition: all 0.4s ease;
}

.captured-fairies-cell:hover {
  z-index: 9999 !important;
  transform: translateY(-4px) scale(1.03);
  
  /* Intensificar el brillo mágico al hacer hover */
  box-shadow: 
    0 12px 35px rgba(221, 160, 221, 0.6),
    0 0 40px rgba(255, 192, 203, 0.8),
    inset 0 2px 8px rgba(255, 255, 255, 0.9),
    inset 0 -2px 8px rgba(221, 160, 221, 0.4),
    0 0 60px rgba(255, 215, 0, 0.4),
    0 0 80px rgba(255, 105, 180, 0.3);
}

/* Barrotes de la jaula mágica */
.captured-fairies-cell::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    /* Barrotes verticales */
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      transparent 18px,
      rgba(192, 192, 192, 0.6) 19px,
      rgba(255, 215, 0, 0.8) 20px,
      rgba(192, 192, 192, 0.6) 21px,
      transparent 22px,
      transparent 40px
    ),
    /* Barrotes horizontales */
    repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 18px,
      rgba(192, 192, 192, 0.4) 19px,
      rgba(255, 215, 0, 0.6) 20px,
      rgba(192, 192, 192, 0.4) 21px,
      transparent 22px,
      transparent 40px
    );
  
  border-radius: 16px;
  pointer-events: none;
  z-index: 2;
}

/* Partículas mágicas flotantes */
.fairy-particles {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
  border-radius: 20px;
}

.fairy-particles::before,
.fairy-particles::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 6px;
  background: radial-gradient(circle, #ffd700 0%, #ffb6c1 100%);
  border-radius: 50%;
  animation: float-sparkle 4s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
}

.fairy-particles::before {
  top: 20%;
  left: 15%;
  animation-delay: 0s;
}

.fairy-particles::after {
  top: 70%;
  right: 20%;
  animation-delay: 2s;
  background: radial-gradient(circle, #ffb6c1 0%, #dda0dd 100%);
}

@keyframes float-sparkle {
  0%, 100% { 
    transform: translateY(0px) scale(1);
    opacity: 0.8;
  }
  25% { 
    transform: translateY(-8px) scale(1.2);
    opacity: 1;
  }
  50% { 
    transform: translateY(-4px) scale(0.9);
    opacity: 0.6;
  }
  75% { 
    transform: translateY(-12px) scale(1.1);
    opacity: 1;
  }
}

/* Icono de hada capturada */
.fairy-capture-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 36px;
  height: 36px;
  background: radial-gradient(ellipse at center, 
    rgba(255, 192, 203, 0.9) 30%, 
    rgba(255, 105, 180, 0.8) 70%);
  border: 2px solid rgba(255, 215, 0, 0.8);
  border-radius: 50%;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 
    0 0 15px rgba(255, 192, 203, 0.6),
    inset 0 1px 3px rgba(255, 255, 255, 0.8);
  animation: gentle-glow 3s ease-in-out infinite alternate;
}

.fairy-capture-icon::before {
  content: '🧚';
  filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.8));
}

@keyframes gentle-glow {
  0% { 
    box-shadow: 
      0 0 15px rgba(255, 192, 203, 0.6),
      inset 0 1px 3px rgba(255, 255, 255, 0.8);
  }
  100% { 
    box-shadow: 
      0 0 25px rgba(255, 192, 203, 0.9),
      0 0 35px rgba(255, 215, 0, 0.4),
      inset 0 1px 3px rgba(255, 255, 255, 0.9);
  }
}

/* Texto de hadas capturadas */
.captured-fairies-text {
  color: #8b008b;
  font-weight: bold;
  font-size: 0.85rem;
  text-shadow: 
    0 0 8px rgba(255, 192, 203, 0.8),
    0 1px 2px rgba(255, 255, 255, 0.9);
  z-index: 15;
  position: relative;
  text-align: center;
  line-height: 1.2;
}

/* Efecto de brillo en las cartas dentro de la jaula */
.captured-fairies-cell .fairy-card {
  filter: brightness(1.1) saturate(1.2);
  box-shadow: 
    0 0 10px rgba(255, 192, 203, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.captured-fairies-cell .fairy-card:hover {
  filter: brightness(1.3) saturate(1.4);
  box-shadow: 
    0 0 15px rgba(255, 192, 203, 0.7),
    0 0 25px rgba(255, 215, 0, 0.5),
    0 4px 12px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

/* Hover preview container mejorado */
.captured-fairies-cell .hover-preview-container {
  position: static;
}

.captured-fairies-cell .hover-preview-container .hover-preview {
  position: fixed !important;
  z-index: 10000 !important;
  background: linear-gradient(135deg, 
    rgba(255, 192, 203, 0.95) 0%, 
    rgba(221, 160, 221, 0.95) 50%,
    rgba(255, 182, 193, 0.95) 100%);
  border: 3px solid rgba(255, 215, 0, 0.8);
  border-radius: 16px;
  box-shadow: 
    0 15px 40px rgba(0, 0, 0, 0.8),
    0 0 30px rgba(255, 192, 203, 0.8),
    0 0 50px rgba(255, 215, 0, 0.4);
  backdrop-filter: blur(5px);
}

/* Variante para el rival (colores más oscuros y siniestros) */
.rival-captured-fairies-cell {
  background: 
    radial-gradient(ellipse 70% 50% at center 40%, 
      rgba(128, 0, 128, 0.4) 0%, 
      rgba(75, 0, 130, 0.3) 40%,
      transparent 70%),
    
    radial-gradient(ellipse 30% 20% at 20% 20%, 
      rgba(255, 255, 255, 0.6) 0%, 
      rgba(148, 0, 211, 0.4) 30%,
      transparent 60%),
    
    radial-gradient(ellipse 25% 15% at 80% 70%, 
      rgba(139, 0, 139, 0.5) 0%, 
      rgba(128, 0, 128, 0.3) 40%,
      transparent 60%),
    
    linear-gradient(135deg, 
      rgba(25, 25, 112, 0.8) 0%, 
      rgba(75, 0, 130, 0.7) 25%, 
      rgba(128, 0, 128, 0.6) 50%, 
      rgba(75, 0, 130, 0.7) 75%, 
      rgba(25, 25, 112, 0.8) 100%);
  
  /* Sin borde - solo efectos internos */
  border: none;
  
  box-shadow: 
    0 8px 25px rgba(128, 0, 128, 0.5),
    0 0 30px rgba(75, 0, 130, 0.4),
    inset 0 2px 8px rgba(255, 255, 255, 0.3),
    inset 0 -2px 8px rgba(128, 0, 128, 0.4);
}

.rival-captured-fairies-cell .captured-fairies-text {
  color: #dda0dd;
  text-shadow: 
    0 0 8px rgba(128, 0, 128, 0.8),
    0 1px 2px rgba(255, 255, 255, 0.6);
}

.rival-captured-fairies-cell .fairy-capture-icon {
  background: radial-gradient(ellipse at center, 
    rgba(75, 0, 130, 0.9) 30%, 
    rgba(128, 0, 128, 0.8) 70%);
  border: 2px solid rgba(148, 0, 211, 0.8);
}

/* Variante para el jugador (colores más brillantes y amigables) */
.player-captured-fairies-cell {
  background: 
    /* Brillo mágico interior - más brillante y azulado */
    radial-gradient(ellipse 70% 50% at center 40%, 
      rgba(135, 206, 235, 0.7) 0%, 
      rgba(173, 216, 230, 0.5) 40%,
      transparent 70%),
    
    /* Destellos de luz mágica azul-dorada */
    radial-gradient(ellipse 30% 20% at 20% 20%, 
      rgba(255, 255, 255, 0.9) 0%, 
      rgba(30, 144, 255, 0.5) 30%,
      transparent 60%),
    
    radial-gradient(ellipse 25% 15% at 80% 70%, 
      rgba(176, 224, 230, 0.8) 0%, 
      rgba(135, 206, 235, 0.4) 40%,
      transparent 60%),
    
    /* Polvo de hadas flotando azul */
    radial-gradient(ellipse 15% 10% at 60% 30%, 
      rgba(30, 144, 255, 0.6) 0%, 
      transparent 50%),
    
    radial-gradient(ellipse 12% 8% at 30% 80%, 
      rgba(173, 216, 230, 0.5) 0%, 
      transparent 50%),
    
    /* Base de cristal mágico azul */
    linear-gradient(135deg, 
      rgba(240, 248, 255, 0.9) 0%, 
      rgba(173, 216, 230, 0.8) 25%, 
      rgba(135, 206, 235, 0.7) 50%, 
      rgba(173, 216, 230, 0.8) 75%, 
      rgba(240, 248, 255, 0.9) 100%);
  
  /* Sin borde - solo efectos internos */
  border: none;
  
  /* Sombras y efectos mágicos azules */
  box-shadow: 
    0 8px 25px rgba(135, 206, 235, 0.5),
    0 0 30px rgba(173, 216, 230, 0.6),
    inset 0 2px 8px rgba(255, 255, 255, 0.9),
    inset 0 -2px 8px rgba(135, 206, 235, 0.4),
    0 0 50px rgba(30, 144, 255, 0.3);
}

.player-captured-fairies-cell:hover {
  box-shadow: 
    0 12px 35px rgba(135, 206, 235, 0.7),
    0 0 40px rgba(173, 216, 230, 0.8),
    inset 0 2px 8px rgba(255, 255, 255, 1),
    inset 0 -2px 8px rgba(135, 206, 235, 0.5),
    0 0 60px rgba(30, 144, 255, 0.5),
    0 0 80px rgba(0, 191, 255, 0.4);
}

.player-captured-fairies-cell .captured-fairies-text {
  color: #1e90ff;
  text-shadow: 
    0 0 8px rgba(173, 216, 230, 0.9),
    0 1px 2px rgba(255, 255, 255, 0.9);
}

.player-captured-fairies-cell .fairy-capture-icon {
  background: radial-gradient(ellipse at center, 
    rgba(173, 216, 230, 0.9) 30%, 
    rgba(135, 206, 235, 0.8) 70%);
  border: 2px solid rgba(30, 144, 255, 0.8);
}

.player-captured-fairies-cell .fairy-particles::before {
  background: radial-gradient(circle, #1e90ff 0%, #87ceeb 100%);
  box-shadow: 0 0 10px rgba(30, 144, 255, 0.8);
}

.player-captured-fairies-cell .fairy-particles::after {
  background: radial-gradient(circle, #87ceeb 0%, #b0e0e6 100%);
  box-shadow: 0 0 10px rgba(135, 206, 235, 0.8);
}

/* Evitar efectos borrosos en todas las variantes */
.captured-fairies-cell,
.rival-captured-fairies-cell,
.player-captured-fairies-cell {
  backdrop-filter: none !important;
  filter: none !important;
}

.captured-fairies-cell:hover,
.rival-captured-fairies-cell:hover,
.player-captured-fairies-cell:hover {
  backdrop-filter: none !important;
  filter: none !important;
}

/* Casilla de Magias del Rival - Grimorio Oscuro Maldito */
.rival-magic-cell {
    position: relative;
    border-radius: 12px;
    overflow: visible;
    
    /* Fondo de grimorio maldito con runas */
    background: 
        /* Runas brillantes en las esquinas */
        radial-gradient(ellipse 25% 15% at 15% 15%, 
            rgba(220, 20, 60, 0.9) 0%, 
            rgba(139, 0, 0, 0.6) 40%,
            transparent 70%),
        
        radial-gradient(ellipse 25% 15% at 85% 15%, 
            rgba(255, 69, 0, 0.8) 0%, 
            rgba(178, 34, 34, 0.5) 40%,
            transparent 70%),
        
        radial-gradient(ellipse 25% 15% at 15% 85%, 
            rgba(128, 0, 128, 0.7) 0%, 
            rgba(75, 0, 130, 0.4) 40%,
            transparent 70%),
        
        radial-gradient(ellipse 25% 15% at 85% 85%, 
            rgba(255, 140, 0, 0.8) 0%, 
            rgba(255, 69, 0, 0.5) 40%,
            transparent 70%),
        
        /* Aura mágica central */
        radial-gradient(ellipse 60% 40% at center center, 
            rgba(220, 20, 60, 0.3) 0%, 
            rgba(139, 0, 0, 0.2) 50%,
            transparent 80%),
        
        /* Textura de cuero oscuro envejecido */
        repeating-linear-gradient(
            45deg,
            #2c1810 0px,
            #1a0e08 3px,
            #2c1810 6px,
            #3d2317 9px,
            #2c1810 12px
        ),
        
        /* Base de pergamino antiguo */
        linear-gradient(135deg, 
            #2c1810 0%, 
            #1a0e08 25%, 
            #3d2317 50%, 
            #2c1810 75%, 
            #4a2c1d 100%);
    
    /* Borde de hierro forjado con runas */
    border: 3px solid;
    border-image: linear-gradient(45deg, 
        #8b0000, #dc143c, #ff4500, #8b0000, 
        #800080, #ff8c00, #8b0000, #dc143c
    ) 1;
    
    /* Sombras y efectos mágicos */
    box-shadow: 
        /* Sombra exterior */
        0 8px 25px rgba(220, 20, 60, 0.4),
        /* Brillo mágico maligno */
        0 0 30px rgba(139, 0, 0, 0.6),
        /* Profundidad del grimorio */
        inset 0 -4px 8px rgba(0, 0, 0, 0.8),
        inset 0 2px 4px rgba(255, 69, 0, 0.2),
        /* Aura siniestra */
        0 0 50px rgba(75, 0, 130, 0.3);
    
    transition: all 0.4s ease;
    /* Z-index base para la casilla */
    z-index: 1;
}

.rival-magic-cell:hover {
    z-index: 50 !important; /* Aumentamos el z-index base cuando hay hover */
    transform: translateY(-3px) scale(1.02);
    
    /* Intensificar el poder mágico al hacer hover */
    box-shadow: 
        0 12px 35px rgba(220, 20, 60, 0.6),
        0 0 40px rgba(139, 0, 0, 0.8),
        inset 0 -4px 8px rgba(0, 0, 0, 0.9),
        inset 0 2px 4px rgba(255, 69, 0, 0.4),
        0 0 60px rgba(75, 0, 130, 0.5),
        0 0 80px rgba(220, 20, 60, 0.4);
}

/* Runas mágicas flotantes */
.magic-runes {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
    pointer-events: none;
    overflow: hidden;
    border-radius: 12px;
}

.magic-runes::before,
.magic-runes::after {
    content: '';
    position: absolute;
    font-size: 20px;
    color: #dc143c;
    text-shadow: 0 0 10px rgba(220, 20, 60, 0.8);
    animation: float-rune 6s ease-in-out infinite;
}

.magic-runes::before {
    content: '☥';
    top: 10px;
    left: 10px;
    animation-delay: 0s;
}

.magic-runes::after {
    content: '☽';
    bottom: 10px;
    right: 10px;
    animation-delay: 3s;
}

/* Símbolo de grimorio central */
.grimoire-symbol {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50px;
    height: 50px;
    background: radial-gradient(circle at center, 
        rgba(220, 20, 60, 0.9) 0%, 
        rgba(139, 0, 0, 0.7) 50%,
        rgba(75, 0, 130, 0.5) 100%);
    border: 2px solid rgba(255, 69, 0, 0.8);
    border-radius: 50%;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    box-shadow: 
        0 0 20px rgba(220, 20, 60, 0.7),
        inset 0 2px 4px rgba(255, 69, 0, 0.3);
    animation: pulse-grimoire 4s ease-in-out infinite alternate;
}

.grimoire-symbol::before {
    content: '📖';
    filter: 
        hue-rotate(320deg) 
        saturate(1.5) 
        brightness(1.2)
        drop-shadow(0 0 8px rgba(220, 20, 60, 0.8));
}

@keyframes pulse-grimoire {
    0% { 
        box-shadow: 
            0 0 20px rgba(220, 20, 60, 0.7),
            inset 0 2px 4px rgba(255, 69, 0, 0.3);
        transform: translate(-50%, -50%) scale(1);
    }
    100% { 
        box-shadow: 
            0 0 30px rgba(220, 20, 60, 0.9),
            0 0 50px rgba(139, 0, 0, 0.5),
            inset 0 2px 4px rgba(255, 69, 0, 0.5);
        transform: translate(-50%, -50%) scale(1.1);
    }
}

@keyframes float-rune {
    0%, 100% { 
        transform: translateY(0px) rotate(0deg);
        opacity: 0.7;
    }
    25% { 
        transform: translateY(-8px) rotate(90deg);
        opacity: 1;
    }
    50% { 
        transform: translateY(-4px) rotate(180deg);
        opacity: 0.8;
    }
    75% { 
        transform: translateY(-12px) rotate(270deg);
        opacity: 1;
    }
}

/* Energía mágica pulsante */
.magical-energy {
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    z-index: 1;
    pointer-events: none;
    border-radius: 16px;
    background: 
        radial-gradient(ellipse 100% 50% at center, 
            rgba(220, 20, 60, 0.2) 0%, 
            transparent 70%);
    animation: magical-pulse 3s ease-in-out infinite;
}

@keyframes magical-pulse {
    0%, 100% { 
        opacity: 0.4;
        transform: scale(1);
    }
    50% { 
        opacity: 0.8;
        transform: scale(1.05);
    }
}

/* Texto de magias */
.magic-text {
    color: #dc143c;
    font-weight: bold;
    font-size: 0.9rem;
    text-shadow: 
        0 0 10px rgba(220, 20, 60, 0.8),
        0 1px 2px rgba(0, 0, 0, 0.9);
    z-index: 15;
    position: relative;
    text-align: center;
    line-height: 1.2;
    font-family: 'Georgia', serif;
}

/* Icono de poder mágico */
.magic-power-icon {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 32px;
    height: 32px;
    background: radial-gradient(ellipse at center, 
        rgba(255, 69, 0, 0.9) 30%, 
        rgba(220, 20, 60, 0.8) 70%);
    border: 2px solid rgba(139, 0, 0, 0.8);
    border-radius: 50%;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    box-shadow: 
        0 0 15px rgba(255, 69, 0, 0.6),
        inset 0 1px 3px rgba(255, 255, 255, 0.2);
    animation: power-glow 2s ease-in-out infinite alternate;
}

.magic-power-icon::before {
    content: '⚡';
    filter: drop-shadow(0 0 5px rgba(255, 69, 0, 0.8));
}

@keyframes power-glow {
    0% { 
        box-shadow: 
            0 0 15px rgba(255, 69, 0, 0.6),
            inset 0 1px 3px rgba(255, 255, 255, 0.2);
    }
    100% { 
        box-shadow: 
            0 0 25px rgba(255, 69, 0, 0.9),
            0 0 35px rgba(220, 20, 60, 0.4),
            inset 0 1px 3px rgba(255, 255, 255, 0.4);
    }
}

/* Partículas de energía oscura */
.dark-particles {
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    z-index: 1;
    pointer-events: none;
    overflow: hidden;
    border-radius: 20px;
}

.dark-particles::before,
.dark-particles::after {
    content: '';
    position: absolute;
    width: 4px;
    height: 4px;
    background: radial-gradient(circle, #dc143c 0%, #8b0000 100%);
    border-radius: 50%;
    animation: float-dark-sparkle 5s ease-in-out infinite;
    box-shadow: 0 0 8px rgba(220, 20, 60, 0.8);
}

.dark-particles::before {
    top: 25%;
    left: 20%;
    animation-delay: 0s;
}

.dark-particles::after {
    top: 75%;
    right: 25%;
    animation-delay: 2.5s;
    background: radial-gradient(circle, #ff4500 0%, #8b0000 100%);
}

@keyframes float-dark-sparkle {
    0%, 100% { 
        transform: translateY(0px) scale(1);
        opacity: 0.6;
    }
    25% { 
        transform: translateY(-10px) scale(1.3);
        opacity: 1;
    }
    50% { 
        transform: translateY(-6px) scale(0.8);
        opacity: 0.4;
    }
    75% { 
        transform: translateY(-14px) scale(1.2);
        opacity: 1;
    }
}

/* Efecto de hover mejorado */
.rival-magic-cell:hover .magical-energy {
    animation-duration: 1s;
    opacity: 1;
}

.rival-magic-cell:hover .dark-particles {
    animation-duration: 2s;
}

.rival-magic-cell:hover .magic-runes::before,
.rival-magic-cell:hover .magic-runes::after {
    animation-duration: 3s;
    color: #ff4500;
    text-shadow: 0 0 15px rgba(255, 69, 0, 1);
}

/* NUEVAS REGLAS PARA HOVER PREVIEW - MUY IMPORTANTES */

/* Contenedor de cartas con z-index controlado */
.rival-magic-cell .relative {
    z-index: 20; /* Las cartas base tienen z-index 20 */
}

/* Grupo de hover individual para cada carta */
.rival-magic-cell .group {
    position: relative;
    z-index: 25; /* Cada carta individual tiene z-index 25 */
}

/* Trigger de hover */
.rival-magic-cell .hover-trigger {
    position: absolute;
    z-index: 30; /* El trigger tiene z-index 30 */
}

/* HOVER PREVIEW - EL MÁS IMPORTANTE */
.rival-magic-cell .group-hover\:block {
    z-index: 10000 !important; /* Máximo z-index para el preview */
    position: fixed !important; /* Cambiamos a fixed para que esté por encima de todo */
    pointer-events: none; /* Evitamos que interfiera con otros elementos */
}

/* Alternativa si fixed no funciona bien */
.rival-magic-cell .hover-preview {
    position: absolute;
    z-index: 10000 !important;
    pointer-events: none;
    transform: translateZ(0); /* Forzamos un nuevo contexto de apilamiento */
}

/* Estilos para el preview hover */
.rival-magic-cell .group:hover .group-hover\:block {
    display: block !important;
    z-index: 10000 !important;
    position: absolute !important;
    top: -10px !important;
    left: 90px !important;
    pointer-events: none !important;
    transform: translateZ(0) !important; /* Nuevo contexto de apilamiento */
}

/* Asegurar que el contenedor del preview tenga el z-index más alto */
.rival-magic-cell .group:hover .group-hover\:block > div {
    z-index: 10001 !important;
    position: relative;
    background: white;
    border: 2px solid #333;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
    transform: translateZ(0);
}

/* Casilla de Magias del Jugador - Grimorio Sagrado Luminoso */
.player-magic-cell {
    position: relative;
    border-radius: 12px;
    overflow: visible;
    
    /* Fondo de grimorio sagrado con runas luminosas */
    background: 
        /* Runas brillantes en las esquinas */
        radial-gradient(ellipse 25% 15% at 15% 15%, 
            rgba(30, 144, 255, 0.9) 0%, 
            rgba(70, 130, 180, 0.6) 40%,
            transparent 70%),
        
        radial-gradient(ellipse 25% 15% at 85% 15%, 
            rgba(65, 105, 225, 0.8) 0%, 
            rgba(100, 149, 237, 0.5) 40%,
            transparent 70%),
        
        radial-gradient(ellipse 25% 15% at 15% 85%, 
            rgba(138, 43, 226, 0.7) 0%, 
            rgba(147, 112, 219, 0.4) 40%,
            transparent 70%),
        
        radial-gradient(ellipse 25% 15% at 85% 85%, 
            rgba(0, 191, 255, 0.8) 0%, 
            rgba(135, 206, 235, 0.5) 40%,
            transparent 70%),
        
        /* Aura mágica central */
        radial-gradient(ellipse 60% 40% at center center, 
            rgba(30, 144, 255, 0.3) 0%, 
            rgba(70, 130, 180, 0.2) 50%,
            transparent 80%),
        
        /* Textura de cuero azul celestial */
        repeating-linear-gradient(
            45deg,
            #1e3a5f 0px,
            #0f1929 3px,
            #1e3a5f 6px,
            #2c4a6b 9px,
            #1e3a5f 12px
        ),
        
        /* Base de pergamino mágico */
        linear-gradient(135deg, 
            #1e3a5f 0%, 
            #0f1929 25%, 
            #2c4a6b 50%, 
            #1e3a5f 75%, 
            #3d5a87 100%);
    
    /* Borde de plata élfica con runas */
    border: 3px solid;
    border-image: linear-gradient(45deg, 
        #1e90ff, #4169e1, #00bfff, #1e90ff, 
        #8a2be2, #87ceeb, #1e90ff, #4169e1
    ) 1;
    
    /* Sombras y efectos mágicos */
    box-shadow: 
        /* Sombra exterior */
        0 8px 25px rgba(30, 144, 255, 0.4),
        /* Brillo mágico benévolo */
        0 0 30px rgba(70, 130, 180, 0.6),
        /* Profundidad del grimorio */
        inset 0 -4px 8px rgba(0, 0, 0, 0.8),
        inset 0 2px 4px rgba(65, 105, 225, 0.2),
        /* Aura celestial */
        0 0 50px rgba(138, 43, 226, 0.3);
    
    transition: all 0.4s ease;
    /* Z-index base para la casilla */
    z-index: 1;
}

.player-magic-cell:hover {
    z-index: 50 !important; /* Aumentamos el z-index base cuando hay hover */
    transform: translateY(-3px) scale(1.02);
    
    /* Intensificar el poder mágico al hacer hover */
    box-shadow: 
        0 12px 35px rgba(30, 144, 255, 0.6),
        0 0 40px rgba(70, 130, 180, 0.8),
        inset 0 -4px 8px rgba(0, 0, 0, 0.9),
        inset 0 2px 4px rgba(65, 105, 225, 0.4),
        0 0 60px rgba(138, 43, 226, 0.5),
        0 0 80px rgba(30, 144, 255, 0.4);
}

/* Runas mágicas luminosas flotantes */
.player-magic-runes {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
    pointer-events: none;
    overflow: hidden;
    border-radius: 12px;
}

.player-magic-runes::before,
.player-magic-runes::after {
    content: '';
    position: absolute;
    font-size: 20px;
    color: #4169e1;
    text-shadow: 0 0 10px rgba(65, 105, 225, 0.8);
    animation: float-rune 6s ease-in-out infinite;
}

.player-magic-runes::before {
    content: '☆';
    top: 10px;
    left: 10px;
    animation-delay: 0s;
}

.player-magic-runes::after {
    content: '☾';
    bottom: 10px;
    right: 10px;
    animation-delay: 3s;
}

/* Símbolo de grimorio central sagrado */
.player-grimoire-symbol {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50px;
    height: 50px;
    background: radial-gradient(circle at center, 
        rgba(30, 144, 255, 0.9) 0%, 
        rgba(70, 130, 180, 0.7) 50%,
        rgba(138, 43, 226, 0.5) 100%);
    border: 2px solid rgba(65, 105, 225, 0.8);
    border-radius: 50%;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    box-shadow: 
        0 0 20px rgba(30, 144, 255, 0.7),
        inset 0 2px 4px rgba(65, 105, 225, 0.3);
    animation: pulse-player-grimoire 4s ease-in-out infinite alternate;
}

.player-grimoire-symbol::before {
    content: '📖';
    filter: 
        hue-rotate(200deg) 
        saturate(1.5) 
        brightness(1.2)
        drop-shadow(0 0 8px rgba(30, 144, 255, 0.8));
}

@keyframes pulse-player-grimoire {
    0% { 
        box-shadow: 
            0 0 20px rgba(30, 144, 255, 0.7),
            inset 0 2px 4px rgba(65, 105, 225, 0.3);
        transform: translate(-50%, -50%) scale(1);
    }
    100% { 
        box-shadow: 
            0 0 30px rgba(30, 144, 255, 0.9),
            0 0 50px rgba(70, 130, 180, 0.5),
            inset 0 2px 4px rgba(65, 105, 225, 0.5);
        transform: translate(-50%, -50%) scale(1.1);
    }
}

/* Energía mágica pulsante celestial */
.player-magical-energy {
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    z-index: 1;
    pointer-events: none;
    border-radius: 16px;
    background: 
        radial-gradient(ellipse 100% 50% at center, 
            rgba(30, 144, 255, 0.2) 0%, 
            transparent 70%);
    animation: magical-pulse 3s ease-in-out infinite;
}

/* Texto de magias del jugador */
.player-magic-text {
    color: #4169e1;
    font-weight: bold;
    font-size: 0.9rem;
    text-shadow: 
        0 0 10px rgba(65, 105, 225, 0.8),
        0 1px 2px rgba(0, 0, 0, 0.9);
    z-index: 15;
    position: relative;
    text-align: center;
    line-height: 1.2;
    font-family: 'Georgia', serif;
}

/* Icono de poder mágico celestial */
.player-magic-power-icon {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 32px;
    height: 32px;
    background: radial-gradient(ellipse at center, 
        rgba(65, 105, 225, 0.9) 30%, 
        rgba(30, 144, 255, 0.8) 70%);
    border: 2px solid rgba(70, 130, 180, 0.8);
    border-radius: 50%;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    box-shadow: 
        0 0 15px rgba(65, 105, 225, 0.6),
        inset 0 1px 3px rgba(255, 255, 255, 0.2);
    animation: player-power-glow 2s ease-in-out infinite alternate;
}

.player-magic-power-icon::before {
    content: '✨';
    filter: drop-shadow(0 0 5px rgba(65, 105, 225, 0.8));
}

@keyframes player-power-glow {
    0% { 
        box-shadow: 
            0 0 15px rgba(65, 105, 225, 0.6),
            inset 0 1px 3px rgba(255, 255, 255, 0.2);
    }
    100% { 
        box-shadow: 
            0 0 25px rgba(65, 105, 225, 0.9),
            0 0 35px rgba(30, 144, 255, 0.4),
            inset 0 1px 3px rgba(255, 255, 255, 0.4);
    }
}

/* Partículas de energía luminosa */
.player-light-particles {
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    z-index: 1;
    pointer-events: none;
    overflow: hidden;
    border-radius: 20px;
}

.player-light-particles::before,
.player-light-particles::after {
    content: '';
    position: absolute;
    width: 4px;
    height: 4px;
    background: radial-gradient(circle, #4169e1 0%, #1e90ff 100%);
    border-radius: 50%;
    animation: float-light-sparkle 5s ease-in-out infinite;
    box-shadow: 0 0 8px rgba(65, 105, 225, 0.8);
}

.player-light-particles::before {
    top: 25%;
    left: 20%;
    animation-delay: 0s;
}

.player-light-particles::after {
    top: 75%;
    right: 25%;
    animation-delay: 2.5s;
    background: radial-gradient(circle, #00bfff 0%, #1e90ff 100%);
}

@keyframes float-light-sparkle {
    0%, 100% { 
        transform: translateY(0px) scale(1);
        opacity: 0.6;
    }
    25% { 
        transform: translateY(-10px) scale(1.3);
        opacity: 1;
    }
    50% { 
        transform: translateY(-6px) scale(0.8);
        opacity: 0.4;
    }
    75% { 
        transform: translateY(-14px) scale(1.2);
        opacity: 1;
    }
}

/* Efecto de hover mejorado */
.player-magic-cell:hover .player-magical-energy {
    animation-duration: 1s;
    opacity: 1;
}

.player-magic-cell:hover .player-light-particles {
    animation-duration: 2s;
}

.player-magic-cell:hover .player-magic-runes::before,
.player-magic-cell:hover .player-magic-runes::after {
    animation-duration: 3s;
    color: #00bfff;
    text-shadow: 0 0 15px rgba(0, 191, 255, 1);
}

/* REGLAS PARA HOVER PREVIEW - HEREDADAS DEL RIVAL */

/* Contenedor de cartas con z-index controlado */
.player-magic-cell .relative {
    z-index: 20; /* Las cartas base tienen z-index 20 */
}

/* Grupo de hover individual para cada carta */
.player-magic-cell .group {
    position: relative;
    z-index: 25; /* Cada carta individual tiene z-index 25 */
}

/* Trigger de hover */
.player-magic-cell .hover-trigger {
    position: absolute;
    z-index: 30; /* El trigger tiene z-index 30 */
}

/* HOVER PREVIEW - EL MÁS IMPORTANTE */
.player-magic-cell .group-hover\:block {
    z-index: 10000 !important; /* Máximo z-index para el preview */
    position: fixed !important; /* Cambiamos a fixed para que esté por encima de todo */
    pointer-events: none; /* Evitamos que interfiera con otros elementos */
}

/* Alternativa si fixed no funciona bien */
.player-magic-cell .hover-preview {
    position: absolute;
    z-index: 10000 !important;
    pointer-events: none;
    transform: translateZ(0); /* Forzamos un nuevo contexto de apilamiento */
}

/* Estilos para el preview hover */
.player-magic-cell .group:hover .group-hover\:block {
    display: block !important;
    z-index: 10000 !important;
    position: absolute !important;
    top: -10px !important;
    left: 90px !important;
    pointer-events: none !important;
    transform: translateZ(0) !important; /* Nuevo contexto de apilamiento */
}

/* Asegurar que el contenedor del preview tenga el z-index más alto */
.player-magic-cell .group:hover .group-hover\:block > div {
    z-index: 10001 !important;
    position: relative;
    background: white;
    border: 2px solid #333;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
    transform: translateZ(0);
}

    `}</style>
      </div>
    </div>
  );
}
