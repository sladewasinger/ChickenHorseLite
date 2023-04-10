import Matter from "matter-js";
import { Plugin, PluginHandler } from "./pluginHandler";
import { SimpleBody } from "shared/SimpleBody";
import { BodyMetaData } from "shared/BodyMetaData";
import { Input } from 'shared/Input';
import { ClientPlayer } from "shared/ClientPlayer";
import { GameState } from "shared/GameState";
import { Renderer } from "renderer/renderer";
import { Vector2D } from "shared/math/Vector2D";
import { Socket } from "socket.io-client";
import { CustomBody } from "models/CustomBody";
import { PixiRenderer } from "renderer/PixiRenderer";

export class Engine {
    public static readonly VERSION = '0.0.1';
    socket: Socket | undefined;
    pluginHandler: PluginHandler;
    fps: number = 60;
    matterEngine: Matter.Engine;
    lastUpdated: number = 0;
    lastUpdatedUTC: number = 0;
    myPlayerId: string | undefined;
    myPlayerBodyId: number | undefined;
    input: Input = new Input();
    gameState: GameState = new GameState();
    bodyMetaData: Map<number, BodyMetaData> = new Map();
    targetCameraPosition: Vector2D = new Vector2D(0, 0);
    jumpDebounce: boolean = false;
    maxDt: number = 1000 / 20;
    latestCommandId: number = 0;
    inputDebounce: boolean = false;
    debugMode: boolean = false;

    constructor(public renderer: PixiRenderer) {
        console.log(`Engine version ${Engine.VERSION} started`);

        this.pluginHandler = new PluginHandler();
        this.matterEngine = Matter.Engine.create();
    }

    handleGameState(gameState: GameState) {
        if (gameState.frameNumber < this.gameState.frameNumber) {
            console.error('Received old game state');
            return;
        }
        if (gameState.frameNumber > this.gameState.frameNumber + 4) {
            console.error('Dropped frames: ', gameState.frameNumber - this.gameState.frameNumber + 1);
        }


        this.lastUpdatedUTC = new Date().getTime();
        const dt = this.lastUpdatedUTC - gameState.timeStampUTC;
        if (dt > 100) {
            console.error("Server is behind client by: ", dt, " ms")
        }

        const player = gameState.players.find(p => p.id === this.myPlayerId);
        if (player) {
            if (this.debugMode)
                this.renderer.renderGhostPlayer(player);
            else
                this.renderer.renderGhostPlayer(undefined);

            if (player.latestCommandId < this.latestCommandId) {
                if (this.debugMode)
                    console.error('Server is behind client inputs. Skipping this update.');
                return;
            }
            if (this.debugMode)
                console.log('gameStateUpadted', player.latestCommandId);
        }

        this.gameState = gameState;

        for (const body of gameState.dynamicBodies) {
            let b = this.matterEngine.world.bodies.find(b => b.id === body.id);
            if (!b) {
                const b = this.createBodyFromSimpleBody(body);
                b.friction = 1;
                this.addBody(b);
            } else {
                Matter.Body.setPosition(b, body.position);
                Matter.Body.setAngle(b, body.angle);
                Matter.Body.setVelocity(b, body.velocity);
                Matter.Body.setAngularVelocity(b, body.angularVelocity);
            }
        }


        for (const player of gameState.players) {
            const clientBody = this.matterEngine.world.bodies.find(b => b.id === player.body.id);
            if (!clientBody) {
                const body = this.createBodyFromSimpleBody(player.body);
                body.label = "player";
                body.inertia = Infinity;
                body.friction = 1;

                this.addBody(body);
            } else {
                const serverPosition2D = new Vector2D(player.body.position.x, player.body.position.y);
                const clientPosition2D = new Vector2D(clientBody.position.x, clientBody.position.y);

                // Interpolate playerPosition with velocity to account for network latency
                const serverVelocity = new Vector2D(player.body.velocity.x, player.body.velocity.y);
                const playerPositionInterpolated = Vector2D.add(serverPosition2D, Vector2D.multiply(serverVelocity, dt / 1000));

                if (this.debugMode)
                    this.renderer.renderGhostPlayerInterpolated(playerPositionInterpolated);
                else
                    this.renderer.renderGhostPlayerInterpolated(undefined);

                if (Vector2D.subtract(serverPosition2D, clientPosition2D).length() > 75) {
                    Matter.Body.setPosition(clientBody, serverPosition2D);
                    console.log("Teleporting player", player.id);
                } else {
                    Matter.Body.setPosition(clientBody, Vector2D.lerp(clientPosition2D, serverPosition2D, 0.25));
                }

                // const bodyVelocity2D = new Vector2D(body.velocity.x, body.velocity.y);
                // const velocityLerpValue = 0.1;
                //Matter.Body.setVelocity(body, Vector2D.lerp(bodyVelocity2D, player.body.velocity, velocityLerpValue));
                Matter.Body.setVelocity(clientBody, player.body.velocity);
                Matter.Body.setAngle(clientBody, player.body.angle);
                Matter.Body.setAngularVelocity(clientBody, player.body.angularVelocity);
            }
        };
    }

    public createBodyFromSimpleBody(simpleBody: SimpleBody) {
        const options = {
            id: simpleBody.id,
            angle: simpleBody.angle,
            angularVelocity: simpleBody.angularVelocity,
            velocity: simpleBody.velocity,
            isStatic: simpleBody.isStatic,
            label: simpleBody.label,
            isSensor: simpleBody.isSensor,
            fillColor: simpleBody.fillColor,
            strokeColor: simpleBody.strokeColor,
            radius: simpleBody.radius,
            width: simpleBody.width,
            height: simpleBody.height,
        };

        if (simpleBody.shape === 'circle') {
            if (!simpleBody.radius)
                throw new Error('Radius not defined');

            return Matter.Bodies.circle(simpleBody.position.x, simpleBody.position.y, simpleBody.radius, options);
        } else if (simpleBody.shape === 'rectangle') {
            if (!simpleBody.width || !simpleBody.height)
                throw new Error('Width or height not defined');

            return Matter.Bodies.rectangle(simpleBody.position.x, simpleBody.position.y, simpleBody.width, simpleBody.height, options);
        }

        throw new Error('Unknown body type: ' + simpleBody.shape);
    }

    addBodies(bodies: Matter.Body[]) {
        Matter.World.add(this.matterEngine.world, bodies);
    }

    addBody(body: Matter.Body) {
        Matter.World.add(this.matterEngine.world, body);
    }

    addPlugin(plugin: Plugin) {
        this.pluginHandler.addPlugin(plugin);
    }

    get myPlayer() {
        return this.gameState.players.find(player => player.id === this.myPlayerId);
    }

    start(socket: Socket) {
        this.socket = socket;

        setInterval(() => {
            this.update();
        }, 1000 / this.fps);
    }

    update() {
        if (!this.matterEngine) {
            throw new Error('Matter engine not initialized');
        }

        const now = Date.now();
        let delta = now - this.lastUpdated;
        if (delta > this.maxDt) {
            delta = this.maxDt;
        }

        if (this.myPlayer) {
            this.handleLandingCheck(this.myPlayer);
            this.handleInput();
            const worldBody = this.matterEngine.world.bodies.find(body => body.id === this.myPlayer!.body.id);
            if (worldBody) {
                const worldBodyPosition = new Vector2D(worldBody.position.x, worldBody.position.y);
                this.targetCameraPosition = this.renderer.camera.position.lerp(worldBodyPosition, 0.1);
                this.renderer.panTo(this.targetCameraPosition.x, this.targetCameraPosition.y);
            }
        }

        Matter.Engine.update(this.matterEngine, delta);
        this.pluginHandler.runPlugins();

        this.lastUpdated = Date.now();
    }

    public sendEvent(event: string, data: any): void {
        if (this.socket && this.socket.connected) {
            this.socket.emit(event, data);
        }
    }

    handleKeyDown(key: string) {
        const utcNow = new Date().getTime();

        if (!this.input[key]?.pressed) {
            this.latestCommandId++;
            this.sendEvent('keydown', { key: key, utcTime: utcNow, commandId: this.latestCommandId });
        }

        if (key == 'i') {
            this.debugMode = !this.debugMode;
        }

        this.input[key] = { pressed: true, time: utcNow };
    }

    handleKeyUp(key: string) {
        const utcNow = new Date().getTime();

        if (this.input[key]?.pressed) {
            this.latestCommandId++;
            this.sendEvent('keyup', { key: key, utcTime: utcNow, commandId: this.latestCommandId });
        }

        this.input[key] = { pressed: false, time: utcNow };
    }

    handleInput() {
        const body = this.matterEngine.world.bodies.find(body => body.id === this.myPlayerBodyId);
        if (!this.myPlayer || !body) {
            return;
        }

        if (this.input[' ']?.pressed && this.myPlayer.jumpReleased) {
            if (this.myPlayer.grounded) {
                this.myPlayer.grounded = false;
                Matter.Body.setVelocity(body, { x: body.velocity.x, y: -10 });
            } else if (this.myPlayer.hasDoubleJump) {
                this.myPlayer.hasDoubleJump = false;
                Matter.Body.setVelocity(body, { x: body.velocity.x, y: -10 });
            }
        }

        const moveVector = new Vector2D(0, 0);
        if (this.input['a']?.pressed) {
            moveVector.x -= 1;
        }
        if (this.input['d']?.pressed) {
            moveVector.x += 1;
        }
        if (moveVector.length() > 0 && !this.inputDebounce) {
            this.inputDebounce = true;
            setTimeout(() => {
                this.inputDebounce = false;
                Matter.Body.setVelocity(body, { x: moveVector.x * 5, y: body.velocity.y });
            }, 10);
        }
    }

    private handleLandingCheck(player: ClientPlayer): void {
        const body = this.matterEngine.world.bodies.find((body) => body.id === player.body.id);
        if (!body || this.jumpDebounce) {
            return;
        }

        // ray cast down and see if we hit the ground
        // ray cast down and see if we hit the ground
        const validIds = this.matterEngine.world.bodies.map((body) => body.id);
        const rayCollisions = Matter.Query
            .ray(this.matterEngine.world.bodies, body.position, { x: body.position.x, y: body.position.y + 25 });
        const filteredCollisions = rayCollisions
            .filter((collision) => (<any>collision).body.id !== player.body.id)
            .filter((collision) => (<any>collision).body.isSensor !== true)
            .filter((collision) => validIds.includes(collision.bodyA.id) && validIds.includes(collision.bodyB.id));

        if (filteredCollisions.length > 0) {
            player.grounded = true;
        }
    }
}