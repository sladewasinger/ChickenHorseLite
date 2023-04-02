import { Engine } from "../Engine";
import Matter from "matter-js";
import { Level } from "./Level";


export class Level1 implements Level {
    name: string = "Level 1";
    getBodies() {
        const width = 1500;
        const height = 800;

        // create ground
        const ground = Matter.Bodies.rectangle(
            width / 2,
            height - 25,
            width,
            50,
            { isStatic: true }
        );

        // create left wall
        const leftWall = Matter.Bodies.rectangle(
            0,
            height / 2,
            50,
            height,
            { isStatic: true }
        );

        // create right wall
        const rightWall = Matter.Bodies.rectangle(
            width,
            height / 2,
            50,
            height,
            { isStatic: true }
        );

        return [ground, leftWall, rightWall];
    }
}
