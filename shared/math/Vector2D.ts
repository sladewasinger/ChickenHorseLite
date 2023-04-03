
export class Vector2D {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public clone() {
        return new Vector2D(this.x, this.y);
    }

    public add(v: Vector2D) {
        const newV = new Vector2D(this.x + v.x, this.y + v.y);
        return newV;
    }

    public subtract(v: Vector2D) {
        const newV = new Vector2D(this.x - v.x, this.y - v.y);
        return newV;
    }

    static subtract(v1: Vector2D, v2: Vector2D) {
        const newV = new Vector2D(v1.x - v2.x, v1.y - v2.y);
        return newV;
    }

    multiply(n: number) {
        const newV = new Vector2D(this.x * n, this.y * n);
        return newV;
    }

    lerp(pos: Vector2D, lerp: number) {
        const newV = new Vector2D(this.x + (pos.x - this.x) * lerp, this.y + (pos.y - this.y) * lerp);
        return newV;
    }

    static lerp(pos1: Vector2D, pos2: Vector2D, lerp: number) {
        const newV = new Vector2D(pos1.x + (pos2.x - pos1.x) * lerp, pos1.y + (pos2.y - pos1.y) * lerp);
        return newV;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}
