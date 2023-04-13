import { Level } from "./Level.js";
import { ShapeFactory } from "../utilities/ShapeFactory.js";
import levelJSON from "./level.json" assert { type: "json" };
import { CustomBody } from "@/models/CustomBody.js";

export class LevelLoader implements Level {
    name: string = "Level 1";

    getBodies() {
        const rects: CustomBody[] = [];

        for (const box of levelJSON) {
            const rect = ShapeFactory.CreateRectangle(
                box.position.x + box.width / 2,
                box.position.y + box.height / 2,
                box.width,
                box.height,
                true
            );

            if (box.type === 'startingZone') {
                rect.label = "startingZone";
                rect.fillColor = "rgba(0, 0, 255, 0.5)";
            }
            if (box.type === 'endingZone') {
                rect.label = "goal";
                rect.fillColor = "rgba(255, 0, 0, 0.5)";
            }
            if (box.type === 'joinGameZone') {
                rect.label = "joinGameZone";
                rect.fillColor = "rgba(0, 255, 0, 0.5)";
            }
            if (box.type === 'spawnZone') {
                rect.label = "spawnZone";
                rect.fillColor = "rgba(64, 64, 64, 0.5)";
            }

            rects.push(rect);
        }

        return rects;
    }
}
