import Matter from "matter-js";
import { Player } from "./models/Player.js";
import { Input } from "../../shared/Input.js";
import { SimpleBody } from "shared/SimpleBody.js";
import { Level, ShapeFactory } from "./levels/Level.js";
import { Server as SocketIOServer, Socket } from "socket.io";
import { GameState } from "shared/GameState.js";
import { ClientPlayer } from "shared/ClientPlayer.js";

export class Engine {
    public engine: Matter.Engine;
    public lastUpdated: number = 0;
    public lastClientUpdate: number = 0;
    public fps: number = 60;
    public frameNumber: number = 0;
    public clientUpdateFps: number = 1;
    private players: Player[] = [];

    constructor(
        private io: SocketIOServer,
    ) {
        this.engine = Matter.Engine.create();
    }

    public start(): void {
        this.update();
    }

    private update(): void {
        this.frameNumber++;
        const now = Date.now();
        const gameDelta = now - this.lastUpdated;
        const clientDelta = now - this.lastClientUpdate;

        Matter.Engine.update(this.engine, gameDelta);

        for (const player of this.players) {
            this.handleInput(player.id, player.input);
        }

        if (clientDelta > 1000 / this.clientUpdateFps) {
            const clientPlayers: ClientPlayer[] = [];
            for (const player of this.players) {
                const pBody = this.engine.world.bodies.find((body) => body.id === player.bodyId);
                if (!pBody) {
                    continue;
                }
                const clientPlayer = <ClientPlayer>{
                    id: player.id,
                    name: player.name,
                    body: this.getSimpleBodyFromBody(pBody),
                };
                clientPlayers.push(clientPlayer);
            }
            const gameState = <GameState>{
                players: clientPlayers,
                dynamicBodies: this.getDynamicBodies().filter((body) => !body.isStatic),
            };
            this.io.emit("gameState", gameState);
            this.lastClientUpdate = now;
        }

        this.lastUpdated = now;

        setTimeout(() => {
            this.update();
        }, 1000 / this.fps);
    }

    public getSimpleBodyFromBody(body: Matter.Body): SimpleBody {
        return <SimpleBody>{
            id: body.id,
            position: { x: body.position.x, y: body.position.y },
            velocity: { x: body.velocity.x, y: body.velocity.y },
            angle: body.angle,
            angularVelocity: body.angularVelocity,
            type: (<any>body).simpleBodyType,
            isStatic: body.isStatic,
            label: body.label,
            width: (<any>body).width,
            height: (<any>body).height,
            radius: (<any>body).radius,
        };
    }

    public getDynamicBodies(): SimpleBody[] {
        return this.engine.world.bodies
            .filter((body) => body.isStatic)
            .filter((body) => body.label !== 'player')
            .map((body) => {
                return this.getSimpleBodyFromBody(body)
            });
    }

    public loadLevel(level: Level) {
        const bodies = level.getBodies();
        if (bodies.some((body) => !(<any>body).simpleBodyType)) {
            throw new Error("Body type is not defined");
        }
        Matter.World.add(this.engine.world, bodies);
    }

    public getPlayer(id: string) {
        return this.players.find((player) => player.id === id);
    }

    public addPlayer(id: string, name: string): void {
        const newPlayer = new Player(id, name);
        this.players.push(newPlayer);

        const playerBody = ShapeFactory.createCircle(200, 0, 20, false);
        playerBody.label = "player";
        newPlayer.bodyId = playerBody.id;
        Matter.World.add(this.engine.world, playerBody);

        const bodies = this.engine.world.bodies;
        const simpleBodies: SimpleBody[] = [];
        for (const body of bodies.filter((body) => body.isStatic)) {
            if (body.label === "player") {
                continue;
            }

            const simpleBody = this.getSimpleBodyFromBody(body);
            simpleBodies.push(simpleBody);
        }
        this.io.to(newPlayer.id).emit("bodies", simpleBodies);
        this.io.to(newPlayer.id).emit("myPlayer", newPlayer.id, newPlayer.bodyId);
    }

    public removePlayer(id: string): void {
        const player = this.getPlayer(id);
        if (!player) {
            return;
        }

        this.players = this.players.filter((player) => player.id !== id);
        const body = this.engine.world.bodies.find((body) => body.id === player.bodyId);
        if (body) {
            Matter.World.remove(this.engine.world, body);
        }
        this.io.emit("removeBodies", [player.bodyId]);
    }

    public handleInput(id: string, input: Input): void {
        const player = this.getPlayer(id);
        if (!player) {
            return;
        }

        const body = this.engine.world.bodies.find((body) => body.id === player.bodyId);
        if (!body) {
            return;
        }

        if (input['w']) {
            Matter.Body.setVelocity(body, { x: 0, y: -5 });
        }
        if (input['s']) {
            Matter.Body.setVelocity(body, { x: 0, y: 5 });
        }
        if (input['a']) {
            Matter.Body.setVelocity(body, { x: -5, y: 0 });
        }
        if (input['d']) {
            Matter.Body.setVelocity(body, { x: 5, y: 0 });
        }
    }
}