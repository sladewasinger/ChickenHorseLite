import Matter from "matter-js";

export interface Level {
    name: string;
    getBodies(): Matter.Body[];
}

export class ShapeFactory {
    static createRectangle(x: number, y: number, width: number, height: number, isStatic: boolean) {
        const body = Matter.Bodies.rectangle(x, y, width, height, { isStatic });
        (<any>body).simpleBodyType = "rectangle";
        (<any>body).width = width;
        (<any>body).height = height;
        return body;
    }

    static createCircle(x: number, y: number, radius: number, isStatic: boolean) {
        const body = Matter.Bodies.circle(x, y, radius, { isStatic });
        (<any>body).simpleBodyType = "circle";
        (<any>body).radius = radius;
        return body;
    }
}