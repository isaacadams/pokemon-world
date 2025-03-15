const config = {
   port: Number(process.env.port || 8080)
};

const WebSocket = require("ws");
const server = new WebSocket.Server({ port: config.port });

/***
 * TODO:
 *
 * - if websocket is idle, then broadcast "idle" signal so screens can indicate idle players
 * - if websocket is idle for too long, then terminate and broadcast the removal of the player
 */

class PlayerState {
   id;
   position = { x: 0, y: 0 };
   ws;

   constructor(id, ws) {
      this.id = id;
      this.ws = ws;
   }
}

class PlayerStateManager {
   map = new Map();
   constructor() {}

   add(ws) {
      const player = new PlayerState(generateUniqueId(), ws);
      this.map.set(player.id, player);
      return player;
   }

   players() {
      return Object.fromEntries(
         [...this.map.values()].map(player => [player.id, { id: player.id, position: player.position }])
      );
   }
}

const manager = new PlayerStateManager();

server.on("connection", ws => {
   const player = manager.add(ws);

   console.log(`Player ${player.id} connected`);

   // Send player their ID
   ws.send(JSON.stringify({ type: "init", id: player.id }));

   // Broadcast current players to the new player
   // send all player data
   ws.send(
      JSON.stringify({
         type: "players",
         players: manager.players()
      })
   );

   // Notify all players of the new connection
   broadcast({ type: "join", id: player.id, x: player.position.x, y: player.position.y });

   ws.on("message", message => {
      const data = JSON.parse(message);
      if (data.type === "update") {
         // Update player position
         player.position.x = data.x;
         player.position.y = data.y;

         // Broadcast to all other players
         broadcast({ type: "update", id: data.id, x: data.x, y: data.y }, ws);
      }
   });

   ws.on("close", () => {
      manager.map.delete(player.id);
      broadcast({ type: "leave", id: player.id });
      console.log(`Player ${player.id} disconnected`);
   });
});

function broadcast(message, excludeWs = null) {
   server.clients.forEach(client => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
         client.send(JSON.stringify(message));
      }
   });
}

function generateUniqueId() {
   return Math.random().toString(36).substring(2, 9);
}

console.log("WebSocket server running on ws://localhost:8080");
