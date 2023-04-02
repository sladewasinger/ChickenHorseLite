import { Vector2D } from "./math/Vector2D";

export type SimpleBodyType = "circle" | "rectangle";

export class SimpleBody {
    public id: number;
    public position: Vector2D;
    public velocity: Vector2D;
    public angle: number;
    public angularVelocity: number;
    public isStatic: boolean = false;
    public type: SimpleBodyType;
    public radius: number | undefined;
    public width: number | undefined;
    public height: number | undefined;
    public label: string | undefined;

    constructor(
        id: number,
        position: Vector2D,
        velocity: Vector2D,
        angle: number,
        angularVelocity: number,
        type: SimpleBodyType,
        isStatic: boolean = false
    ) {
        this.id = id;
        this.position = position;
        this.velocity = velocity;
        this.angle = angle;
        this.angularVelocity = angularVelocity;
        this.type = type;
        this.isStatic = isStatic;
    }
}