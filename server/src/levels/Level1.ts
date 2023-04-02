import { Level, ShapeFactory } from "./Level.js";

export class Level1 implements Level {
    name: string = "Level 1";
    getBodies() {
        const width = 1500;
        const height = 800;

        // create ground
        const ground = ShapeFactory.createRectangle(
            width / 2,
            height - 25,
            width,
            50,
            true
        );

        // create left wall
        const leftWall = ShapeFactory.createRectangle(
            0,
            height / 2,
            50,
            height,
            true
        );

        // create right wall
        const rightWall = ShapeFactory.createRectangle(
            width,
            height / 2,
            50,
            height,
            true
        );

        return [ground, leftWall, rightWall];
    }
}
