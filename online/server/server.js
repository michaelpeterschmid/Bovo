import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ⚡ wichtig: Pfad ein Level höher -> ../client
app.use(express.static(path.join(__dirname, "../client")));

// optional: SPA-Fallback (z. B. für React Router oder Vue Router)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client", "index.html"));
});

const server = http.createServer(app);
const io = new SocketIOServer(server);

let globalRoomArray = [];

io.on("connection", (socket) => {
    console.log(`socket: ${socket.id} conntected to the server`)
    socket.on("join-room", (room, ack) => {
    const size = io.of("/").adapter.rooms.get(room)?.size || 0;

    if (size === 0) {
      socket.join(room);
      //The ack callback (ack) is how the server replies to a specific emit.
      return ack({ ok: true, message: `you joined the empty room: ${room}, wait for user to join` });
    }

    if (size === 1) {
      socket.join(room);
      return ack({ ok: true, message: `you joined the room: ${room}, this room is now full` });
    }

    // size >= 2
    return ack({ ok: false, message: `The room ${room} is already full, please join another room.` });
  });

  socket.on("send-data", (room, cellId, currentPlayer) => {
    //go to all the rooms except to the sender!
    socket.broadcast.to(room).emit("receive-data", cellId, currentPlayer);

  })

  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) socket.to(room).emit("leave");
    }
  });


});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
