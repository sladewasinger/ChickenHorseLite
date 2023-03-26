
export class Vector2D {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public add(v: Vector2D) {
        const newV = new Vector2D(this.x + v.x, this.y + v.y);
        return newV;
    }

    public subtract(v: Vector2D) {
        const newV = new Vector2D(this.x - v.x, this.y - v.y);
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
}
