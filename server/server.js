const config = {
  port: Number(process.env.port || 8080),
};

const WebSocket = require('ws');
const server = new WebSocket.Server({ port: config.port });

const players = new Map(); // Store player data: { id: { x, y } }

server.on('connection', (ws) => {
  const playerId = generateUniqueId();
  console.log(`Player ${playerId} connected`);

  // Send player their ID
  ws.send(JSON.stringify({ type: 'init', id: playerId }));

  // Broadcast current players to the new player
  ws.send(
    JSON.stringify({
      type: 'players',
      players: Object.fromEntries(players),
    })
  );

  // Add player to the list
  players.set(playerId, { x: 0, y: 0 });

  // Notify all players of the new connection
  broadcast({ type: 'join', id: playerId, x: 0, y: 0 });

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === 'update') {
      // Update player position
      players.set(data.id, { x: data.x, y: data.y });
      // Broadcast to all other players
      broadcast({ type: 'update', id: data.id, x: data.x, y: data.y }, ws);
    }
  });

  ws.on('close', () => {
    players.delete(playerId);
    broadcast({ type: 'leave', id: playerId });
    console.log(`Player ${playerId} disconnected`);
  });
});

function broadcast(message, excludeWs = null) {
  server.clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

function generateUniqueId() {
  return Math.random().toString(36).substring(2, 9);
}

console.log('WebSocket server running on ws://localhost:8080');
