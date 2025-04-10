import { useEffect, useState } from "react";
import socket from "../socket";
import { Tile } from "../@types/Tile";
import useBoardStore from "../store/BoardStore";
import { useGameStore } from "../store/GameStore";
import { usePointStore } from "../store/PointsStore";
import useNeoHandStore from "../store/NeoHandStore";
import useTurnStore from "../store/TurnStore";
import useCardStore from "../store/CardStore"; // Para la carta seleccionada
import Card from "../components/Card";
import { CardType } from "../@types/Card";
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

  // Validación para colocar carta en zona de juego (fila 1, celdas 0-2)
  function canAddCardToPosition(card: any, position: Tile, rowIndex: number, colIndex: number): boolean {
    if (!card || !isMyTurn) return false;

    if (rowIndex == 2) {
      switch (card.type) {
        case CardType.SHIELD:
          return position.type === 'deck'|| position.type === 'discard';
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
  // Para Cazahadas, en la celda seleccionada (de tipo 'fairy'), se reemplaza la celda
  // con una nueva que contenga la carta y los puntos correspondientes.
  function mapPawns(
    card: any,
    rowIndex: number,
    colIndex: number,
    currentTiles: Tile[][],
    amIP1: boolean
  ): Tile[][] {
    const newTiles = currentTiles.map((row) => row.slice());
    // Reemplazamos la celda de tipo 'fairy' donde se coloca la carta por una celda ocupada.
    newTiles[rowIndex][colIndex] = {
      type: 'fairy',
      card: { ...card, placedByPlayerOne: amIP1 },
    };
    // Opcionalmente, se pueden actualizar puntos u otras propiedades en la celda.
    return newTiles;
  }

  // Renderizamos el tablero con la estructura 3x4.
  return (
    <div className="grid grid-rows-3 grid-cols-4 gap-2 p-4 w-full max-w-xl mx-auto">
      {/* Fila 0: Zona del Rival */}
      <div className="bg-red-500 flex items-center justify-center border">
        {"Deck Rival"}
      </div>
      <div className="bg-red-500 flex items-center justify-center border">
        {tiles[0][1].type === 'capturedFairies' ? (
          tiles[0][1].cards.length > 0 ? (
            <Card placed={true} card={tiles[0][1].cards[0]} amIP1={amIP1} />
          ) : (
            "Captured Fairies"
          )
        ) : (
          "Captured Fairies"
        )}
      </div>
      <div className="bg-red-500 flex items-center justify-center border">
        {tiles[0][2].type === 'discard' ? (
          tiles[0][2].cards.length > 0 ? (
            <Card placed={true} card={tiles[0][2].cards[0]} amIP1={amIP1} />
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
            <Card placed={true} card={tiles[0][3].cards[0]} amIP1={amIP1} />
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
        className="bg-gray-200 flex items-center justify-center border cursor-pointer"
        onClick={() => handleCellClick(tiles[1][0], 1, 0)}
      >
        {tiles[1][0].type === 'fairy' && tiles[1][0].card ? (
          <Card placed={true} card={tiles[1][0].card} amIP1={amIP1} />
        ) : (
          "Fairy 1"
        )}
      </div>
      <div
        className="bg-gray-200 flex items-center justify-center border cursor-pointer"
        onClick={() => handleCellClick(tiles[1][1], 1, 1)}
      >
        {tiles[1][1].type === 'fairy' && tiles[1][1].card ? (
          <Card placed={true} card={tiles[1][1].card} amIP1={amIP1} />
        ) : (
          "Fairy 2"
        )}
      </div>
      <div
        className="bg-gray-200 flex items-center justify-center border cursor-pointer"
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
        {"Deck Player"}
      </div>
      <div 
        className="bg-blue-500 flex items-center justify-center border"
        onClick={() => handleCellClick(tiles[2][1], 2, 1)}>
        {tiles[2][1].type === 'capturedFairies' ? (
          tiles[2][1].cards.length > 0 ? (
            <Card placed={true} card={tiles[2][1].cards[0]} amIP1={amIP1} />
          ) : (
            "Captured Fairies"
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
            <div className="flex space-x-1">
              {tiles[2][2].cards.slice(0, 3).map((card, i) => (
                <Card key={i} placed={true} card={card} amIP1={amIP1} />
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
            <Card placed={true} card={tiles[2][3].cards[0]} amIP1={amIP1} />
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
