import { Input } from "@/Input";
import { Vector2D } from "shared/math/Vector2D";


export class Player {
    public id: string;
    public name: string;
    public position: Vector2D;
    public bodyId: number | undefined;
    public inputs: Input = new Input();

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.position = new Vector2D(0, 0);
    }
}
