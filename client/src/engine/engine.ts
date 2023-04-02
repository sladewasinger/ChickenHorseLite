import Matter from "matter-js";
import { Plugin, PluginHandler } from "./pluginHandler";
import { SimpleBody } from "shared/SimpleBody";

export class Engine {
    public static readonly VERSION = '0.0.1';
    pluginHandler: PluginHandler;
    fps: number = 60;
    matterEngine: Matter.Engine;
    lastUpdated: number = 0;

    constructor() {
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

        Matter.Engine.update(this.matterEngine, delta);
        this.pluginHandler.runPlugins();

        this.lastUpdated = Date.now();
    }
}