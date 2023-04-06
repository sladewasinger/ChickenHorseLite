import Matter from "matter-js";
import { Player } from "./models/Player.js";
import { Input } from "../../shared/Input.js";
import { SimpleBody } from "shared/SimpleBody.js";
import { BodyMetaData } from "shared/BodyMetaData.js";
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
    public clientUpdateFps: number = 20;
    private players: Player[] = [];
    private maxDt: number = 1000 / 10;

    constructor(
        private io: SocketIOServer,
    ) {
        this.engine = Matter.Engine.create();
    }

    public start(): void {
        this.update();
    }

    public update(): void {
        this.frameNumber++;
        const now = Date.now();
        let gameDelta = now - this.lastUpdated;
        gameDelta = Math.min(gameDelta, this.maxDt);
        const clientDelta = now - this.lastClientUpdate;

        for (const player of this.players) {
            this.handleFallThroughFloor(player);
            this.handleLandingCheck(player);
            this.handleInput(player.id, player.input);
        }

        Matter.Engine.update(this.engine, gameDelta);

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
                    grounded: player.grounded,
                    jumpDebounce: player.jumpDebounce,
                    body: this.getSimpleBodyFromBody(pBody),
                };
                clientPlayers.push(clientPlayer);
            }
            const gameState = <GameState>{
                frameNumber: this.frameNumber,
                players: clientPlayers,
                dynamicBodies: this.getDynamicBodies().filter((body) => !body.isStatic),
            };
            this.io.volatile.emit("gameState", gameState); // volatile = don't buffer
            this.lastClientUpdate = now;
        }

        this.lastUpdated = now;

        setTimeout(() => {
            this.update();
        }, 1000 / this.fps);
    }

    handleFallThroughFloor(player: Player) {
        const body = this.engine.world.bodies.find((body) => body.id === player.bodyId);
        if (!body) {
            return;
        }
        if (body.position.y > 3000) {
            Matter.Body.setPosition(body, { x: 200, y: 0 });
        }
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
        (<any>playerBody).isJumping = false;
        (<any>playerBody).canJump = true;
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

        if (input[' '] && !player.jumpDebounce && player.grounded) {
            player.jumpDebounce = true;
            player.grounded = false;
            setTimeout(() => {
                player.jumpDebounce = false;
            }, 500);
            Matter.Body.setVelocity(body, { x: body.velocity.x, y: -10 });
        }
        if (input['a']) {
            Matter.Body.setVelocity(body, { x: -5, y: body.velocity.y });
        }
        if (input['d']) {
            Matter.Body.setVelocity(body, { x: 5, y: body.velocity.y });
        }
    }

    private handleLandingCheck(player: Player): void {
        const body = this.engine.world.bodies.find((body) => body.id === player.bodyId);
        if (!body /*|| player.grounded || player.jumpDebounce*/) {
            return;
        }

        // ray cast down and see if we hit the ground
        const rayCollisions = Matter.Query
            .ray(this.engine.world.bodies, body.position, { x: body.position.x, y: body.position.y + (<any>body).radius + 5 });
        const filteredCollisions = rayCollisions
            .filter((collision) => (<any>collision).body.label !== "player");

        if (filteredCollisions.length > 0) {
            player.grounded = true;
        }
    }
}