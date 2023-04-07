import { SimpleBody } from "@/../../shared/SimpleBody";
import { CustomBody } from "@/models/CustomBody";
import Matter from "matter-js";

export class ShapeFactory {
    static CreateRectangle(x: number, y: number, width: number, height: number, isStatic: boolean) {
        const body: CustomBody = Matter.Bodies.rectangle(x, y, width, height, { isStatic }) as CustomBody;
        body.shape = "rectangle";
        body.width = width;
        body.height = height;
        body.fillColor = "gray";
        body.strokeColor = "black";

        return body;
    }

    static CreateCircle(x: number, y: number, radius: number, isStatic: boolean) {
        const body = Matter.Bodies.circle(x, y, radius, { isStatic }) as CustomBody;
        body.shape = "circle";
        body.radius = radius;
        body.fillColor = "gray";
        body.strokeColor = "black";

        return body;
    }

    static GetSimpleBodyFromBody(body: CustomBody): SimpleBody {
        return <SimpleBody>{
            id: body.id,
            position: { x: body.position.x, y: body.position.y },
            velocity: { x: body.velocity.x, y: body.velocity.y },
            angle: body.angle,
            angularVelocity: body.angularVelocity,
            shape: body.shape,
            isStatic: body.isStatic,
            label: body.label,
            width: body.width,
            height: body.height,
            radius: body.radius,
            isSensor: body.isSensor,
            fillColor: body.fillColor,
            strokeColor: body.strokeColor,
        };
    }
}
