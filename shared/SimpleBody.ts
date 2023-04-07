import { Vector2D } from "./math/Vector2D.js";
export type SimpleBodyShape = "circle" | "rectangle";

export class SimpleBody {
    public id: number;
    public position: Vector2D;
    public velocity: Vector2D;
    public angle: number;
    public angularVelocity: number;
    public isStatic: boolean = false;
    public shape: SimpleBodyShape;
    public radius: number | undefined;
    public width: number | undefined;
    public height: number | undefined;
    public label: string | undefined;
    public isSensor: boolean = false;
    public fillColor: string | undefined;
    public strokeColor: string | undefined;

    constructor(
        id: number,
        position: Vector2D,
        velocity: Vector2D,
        angle: number,
        angularVelocity: number,
        shape: SimpleBodyShape,
        isStatic: boolean = false
    ) {
        this.id = id;
        this.position = position;
        this.velocity = velocity;
        this.angle = angle;
        this.angularVelocity = angularVelocity;
        this.shape = shape;
        this.isStatic = isStatic;
        this.fillColor = 'red';
    }

    public static CreateCircle(x: number, y: number, radius: number, isStatic: boolean = false) {
        const circle = new SimpleBody(0, new Vector2D(x, y), new Vector2D(0, 0), 0, 0, "circle", isStatic);
        circle.radius = radius;
        return circle;
    }

    public static CreateRectangle(x: number, y: number, width: number, height: number, isStatic: boolean = false) {
        const rect = new SimpleBody(0, new Vector2D(x, y), new Vector2D(0, 0), 0, 0, "rectangle", isStatic);
        rect.width = width;
        rect.height = height;
        return rect;
    }
}