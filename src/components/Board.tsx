import { useEffect } from "react";
import socket from "../socket";
import { Tile } from "../@types/Tile";
import useBoardStore from "../store/BoardStore";
import { useGameStore } from "../store/GameStore";
import useNeoHandStore from "../store/NeoHandStore";
import useTurnStore from "../store/TurnStore";
import useCardStore from "../store/CardStore"; // Para la carta seleccionada
import Card from "../components/Card";
import { CardType, CardUnity } from "../@types/Card";
import { useParams } from "react-router-dom";
import { hydrateCard } from "../utils/hydrateCard"; // Para rehidratar cartas

export default function Board({ amIP1 }: { amIP1: boolean }) {
  // Obtenemos el estado del tablero (estructura 3x4) desde el store
  const [tiles, setTiles] = useBoardStore((state) => [state.board, state.setBoard]);
  // Carta seleccionada para colocar en la zona de juego
  const [selectedCard, resetSelectedCard] = useCardStore((state) => [
    state.selectedCard,
    state.resetSelectedCard,
  ]);
  const [isMyTurn, isMyFirstTurn, isBattle, setIsBattle] = useTurnStore((state) => [state.isMyTurn, state.isMyFirstTurn, state.isBattle, state.setIsBattle]);
  const [playerOneName, playerTwoName] =
    useGameStore((state) => [
      state.playerOneName,
      state.playerTwoName,
    ]);
  const [placeCard, drawCard] = useNeoHandStore((state) => [state.placeCard, state.drawCard]);

  const { id: gameId } = useParams<{ id: string }>();

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
              console.log('Hada capturada:', tile.card);
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
    if (!isBattle) {
      updatedTiles = checkMarkedFairiesForCapture(tiles, amIP1);
    }
    setTiles(updatedTiles);
    // Ejecutar la lógica de captura al iniciar turno
    if (isMyTurn) { // Solo ejecutar si es mi turno
      if (!isMyFirstTurn) {
        drawCard(isBattle);
      }
    }
  }, [isMyTurn]);


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

  //Quiero aumentar el tamaño de las casillas de la zona de juego
  return (
    <div className="grid grid-rows-3 grid-cols-4 gap-4 p-4 w-full max-w-5xl mx-auto auto-rows-[130px] auto-cols-[100px]">
      {/* Fila 0: Zona del Rival */}
      <div className="bg-red-500 flex items-center justify-center border">
        {tiles[0][0].type === 'deck' ? (
          tiles[0][0].cards.length > 0 ? (
            <div className="relative h-[130px] w-[100px]">
              {tiles[0][0].cards.slice(-3).map((card, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-0 group"
                  style={{ top: `${i * 12}px`, zIndex: i }}
                >
                  <div className="w-[100px] h-[105px] overflow-hidden">
                    <Card placed={true} card={card} amIP1={amIP1} />
                  </div>
                  {/* Hover preview */}
                  <div className="absolute z-50 hidden group-hover:block top-[-10px] left-[110px]">
                    <div className="w-[150px] h-[200px] border bg-white shadow-lg rounded p-2">
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
      <div className="bg-red-500 flex items-center justify-center border">
        {tiles[0][1].type === 'capturedFairies' ? (
          tiles[0][1].cards.length > 0 ? (
            <div className="relative h-[130px] w-[100px]">
              {tiles[0][1].cards.slice(-3).map((card, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-0 group"
                  style={{ top: `${i * 12}px`, zIndex: i }}
                >
                  <div className="w-[100px] h-[105px] overflow-hidden">
                    <Card placed={true} card={card} amIP1={amIP1} />
                  </div>
                  {/* Hover preview */}
                  <div className="absolute z-50 hidden group-hover:block top-[-10px] left-[110px]">
                    <div className="w-[150px] h-[200px] border bg-white shadow-lg rounded p-2">
                      <Card placed={true} card={card} amIP1={amIP1} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-white">Captured Fairies</div>
          )
        ) : (
          "Captured Fairies"
        )}
      </div>

      <div className="bg-red-500 flex items-center justify-center border">
        {tiles[0][2].type === 'discard' ? (
          tiles[0][2].cards.length > 0 ? (
            <div className="relative h-[130px] w-[100px]">
              {tiles[0][2].cards.slice(-3).map((card, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-0 group"
                  style={{ top: `${i * 12}px`, zIndex: i }}
                >
                  <div className="w-[100px] h-[105px] overflow-hidden">
                    <Card placed={true} card={card} amIP1={amIP1} />
                  </div>
                  {/* Hover preview */}
                  <div className="absolute z-50 hidden group-hover:block top-[-10px] left-[110px]">
                    <div className="w-[150px] h-[200px] border bg-white shadow-lg rounded p-2">
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
      <div className="bg-red-500 flex items-center justify-center border">
        {tiles[0][3].type === 'magic' ? (
          tiles[0][3].cards.length > 0 ? (
            <div className="relative h-[130px] w-[100px]">
              {tiles[0][3].cards.slice(-3).map((card, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-0 group"
                  style={{ top: `${i * 12}px`, zIndex: i }}
                >
                  <div className="w-[100px] h-[105px] overflow-hidden">
                    <Card placed={true} card={card} amIP1={amIP1} />
                  </div>
                  {/* Hover preview */}
                  <div className="absolute z-50 hidden group-hover:block top-[-10px] left-[110px]">
                    <div className="w-[150px] h-[200px] border bg-white shadow-lg rounded p-2">
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

      {/* Fila 1: Zona de juego */}
      {/* Las primeras tres celdas son para hadas en juego */}
      <div
        className={`flex items-center justify-center border cursor-pointer
          ${tiles[1][0].type === 'fairy' && tiles[1][0].captured
            ? 'bg-gray-500'  // Color para hadas capturadas
            : 'bg-gray-200'  // Color normal
          }`}
        onClick={() => handleCellClick(tiles[1][0], 1, 0)}
      >
        {tiles[1][0].type === 'fairy' && tiles[1][0].card ? (
          <Card placed={true} card={tiles[1][0].card} amIP1={amIP1} />
        ) : (
          "Fairy 1"
        )}
      </div>
      <div
        className={`flex items-center justify-center border cursor-pointer
          ${tiles[1][1].type === 'fairy' && tiles[1][1].captured
            ? 'bg-gray-500'  // Color para hadas capturadas
            : 'bg-gray-200'  // Color normal
          }`}
        onClick={() => handleCellClick(tiles[1][1], 1, 1)}
      >
        {tiles[1][1].type === 'fairy' && tiles[1][1].card ? (
          <Card placed={true} card={tiles[1][1].card} amIP1={amIP1} />
        ) : (
          "Fairy 2"
        )}
      </div>
      <div
        className={`flex items-center justify-center border cursor-pointer
          ${tiles[1][2].type === 'fairy' && tiles[1][2].captured
            ? 'bg-gray-500'  // Color para hadas capturadas
            : 'bg-gray-200'  // Color normal
          }`}
        onClick={() => handleCellClick(tiles[1][2], 1, 2)}
      >
        {tiles[1][2].type === 'fairy' && tiles[1][2].card ? (
          <Card placed={true} card={tiles[1][2].card} amIP1={amIP1} />
        ) : (
          "Fairy 3"
        )}
      </div>
      {/* Última celda de la fila central para la variable X */}
      <div
        className="bg-yellow-300 flex items-center justify-center border"
        onClick={() => handleCellClick(tiles[1][3], 1, 3)}>
        {tiles[1][3].type === 'variableX'
          ? tiles[1][3].value
          : "X"}
      </div>

      {/* Fila 2: Zona del Jugador */}
      <div
        className="bg-blue-500 flex items-center justify-center border cursor-pointer"
        onClick={() => handleCellClick(tiles[2][0], 2, 0)}>
        {tiles[2][0].type === 'deck' ? (
          tiles[2][0].cards.length > 0 ? (
            <div className="relative h-[130px] w-[100px]">
              {tiles[2][0].cards.slice(-3).map((card, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-0 group"
                  style={{ top: `${i * 12}px`, zIndex: i }}
                >
                  <div className="w-[100px] h-[105px] overflow-hidden">
                    <Card placed={true} card={card} amIP1={amIP1} />
                  </div>
                  {/* Hover preview */}
                  <div className="absolute z-50 hidden group-hover:block top-[-10px] left-[110px]">
                    <div className="w-[150px] h-[200px] border bg-white shadow-lg rounded p-2">
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
      <div className="bg-blue-500 flex items-center justify-center border">
        {tiles[2][1].type === 'capturedFairies' ? (
          tiles[2][1].cards.length > 0 ? (
            <div className="relative h-[130px] w-[100px]">
              {tiles[2][1].cards.slice(-3).map((card, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-0 group"
                  style={{ top: `${i * 12}px`, zIndex: i }}
                >
                  <div className="w-[100px] h-[105px] overflow-hidden">
                    <Card placed={true} card={card} amIP1={amIP1} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-white">Captured Fairies</div>
          )
        ) : (
          "Captured Fairies"
        )}
      </div>

      <div
        className="bg-blue-500 flex items-center justify-center border cursor-pointer"
        onClick={() => handleCellClick(tiles[2][2], 2, 2)}>
        {tiles[2][2].type === 'discard' ? (
          tiles[2][2].cards.length > 0 ? (
            <div className="relative h-[130px] w-[100px]">
              {tiles[2][2].cards.slice(-3).map((card, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-0 group"
                  style={{ top: `${i * 12}px`, zIndex: i }}
                >
                  <div className="w-[100px] h-[105px] overflow-hidden">
                    <Card placed={true} card={card} amIP1={amIP1} />
                  </div>
                  {/* Hover preview */}
                  <div className="absolute z-50 hidden group-hover:block top-[-10px] left-[110px]">
                    <div className="w-[150px] h-[200px] border bg-white shadow-lg rounded p-2">
                      <Card placed={true} card={card} amIP1={amIP1} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            "Discard Player"
          )
        ) : (
          "Discard Player"
        )}
      </div>
      <div
        className="bg-blue-500 flex items-center justify-center border cursor-pointer"
        onClick={() => handleCellClick(tiles[2][3], 2, 3)}>
        {tiles[2][3].type === 'magic' ? (
          tiles[2][3].cards.length > 0 ? (
            <div className="relative h-[130px] w-[100px]">
              {tiles[2][3].cards.slice(-3).map((card, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-0 group"
                  style={{ top: `${i * 12}px`, zIndex: i }}
                >
                  <div className="w-[100px] h-[105px] overflow-hidden">
                    <Card placed={true} card={card} amIP1={amIP1} />
                  </div>
                  {/* Hover preview */}
                  <div className="absolute z-50 hidden group-hover:block top-[-10px] left-[110px]">
                    <div className="w-[150px] h-[200px] border bg-white shadow-lg rounded p-2">
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
  );
}
