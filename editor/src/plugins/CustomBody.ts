import Matter from "matter-js";


export interface CustomBody extends Matter.Body {
    killOnContact: boolean;
}
