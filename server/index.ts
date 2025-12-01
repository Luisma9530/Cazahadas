import fastifyStatic from '@fastify/static';
import fastify from "fastify";
import path from 'path';
import { Server as SocketIOServer } from "socket.io";
import { Tile } from "../src/@types/Tile";
import { CardType, CardUnity } from '../src/@types/Card';
import { hydrateCard } from "../src/utils/hydrateCard"; // Para rehidratar cartas


const app = fastify();

const __dirname = path.resolve();



app.register(fastifyStatic, {
  root: path.join(__dirname, 'dist'),
  prefix: '/',
  wildcard: false, //evita conflictos con HEAD
});

app.setNotFoundHandler((_, reply) => {
  reply.sendFile('index.html');
});

const io = new SocketIOServer(app.server, {
  cors: {
    origin: "*",

    methods: ["GET", "POST"],
  },
});
let currentGames = {} as {
  [key: string]: {
    playerIds: string[];
    playerNames: string[];
    playerSkippedTurn: boolean;
    gameEnded: boolean;
    currentTurnPlayerId: string;
  };
};

io.on("connection", (socket) => {
  console.log("A Player with id", socket.id, "connected");

  socket.on("skip-turn", (data: { tiles: Tile[][]; gameId: string, isBattle: boolean, isMyFirstTurnBattle: boolean, amIP1: boolean }) => {
    if (currentGames[data.gameId].currentTurnPlayerId !== socket.id) {
      return;
    }

    var endBattle = false;
    if (currentGames[data.gameId].playerSkippedTurn && !data.isBattle) { // Si el jugador ya había saltado su turno y no es una batalla
      currentGames[data.gameId].gameEnded = true;
      io.to(currentGames[data.gameId].playerIds).emit("game-end", {
        tiles: data.tiles,
        reason: "player-skipped-turn",
      }); // Terminar el juego porque el jugador ya había saltado su turno
      return;
    } else if (currentGames[data.gameId].playerSkippedTurn && data.isBattle && !data.isMyFirstTurnBattle) { // Si el jugador ya había saltado su turno y es una batalla
      var captured = false
      endBattle = true
      currentGames[data.gameId].playerSkippedTurn = false; // Marcar que el jugador ha terminado la batalla
      var player = data.amIP1

      data.tiles[1] = data.tiles[1].map(tile => {
        if (
          tile.type === "fairy" &&
          tile.card?.type === CardType.CATCH &&
          tile.marked &&
          !tile.captured
        ) { // Si la carta es un hada de captura, está marcada y no está capturada

          var rivalShield = null
          var valueX = 0;

          // Buscar el escudo del defensor (solo uno puede existir)
          if (data.tiles[0][0].type === "deck" && data.tiles[0][0].cards && data.tiles[0][0].cards.length > 0) {
            rivalShield = data.tiles[0][0].cards.at(-1);
          } else if (data.tiles[2][0].type === "deck" && data.tiles[2][0].cards && data.tiles[2][0].cards.length > 0) {
            rivalShield = data.tiles[2][0].cards.at(-1);
          }
          if (data.tiles[1][3].type === "variableX") {
            valueX = data.tiles[1][3].value;
          }
          if (rivalShield) {
            const hydrated = hydrateCard(rivalShield ?? {});
            if (
              hydrated.type === CardType.SHIELD &&
              hydrated.defenseCondition &&
              !hydrated.defenseCondition(valueX)
            ) { // Si la carta de rival es un escudo y no cumple la condición de defensa
              captured = true
            } else { // Si la carta de rival es un escudo y cumple la condición de defensa
              captured = false;
            }
          } else {
            captured = true; // Si no hay escudo, la hada se captura
          }
          player = tile.placedByPlayerOne ?? true
          return {
            ...tile,
            marked: false,
            captured: captured,
          };
        }
        return tile;
      });
      if (captured) {
        io.to(currentGames[data.gameId].playerIds).emit("captured-fairy", {
          player: player
        });
      }
    } else if (data.isBattle && data.isMyFirstTurnBattle) { // Si es el primer turno de batalla
      var player = true
      endBattle = true;
      currentGames[data.gameId].playerSkippedTurn = false;

      // Marcar todas las hadas como capturadas si el jugador saltó su turno en la primera batalla
      data.tiles[1] = data.tiles[1].map(tile => {
        if (
          tile.type === "fairy" &&
          tile.card?.type === CardType.CATCH &&
          tile.marked &&
          !tile.captured
        ) {
          player = tile.placedByPlayerOne ?? true
          return {
            ...tile,
            marked: false,
            captured: true,
          };
        }
        return tile;
      });
      io.to(currentGames[data.gameId].playerIds).emit("captured-fairy", {
        player: player
      });
    } else if (!currentGames[data.gameId].playerSkippedTurn) { // Si el jugador no había saltado su turno
      currentGames[data.gameId].playerSkippedTurn = true; // Marcar que el jugador ha saltado su turno
    }

    const currentPlayerIndex = currentGames[data.gameId].playerIds.indexOf(socket.id);
    const nextPlayerIndex = currentPlayerIndex === 0 ? 1 : 0;
    currentGames[data.gameId].currentTurnPlayerId = currentGames[data.gameId].playerIds[nextPlayerIndex];

    if (!data.isMyFirstTurnBattle) {
      io.to(currentGames[data.gameId].playerIds).emit("new-turn", { // Enviar el nuevo turno a todos los jugadores
        tiles: data.tiles,
        playerSkippedTurn: currentGames[data.gameId].playerSkippedTurn,
        endBattle: endBattle,
        isMyFirstTurnBattle: data.isMyFirstTurnBattle
      });
    }
    if ((data.isBattle && data.isMyFirstTurnBattle) || endBattle) {

      io.to(currentGames[data.gameId].playerIds).emit("update-tiles", {
        tiles: data.tiles
      });

    }
  });

  socket.on("place-card", (data: { tiles: Tile[][]; gameId: string, isBattle: boolean, selectedCard: CardUnity[] }) => {
    // VALIDACIÓN: Verificar que es el turno de este jugador
    if (currentGames[data.gameId].currentTurnPlayerId !== socket.id) {
      console.log("Place-card rejected: Not your turn! Socket:", socket.id, "Current turn:", currentGames[data.gameId].currentTurnPlayerId);
      return;
    }

    currentGames[data.gameId].playerSkippedTurn = false;
    if (data.isBattle) {
      io.to(currentGames[data.gameId].playerIds).emit("end-first-turn-battle");
    }

    const currentPlayerIndex = currentGames[data.gameId].playerIds.indexOf(socket.id);
    const nextPlayerIndex = currentPlayerIndex === 0 ? 1 : 0;
    currentGames[data.gameId].currentTurnPlayerId = currentGames[data.gameId].playerIds[nextPlayerIndex];

    io.to(currentGames[data.gameId].playerIds).emit("new-turn", {
      tiles: data.tiles,
      playerSkippedTurn: currentGames[data.gameId].playerSkippedTurn,
      endBattle: false
    });
  });

  socket.on("end-battle", (data: { gameId: string, tiles: Tile[][] }) => {
    var player = true
    data.tiles[1] = data.tiles[1].map(tile => {
      if (
        tile.type === "fairy" &&
        tile.card?.type === CardType.CATCH &&
        tile.marked &&
        !tile.captured
      ) {
        player = tile.placedByPlayerOne ?? true
        return {
          ...tile,
          marked: false,
          captured: true,
        };
      }
      return tile;
    });

    io.to(currentGames[data.gameId].playerIds).emit("captured-fairy", {
      player: player
    });

    io.to(currentGames[data.gameId].playerIds).emit("update-tiles", {
      tiles: data.tiles
    });
  });

  socket.on("request-draw", (data: { gameId: string, amIP1: boolean }) => {
    io.to(currentGames[data.gameId].playerIds).emit("request-draw-player", {
      amIP1: data.amIP1
    });
  });

  socket.on("start-battle", (data: { gameId: string, amIP1: boolean }) => {
    io.to(currentGames[data.gameId].playerIds).emit("start-battle-player", {
      amIP1: data.amIP1
    });
  });

  socket.on("disconnect", () => {
    console.log("A Player with id", socket.id, "disconnected");
    const gameIdForDcedPlayer = Object.keys(currentGames).find((gameId) =>
      currentGames[gameId].playerIds.includes(socket.id)
    );

    if (gameIdForDcedPlayer && !currentGames[gameIdForDcedPlayer].gameEnded) {
      io.to(currentGames[gameIdForDcedPlayer].playerIds).emit("game-end", {
        playerDisconnected: true,
      });
      return;
    }
  });
  socket.on("all-fairy-captured", (data) => {
    const game = currentGames[data.gameId];
    if (!game) return;

    game.gameEnded = true;

    io.to(game.playerIds).emit("game-end", {
      reason: data.reason,
      winner: data.winner,
    });
  });
  socket.on("draw-game", (data) => {
    const game = currentGames[data.gameId];
    if (!game) return;

    game.gameEnded = true;

    io.to(game.playerIds).emit('game-end', {
      reason: 'draw-request'
    });
  });


  // rooms

  socket.on(
    "start-game-info",
    (data: { playerName: string; gameId: string }) => {
      currentGames[data.gameId] = {
        playerIds: [socket.id],
        playerNames: [data.playerName],
        playerSkippedTurn: false,
        gameEnded: false,
        currentTurnPlayerId: "",
      };
      io.to(socket.id).emit("player-connected", {
        firstPlayer: currentGames[data.gameId].playerNames.length === 1,
      });
    }
  );

  socket.on("join-game", (data: { playerName: string; gameId: string }) => {
    console.log("Player", data.playerName, "is trying to join game", data.gameId);
    if (currentGames[data.gameId]["playerIds"].includes(socket.id)) {
      currentGames[data.gameId].playerNames.push(data.playerName);
      currentGames[data.gameId].currentTurnPlayerId = currentGames[data.gameId].playerIds[0];
      io.to(socket.id).emit("player-connected", {
        firstPlayer: currentGames[data.gameId].playerNames.length === 1,
      });
      io.to(currentGames[data.gameId].playerIds).emit(
        "game-start",
        currentGames[data.gameId].playerNames
      );
      return;
    }
    if (currentGames[data.gameId]?.playerIds.length >= 2) {
      io.to(socket.id).emit("game-busy");
      return;
    }
  });

  socket.on("attempt-to-join-game", (data: { gameId: string }) => {
    if (currentGames[data.gameId]?.playerIds.length >= 2) {
      io.to(socket.id).emit("game-busy");
      return;
    }

    if (currentGames[data.gameId]) {
      io.to(socket.id).emit("game-found", {
        gameIdFound: data.gameId,
      });
      currentGames[data.gameId]["playerIds"].push(socket.id);
      return;
    }
    io.to(socket.id).emit("game-not-found");
  });
});

app.listen({ port: parseInt(process.env.PORT!) || 4000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
