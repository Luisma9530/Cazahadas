import { useState, useEffect } from "react";
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

  const [logedUser, password] = useAuthStore((state) => [state.logedUser, state.password]);

  const { id: gameId } = useParams<{ id: string }>();
  const API_URL = import.meta.env.VITE_API_URL;

  // Validación para colocar carta en zona de juego
  function canAddCardToPosition(selectedCards: CardUnity[], position: Tile, rowIndex: number): boolean {
    if (selectedCards.length === 1) {
      const card = selectedCards[0];
      if (!card || !isMyTurn || showBattleModal) return false;
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
      } else if (rowIndex == 1 && CardType.MAGIC === card.type) {
        return (position.type === 'magic' && isBattle);
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

      setIsBattle(false);
      setIsMyFirstTurnBattle(false);
      clearDeckAndMagic();
      resetVariableX();
    };

    const handleDrawRequest = (data: { amIP1: boolean }) => {
      setShowDrawModal(false)
      if (data.amIP1 != null && amIP1 != null && data.amIP1 !== amIP1) {
        setShowDrawModal(true)
      }
    };

    const handleBattleStart = (data: { amIP1: boolean }) => {
      setIsBattle(true);
      setIsMyFirstTurnBattle(true);
      console.log("Battle started");
      console.log("amIP1:", data.amIP1, " | I am:", amIP1);
      if (data.amIP1 !== amIP1) {
        setShowBattleModal(true)
        console.log("Battle modal shown");
      }
    };

    const handleCapturedFairy = (data: { player: boolean }) => {
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
    };

    const handleEndFirstTurnBattle = () => {
      setIsMyFirstTurnBattle(false);
    };

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
      MAGIC: [[1, 4]], // Casilla de magia del jugador
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

      {/* Tablero de juego - Layout diferente para móvil vs desktop */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-2xl lg:max-w-4xl mx-auto">

        {/* DISEÑO MÓVIL - Flex vertical compacto */}
        <div className="flex flex-col gap-1 p-2 sm:hidden">

          {/* Fila 0: Zona del Rival - Móvil */}
          <div className="grid grid-cols-4 gap-1">
            <div className="rival-cell-3d defense-cell-castle game-cell flex items-center justify-center hover-container"
              style={{ height: '25vw', width: '20vw' }}>
              <div className="defense-shield-icon"></div>
              {tiles[0][0].type === 'deck' ? (
                tiles[0][0].cards.length > 0 ? (
                  <div className="relative h-full w-full">
                    {tiles[0][0].cards.slice(-3).map((card, i) => (
                      <div
                        key={i}
                        className="absolute top-0 left-0"
                        style={{ top: `${i * 2}px`, zIndex: i }}
                      >
                        <div className="w-full h-full overflow-hidden">
                          <Card placed={true} card={card} amIP1={amIP1} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[6px] font-bold text-center text-stone-100 leading-tight">
                    DEFENSA<br />DEL HADA
                  </div>
                )
              ) : (
                <div className="text-[6px] font-bold text-center text-stone-100 leading-tight">
                  DEFENSA<br />DEL HADA
                </div>
              )}
            </div>

            <div className="rival-cell-3d game-cell captured-fairies-cell rival-captured-fairies-cell flex items-center justify-center hover-container"
              style={{ height: '25vw', width: '20vw' }}>
              <div className="fairy-particles"></div>
              <div className="fairy-capture-icon"></div>
              {tiles[0][1].type === 'capturedFairies' ? (
                tiles[0][1].cards.length > 0 ? (
                  <div className="relative h-full w-full">
                    {tiles[0][1].cards.slice(-3).map((card, i) => (
                      <div
                        key={i}
                        className="absolute top-0 left-0"
                        style={{ top: `${i * 2}px`, zIndex: i }}
                      >
                        <div className="w-full h-full overflow-hidden">
                          <Card placed={true} card={card} amIP1={amIP1} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="captured-fairies-text text-[6px] leading-tight text-center">Captured<br />Fairies</div>
                )
              ) : (
                <span className="text-[6px] leading-tight text-center">Captured<br />Fairies</span>
              )}
            </div>

            <div className="h-12"></div>
            <div className="h-12"></div>
          </div>

          {/* Fila 1: Zona de juego central - Móvil */}
          <div className="grid grid-cols-5 gap-12 justify-center my-4">
            <div
              className={getCellHighlightClasses(1, 0, selectedCard,
                `middle-cell-3d game-cell flex items-center justify-center border cursor-pointer
                ${tiles[1][0].type === 'fairy' && tiles[1][0].captured
                  ? 'bg-gray-500'
                  : 'bg-gray-200'}`
              )}
              onClick={() => handleCellClick(tiles[1][0], 1, 0)}
              style={{ height: '25vw', width: '20vw' }}
            >
              {tiles[1][0].type === 'fairy' && tiles[1][0].card ? (
                <div className="w-full h-full p-0.5">
                  <Card placed={true} card={tiles[1][0].card} amIP1={amIP1} />
                </div>
              ) : (
                <span className="text-[7px] font-semibold text-center">Fairy 1</span>
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
              style={{ height: '25vw', width: '20vw' }}
            >
              {tiles[1][1].type === 'fairy' && tiles[1][1].card ? (
                <div className="w-full h-full p-0.5">
                  <Card placed={true} card={tiles[1][1].card} amIP1={amIP1} />
                </div>
              ) : (
                <span className="text-[7px] font-semibold text-center">Fairy 2</span>
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
              style={{ height: '25vw', width: '20vw' }}
            >
              {tiles[1][2].type === 'fairy' && tiles[1][2].card ? (
                <div className="w-full h-full p-0.5">
                  <Card placed={true} card={tiles[1][2].card} amIP1={amIP1} />
                </div>
              ) : (
                <span className="text-[7px] font-semibold text-center">Fairy 3</span>
              )}
            </div>

            <div
              className="middle-cell-3d game-cell bg-yellow-300 flex items-center justify-center border cursor-pointer"
              onClick={() => handleCellClick(tiles[1][3], 1, 3)}
              style={{ height: '25vw', width: '20vw' }}
            >
              <span className="text-sm font-bold">
                {tiles[1][3].type === 'variableX'
                  ? "X= " + tiles[1][3].value
                  : "X"}
              </span>
            </div>

            <div
              className={getCellHighlightClasses(1, 4, selectedCard,
                "player-cell-3d game-cell player-magic-cell bg-blue-500 flex items-center justify-center border cursor-pointer hover-container"
              )}
              onClick={() => handleCellClick(tiles[1][4], 1, 4)}
              style={{ height: '25vw', width: '20vw' }}
            >
              <div className="player-light-particles"></div>
              <div className="player-magical-energy"></div>
              <div className="player-magic-runes"></div>
              <div className="player-grimoire-symbol"></div>
              <div className="player-magic-power-icon"></div>
              {tiles[1][4].type === 'magic' ? (
                tiles[1][4].cards.length > 0 ? (
                  <div className="relative h-full w-full">
                    {tiles[1][4].cards.slice(-3).map((card, i) => (
                      <div
                        key={i}
                        className="absolute top-0 left-0"
                        style={{ top: `${i * 2}px`, zIndex: i }}
                      >
                        <div className="w-full h-full overflow-hidden">
                          <Card placed={true} card={card} amIP1={amIP1} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="player-magic-text text-[6px] text-center leading-tight">
                    Sacred<br />Magics
                  </div>
                )
              ) : (
                <div className="player-magic-text text-[6px] text-center leading-tight">
                  Sacred<br />Magics
                </div>
              )}
            </div>
          </div>

          {/* Fila 2: Zona del Jugador - Móvil */}
          <div className="grid grid-cols-4 gap-5">
            <div
              className={getCellHighlightClasses(2, 0, selectedCard,
                "player-cell-3d defense-cell-castle game-cell flex items-center justify-center cursor-pointer hover-container"
              )}
              onClick={() => handleCellClick(tiles[2][0], 2, 0)}
              style={{ height: '25vw', width: '20vw' }}
            >
              <div className="defense-shield-icon"></div>
              {tiles[2][0].type === 'deck' ? (
                tiles[2][0].cards.length > 0 ? (
                  <div className="relative h-full w-full">
                    {tiles[2][0].cards.slice(-3).map((card, i) => (
                      <div
                        key={i}
                        className="absolute top-0 left-0"
                        style={{ top: `${i * 2}px`, zIndex: i }}
                      >
                        <div className="w-full h-full overflow-hidden">
                          <Card placed={true} card={card} amIP1={amIP1} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[6px] font-bold text-center text-stone-100 leading-tight">
                    DEFENSA<br />DEL JUGADOR
                  </div>
                )
              ) : (
                <div className="text-[6px] font-bold text-center text-stone-100 leading-tight">
                  DEFENSA<br />DEL JUGADOR
                </div>
              )}
            </div>

            <div className="player-cell-3d game-cell captured-fairies-cell player-captured-fairies-cell flex items-center justify-center hover-container"
              style={{ height: '25vw', width: '20vw' }}>
              <div className="fairy-particles"></div>
              <div className="fairy-capture-icon"></div>
              {tiles[2][1].type === 'capturedFairies' ? (
                tiles[2][1].cards.length > 0 ? (
                  <div className="relative h-full w-full">
                    {tiles[2][1].cards.slice(-3).map((card, i) => (
                      <div
                        key={i}
                        className="absolute top-0 left-0"
                        style={{ top: `${i * 2}px`, zIndex: i }}
                      >
                        <div className="w-full h-full overflow-hidden">
                          <Card placed={true} card={card} amIP1={amIP1} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="captured-fairies-text text-[6px] text-center leading-tight">Captured<br />Fairies</div>
                )
              ) : (
                <div className="captured-fairies-text text-[6px] text-center leading-tight">Captured<br />Fairies</div>
              )}
            </div>

            <div
              className={getCellHighlightClasses(2, 2, selectedCard,
                "player-cell-3d game-cell discard-cell-cauldron player-discard-cell flex items-center justify-center border cursor-pointer hover-container"
              )}
              onClick={() => handleCellClick(tiles[2][2], 2, 2)}
              style={{ height: '25vw', width: '20vw' }}
            >
              <div className="discard-magical-smoke"></div>
              <div className="discard-magic-icon"></div>
              {tiles[2][2].type === 'discard' ? (
                tiles[2][2].cards.length > 0 ? (
                  <div className="relative h-full w-full">
                    {tiles[2][2].cards.slice(-3).map((card, i) => (
                      <div
                        key={i}
                        className="absolute top-0 left-0 discard-card-animation"
                        style={{ top: `${i * 2}px`, zIndex: i }}
                      >
                        <div className="w-full h-full overflow-hidden">
                          <Card placed={true} card={card} amIP1={amIP1} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="discard-text text-[6px] text-center">Mi Caldero</span>
                )
              ) : (
                <span className="discard-text text-[6px] text-center">Mi Caldero</span>
              )}
            </div>

            <div className="h-12"></div>
          </div>
        </div>

        {/* DISEÑO DESKTOP - Grid original (sm: y superiores) */}
        <div className="hidden sm:grid grid-rows-3 gap-1 sm:gap-2 p-4 sm:p-8">

          {/* Fila 0: Zona del Rival - Desktop */}
          <div className="grid grid-cols-4 gap-1 sm:gap-2 auto-rows-[60px] sm:auto-rows-[100px] auto-cols-[48px] sm:auto-cols-[80px]">
            <div className="rival-cell-3d defense-cell-castle game-cell flex items-center justify-center hover-container"
              style={{ height: '7vw', width: '13vw' }}>
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

            <div className="rival-cell-3d game-cell captured-fairies-cell rival-captured-fairies-cell flex items-center justify-center hover-container"
              style={{ height: '7vw', width: '13.5vw' }}>
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
          </div>

          {/* Fila 1: Zona de juego - Desktop */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3 auto-rows-[84px] sm:auto-rows-[140px] auto-cols-[66px] sm:auto-cols-[110px] justify-center mb-2 sm:mb-4 -mt-4 sm:-mt-7">
            <div
              className={getCellHighlightClasses(1, 0, selectedCard,
                `middle-cell-3d game-cell flex items-center justify-center border cursor-pointer
                ${tiles[1][0].type === 'fairy' && tiles[1][0].captured
                  ? 'bg-gray-500'
                  : 'bg-gray-200'}`
              )}
              onClick={() => handleCellClick(tiles[1][0], 1, 0)}
              style={{ height: '9.5vw', width: '10.7vw' }}
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
              style={{ height: '9.5vw', width: '10.7vw' }}
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
              style={{ height: '9.5vw', width: '10.7vw' }}
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
              style={{ height: '9.5vw', width: '10.7vw' }}
            >
              <span className="text-lg sm:text-xl font-bold">
                {tiles[1][3].type === 'variableX'
                  ? tiles[1][3].value
                  : "X"}
              </span>
            </div>

            <div
              className={getCellHighlightClasses(1, 4, selectedCard,
                "player-cell-3d game-cell player-magic-cell bg-blue-500 flex items-center justify-center border cursor-pointer hover-container"
              )}
              onClick={() => handleCellClick(tiles[1][4], 1, 4)}
              style={{ height: '9.5vw', width: '10.7vw' }}
            >
              <div className="player-light-particles"></div>
              <div className="player-magical-energy"></div>
              <div className="player-magic-runes"></div>
              <div className="player-grimoire-symbol"></div>
              <div className="player-magic-power-icon"></div>
              {tiles[1][4].type === 'magic' ? (
                tiles[1][4].cards.length > 0 ? (
                  <div className="relative h-[78px] sm:h-[130px] w-[60px] sm:w-[100px]">
                    {tiles[1][4].cards.slice(-3).map((card, i) => (
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

          {/* Fila 2: Zona del Jugador - Desktop */}
          <div className="grid grid-cols-4 gap-1 sm:gap-2 auto-rows-[60px] sm:auto-rows-[100px] auto-cols-[48px] sm:auto-cols-[80px] -mt-3 sm:-mt-5">
            <div
              className={getCellHighlightClasses(2, 0, selectedCard,
                "player-cell-3d defense-cell-castle game-cell flex items-center justify-center cursor-pointer hover-container"
              )}
              onClick={() => handleCellClick(tiles[2][0], 2, 0)}
              style={{ height: '7.5vw', width: '13.5vw' }}
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

            <div className="player-cell-3d game-cell captured-fairies-cell player-captured-fairies-cell flex items-center justify-center hover-container"
              style={{ height: '7.5vw', width: '13.5vw' }}>
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
              style={{ height: '7vw', width: '13.5vw' }}
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
          </div>
        </div>
      </div>
    </div>
  );
}
