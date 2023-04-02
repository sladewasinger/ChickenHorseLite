import Matter from "matter-js";
import { Plugin, PluginHandler } from "./pluginHandler";
import { SimpleBody } from "shared/SimpleBody";
import { BodyMetaData } from "shared/BodyMetaData";
import { Input } from 'shared/Input';
import { ClientPlayer } from "shared/ClientPlayer";
import { GameState } from "shared/GameState";
import { Renderer } from "renderer/renderer";
import { Vector2D } from "shared/math/Vector2D";

export class Engine {
    public static readonly VERSION = '0.0.1';
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

    constructor(public renderer: Renderer) {
        console.log(`Engine version ${Engine.VERSION} started`);

        this.pluginHandler = new PluginHandler();
        this.matterEngine = Matter.Engine.create();
    }

    public createBodyFromSimpleBody(simpleBody: SimpleBody) {
        if (simpleBody.type === 'circle') {
            if (!simpleBody.radius)
                throw new Error('Radius not defined');

            return Matter.Bodies.circle(simpleBody.position.x, simpleBody.position.y, simpleBody.radius, {
                id: simpleBody.id,
                angle: simpleBody.angle,
                angularVelocity: simpleBody.angularVelocity,
                velocity: simpleBody.velocity,
                isStatic: simpleBody.isStatic,
            });
        } else if (simpleBody.type === 'rectangle') {
            if (!simpleBody.width || !simpleBody.height)
                throw new Error('Width or height not defined');

            return Matter.Bodies.rectangle(simpleBody.position.x, simpleBody.position.y, simpleBody.width, simpleBody.height, {
                id: simpleBody.id,
                angle: simpleBody.angle,
                angularVelocity: simpleBody.angularVelocity,
                velocity: simpleBody.velocity,
                isStatic: simpleBody.isStatic,
            });
        }

        throw new Error('Unknown body type: ' + simpleBody.type);
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

    start() {
        setInterval(() => {
            this.update();
        }, 1000 / this.fps);
    }

    update() {
        if (!this.matterEngine) {
            throw new Error('Matter engine not initialized');
        }

        const now = Date.now();
        const delta = now - this.lastUpdated;

        this.handleInput();
        if (this.myPlayer) {
            this.handleLandingCheck(this.myPlayer);
            this.targetCameraPosition = this.renderer.camera.position.lerp(this.myPlayer.body.position, 0.1);
            this.renderer.panTo(this.targetCameraPosition.x, this.targetCameraPosition.y);
        }

        Matter.Engine.update(this.matterEngine, delta);
        this.pluginHandler.runPlugins();

        this.lastUpdated = Date.now();
    }

    handleInput() {
        const body = this.matterEngine.world.bodies.find(body => body.id === this.myPlayerBodyId);
        if (!this.myPlayer || !body) {
            return;
        }

        if (this.input[' '] && this.myPlayer.grounded && !this.myPlayer.jumpDebounce) {
            console.log("jump")
            this.myPlayer.jumpDebounce = true;
            this.myPlayer.grounded = false;
            setTimeout(() => {
                if (!this.myPlayer) {
                    return;
                }
                this.myPlayer.jumpDebounce = false;
            }, 500);
            Matter.Body.applyForce(body, body.position, { x: 0, y: -0.05 });
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
        if (!body || player.grounded || player.jumpDebounce) {
            return;
        }

        // ray cast down and see if we hit the ground
        const rayCollisions = Matter.Query
            .ray(this.matterEngine.world.bodies, body.position, { x: body.position.x, y: body.position.y + (<any>body).radius + 10 })
            .filter((collision) => collision.bodyA.id !== player.body.id || collision.bodyB.id !== player.body.id);

        if (rayCollisions.length > 0) {
            player.grounded = true;
        }
    }
}