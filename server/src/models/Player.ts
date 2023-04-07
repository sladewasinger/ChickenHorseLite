import { ClientPlayer } from "shared/ClientPlayer";
import { Input } from "shared/Input.js";
import { Vector2D } from "shared/math/Vector2D.js";
import { SimpleBody } from "@/../../shared/SimpleBody";


export class Player {
    public id: string;
    public name: string;
    public position: Vector2D;
    public bodyId: number | undefined;
    public input: Input = new Input();
    public jumpDebounce: boolean = false;
    public grounded: boolean = true;
    public hasDoubleJump: boolean = true;
    public jumpReleased: boolean = true;
    public latestCommandId: number = 0;


    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.position = new Vector2D(0, 0);
    }
}
