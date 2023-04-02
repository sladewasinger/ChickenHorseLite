import './style.css'; // Provides global styles

import { io, Socket } from "socket.io-client";
import { Engine } from './engine/engine';
import { Renderer } from './renderer/renderer';
import { LoadingIcon } from './loading-icon/LoadingIcon';
import { NameForm } from './NameForm';
import { SimpleBody } from 'shared/SimpleBody';
import Matter from 'matter-js';

class Client {
    private socket: Socket | undefined;
    private engine: Engine;
    private renderer: Renderer;
    private canvas: HTMLCanvasElement;

    private nameForm: NameForm;
    private loadingIcon: LoadingIcon;

    constructor(private serverUrl: string) {
        this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error('Canvas not found');
        }
        this.engine = new Engine();
        this.renderer = new Renderer(this.canvas);
        this.nameForm = new NameForm((value) => {
            this.sendEvent('registerPlayer', value);
        });
        this.loadingIcon = new LoadingIcon();
        this.loadingIcon.show();
    }

    public connect(): void {
        this.socket = io(this.serverUrl);

        this.socket.on("connect", () => {
            console.log("Connected to server");

            // Send data to server
            this.socket!.emit("event", { data: "Hello from client" });
            this.loadingIcon.hide();
            this.nameForm.show();
        });

        this.socket.on("event", (data: any) => {
            console.log("Received data:", data);
        });

        this.socket.on("disconnect", () => {
            console.log("Disconnected from server");
            this.nameForm.hide();
            this.loadingIcon.show();
        });

        this.socket.on("bodies", (bodies: SimpleBody[]) => {
            console.log("Received bodies:", bodies);

            for (const body of bodies) {
                const b = Matter.Bodies.fromVertices(body.position.x, body.position.y, body.vertexSets, {
                    label: "body",
                    isStatic: body.isStatic
                });
                this.engine.addBodies([b]);
            }
        });

        this.socket.on("player", (player: any, playerBody: SimpleBody) => {
            console.log("Received player:", player,);

            const body = Matter.Bodies.fromVertices(playerBody.position.x, playerBody.position.y, playerBody.vertexSets, {
                label: "player",
            });
            this.engine.addBodies([body]);
        });

        this.engine.start();
        this.renderer.start(this.engine);
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