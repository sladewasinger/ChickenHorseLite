import { Vector2D } from "./Vector2D";


export class Rectangle {
    position: Vector2D;
    width: number;
    height: number;

    constructor(position: Vector2D, width: number, height: number) {
        this.position = position;
        this.width = width;
        this.height = height;
    }
}
