import Matter from "matter-js";
import { Player } from "./models/Player.js";
import { Input } from "../../shared/Input.js";
import { SimpleBody } from "shared/SimpleBody.js";
import { Level } from "./levels/Level.js";
import { ShapeFactory } from "./utilities/ShapeFactory.js";
import { Server as SocketIOServer, Socket } from "socket.io";
import { GameState } from "shared/GameState.js";
import { ClientPlayer } from "shared/ClientPlayer.js";
import { CustomBody } from "./models/CustomBody.js";
import { Vector2D } from "../../shared/math/Vector2D.js";

export class Engine {
    public engine: Matter.Engine;
    public lastUpdated: number = 0;
    public lastClientUpdate: number = 0;
    public fps: number = 60;
    public frameNumber: number = 0;
    public clientUpdateFps: number = 20;

    private startingZone: CustomBody | undefined;
    private goal: CustomBody | undefined;
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
            this.sendClientUpdate();
        }

        this.lastUpdated = now;

        setTimeout(() => {
            this.update();
        }, 1000 / this.fps);
    }

    private sendClientUpdate() {
        const now = Date.now();
        const clientPlayers: ClientPlayer[] = [];
        for (const player of this.players) {
            const pBody = this.engine.world.bodies.find((body) => body.id === player.bodyId) as CustomBody;
            if (!pBody) {
                continue;
            }
            const clientPlayer = <ClientPlayer>{
                id: player.id,
                name: player.name,
                grounded: player.grounded,
                jumpDebounce: player.jumpDebounce,
                jumpReleased: player.jumpReleased,
                hasDoubleJump: player.hasDoubleJump,
                body: ShapeFactory.GetSimpleBodyFromBody(pBody),
                latestCommandId: player.latestCommandId,
            };
            clientPlayers.push(clientPlayer);
        }
        const gameState = <GameState>{
            frameNumber: this.frameNumber,
            players: clientPlayers,
            dynamicBodies: this.getDynamicBodies(),
            timeStampUTC: new Date().getTime(),
        };
        this.io.volatile.emit("gameState", gameState); // volatile = don't buffer
        this.lastClientUpdate = now;
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

    public getDynamicBodies(): SimpleBody[] {
        return this.engine.world.bodies
            .filter((body) => body.isStatic)
            .filter((body) => body.label !== 'player')
            .map((body) => {
                return ShapeFactory.GetSimpleBodyFromBody(body as CustomBody)
            });
    }

    public loadLevel(level: Level) {
        const bodies = level.getBodies();

        const startingZone = bodies.find((body) => body.label === "startingZone") as CustomBody;
        const goal = bodies.find((body) => body.label === "goal") as CustomBody;

        if (bodies.some((body) => body.shape === undefined)) {
            throw new Error("Body type is not defined");
        }

        if (!startingZone) {
            throw new Error("Starting zone is not defined");
        }

        if (!goal) {
            throw new Error("Goal is not defined");
        }

        Matter.World.add(this.engine.world, bodies);

        startingZone.isSensor = true;
        goal.isSensor = true;

        this.startingZone = startingZone;
        this.goal = goal;

        Matter.World.add(this.engine.world, [startingZone, goal]);
    }

    public getPlayer(id: string) {
        return this.players.find((player) => player.id === id);
    }

    public addPlayer(id: string, name: string): void {
        if (!this.startingZone || !this.goal) {
            throw new Error("Level is not loaded");
        }

        const newPlayer = new Player(id, name);
        this.players.push(newPlayer);

        const playerBody = ShapeFactory.CreateCircle(
            this.startingZone.position.x,
            this.startingZone.position.y,
            20,
            false);
        playerBody.label = "player";
        playerBody.inertia = Infinity;

        newPlayer.bodyId = playerBody.id;
        Matter.World.add(this.engine.world, playerBody);

        const bodies = this.engine.world.bodies;
        const simpleBodies: SimpleBody[] = [];
        for (const body of bodies.filter((body) => body.isStatic)) {
            if (body.label === "player") {
                continue;
            }

            const simpleBody = ShapeFactory.GetSimpleBodyFromBody(body as CustomBody);
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

    handleKeyDown(id: string, keyInput: { key: string; utcTime: number; commandId: number; }) {
        const player = this.getPlayer(id);
        if (!player) {
            console.log("Player not found", id)
            return;
        }

        const key = keyInput.key;
        const utcTime = keyInput.utcTime;

        const utcNow = new Date().getTime();
        console.log("keydown", key, utcNow - utcTime);

        player.input[key] = { pressed: true, time: utcTime };
        player.latestCommandId = keyInput.commandId;
        this.handleInput(player.id, player.input);
    }

    handleKeyUp(id: string, keyInput: { key: string; utcTime: number; commandId: number; }) {
        const player = this.getPlayer(id);
        if (!player) {
            return;
        }

        const key = keyInput.key;
        const utcTime = keyInput.utcTime;


        const utcNow = new Date().getTime();
        console.log("keyup", key, utcNow - utcTime);

        player.input[key] = { pressed: false, time: utcTime };
        player.latestCommandId = keyInput.commandId;

        if (key === ' ') {
            player.jumpReleased = true;
        }
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

        if (input[' ']?.pressed) {
            if (player.jumpReleased && !player.jumpDebounce) {
                if (player.grounded) {
                    player.jumpDebounce = true;
                    player.grounded = false;
                    player.hasDoubleJump = true;
                    setTimeout(() => {
                        player.jumpDebounce = false;
                    }, 100);


                    const dt = new Date().getTime() - input[' '].time;
                    // const baseVelocity = { ...body.velocity };
                    // baseVelocity.y = -10;

                    // // // Apply gravity
                    // const gravity = this.engine.gravity;
                    // baseVelocity.y += gravity.y * dt / 1000;


                    // const xAdjustment = baseVelocity.x * dt / 1000;
                    // const yAdjustment = (baseVelocity.y * (dt / 1000));
                    // console.log('basevelocity.y', baseVelocity.y);
                    // console.log('y adjustment', yAdjustment);

                    Matter.Body.setVelocity(body, { x: body.velocity.x, y: -10 });
                    console.log("moving forward", dt, "ms");
                    //Matter.Engine.update(this.engine, dt);
                    this.sendClientUpdate();
                    //setTimeout(() => this.update(), 0);
                    //Matter.Body.setPosition(body, { x: body.position.x + xAdjustment, y: body.position.y + yAdjustment });
                } else if (player.hasDoubleJump) {
                    player.jumpDebounce = true;
                    player.hasDoubleJump = false;
                    setTimeout(() => {
                        player.jumpDebounce = false;
                    }, 100);
                    Matter.Body.setVelocity(body, { x: body.velocity.x, y: -10 });
                }
            } else {
                player.jumpReleased = false;
            }
        }

        const moveVector = new Vector2D(0, 0);
        const speed = 5;
        const now = new Date().getTime();
        let dt = now;

        if (input['a']?.pressed) {
            moveVector.x -= 1 * speed;
            dt = dt - input['a'].time;
            input['a'].time = now;
        }
        if (input['d']?.pressed) {
            moveVector.x += 1 * speed;
            dt = dt - input['d'].time;
            input['d'].time = now;
        }
        if (moveVector.length() > 0) {
            // if (Math.abs(moveVector.x - body.velocity.x) >= speed * 0.5) { // switched directions?
            //     const xAdjustment = moveVector.x * dt / 1000;
            //     Matter.Body.setPosition(body, { x: body.position.x + xAdjustment, y: body.position.y });
            //     console.log('xAjustment', xAdjustment);
            // }

            Matter.Body.setVelocity(body, { x: moveVector.x, y: body.velocity.y });
            //Matter.Engine.update(this.engine, dt);
            //this.sendClientUpdate();
        }
    }

    private handleLandingCheck(player: Player): void {
        const body = this.engine.world.bodies.find((body) => body.id === player.bodyId);
        if (!body /*|| player.grounded || player.jumpDebounce*/) {
            return;
        }

        // ray cast down and see if we hit the ground
        const rayCollisions = Matter.Query
            .ray(this.engine.world.bodies, body.position, { x: body.position.x, y: body.position.y + (<any>body).radius + 5 }, 10);
        const filteredCollisions = rayCollisions
            .filter((collision) => (<any>collision).body.id !== player.bodyId)
            .filter((collision) => (<any>collision).body.isSensor !== true);

        if (filteredCollisions.length > 0) {
            player.grounded = true;
            player.hasDoubleJump = true;
        } else {
            player.grounded = false;
        }
    }
}