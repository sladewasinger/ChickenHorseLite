
export class Vector2D {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public add(v: Vector2D) {
        this.x += v.x;
        this.y += v.y;

        return this;
    }

    public subtract(v: Vector2D) {
        this.x -= v.x;
        this.y -= v.y;

        return this;
    }
}
