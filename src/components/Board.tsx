import { useEffect, useState } from "react";
import socket from "../socket";
import { Tile } from "../@types/Tile";
import useBoardStore from "../store/BoardStore";
import { useGameStore } from "../store/GameStore";
import { usePointStore } from "../store/PointsStore";
import useNeoHandStore from "../store/NeoHandStore";
import useTurnStore from "../store/TurnStore";
import useCardStore from "../store/CardStore"; // Para la carta seleccionada
import useCaptureStore from "../store/CaptureStore";
import Card from "../components/Card";
import { CardType, CardUnity } from "../@types/Card";
import { useParams } from "react-router-dom";

export default function Board({ amIP1 }: { amIP1: boolean }) {
  // Obtenemos el estado del tablero (estructura 3x4) desde el store
  const [tiles, setTiles] = useBoardStore((state) => [state.board, state.setBoard]);
  // Carta seleccionada para colocar en la zona de juego
  const [selectedCard, resetSelectedCard] = useCardStore((state) => [
    state.selectedCard,
    state.resetSelectedCard,
  ]);
  const [isMyTurn] = useTurnStore((state) => [state.isMyTurn]);
  const [gameOver, setGameResult, playerOneName, playerTwoName, playerDisconnected] =
    useGameStore((state) => [
      state.gameOver,
      state.setGameResult,
      state.playerOneName,
      state.playerTwoName,
      state.playerDisconnected,
    ]);
  const [setPoints] = usePointStore((state) => [state.setPoints]);
  const [placeCard] = useNeoHandStore((state) => [state.placeCard]);

  const { id: gameId } = useParams<{ id: string }>();

  const [pendingCapture, setPendingCapture, clearPendingCapture] = useCaptureStore((state) => [
    state.pendingCapture,
    state.setPendingCapture,
    state.clearPendingCapture,
  ]);

  useEffect(() => {
    if (!pendingCapture) return;

    const isMyCatch = pendingCapture.placedByPlayerOne === amIP1;
    const nowMyTurn = isMyTurn;

    if (isMyCatch && nowMyTurn && tiles[0][2].type === 'deck' && tiles[2][2].type === 'discard' && tiles[1][3].type === 'variableX') {
      const fairyTile = tiles[1][pendingCapture.fairyIndex];
      const rivalShield =
        amIP1 ? tiles[0][2].cards.at(-1) : tiles[2][2].cards.at(-1); // Última carta en el discard del rival

      const xValue = tiles[1][3].value;

      if (rivalShield && rivalShield.type === CardType.SHIELD) {
        if (!rivalShield || !rivalShield.defenseCondition(xValue)) {
          const newTiles = [...tiles];
          const capturedRow = amIP1 ? 2 : 0;
          if (newTiles[capturedRow][1].type === 'capturedFairies' &&
            fairyTile.type === 'fairy' &&
            'card' in fairyTile &&
            fairyTile.card) {
            newTiles[capturedRow][1].cards.push(fairyTile.card);
            const newFairyTile = newTiles[1][pendingCapture.fairyIndex];
            if (newFairyTile.type === 'fairy') {
              if (newFairyTile.card) {
                newFairyTile.captured = true; // <--- Aquí marcas que fue atrapada
              }
              newFairyTile.card = null;
              newTiles[1][pendingCapture.fairyIndex] = newFairyTile;
            }
            setTiles(newTiles);
            socket.emit("capture-fairy", { tiles: newTiles, gameId });
          }
        }
      }

      clearPendingCapture();
    }
  }, [isMyTurn]);



  // Validación para colocar carta en zona de juego
  function canAddCardToPosition(card: any, position: Tile, rowIndex: number, colIndex: number): boolean {
    if (!card || !isMyTurn) return false;

    if (rowIndex == 2) {
      switch (card.type) {
        case CardType.SHIELD:
          return position.type === 'deck' || position.type === 'discard';
        case CardType.MAGIC:
          return position.type === 'magic' || position.type === 'discard';
        default:
          return false; // Si no conocemos el tipo no dejamos colocar
      }
    } else {
      if (CardType.CATCH === card.type) {
        return position.type === 'fairy' && position.card === null;
      } else {
        return false;
      }
    }
  }


  // Al hacer clic en una celda de la zona de juego (fila 1, columnas 0 a 2)
  function handleCellClick(position: Tile, rowIndex: number, colIndex: number) {
    if (!selectedCard || !canAddCardToPosition(selectedCard, position, rowIndex, colIndex)) return;
    // Lógica para colocar la carta. Se asume que mapPawns transforma la celda y actualiza el estado.
    const newTiles = mapPawns(selectedCard, rowIndex, colIndex, tiles, amIP1);
    placeCard(selectedCard);
    setTiles(newTiles);
    resetSelectedCard();
    socket.emit("place-card", { tiles: newTiles, gameId });
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
        }
        if (newTiles[1][3].type === 'variableX') {
          newTiles[1][3].value = card.operation(newTiles[1][3].value); // Aplicar la operación de la carta mágica a la variable X
        }
        // Aquí podrías agregar más efectos especiales de cartas mágicas
        break;
      case CardType.SHIELD:
        if (currentTile.type === 'discard' || currentTile.type === 'deck') {
          newTiles[rowIndex][colIndex] = {
            ...currentTile,
            cards: [...(currentTile.cards || []), { ...card, placedByPlayerOne: amIP1 }],
          };
        }
        break;

      case CardType.CATCH:
        if (currentTile.type === 'fairy' && !currentTile.card) {
          setPendingCapture({ fairyIndex: colIndex, placedByPlayerOne: amIP1 });
          newTiles[rowIndex][colIndex] = {
            ...currentTile,
            card: { ...card, placedByPlayerOne: amIP1 },
          };
          if (newTiles[0][0].type === 'deck' && newTiles[0][0].cards.length > 0) {
            // Compruebo la última carta del mazo rival, miro su atributo condicion y lo considero para el efecto de la carta
            const lastCard = newTiles[0][0].cards[newTiles[0][0].cards.length - 1];
            if (lastCard.type === 'shield' && newTiles[1][3].type === 'variableX') {
              var overcomeShied = lastCard.defenseCondition(newTiles[1][3].value); // Aquí compruebo la condición de defensa de la carta escudo

            }
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
    <div className="grid grid-rows-3 grid-cols-4 gap-2 p-4 w-full max-w-xl mx-auto">
      {/* Fila 0: Zona del Rival */}
      <div className="bg-red-500 flex items-center justify-center border">
        {tiles[0][0].type === 'deck' ? (
          tiles[0][0].cards.length > 0 ? (
            <div className="relative h-[100px] w-[70px]">
              {tiles[0][0].cards.slice(-3).map((card, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-0"
                  style={{ top: `${i * 12}px`, zIndex: i }}
                >
                  <Card placed={true} card={card} amIP1={amIP1} />
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
            tiles[0][1].cards.map((card, index) => (
              <Card key={index} placed={true} card={card} amIP1={amIP1} />
            ))
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
            <div className="relative h-[100px] w-[70px]">
              {tiles[0][2].cards.slice(-3).map((card, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-0"
                  style={{ top: `${i * 12}px`, zIndex: i }}
                >
                  <Card placed={true} card={card} amIP1={amIP1} />
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
            <div className="relative h-[100px] w-[70px]">
              {tiles[0][3].cards.slice(-3).map((card, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-0"
                  style={{ top: `${i * 12}px`, zIndex: i }}
                >
                  <Card placed={true} card={card} amIP1={amIP1} />
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
            <div className="relative h-[100px] w-[70px]">
              {tiles[2][0].cards.slice(-3).map((card, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-0"
                  style={{ top: `${i * 12}px`, zIndex: i }}
                >
                  <Card placed={true} card={card} amIP1={amIP1} />
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
            tiles[2][1].cards.map((card, index) => (
              <Card key={index} placed={true} card={card} amIP1={amIP1} />
            ))
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
            <div className="relative h-[100px] w-[70px]">
              {tiles[2][2].cards.slice(-3).map((card, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-0"
                  style={{ top: `${i * 12}px`, zIndex: i }}
                >
                  <Card placed={true} card={card} amIP1={amIP1} />
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
            <div className="relative h-[100px] w-[70px]">
              {tiles[2][3].cards.slice(-3).map((card, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-0"
                  style={{ top: `${i * 12}px`, zIndex: i }}
                >
                  <Card placed={true} card={card} amIP1={amIP1} />
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
