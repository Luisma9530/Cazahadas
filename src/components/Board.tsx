import { useEffect } from "react";
import socket from "../socket";
import { Tile } from "../@types/Tile";
import useBoardStore from "../store/BoardStore";
import useNeoHandStore from "../store/NeoHandStore";
import useTurnStore from "../store/TurnStore";
import useCardStore from "../store/CardStore"; // Para la carta seleccionada
import Card from "../components/Card";
import { CardType, CardUnity } from "../@types/Card";
import { useParams } from "react-router-dom";
import { hydrateCard } from "../utils/hydrateCard"; // Para rehidratar cartas
import { useAuthStore } from '../store/LoginStore';

export default function Board({ amIP1 }: { amIP1: boolean }) {
  // Obtenemos el estado del tablero (estructura 3x4) desde el store
  const [tiles, setTiles] = useBoardStore((state) => [state.board, state.setBoard]);
  // Carta seleccionada para colocar en la zona de juego
  const [selectedCard, resetSelectedCard] = useCardStore((state) => [
    state.selectedCard,
    state.resetSelectedCard,
  ]);
  const [isMyTurn, isMyFirstTurn, isBattle, setIsBattle, setIsMyFirstTurn] = useTurnStore((state) => [state.isMyTurn, state.isMyFirstTurn, state.isBattle, state.setIsBattle, state.setIsMyFirstTurn]);

  const [drawInitialHand] = useNeoHandStore((state) => [state.drawInitialHand])

  const [placeCard, drawCard] = useNeoHandStore((state) => [state.placeCard, state.drawCard]);

  const [logedUser, password] = useAuthStore((state) => [state.logedUser, state.password]);

  const { id: gameId } = useParams<{ id: string }>();
  const API_URL = import.meta.env.VITE_API_URL;


  // Validación para colocar carta en zona de juego
  function canAddCardToPosition(card: any, position: Tile, rowIndex: number): boolean {
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
        return position.type === 'fairy' && position.card === null && !isBattle;
      } else {
        return false;
      }
    }
  }

  socket.on("selected-card", (data: { card: CardUnity }) => {
    switch (data.card.type) {
      case CardType.MAGIC:

        break;
      case CardType.SHIELD:

        break;
      case CardType.CATCH:

        break;
      default:
        console.warn(`Tipo de carta no reconocido: ${(data.card as any).type}`);
        break;
    }
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
    if (!selectedCard || !canAddCardToPosition(selectedCard, position, rowIndex)) return;
    // Lógica para colocar la carta. Se asume que mapPawns transforma la celda y actualiza el estado.
    const newTiles = mapPawns(selectedCard, rowIndex, colIndex, tiles, amIP1);
    placeCard(selectedCard);
    setTiles(newTiles);
    resetSelectedCard();
    socket.emit("place-card", { tiles: newTiles, gameId });
  }

  function checkMarkedFairiesForCapture(
    tiles: Tile[][],
    amIP1: boolean
  ): Tile[][] {
    const newTiles = tiles.map((row) => row.map((tile) => ({ ...tile })));


    for (let colIndex = 0; colIndex < newTiles[1].length - 1; colIndex++) {
      const tile = newTiles[1][colIndex];

      if (
        tile.type === 'fairy' &&
        tile.marked &&
        !tile.captured &&
        tile.placedByPlayerOne === amIP1
      ) {
        // Verificar la condición de defensa del escudo del rival
        const rivalDeck = newTiles[0][0];
        const variableTile = newTiles[1][3];

        if (rivalDeck.type === 'deck' && variableTile.type === 'variableX') {
          const rivalShield = rivalDeck.cards?.at(-1); // Última carta en el deck del rival
          const hydratedRivalShield = hydrateCard(rivalShield != undefined ? rivalShield : {}); // Rehidratamos la carta del rival
          if (
            rivalDeck.cards.length == 0 || // No hay escudo en el deck del rival
            (
              hydratedRivalShield.type === CardType.SHIELD && // Última carta en el deck del rival
              !hydratedRivalShield.defenseCondition(variableTile.value)// La variable X no cumple la condición del escudo
            )
          ) {
            if (tile.type === 'fairy' && tile.card && newTiles[2][1].type === 'capturedFairies') {
              tile.captured = true;
              newTiles[1][colIndex] = tile; // Actualizar el estado de la hada
              newTiles[2][1].cards.push(tile.card); // Agregar la hada capturada a la zona de hadas capturadas
              setIsBattle(false); // Cambiar el estado de batalla a falso
              if (logedUser) {
                sendCapturedFairies()
              }
              if (newTiles[2][1].cards.length >= 2) {
                console.log('Fin del juego: Capturadas dos hadas');
                socket.emit('fairy-captured', {
                  reason: 'captured-two-fairies',
                  winner: amIP1,
                  gameId: gameId,
                });// Emitir evento de fin de juego si se capturan dos hadas
              }
            }
          }
        }

      }
    }
    return newTiles;
  }

  useEffect(() => {
    var updatedTiles = tiles.map((row) => row.map((tile) => ({ ...tile })));
    setIsBattle(chechIsBattle(updatedTiles));
    if (!isBattle) {
      updatedTiles = checkMarkedFairiesForCapture(tiles, amIP1);
    }
    setTiles(updatedTiles);
    // Ejecutar la lógica de captura al iniciar turno
    if (isMyTurn) { // Solo ejecutar si es mi turno
      if (!isMyFirstTurn) {
        drawCard(isBattle);
      } else {
        drawCard(isBattle)
        setIsMyFirstTurn(false)
      }
    }
  }, [isMyTurn]);

  function chechIsBattle(tiles: Tile[][]): boolean {
    // Es batalla si hay una carta de tipo "catch" en la zona de las hadas, que corresponde a la fila 1
    // Además la carta debe estar marcada y no capturada
    return tiles[1].some((tile) => {
      return (
        tile.type === 'fairy' &&
        tile.card?.type === CardType.CATCH &&
        tile.marked &&
        !tile.captured
      );
    });
  }


  // Función para transformar el tablero al colocar una carta en la zona de juego.
  function mapPawns(
    card: CardUnity,
    rowIndex: number,
    colIndex: number,
    currentTiles: Tile[][],
    amIP1: boolean
  ): Tile[][] {
    const newTiles = currentTiles.map((row) => row.slice());
    const currentTile = newTiles[rowIndex][colIndex];

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
        if (currentTile.type === 'fairy' && !currentTile.card) {
          if (!currentTile.captured && !currentTile.marked) { // Si la hada no ha sido capturada y no está marcada, se puede colocar la carta
            currentTile.marked = true; // Marcar la hada como seleccionada
            currentTile.placedByPlayerOne = amIP1; // Marcar la hada como seleccionada por el jugador 1 o 2
            newTiles[rowIndex][colIndex] = {
              ...currentTile,
              card: { ...card, placedByPlayerOne: amIP1 }, // Colocar la carta en la celda
            };
            setIsBattle(true); // Cambiar el estado de batalla a verdadero
          }
        }
        break;

      default:
        console.warn(`Tipo de carta no reconocido: ${(card as any).type}`);
        break;
    }

    return newTiles;
  }

  // Renderizamos el tablero con la estructura 3x4.

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center p-4">
      {/* Mesa de fondo */}
      <div className="absolute inset-0 table-background"></div>

      {/* Tablero de juego */}
      <div className="relative z-10 grid grid-rows-3 gap-1 p-8 w-full max-w-4xl mx-auto">
        {/* Fila 0: Zona del Rival - Grid normal (AHORA ARRIBA) */}
        <div className="grid grid-cols-4 gap-2 auto-rows-[100px] auto-cols-[80px] ">
          <div className="rival-cell-3d game-cell bg-red-500 flex items-center justify-center border hover-container">
            {tiles[0][0].type === 'deck' ? (
              tiles[0][0].cards.length > 0 ? (
                <div className="relative h-[100px] w-[80px]">
                  {tiles[0][0].cards.slice(-3).map((card, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-0 group"
                      style={{ top: `${i * 8}px`, zIndex: i }}
                    >
                      <div className="w-[80px] h-[85px] overflow-hidden">
                        <Card placed={true} card={card} amIP1={amIP1} />
                      </div>
                      {/* Hover preview individual para cada carta */}
                      <div className="absolute z-[9999] hidden group-hover:block top-[-10px] left-[90px]">
                        <div className="w-[120px] h-[150px] border bg-white shadow-lg rounded p-1">
                          <Card placed={true} card={card} amIP1={amIP1} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                "Deck Rival"
              )
            ) : (
              "Deck Rival"
            )}
          </div>

          <div className="rival-cell-3d game-cell bg-red-500 flex items-center justify-center border hover-container">
            {tiles[0][1].type === 'capturedFairies' ? (
              tiles[0][1].cards.length > 0 ? (
                <div className="relative h-[100px] w-[80px]">
                  {tiles[0][1].cards.slice(-3).map((card, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-0 group"
                      style={{ top: `${i * 8}px`, zIndex: i }}
                    >
                      <div className="w-[80px] h-[85px] overflow-hidden">
                        <Card placed={true} card={card} amIP1={amIP1} />
                      </div>
                      {/* Hover preview individual para cada carta */}
                      <div className="absolute z-[9999] hidden group-hover:block top-[-10px] left-[90px]">
                        <div className="w-[120px] h-[150px] border bg-white shadow-lg rounded p-1">
                          <Card placed={true} card={card} amIP1={amIP1} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-white">Captured Fairies</div>
              )
            ) : (
              "Captured Fairies"
            )}
          </div>

          <div className="rival-cell-3d game-cell bg-red-500 flex items-center justify-center border hover-container">
            {tiles[0][2].type === 'discard' ? (
              tiles[0][2].cards.length > 0 ? (
                <div className="relative h-[100px] w-[80px]">
                  {tiles[0][2].cards.slice(-3).map((card, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-0 group"
                      style={{ top: `${i * 8}px`, zIndex: i }}
                    >
                      <div className="w-[80px] h-[85px] overflow-hidden">
                        <Card placed={true} card={card} amIP1={amIP1} />
                      </div>
                      {/* Hover preview individual para cada carta */}
                      <div className="absolute z-[9999] hidden group-hover:block top-[-10px] left-[90px]">
                        <div className="w-[120px] h-[150px] border bg-white shadow-lg rounded p-1">
                          <Card placed={true} card={card} amIP1={amIP1} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                "Discard Rival"
              )
            ) : (
              "Discard Rival"
            )}
          </div>

          <div className="rival-cell-3d game-cell bg-red-500 flex items-center justify-center border hover-container">
            {tiles[0][3].type === 'magic' ? (
              tiles[0][3].cards.length > 0 ? (
                <div className="relative h-[100px] w-[80px]">
                  {tiles[0][3].cards.slice(-3).map((card, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-0 group hover-trigger"
                      style={{ top: `${i * 8}px`, zIndex: i }}
                    >
                      <div className="w-[80px] h-[85px] overflow-hidden">
                        <Card placed={true} card={card} amIP1={amIP1} />
                      </div>
                      {/* Hover preview individual para cada carta */}
                      <div className="absolute z-[9999] hidden group-hover:block top-[-10px] left-[90px]">
                        <div className="w-[120px] h-[150px] border bg-white shadow-lg rounded p-1">
                          <Card placed={true} card={card} amIP1={amIP1} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                "Magics Rival"
              )
            ) : (
              "Magics Rival"
            )}
          </div>
        </div>

        {/* Fila 1: Zona de juego - CASILLAS MÁS GRANDES (SIGUE EN EL MEDIO) */}
        <div className="grid grid-cols-4 gap-3 auto-rows-[140px] auto-cols-[110px] justify-center mb-4 -mt-7">
          <div
            className={`middle-cell-3d game-cell flex items-center justify-center border cursor-pointer
        ${tiles[1][0].type === 'fairy' && tiles[1][0].captured
                ? 'bg-gray-500'
                : 'bg-gray-200'
              }`}
            onClick={() => handleCellClick(tiles[1][0], 1, 0)}
          >
            {tiles[1][0].type === 'fairy' && tiles[1][0].card ? (
              <div className="w-[95px] h-[125px]">
                <Card placed={true} card={tiles[1][0].card} amIP1={amIP1} />
              </div>
            ) : (
              <span className="text-base font-semibold">Fairy 1</span>
            )}
          </div>

          <div
            className={`middle-cell-3d game-cell flex items-center justify-center border cursor-pointer
        ${tiles[1][1].type === 'fairy' && tiles[1][1].captured
                ? 'bg-gray-500'
                : 'bg-gray-200'
              }`}
            onClick={() => handleCellClick(tiles[1][1], 1, 1)}
          >
            {tiles[1][1].type === 'fairy' && tiles[1][1].card ? (
              <div className="w-[120px] h-[160px]">
                <Card placed={true} card={tiles[1][1].card} amIP1={amIP1} />
              </div>
            ) : (
              <span className="text-base font-semibold">Fairy 2</span>
            )}
          </div>

          <div
            className={`middle-cell-3d game-cell flex items-center justify-center border cursor-pointer
        ${tiles[1][2].type === 'fairy' && tiles[1][2].captured
                ? 'bg-gray-500'
                : 'bg-gray-200'
              }`}
            onClick={() => handleCellClick(tiles[1][2], 1, 2)}
          >
            {tiles[1][2].type === 'fairy' && tiles[1][2].card ? (
              <div className="w-[120px] h-[160px]">
                <Card placed={true} card={tiles[1][2].card} amIP1={amIP1} />
              </div>
            ) : (
              <span className="text-base font-semibold">Fairy 3</span>
            )}
          </div>

          <div
            className="middle-cell-3d game-cell bg-yellow-300 flex items-center justify-center border cursor-pointer"
            onClick={() => handleCellClick(tiles[1][3], 1, 3)}
          >
            <span className="text-xl font-bold">
              {tiles[1][3].type === 'variableX'
                ? tiles[1][3].value
                : "X"}
            </span>
          </div>
        </div>

        {/* Fila 2: Zona del Jugador - Grid normal (AHORA ABAJO) */}
        <div className="grid grid-cols-4 gap-2 auto-rows-[100px] auto-cols-[80px] -mt-5">
          <div
            className="player-cell-3d game-cell bg-blue-500 flex items-center justify-center border cursor-pointer hover-container"
            onClick={() => handleCellClick(tiles[2][0], 2, 0)}
          >
            {tiles[2][0].type === 'deck' ? (
              tiles[2][0].cards.length > 0 ? (
                <div className="relative h-[100px] w-[80px]">
                  {tiles[2][0].cards.slice(-3).map((card, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-0 group hover-trigger"
                      style={{ top: `${i * 12}px`, zIndex: i }}
                    >
                      <div className="w-[80px] h-[85px] overflow-hidden">
                        <Card placed={true} card={card} amIP1={amIP1} />
                      </div>
                      {/* Hover preview individual para cada carta */}
                      <div className="absolute z-[9999] hidden group-hover:block top-[-10px] left-[90px]">
                        <div className="w-[120px] h-[150px] border bg-white shadow-lg rounded p-1">
                          <Card placed={true} card={card} amIP1={amIP1} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                "Deck Player"
              )
            ) : (
              "Deck Player"
            )}
          </div>

          <div className="player-cell-3d game-cell bg-blue-500 flex items-center justify-center border">
            {tiles[2][1].type === 'capturedFairies' ? (
              tiles[2][1].cards.length > 0 ? (
                <div className="relative h-[130px] w-[100px]">
                  {tiles[2][1].cards.slice(-3).map((card, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-0 group"
                      style={{ top: `${i * 8}px`, zIndex: i }}
                    >
                      <div className="w-[80px] h-[85px] overflow-hidden">
                        <Card placed={true} card={card} amIP1={amIP1} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-white">Captured Fairies</div>
              )
            ) : (
              "Captured Fairies"
            )}
          </div>

          <div
            className="player-cell-3d game-cell bg-blue-500 flex items-center justify-center border cursor-pointer hover-container"
            onClick={() => handleCellClick(tiles[2][2], 2, 2)}
          >
            {tiles[2][2].type === 'discard' ? (
              tiles[2][2].cards.length > 0 ? (
                <div className="relative h-[130px] w-[100px]">
                  {tiles[2][2].cards.slice(-3).map((card, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-0 group hover-trigger"
                      style={{ top: `${i * 12}px`, zIndex: i }}
                    >
                      <div className="w-[100px] h-[105px] overflow-hidden">
                        <Card placed={true} card={card} amIP1={amIP1} />
                      </div>
                    </div>
                  ))}
                  <div className="hover-preview-container">
                    {tiles[2][2].cards.slice(-3).map((card, i) => (
                      <div
                        key={`preview-${i}`}
                        className="hover-preview absolute z-[9999] hidden group-hover:block top-[-10px] left-[110px]"
                        style={{ top: `${i * 12 - 10}px` }}
                      >
                        <div className="w-[150px] h-[200px] border bg-white shadow-lg rounded p-2">
                          <Card placed={true} card={card} amIP1={amIP1} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                "Discard Player"
              )
            ) : (
              "Discard Player"
            )}
          </div>

          <div
            className="player-cell-3d game-cell bg-blue-500 flex items-center justify-center border cursor-pointer hover-container"
            onClick={() => handleCellClick(tiles[2][3], 2, 3)}
          >
            {tiles[2][3].type === 'magic' ? (
              tiles[2][3].cards.length > 0 ? (
                <div className="relative h-[130px] w-[100px]">
                  {tiles[2][3].cards.slice(-3).map((card, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-0 group hover-trigger"
                      style={{ top: `${i * 12}px`, zIndex: i }}
                    >
                      <div className="w-[100px] h-[105px] overflow-hidden">
                        <Card placed={true} card={card} amIP1={amIP1} />
                      </div>
                      {/* Hover preview individual para cada carta */}
                      <div className="absolute z-[9999] hidden group-hover:block top-[-10px] left-[100px]">
                        <div className="w-[120px] h-[150px] border bg-white shadow-lg rounded p-1">
                          <Card placed={true} card={card} amIP1={amIP1} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                "Magics Player"
              )
            ) : (
              "Magics Player"
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
    `}</style>
      </div>
    </div>
  );
}
