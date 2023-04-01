import Matter from "matter-js";
import { Plugin, PluginHandler } from "./pluginHandler";

export class Engine {
    public static readonly VERSION = '0.0.1';
    pluginHandler: PluginHandler;
    fps: number = 60;
    matterEngine: Matter.Engine;

    constructor() {
        console.log(`Engine version ${Engine.VERSION} started`);

        this.pluginHandler = new PluginHandler();
        this.matterEngine = Matter.Engine.create();
    }

    addBodies(bodies: Matter.Body[]) {
        Matter.World.add(this.matterEngine.world, bodies);
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

        // update matter js engine
        // Matter.Engine.update(engine);
        Matter.Engine.update(this.matterEngine, 1000 / this.fps);
        this.pluginHandler.runPlugins();
    }
}