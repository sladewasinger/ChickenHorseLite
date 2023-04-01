import Matter from 'matter-js';
import { Engine } from './engine/engine';
import { BoxCreator } from './plugins/BoxCreator';
import { MousePan } from './plugins/MousePan';
import { Renderer } from './renderer/renderer';
import './style.css'; // Provides global styles

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
if (!canvas) {
    throw new Error('Canvas not found');
}
const renderer = new Renderer(canvas);

const engine = new Engine();

engine.start();
renderer.start(engine);

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

// add a ball to the world
engine.addBodies([Matter.Bodies.circle(200, 200, 80, {
    render: {
        fillStyle: '#FF0000',
        strokeStyle: 'black',
        lineWidth: 1,
    },
})]);
