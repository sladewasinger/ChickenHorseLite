import Matter from "matter-js";
import { Player } from "./models/Player.js";
import { Input } from "./Input.js";
import { SimpleBody } from "shared/SimpleBody.js";
import { Level } from "./levels/Level.js";

export class Engine {
    public engine: Matter.Engine;
    public fps: number = 60;
    private players: Player[] = [];

    constructor(
        private sendBodiesUpdate: (id: string, bodies: SimpleBody[]) => void,
        private sendPlayerUpdate: (id: string, player: Player, playerBody: SimpleBody) => void,
    ) {
        this.engine = Matter.Engine.create();
    }

    public start(): void {
        this.update();
    }

    private update(): void {
        Matter.Engine.update(this.engine);

        setTimeout(() => {
            this.update();
        }, 1000 / this.fps);
    }

    public getBodies(): SimpleBody[] {
        return this.engine.world.bodies.map((body) => {
            return <SimpleBody>{
                id: body.id,
                position: { x: body.position.x, y: body.position.y },
                velocity: { x: body.velocity.x, y: body.velocity.y },
                angle: body.angle,
                vertexSets: [body.vertices.map((vertex) => ({ x: vertex.x, y: vertex.y }))],
                angularVelocity: body.angularVelocity,
            };
        });
    }

    public loadLevel(level: Level) {
        const bodies = level.getBodies();
        Matter.World.add(this.engine.world, bodies);
    }

    public getPlayer(id: string) {
        return this.players.find((player) => player.id === id);
    }

    public addPlayer(id: string, name: string): void {
        const player = new Player(id, name);
        this.players.push(player);

        const playerBody = Matter.Bodies.circle(200, 0, 50, {
            label: "player",
            restitution: 0.5,
        });
        player.bodyId = playerBody.id;
        Matter.World.add(this.engine.world, playerBody);

        this.sendPlayerUpdate(player.id, player, <SimpleBody>{
            id: playerBody.id,
            position: { x: playerBody.position.x, y: playerBody.position.y },
            velocity: { x: playerBody.velocity.x, y: playerBody.velocity.y },
            angle: playerBody.angle,
            angularVelocity: playerBody.angularVelocity,
            vertexSets: [playerBody.vertices.map((vertex) => ({ x: vertex.x, y: vertex.y }))],
        });

        const bodies = this.engine.world.bodies;
        const simpleBodies: SimpleBody[] = [];
        for (const body of bodies) {
            if (body.label === "player") {
                continue;
            }

            const simpleBody = <SimpleBody>{
                id: body.id,
                position: { x: body.position.x, y: body.position.y },
                velocity: { x: body.velocity.x, y: body.velocity.y },
                angle: body.angle,
                angularVelocity: body.angularVelocity,
                vertexSets: [body.vertices.map((vertex) => ({ x: vertex.x, y: vertex.y }))],
                isStatic: body.isStatic,
            };

            simpleBodies.push(simpleBody);
        }
        this.sendBodiesUpdate(player.id, simpleBodies);
    }

    public removePlayer(id: string): void {
        this.players = this.players.filter((player) => player.id !== id);
    }

    public handleInput(id: string, input: Input): void {
        const player = this.getPlayer(id);
        if (!player) {
            return;
        }

        const body = this.engine.world.bodies.find((body) => body.id === player.bodyId);
        if (!body) {
            return;
        }

        if (input.up) {
            Matter.Body.applyForce(body, body.position, { x: 0, y: -0.01 });
        }
        if (input.down) {
            Matter.Body.applyForce(body, body.position, { x: 0, y: 0.01 });
        }
        if (input.left) {
            Matter.Body.applyForce(body, body.position, { x: -0.01, y: 0 });
        }
        if (input.right) {
            Matter.Body.applyForce(body, body.position, { x: 0.01, y: 0 });
        }
    }
}