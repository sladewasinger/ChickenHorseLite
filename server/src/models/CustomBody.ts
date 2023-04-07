import Matter from "matter-js";
import { SimpleBodyShape } from "shared/SimpleBody.js";


export interface CustomBody extends Matter.Body {
    shape: SimpleBodyShape;
    width: number | undefined;
    height: number | undefined;
    radius: number | undefined;
    fillColor: string | undefined;
    strokeColor: string | undefined;
}
