import { create } from "zustand";
import { Tile } from "../@types/Tile";

type PointStore = {
  playerOnePoints: number;
  playerTwoPoints: number;
  setPoints: (data: Tile[][]) => void;
  resetStore: () => void;
};

export const usePointStore = create<PointStore>((set) => ({
  playerOnePoints: 0,
  playerTwoPoints: 0,

  setPoints: (data: Tile[][]) => {
    let newPlayerOnePoints = 0;
    let newPlayerTwoPoints = 0;

    data.forEach((row) =>
      row.forEach((tile) => {
        //Sumar puntos solo si la casilla una hada capturada
        if (tile.type === "capturedFairies") {
          if (tile.owner === "playerOne") {
            newPlayerOnePoints += tile.cards.length; // El número de hadas capturadas por el jugador
          } else if (tile.owner === "playerTwo") {
            newPlayerTwoPoints += tile.cards.length; // El número de hadas capturadas por el rival
          }
        }
      })
    );

    set({
      playerOnePoints: newPlayerOnePoints,
      playerTwoPoints: newPlayerTwoPoints,
    });
  },

  resetStore: () => set({ playerOnePoints: 0, playerTwoPoints: 0 }),
}));
