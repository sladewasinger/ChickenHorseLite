import { Vector2D } from "../math/Vector2D";


export class Rectangle {
    id: string;
    position: Vector2D;
    width: number;
    height: number;
    fillColor: string;
    type: string | undefined;

    constructor(position: Vector2D, width: number, height: number, fillColor: string = "#FF0000") {
        this.id = Math.random().toString(36).substring(2, 9);
        this.position = position;
        this.width = width;
        this.height = height;
        this.fillColor = fillColor;
    }
}
