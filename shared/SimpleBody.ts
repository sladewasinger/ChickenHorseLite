import { Vector2D } from "./math/Vector2D.js";
export type SimpleBodyShape = "circle" | "rectangle";

export class SimpleBody {
    public id: number;
    public position: Vector2D;
    public velocity: Vector2D;
    public angle: number;
    public angularVelocity: number;
    public isStatic: boolean = false;
    public friction: number;
    public inertia: number;
    public frictionAir: number;
    public restitution: number;
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
        isStatic: boolean = false,
        friction: number,
        frictionAir: number,
        inertia: number,
        restitution: number,
    ) {
        this.id = id;
        this.position = position;
        this.velocity = velocity;
        this.angle = angle;
        this.angularVelocity = angularVelocity;
        this.shape = shape;
        this.isStatic = isStatic;
        this.fillColor = 'red';
        this.friction = friction;
        this.frictionAir = frictionAir;
        this.inertia = inertia;
        this.restitution = restitution;
    }
}