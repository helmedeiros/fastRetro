import type { Plugin } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';

interface Room {
  state: string | null;
  clients: Set<WebSocket>;
  votes: Map<string, Set<string>>; // stage -> participantIds
  takenIds: Set<string>; // claimed participant IDs
}

export function retroSyncPlugin(): Plugin {
  return {
    name: 'retro-sync',
    configureServer(server) {
      const wss = new WebSocketServer({ noServer: true });
      const rooms = new Map<string, Room>();

      function getOrCreateRoom(code: string): Room {
        let room = rooms.get(code);
        if (room === undefined) {
          room = { state: null, clients: new Set(), votes: new Map(), takenIds: new Set() };
          rooms.set(code, room);
        }
        return room;
      }

      function broadcast(room: Room, data: string, exclude?: WebSocket): void {
        for (const client of room.clients) {
          if (client !== exclude && client.readyState === WebSocket.OPEN) {
            client.send(data);
          }
        }
      }

      server.httpServer?.on('upgrade', (req, socket, head) => {
        const url = req.url ?? '';

        // Room WebSocket: /__ws/room/CODE
        const roomMatch = /^\/__ws\/room\/([A-Z0-9-]+)$/i.exec(url);
        if (roomMatch !== null) {
          const code = roomMatch[1];
          wss.handleUpgrade(req, socket, head, (ws) => {
            const room = getOrCreateRoom(code);
            room.clients.add(ws);

            // Send current state to new client
            if (room.state !== null) {
              ws.send(JSON.stringify({ type: 'state', state: JSON.parse(room.state) }));
            }

            // Notify all about peer count
            broadcast(room, JSON.stringify({ type: 'peer-count', count: room.clients.size }));

            // Send taken participant IDs to new client
            if (room.takenIds.size > 0) {
              ws.send(JSON.stringify({ type: 'taken-ids', ids: [...room.takenIds] }));
            }

            ws.on('message', (raw) => {
              const msg = JSON.parse(raw.toString()) as { type: string; state?: unknown; stage?: string; participantId?: string };

              if (msg.type === 'state' && msg.state !== undefined) {
                room.state = JSON.stringify(msg.state);
                broadcast(room, raw.toString(), ws);
              }

              if (msg.type === 'vote-stage' && msg.stage !== undefined && msg.participantId !== undefined) {
                const stage = msg.stage;
                if (!room.votes.has(stage)) room.votes.set(stage, new Set());
                room.votes.get(stage)!.add(msg.participantId);

                // Broadcast vote update
                broadcast(room, JSON.stringify({
                  type: 'vote-update',
                  stage,
                  count: room.votes.get(stage)!.size,
                  total: room.clients.size,
                }));

                // Check 40% threshold
                const voteCount = room.votes.get(stage)!.size;
                const threshold = Math.ceil(room.clients.size * 0.4);
                if (voteCount >= threshold) {
                  broadcast(room, JSON.stringify({ type: 'navigate-stage', stage }));
                  room.votes.clear();
                }
              }

              if (msg.type === 'request-state') {
                broadcast(room, raw.toString(), ws);
              }

              if (msg.type === 'claim-identity' && msg.participantId !== undefined) {
                room.takenIds.add(msg.participantId);
                broadcast(room, JSON.stringify({ type: 'taken-ids', ids: [...room.takenIds] }));
              }
            });

            ws.on('close', () => {
              room.clients.delete(ws);
              if (room.clients.size === 0) {
                rooms.delete(code);
              } else {
                broadcast(room, JSON.stringify({ type: 'peer-count', count: room.clients.size }));
              }
            });
          });
          return;
        }

        // Not our request — let Vite handle it
      });

      // REST endpoint to create rooms
      server.middlewares.use('/__api/rooms', (req, res) => {
        if (req.method === 'POST') {
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          const parts: string[] = [];
          for (let p = 0; p < 3; p++) {
            let seg = '';
            for (let i = 0; i < 3; i++) {
              seg += chars[Math.floor(Math.random() * chars.length)];
            }
            parts.push(seg);
          }
          const code = parts.join('-');
          getOrCreateRoom(code);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ code }));
          return;
        }
        res.writeHead(405);
        res.end();
      });
    },
  };
}
