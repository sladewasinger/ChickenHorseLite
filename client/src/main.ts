import './style.css'; // Provides global styles

import { io, Socket } from "socket.io-client";
import { Engine } from './engine/engine';
import { Renderer } from './renderer/renderer';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
if (!canvas) {
    throw new Error('Canvas not found');
}
const renderer = new Renderer(canvas);

const engine = new Engine();

engine.start();
renderer.start(engine);



class Client {
    private socket: Socket | undefined;

    constructor(private serverUrl: string) { }

    public connect(): void {
        this.socket = io(this.serverUrl);

        this.socket.on("connect", () => {
            console.log("Connected to server");

            // Send data to server
            this.socket!.emit("event", { data: "Hello from client" });
        });

        this.socket.on("event", (data: any) => {
            console.log("Received data:", data);
        });

        this.socket.on("disconnect", () => {
            console.log("Disconnected from server");
        });

        this.socket.on("bodies", (bodies: any) => {
            console.log("Received bodies:", bodies);
        });

        this.socket.on("player", (player: any) => {
            console.log("Received player:", player);
        });
    }

    public sendEvent(event: string, data: any): void {
        if (this.socket && this.socket.connected) {
            this.socket.emit(event, data);
        }
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

const client = new Client("http://localhost:3000");
client.connect();