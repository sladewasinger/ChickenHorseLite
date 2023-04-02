import { Vector2D } from "./math/Vector2D";

export class SimpleBody {
    public id: number;
    public position: Vector2D;
    public velocity: Vector2D;
    public angle: number;
    public angularVelocity: number;
    public isStatic: boolean = false;
    public vertexSets: Matter.Vector[][];

    constructor(
        id: number,
        position: Vector2D,
        velocity: Vector2D,
        angle: number,
        angularVelocity: number,
        vertexSets: Matter.Vector[][],
        isStatic: boolean = false
    ) {
        this.id = id;
        this.position = position;
        this.velocity = velocity;
        this.angle = angle;
        this.angularVelocity = angularVelocity;
        this.isStatic = isStatic;
        this.vertexSets = vertexSets;
    }
}