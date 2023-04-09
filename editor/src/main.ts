import Matter from 'matter-js';
import { Engine } from './engine/engine';
import { Editor } from './plugins/Editor';
import { MousePan } from './plugins/MousePan';
import { Renderer } from './renderer/renderer';
import './style.css'; // Provides global styles

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
if (!canvas) {
    throw new Error('Canvas not found');
}
const renderer = new Renderer(canvas);

const engine = new Engine();
engine.addPlugin(new MousePan(engine, renderer));
engine.addPlugin(new Editor(engine, renderer));

engine.start(renderer);

// create ground
const ground = Matter.Bodies.rectangle(
    canvas.width / 2,
    canvas.height - 25,
    canvas.width,
    50,
    { isStatic: true }
);

// create left wall
const leftWall = Matter.Bodies.rectangle(
    0,
    canvas.height / 2,
    50,
    canvas.height,
    { isStatic: true }
);

// create right wall
const rightWall = Matter.Bodies.rectangle(
    canvas.width,
    canvas.height / 2,
    50,
    canvas.height,
    { isStatic: true }
);

// add bodies to the world
engine.addBodies([ground, leftWall, rightWall]);
