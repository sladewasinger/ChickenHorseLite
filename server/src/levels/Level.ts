import { Engine } from "../Engine";


export interface Level {
    name: string;
    getBodies(): Matter.Body[];
}
