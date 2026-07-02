import fastifyStatic from '@fastify/static';
import fastify from "fastify";
import path from 'path';
import { Server as SocketIOServer } from "socket.io";
import { Tile } from "../src/@types/Tile";
import { CardType, CardUnity } from '../src/@types/Card';
import { hydrateCard } from "../src/utils/HydrateCard"; // Para rehidratar cartas

/**
 * Servidor principal de Cazahadas.
 * Implementa un servidor Fastify que sirve el frontend compilado como archivos
 * estáticos y gestiona la comunicación en tiempo real entre jugadores mediante
 * Socket.IO. Mantiene el estado autoritativo de todas las partidas activas en
 * el objeto currentGames, valida las acciones de los jugadores y sincroniza
 * el estado del juego entre ambos clientes.
 */

const app = fastify();

const __dirname = path.resolve();

/**
 * Registro del plugin de archivos estáticos de Fastify.
 * Sirve el bundle de producción generado por Vite desde el directorio dist.
 * La opción wildcard desactivada evita conflictos con las peticiones HEAD.
 */
app.register(fastifyStatic, {
  root: path.join(__dirname, 'dist'),
  prefix: '/',
  wildcard: false, //evita conflictos con HEAD
});

/**
 * Manejador de rutas no encontradas que redirige todas las peticiones
 * desconocidas a index.html, habilitando el enrutamiento del lado del cliente
 * de React Router sin requerir configuración adicional en el servidor.
 */
app.setNotFoundHandler((_, reply) => {
  reply.sendFile('index.html');
});

/**
 * Instancia del servidor Socket.IO asociada al servidor HTTP de Fastify.
 * CORS configurado para aceptar conexiones desde cualquier origen, necesario
 * para permitir conexiones desde el cliente React durante el desarrollo local
 * y desde el dominio de producción en Render.
 */
const io = new SocketIOServer(app.server, {
  cors: {
    origin: "*",

    methods: ["GET", "POST"],
  },
});

/**
 * Almacén en memoria de todas las partidas activas indexadas por su código UUID.
 * Cada entrada mantiene los identificadores de socket de ambos jugadores,
 * sus nombres, el estado del salto de turno para detectar doble salto
 * consecutivo, si la partida ha finalizado, y el identificador del jugador
 * con el turno activo.
 */
let currentGames = {} as {
  [key: string]: {
    playerIds: string[];
    playerNames: string[];
    playerSkippedTurn: boolean;
    gameEnded: boolean;
    currentTurnPlayerId: string;
  };
};

/**
 * Manejador del evento de nueva conexión Socket.IO.
 * Se ejecuta cada vez que un cliente establece conexión con el servidor
 * y registra todos los listeners de eventos del juego para ese socket.
 */
io.on("connection", (socket) => {
  console.log("A Player with id", socket.id, "connected");

  /**
   * Manejador del evento "skip-turn".
   * Gestiona tres escenarios distintos según el estado de la partida:
   * 1. Doble salto consecutivo en batalla: finaliza la batalla evaluando la carta
   *    defensiva del defensor mediante hydrateCard y determina si el hada es
   *    capturada según el valor final de la variable X.
   * 2. Salto en el primer turno de batalla: el defensor renuncia automáticamente
   *    y el atacante captura el hada sin evaluación de defensas.
   * 3. Primer salto consecutivo: registra el salto en playerSkippedTurn para
   *    detectar un posible doble salto en el siguiente turno.
   * En todos los casos transfiere el turno al jugador contrario y emite
   * los eventos de actualización correspondientes.
   */
  socket.on("skip-turn", (data: { tiles: Tile[][]; gameId: string, isBattle: boolean, isMyFirstTurnBattle: boolean, amIP1: boolean }) => {
    if (currentGames[data.gameId].currentTurnPlayerId !== socket.id) {
      return;
    }

    var endBattle = false;
    if (currentGames[data.gameId].playerSkippedTurn && data.isBattle && !data.isMyFirstTurnBattle) { // Si el jugador ya había saltado su turno y es una batalla
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

  /**
   * Manejador del evento "place-card".
   * Valida que el socket emisor tiene el turno activo antes de procesar la acción.
   * Resetea el contador de salto consecutivo, notifica el fin del primer turno
   * de batalla si corresponde, transfiere el turno al jugador contrario y emite
   * el nuevo estado del tablero a ambos jugadores.
   */
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

  /**
   * Manejador del evento "end-battle".
   * Se invoca cuando el defensor cede el hada sin combate desde BattleConfirmModal.
   * Marca el hada disputada como capturada por el atacante, emite el evento
   * "captured-fairy" para actualizar las puntuaciones y sincroniza el tablero
   * actualizado con ambos clientes mediante "update-tiles".
   */
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

  /**
   * Manejador del evento "request-draw".
   * Reenvía la solicitud de tablas del jugador emisor al rival mediante el
   * evento "request-draw-player", incluyendo la identidad del solicitante
   * para que el cliente receptor pueda mostrar la notificación correctamente.
   */
  socket.on("request-draw", (data: { gameId: string, amIP1: boolean }) => {
    io.to(currentGames[data.gameId].playerIds).emit("request-draw-player", {
      amIP1: data.amIP1
    });
  });

  /**
   * Manejador del evento "surrender".
   * Procesa la rendición voluntaria de un jugador. Determina el ganador como
   * el jugador contrario al que se rinde y emite "game-end" a ambos jugadores
   * con la razón "surrender" para que el cliente muestre el resultado correcto.
   */
  socket.on('surrender', (data: { gameId: string, amIP1: boolean, board: Tile[][] }) => {
    // El que se rindió pierde
    const winner = !data.amIP1; // Si se rinde P1, gana P2  

    io.to(currentGames[data.gameId].playerIds).emit('game-end', {
      tiles: data.board,
      playerDisconnected: false,
      winner: winner,
      reason: 'surrender'
    });
  });

  /**
   * Manejador del evento "start-battle".
   * Retransmite el inicio de batalla a ambos jugadores mediante "start-battle-player",
   * incluyendo la identidad del atacante para que cada cliente configure
   * correctamente su estado de batalla y muestre el modal correspondiente.
   */
  socket.on("start-battle", (data: { gameId: string, amIP1: boolean }) => {
    io.to(currentGames[data.gameId].playerIds).emit("start-battle-player", {
      amIP1: data.amIP1
    });
  });

  /**
   * Manejador del evento de desconexión de un socket.
   * Busca si el socket desconectado pertenecía a una partida activa no finalizada.
   * Si es así, emite "game-end" con playerDisconnected a true al jugador restante
   * para declararlo ganador por abandono.
   */
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

  /**
   * Manejador del evento "all-fairy-captured".
   * Se invoca cuando un jugador captura su segunda hada, alcanzando la condición
   * de victoria. Marca la partida como finalizada en currentGames y emite
   * "game-end" a ambos jugadores con el ganador y la razón de finalización.
   */
  socket.on("all-fairy-captured", (data) => {
    const game = currentGames[data.gameId];
    if (!game) return;

    game.gameEnded = true;

    io.to(game.playerIds).emit("game-end", {
      reason: data.reason,
      winner: data.winner,
    });
  });

  /**
   * Manejador del evento "draw-game".
   * Se invoca cuando ambos jugadores aceptan terminar la partida en tablas.
   * Marca la partida como finalizada y emite "game-end" con razón "draw-request"
   * a ambos jugadores para mostrar el resultado de empate.
   */
  socket.on("draw-game", (data) => {
    const game = currentGames[data.gameId];
    if (!game) return;

    game.gameEnded = true;

    io.to(game.playerIds).emit('game-end', {
      reason: 'draw-request'
    });
  });

  /**
   * Manejador del evento "start-game-info".
   * Registra una nueva partida en currentGames con el socket del creador
   * como primer jugador y notifica al cliente que ha sido asignado como
   * Jugador 1 mediante el evento "player-connected".
   */
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

  /**
   * Manejador del evento "join-game".
   * Completa el proceso de unión registrando el nombre del segundo jugador,
   * asignando el turno inicial al Jugador 1 y emitiendo "game-start" a ambos
   * clientes con los nombres de los jugadores para iniciar la partida.
   */
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

  /**
   * Manejador del evento "attempt-to-join-game".
   * Valida si la sala solicitada existe y tiene espacio disponible antes de
   * permitir la unión. Emite "game-found" si la sala está disponible y añade
   * el socket a playerIds, "game-busy" si ya tiene dos jugadores, o
   * "game-not-found" si el código de sala no corresponde a ninguna partida activa.
   */
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

/**
 * Inicia el servidor Fastify en el puerto especificado por la variable de
 * entorno PORT o en el puerto 4000 por defecto. Escucha en todas las
 * interfaces de red para permitir conexiones externas en el entorno de
 * producción de Render.
 */
app.listen({ port: parseInt(process.env.PORT!) || 4000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

/**
 * Intervalo de monitorización de memoria del proceso Node.js.
 * Registra cada 10 segundos el número de partidas activas y las métricas
 * de memoria RSS, heap usado y heap total para facilitar el análisis del
 * consumo de recursos del servidor en función de la carga de partidas.
 */
/** 
setInterval(() => {
  const mem = process.memoryUsage();
  const games = Object.keys(currentGames).length;
  console.log(`Partidas activas: ${games} | RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB | Heap usado: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB | Heap total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
}, 10000);
*/
