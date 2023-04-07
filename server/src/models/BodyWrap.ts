import { SimpleBody } from "../../../shared/SimpleBody";

export class BodyWrap {
    body: Matter.Body;
    color: string;
    simpleBody: SimpleBody | undefined;

    constructor(body: Matter.Body, color: string) {
        this.body = body;
        this.color = color;
    }
}