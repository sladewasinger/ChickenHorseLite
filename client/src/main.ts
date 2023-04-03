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
import { ClientPlayer } from 'shared/ClientPlayer';
import { Vector2D } from 'shared/math/Vector2D';

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

        this.renderer = new Renderer(this.canvas);
        this.engine = new Engine(this.renderer);
        this.engine.addPlugin(new MousePan(this.engine, this.renderer));

        this.nameForm = new NameForm((value) => {
            this.sendEvent('registerPlayer', value);
        });
        this.loadingIcon = new LoadingIcon();
        this.loadingIcon.show();

        window.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        window.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });
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

            this.engine.gameState = gameState;
            for (const player of gameState.players) {
                const body = this.engine.matterEngine.world.bodies.find(b => b.id === player.body.id);
                if (!body) {
                    const body = this.engine.createBodyFromSimpleBody(player.body);
                    body.label = "player";
                    this.engine.addBody(body);
                } else {
                    const bodyPosition2D = new Vector2D(body.position.x, body.position.y);



                    if (Vector2D.subtract(player.body.position, bodyPosition2D).length() > 75) {
                        Matter.Body.setPosition(body, player.body.position);
                        console.log("Teleporting player", player.id);
                    } else {
                        Matter.Body.setPosition(body, Vector2D.lerp(bodyPosition2D, player.body.position, 0.1));
                    }
                    Matter.Body.setAngle(body, player.body.angle);

                    // const bodyVelocity2D = new Vector2D(body.velocity.x, body.velocity.y);
                    // if (Vector2D.subtract(player.body.velocity, bodyVelocity2D).length() > 25) {
                    Matter.Body.setVelocity(body, player.body.velocity);
                    //     console.log("snapping player velocity", player.id);
                    // } else {
                    //     Matter.Body.setVelocity(body, Vector2D.lerp(bodyVelocity2D, player.body.velocity, 0.1));
                    // }
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

        this.socket.on("removeBodies", (ids: number[]) => {
            console.log("Received remove bodies:", ids);
            for (const id of ids) {
                const body = this.engine.matterEngine.world.bodies.find(b => b.id === id);
                if (body) {
                    Matter.World.remove(this.engine.matterEngine.world, body, true);
                }
            }
        });

        this.socket.on('myPlayer', (id: string, bodyId: number) => {
            console.log("Received my player id:", id, bodyId);
            this.engine.myPlayerId = id;
            this.engine.myPlayerBodyId = bodyId;
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

    private handleKeyDown(e: KeyboardEvent): void {
        const body = this.engine.matterEngine.world.bodies.find(b => b.id === this.engine.myPlayerBodyId);
        if (!body) {
            return;
        }

        this.sendEvent('keydown', e.key);

        // Simulate server delay before "intepolating" the keydown
        this.engine.input[e.key] = true;
    }

    private handleKeyUp(e: KeyboardEvent): void {
        const body = this.engine.matterEngine.world.bodies.find(b => b.id === this.engine.myPlayerBodyId);
        if (!body) {
            return;
        }

        this.sendEvent('keyup', e.key);

        // Simulate server delay before "intepolating" the keyup

        this.engine.input[e.key] = false;
    }
}

// check node environment for local development

let env = import.meta.env.MODE;
let url = "http://localhost:3000";
if (env != "local" && env != "development") {
    url = "https://chickenhorseliteserver.azurewebsites.net";
}
console.log("Environment:", env, "URL:", url);
const client = new Client(url);
client.connect();