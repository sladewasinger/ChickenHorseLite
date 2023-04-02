import express from "express";
import { createServer, Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { Level } from "./levels/Level";
import { Engine } from "./Engine.js";
import { Level1 } from "./levels/Level1.js";
import { Player } from "./models/Player.js";
import { SimpleBody } from "shared/SimpleBody.js";
import cors from 'cors';

class App {
    private app: express.Application;
    private server: Server;
    private io: SocketIOServer;
    private engine: Engine;

    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new SocketIOServer(this.server, {
            cors: {
                origin: [
                    "http://localhost:3010",
                    "https://chickenhorseliteserver.azurewebsites.net:*"
                ],
                methods: ["GET", "POST"],
            },
        });
        this.configure();
        this.bindEvents();

        this.engine = new Engine(this.io);
    }

    private configure(): void {
        // Configure express middleware, routes, etc.
        //this.app.use(cors({ origin: 'http://localhost:3010', methods: ['GET', 'POST'] }));
    }

    public start(port: number): void {
        this.server.listen(port, () => {
            console.log(`Server started on port ${port}`);
        });
        this.engine.start();
    }

    private bindEvents(): void {
        this.io.on("connection", (socket: Socket) => {
            console.log("New client connected");

            // Handle socket events here
            socket.on("event", (data: any) => {
                console.log("Received data:", data);
                // Broadcast the data to all clients
                this.io.emit("event", data);
            });

            socket.on("disconnect", () => {
                console.log("Client disconnected");
                this.engine.removePlayer(socket.id);
            });

            socket.on("registerPlayer", (name: string) => {
                this.engine.addPlayer(socket.id, name);
            });

            socket.on("keydown", (key: string) => {
                const player = this.engine.getPlayer(socket.id);
                if (!player) {
                    return;
                }

                if (!this.validateKey(key)) {
                    return;
                }

                player.input[key] = true;
            });

            socket.on("keyup", (key: string) => {
                const player = this.engine.getPlayer(socket.id);
                if (!player) {
                    return;
                }

                if (!this.validateKey(key)) {
                    return;
                }

                player.input[key] = false;
            });
        });
    }

    private validateKey(key: string) {
        const validKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", " "];

        if (!validKeys.includes(key)) {
            return false;
        }

        return true;
    }

    public sendBodiesUpdate(id: string, bodies: SimpleBody[]) {
        this.io.to(id).emit("bodies", bodies);
    }

    public sendPlayerUpdate(id: string, player: Player, playerBody: SimpleBody) {
        this.io.to(id).emit("player", player, playerBody);
    }

    public loadLevel(level: Level) {
        this.engine.loadLevel(level);
    }
}

const app = new App();
app.start(3000);
app.loadLevel(new Level1());
