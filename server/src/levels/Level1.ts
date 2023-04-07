import { Level } from "./Level.js";
import { ShapeFactory } from "../utilities/ShapeFactory.js";
import { SimpleBody } from "@/../../shared/SimpleBody.js";

export class Level1 implements Level {
    name: string = "Level 1";
    getBodies() {
        const width = 1500;
        const height = 800;

        // create ground
        const ground = ShapeFactory.CreateRectangle(
            width / 2,
            height - 25,
            width,
            50,
            true
        );

        // create left wall
        const leftWall = ShapeFactory.CreateRectangle(
            0,
            height / 2,
            50,
            height,
            true
        );

        // create right wall
        const rightWall = ShapeFactory.CreateRectangle(
            width,
            height / 2,
            50,
            height,
            true
        );

        const startingZone = ShapeFactory.CreateRectangle(
            100,
            height - 100,
            200,
            200,
            true
        );
        startingZone.label = "startingZone";
        startingZone.fillColor = "rgba(0, 0, 255, 0.5)";

        const goal = ShapeFactory.CreateRectangle(
            width - 100,
            height - 100,
            200,
            200,
            true
        );
        goal.label = "goal";
        goal.fillColor = "red";

        return [startingZone, goal, ground, leftWall, rightWall];
    }
}
