import './style.css'; // Provides global styles

import { io, Socket } from "socket.io-client";
import { Engine } from './engine/engine';
import { Renderer } from './renderer/renderer';
import { LoadingIcon } from './loading-icon/LoadingIcon';
import { NameForm } from './NameForm';
import { SimpleBody } from 'shared/SimpleBody';
import { GameState } from 'shared/GameState';
import Matter from 'matter-js';
import { MousePan } from './plugins/MousePan';

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
        this.engine.addPlugin(new MousePan(this.engine, this.renderer));

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

        this.socket.on('gameState', (gameState: GameState) => {
            console.log("Received game state:", gameState);
            for (const body of gameState.dynamicBodies) {
                let b = this.engine.matterEngine.world.bodies.find(b => b.id === body.id);
                if (!b) {
                    const b = this.engine.createBodyFromSimpleBody(body);
                    this.engine.addBody(b);
                } else {
                    Matter.Body.setPosition(b, body.position);
                    Matter.Body.setAngle(b, body.angle);
                    Matter.Body.setVelocity(b, body.velocity);
                    Matter.Body.setAngularVelocity(b, body.angularVelocity);
                }
            }

            for (const player of gameState.players) {
                const body = this.engine.matterEngine.world.bodies.find(b => b.id === player.body.id);
                if (!body) {
                    const body = this.engine.createBodyFromSimpleBody(player.body);
                    body.label = "player";
                    this.engine.addBody(body);
                } else {
                    Matter.Body.setPosition(body, player.body.position);
                    Matter.Body.setAngle(body, player.body.angle);
                    Matter.Body.setVelocity(body, player.body.velocity);
                    Matter.Body.setAngularVelocity(body, player.body.angularVelocity);
                }
            };
        });

        this.socket.on("bodies", (simpleBodies: SimpleBody[]) => {
            console.log("Received bodies:", simpleBodies);

            for (const simpleBody of simpleBodies) {
                const b = this.engine.matterEngine.world.bodies.find(b => b.id === simpleBody.id);
                if (b) {
                    continue;
                }
                const body = this.engine.createBodyFromSimpleBody(simpleBody);
                this.engine.addBodies([body]);
            }
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