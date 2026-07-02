import { CardType, CardInfo } from "../@types/Card";

/**
 * Definición completa del mazo de cartas de Cazahadas.
 * Contiene todas las cartas disponibles organizadas por tipo: cartas de captura,
 * cartas mágicas y cartas defensivas. Las cartas mágicas incluyen una función
 * operation que define su efecto sobre la variable X, y las cartas defensivas
 * incluyen una función defenseCondition que evalúa si el hada queda protegida
 * al finalizar la batalla. Este fichero es la única fuente de verdad del mazo
 * y es referenciado tanto por NeoHandStore como por HydrateCard.
 */

/** Cartas de captura. Permiten iniciar un intento de captura sobre un hada disponible. */
const catchCard1: CardInfo = {
  name: "Catch",
  type: CardType.CATCH,
  text: "Atrapar",
  image: "/cartasPNG/Hatrapahadas.jpg"
};

const catchCard2: CardInfo = {
  name: "Catch",
  type: CardType.CATCH,
  text: "Atrapar",
  image: "/cartasPNG/Hatrapahadas.jpg"
};

/** Cartas mágicas. Cada una aplica una operación matemática sobre la variable X. */
const magicCard1: CardInfo = {
  name: "+=1",
  type: CardType.MAGIC,
  operation: (x: number) => x + 1,
  text: "+=1",
  image: "/cartasPNG/ataque1.jpg"
};

const magicCard2: CardInfo = {
  name: "+=1",
  type: CardType.MAGIC,
  operation: (x: number) => x + 1,
  text: "+=1",
  image: "/cartasPNG/ataque1.jpg"
};

const magicCard3: CardInfo = {
  name: "-=1",
  type: CardType.MAGIC,
  operation: (x: number) => x - 1,
  text: "-=1",
  image: "/cartasPNG/ataque3.jpg"
};

const magicCard4: CardInfo = {
  name: "-=1",
  type: CardType.MAGIC,
  operation: (x: number) => x - 1,
  text: "-=1",
  image: "/cartasPNG/ataque3.jpg"
};

const magicCard5: CardInfo = {
  name: "*=-1",
  type: CardType.MAGIC,
  operation: (x: number) => x * (-1),
  text: "*=-1",
  image: "/cartasPNG/ataque5.jpg"
};

const magicCard6: CardInfo = {
  name: "+=2",
  type: CardType.MAGIC,
  operation: (x: number) => x + 2,
  text: "+=2",
  image: "/cartasPNG/ataque2.jpg"
};

const magicCard7: CardInfo = {
  name: "+=2",
  type: CardType.MAGIC,
  operation: (x: number) => x + 2,
  text: "+=2",
  image: "/cartasPNG/ataque2.jpg"
};

const magicCard8: CardInfo = {
  name: "-=2",
  type: CardType.MAGIC,
  operation: (x: number) => x - 2,
  text: "-=2",
  image: "/cartasPNG/ataque4.jpg"
};

const magicCard9: CardInfo = {
  name: "-=2",
  type: CardType.MAGIC,
  operation: (x: number) => x - 2,
  text: "-=2",
  image: "/cartasPNG/ataque4.jpg"
};

// Transforma los números negativos y el cero a uno
const magicCard10: CardInfo = {
  name: "endfor+=1",
  type: CardType.MAGIC,
  operation: (x: number) => {
    const end = x + 1;
    for (let i = 1; i >= end; i--) {
      x += 1;
    }
    return x;
  },
  text: "for i=1:-1:x+1\nx += 1\nendfor",
  image: "/cartasPNG/bucle1.jpg"
};

const magicCard11: CardInfo = {
  name: "endfor-=1",
  type: CardType.MAGIC,
  operation: (x: number) => {
    const end = x + 1;
    for (let i = 1; i <= end; i++) {
      x -= 1;
    }
    return x;
  },
  text: "for i=1:x+1\nx -= 1\nendfor",
  image: "/cartasPNG/bucle6.jpg"
};

const magicCard12: CardInfo = {
  name: "until>0",
  type: CardType.MAGIC,
  operation: (x: number) => {
    do {
      x += 1;
    }
    while (x <= 0);
    return x;
  },
  text: "do\nx += 1\nuntil x>0",
  image: "/cartasPNG/bucle2.jpg"
};

const magicCard13: CardInfo = {
  name: "endwhilex<=0",
  type: CardType.MAGIC,
  operation: (x: number) => {
    while (x <= 0) {
      x += 1;
    }
    return x;
  },
  text: "while x<=0\nx += 1\nendwhile",
  image: "/cartasPNG/bucle5.jpg"
};

const magicCard14: CardInfo = {
  name: "until<0",
  type: CardType.MAGIC,
  operation: (x: number) => {
    do {
      x -= 1;
    }
    while (x >= 0);
    return x;
  },
  text: "do\nx -= 1\nuntil x<0",
  image: "/cartasPNG/bucle3.jpg"
};

const magicCard15: CardInfo = {
  name: "endwhilex>=0",
  type: CardType.MAGIC,
  operation: (x: number) => {
    while (x >= 0) {
      x -= 1;
    }
    return x;
  },
  text: "while x>=0\nx -= 1\nendwhile",
  image: "/cartasPNG/bucle4.jpg"
};

/** Cartas defensivas. Cada una establece una condición lógica que protege el hada si se cumple al finalizar la batalla. */
const shieldCard1: CardInfo = {
  name: "x>=0",
  type: CardType.SHIELD,
  defenseCondition: (x: number) => x >= 0,
  text: "if x>=0\n[[no consigue el\nhada]]\nendif",
  image: "/cartasPNG/escudo1.jpg"
};

const shieldCard2: CardInfo = {
  name: "x<=0",
  type: CardType.SHIELD,
  defenseCondition: (x: number) => x <= 0,
  text: "if x<=0\n[[no consigue el\nhada]]\nendif",
  image: "/cartasPNG/escudo4.jpg"
};

const shieldCard3: CardInfo = {
  name: "x>=1",
  type: CardType.SHIELD,
  defenseCondition: (x: number) => x >= 1,
  text: "if x>=1\n[[no consigue el\nhada]]\nendif",
  image: "/cartasPNG/escudo2.jpg"
};

const shieldCard4: CardInfo = {
  name: "x<=1",
  type: CardType.SHIELD,
  defenseCondition: (x: number) => x <= 1,
  text: "if x<=1\n[[no consigue el\nhada]]\nendif",
  image: "/cartasPNG/escudo3.jpg"
};

const shieldCard5: CardInfo = {
  name: "x>=0",
  type: CardType.SHIELD,
  defenseCondition: (x: number) => x >= 0,
  text: "if x>=0\n[[no consigue el\nhada]]\nendif",
  image: "/cartasPNG/escudo1.jpg"
};

const shieldCard6: CardInfo = {
  name: "x<=0",
  type: CardType.SHIELD,
  defenseCondition: (x: number) => x <= 0,
  text: "if x<=0\n[[no consigue el\nhada]]\nendif",
  image: "/cartasPNG/escudo4.jpg"
};

const shieldCard7: CardInfo = {
  name: "x>=0",
  type: CardType.SHIELD,
  defenseCondition: (x: number) => x >= 0,
  text: "if x>=0\n[[no consigue el\nhada]]\nendif",
  image: "/cartasPNG/escudo1.jpg"
};

const shieldCard8: CardInfo = {
  name: "x<=0",
  type: CardType.SHIELD,
  defenseCondition: (x: number) => x <= 0,
  text: "if x<=0\n[[no consigue el\nhada]]\nendif",
  image: "/cartasPNG/escudo4.jpg"
};

export const deckCards = [
  catchCard1,
  catchCard2,
  magicCard1,
  magicCard2,
  magicCard3,
  magicCard4,
  magicCard5,
  magicCard6,
  magicCard7,
  magicCard8,
  magicCard9,
  magicCard10,
  magicCard11,
  magicCard12,
  magicCard13,
  magicCard14,
  magicCard15,
  shieldCard1,
  shieldCard2,
  shieldCard3,
  shieldCard4,
  shieldCard5,
  shieldCard6,
  shieldCard7,
  shieldCard8,
];
