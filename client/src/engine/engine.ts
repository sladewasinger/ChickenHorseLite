import Matter from "matter-js";
import { Mouse } from "./mouse";
import { PluginHandler } from "./pluginHandler";
import { BoxCreator } from "./plugins/BoxCreator";
import { MousePan } from "./plugins/MousePan";
import { Renderer } from "./renderer";

export class Engine {
    public static readonly VERSION = '0.0.1';
    canvas: HTMLCanvasElement;
    renderer: Renderer;
    pluginHandler: PluginHandler;
    mouse: Mouse;
    fps: number = 60;
    matterEngine: Matter.Engine;

    constructor() {
        console.log(`Engine version ${Engine.VERSION} started`);
        this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error('Canvas not found');
        }

        this.renderer = new Renderer(this.canvas);
        this.pluginHandler = new PluginHandler();
        this.mouse = new Mouse(this.renderer);

        this.matterEngine = Matter.Engine.create();;
    }

    start() {
        // create ground
        const ground = Matter.Bodies.rectangle(
            this.canvas.width / 2,
            this.canvas.height - 25,
            this.canvas.width,
            50,
            { isStatic: true }
        );

        // create left wall
        const leftWall = Matter.Bodies.rectangle(
            0,
            this.canvas.height / 2,
            50,
            this.canvas.height,
            { isStatic: true }
        );

        // create right wall
        const rightWall = Matter.Bodies.rectangle(
            this.canvas.width,
            this.canvas.height / 2,
            50,
            this.canvas.height,
            { isStatic: true }
        );

        // add bodies to the world
        Matter.World.add(this.matterEngine.world, [ground, leftWall, rightWall]);

        // add a ball to the world
        Matter.World.add(this.matterEngine.world, Matter.Bodies.circle(200, 200, 80, {
            render: {
                fillStyle: '#FF0000',
                strokeStyle: 'black',
                lineWidth: 1,
            },
        }));

        this.pluginHandler.addPlugin(new BoxCreator(this.canvas, this.mouse, this, this.renderer));
        this.pluginHandler.addPlugin(new MousePan(this.canvas, this.mouse, this, this.renderer));

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

        // render
        this.renderer.render(this.matterEngine);

        this.pluginHandler.runPlugins();
    }
}