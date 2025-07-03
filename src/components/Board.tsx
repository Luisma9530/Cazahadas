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
        return position.type === 'fairy' && !position.marked && !position.captured && !isBattle;
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
    console.log(tiles)
    if (!selectedCard || !canAddCardToPosition(selectedCard, position, rowIndex)) return;
    // Lógica para colocar la carta. Se asume que mapPawns transforma la celda y actualiza el estado.
    const newTiles = mapPawns(selectedCard, rowIndex, colIndex, tiles, amIP1);
    placeCard(selectedCard);
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
  }, []);

  useEffect(() => {
    var updatedTiles = tiles.map((row) => row.map((tile) => ({ ...tile })));

    updatedTiles = checkMarkedFairiesForCapture(tiles, amIP1);

    setTiles(updatedTiles);

    if (isMyTurn) {
      setIsBattle(checkIsBattle(updatedTiles)); // Verificar si es batalla
    }

    // Ejecutar la lógica de captura al iniciar turno
    if (!isMyFirstTurn) {
      drawCard(isBattle);
    } else {
      drawCard(isBattle)
      setIsMyFirstTurn(false)
    }
  }, [isMyTurn]);

  function checkIsBattle(tiles: Tile[][]): boolean {
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
        if (currentTile.type === 'fairy') {
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
          <div className="rival-cell-3d defense-cell-castle game-cell flex items-center justify-center hover-container">
            <div className="defense-shield-icon"></div>
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
                <div className="text-xs font-bold text-center text-stone-100">
                  DEFENSA<br />DEL HADA
                </div>
              )
            ) : (
              <div className="text-xs font-bold text-center text-stone-100">
                DEFENSA<br />DEL HADA
              </div>
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

          <div className="rival-cell-3d game-cell discard-cell-cauldron rival-discard-cell flex items-center justify-center border hover-container">
            {/* Vapor mágico */}
            <div className="discard-magical-smoke"></div>

            {/* Icono de descarte mágico */}
            <div className="discard-magic-icon"></div>

            {tiles[0][2].type === 'discard' ? (
              tiles[0][2].cards.length > 0 ? (
                <div className="relative h-[100px] w-[80px]">
                  {tiles[0][2].cards.slice(-3).map((card, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-0 group discard-card-animation"
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
                <span className="discard-text">Caldero Rival</span>
              )
            ) : (
              <span className="discard-text">Caldero Rival</span>
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
            className="player-cell-3d defense-cell-castle game-cell flex items-center justify-center cursor-pointer hover-container"
            onClick={() => handleCellClick(tiles[2][0], 2, 0)}
          >
            <div className="defense-shield-icon"></div>
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
                <div className="text-xs font-bold text-center text-stone-100">
                  DEFENSA<br />DEL JUGADOR
                </div>
              )
            ) : (
              <div className="text-xs font-bold text-center text-stone-100">
                DEFENSA<br />DEL JUGADOR
              </div>
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
            className="player-cell-3d game-cell discard-cell-cauldron player-discard-cell flex items-center justify-center border cursor-pointer hover-container"
            onClick={() => handleCellClick(tiles[2][2], 2, 2)}
          >
            {/* Vapor mágico */}
            <div className="discard-magical-smoke"></div>

            {/* Icono de descarte mágico */}
            <div className="discard-magic-icon"></div>

            {tiles[2][2].type === 'discard' ? (
              tiles[2][2].cards.length > 0 ? (
                <div className="relative h-[130px] w-[100px]">
                  {tiles[2][2].cards.slice(-3).map((card, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-0 group hover-trigger discard-card-animation"
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
                <span className="discard-text">Mi Caldero</span>
              )
            ) : (
              <span className="discard-text">Mi Caldero</span>
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
        border-image: linear-gradient(45deg, 
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
    `}</style>
      </div>
    </div>
  );
}
