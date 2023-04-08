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
import { i } from 'mathjs';

class Client {
    private socket: Socket | undefined;
    private engine: Engine | undefined;
    private renderer: Renderer | undefined;
    private canvas: HTMLCanvasElement;

    private nameForm: NameForm;
    private loadingIcon: LoadingIcon;

    constructor(private serverUrl: string) {
        this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error('Canvas not found');
        }

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

        console.log("Renderer started", this.renderer);

        this.socket.on("connect", () => {
            console.log("Connected to server");

            // Send data to server
            this.socket!.emit("event", { data: "Hello from client" });
            this.loadingIcon.hide();
            this.nameForm.show();

            this.renderer = new Renderer(this.canvas);
            this.engine = new Engine(this.renderer);
            this.engine.addPlugin(new MousePan(this.engine, this.renderer));

            this.engine.start(this.socket!);
            this.renderer.start(this.engine);
        });

        this.socket.on("event", (data: any) => {
            console.log("Received data:", data);
        });

        this.socket.on("disconnect", () => {
            this.disconnect();
        });

        this.socket.on('gameState', (gameState: GameState) => {
            if (!this.engine) {
                return;
            }

            this.engine.handleGameState(gameState);
        });

        this.socket.on("bodies", (simpleBodies: SimpleBody[]) => {
            if (!this.engine) {
                return;
            }
            console.log("Received bodies:", simpleBodies);

            for (const simpleBody of simpleBodies) {
                const b = this.engine.matterEngine.world.bodies.find(b => b.id === simpleBody.id);
                if (b) {
                    continue;
                }
                console.log(simpleBody);
                const body = this.engine.createBodyFromSimpleBody(simpleBody);
                this.engine.addBodies([body]);
            }
        });

        this.socket.on("removeBodies", (ids: number[]) => {
            if (!this.engine) {
                return;
            }
            console.log("Received remove bodies:", ids);
            for (const id of ids) {
                const body = this.engine.matterEngine.world.bodies.find(b => b.id === id);
                if (body) {
                    Matter.World.remove(this.engine.matterEngine.world, body, true);
                }
            }
        });

        this.socket.on('myPlayer', (id: string, bodyId: number) => {
            if (!this.engine) {
                return;
            }
            console.log("Received my player id:", id, bodyId);
            this.engine.myPlayerId = id;
            this.engine.myPlayerBodyId = bodyId;
        });
    }

    public sendEvent(event: string, data: any): void {
        if (this.socket && this.socket.connected) {
            this.socket.emit(event, data);
        }
    }

    public disconnect(): void {
        console.log("Disconnected from server");
        this.nameForm.hide();
        this.loadingIcon.show();

        // if (this.socket) {
        //     this.socket.disconnect();
        // }

        delete this.renderer;
        delete this.engine;
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (!this.engine) {
            return;
        }
        const body = this.engine.matterEngine.world.bodies.find(b => b.id === this.engine!.myPlayerBodyId);
        if (!body) {
            return;
        }

        if (!this.validateKey(e.key)) {
            return;
        }

        // const utcNow = new Date().getTime();
        // console.log("keydown", e.key, utcNow);
        this.engine.handleKeyDown(e.key);
    }

    private handleKeyUp(e: KeyboardEvent): void {
        if (!this.engine) {
            return;
        }
        const body = this.engine.matterEngine.world.bodies.find(b => b.id === this.engine!.myPlayerBodyId);
        if (!body) {
            return;
        }

        if (!this.validateKey(e.key)) {
            return;
        }

        // const utcNow = new Date().getTime();
        // console.log("keyup", e.key, utcNow);
        this.engine.handleKeyUp(e.key);
    }


    private validateKey(key: string) {
        const validKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", " ", "i"];

        if (!validKeys.includes(key)) {
            return false;
        }

        return true;
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