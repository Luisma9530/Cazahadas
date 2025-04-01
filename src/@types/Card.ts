export enum CardType {
  CATCH = "catch",
  MAGIC = "magic",
  SHIELD = "shield",
}

export type CardInfo = {
  name: string;
  type: CardType;
  placedByPlayerOne?: boolean;
} & (
  | {
    type: CardType.CATCH;
  }
  | {
    type: CardType.MAGIC;
    operation: (x: number) => number; // Función que transforma X
  } | {
    type: CardType.SHIELD;
    defenseCondition: (x: number) => boolean; // Función que evalúa si la captura es válida
  
  }
)

export type CardUnity = CardInfo & {id: number}
