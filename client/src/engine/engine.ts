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

export class Engine {
    public static readonly VERSION = '0.0.1';
    socket: Socket | undefined;
    pluginHandler: PluginHandler;
    fps: number = 60;
    matterEngine: Matter.Engine;
    lastUpdated: number = 0;
    myPlayerId: string | undefined;
    myPlayerBodyId: number | undefined;
    input: Input = new Input();
    gameState: GameState = new GameState();
    bodyMetaData: Map<number, BodyMetaData> = new Map();
    targetCameraPosition: Vector2D = new Vector2D(0, 0);
    jumpDebounce: boolean = false;
    maxDt: number = 1000 / 20;
    public latestCommandId: number = 0;


    constructor(public renderer: Renderer) {
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
        const player = gameState.players.find(p => p.id === this.myPlayerId);
        if (player) {
            if (player.latestCommandId < this.latestCommandId) {
                console.error('Server is behind client inputs. Skipping this update.');
                return;
            }
            console.log('gameStateUpadted', player.latestCommandId);
        }

        for (const body of gameState.dynamicBodies) {
            let b = this.matterEngine.world.bodies.find(b => b.id === body.id);
            if (!b) {
                const b = this.createBodyFromSimpleBody(body);
                this.addBody(b);
            } else {
                Matter.Body.setPosition(b, body.position);
                Matter.Body.setAngle(b, body.angle);
                Matter.Body.setVelocity(b, body.velocity);
                Matter.Body.setAngularVelocity(b, body.angularVelocity);
            }
        }

        this.gameState = gameState;
        for (const player of gameState.players) {
            const body = this.matterEngine.world.bodies.find(b => b.id === player.body.id);
            if (!body) {
                const body = this.createBodyFromSimpleBody(player.body);
                body.label = "player";
                this.addBody(body);
            } else {
                const bodyPosition2D = new Vector2D(body.position.x, body.position.y);

                if (Vector2D.subtract(player.body.position, bodyPosition2D).length() > 500) {
                    Matter.Body.setPosition(body, player.body.position);
                    console.log("Teleporting player", player.id);
                } else {
                    Matter.Body.setPosition(body, Vector2D.lerp(bodyPosition2D, player.body.position, 0.25));
                }
                Matter.Body.setAngle(body, player.body.angle);

                // const bodyVelocity2D = new Vector2D(body.velocity.x, body.velocity.y);
                // if (Vector2D.subtract(player.body.velocity, bodyVelocity2D).length() > 25) {
                Matter.Body.setVelocity(body, player.body.velocity);
                //     console.log("snapping player velocity", player.id);
                // } else {
                //     Matter.Body.setVelocity(body, Vector2D.lerp(bodyVelocity2D, player.body.velocity, 0.5));
                // }
                Matter.Body.setAngularVelocity(body, player.body.angularVelocity);
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
            strokeColor: simpleBody.strokeColor
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

        if (!this.input[key]) {
            this.latestCommandId++;
            this.sendEvent('keydown', { key: key, utcTime: utcNow, commandId: this.latestCommandId });
            console.log('sent keydown', key, this.latestCommandId);
        }

        this.input[key] = true;
    }

    handleKeyUp(key: string) {
        const utcNow = new Date().getTime();

        if (this.input[key]) {
            this.sendEvent('keyup', { key: key, utcTime: utcNow });
        }

        this.input[key] = false;
    }

    handleInput() {
        const body = this.matterEngine.world.bodies.find(body => body.id === this.myPlayerBodyId);
        if (!this.myPlayer || !body) {
            return;
        }

        if (this.input[' '] && this.myPlayer.grounded) {
            // this.jumpDebounce = true;
            // this.myPlayer.grounded = false;
            // setTimeout(() => {
            //     if (!this.myPlayer) {
            //         return;
            //     }
            //     this.jumpDebounce = false;
            // }, 525);
            Matter.Body.setVelocity(body, { x: body.velocity.x, y: -10 });
            //Matter.Body.applyForce(body, body.position, { x: 0, y: -0.05 });
        }
        if (this.input['a']) {
            Matter.Body.setVelocity(body, { x: -5, y: body.velocity.y });
        }
        if (this.input['d']) {
            Matter.Body.setVelocity(body, { x: 5, y: body.velocity.y });
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