import './style.css'; // Provides global styles

export class Vector {
    constructor(public x: number, public y: number) {
    }

    static dot(a: Vector, b: Vector): number {
        return a.x * b.x + a.y * b.y;
    }

    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    magnitude(): number {
        return this.length();
    }

    normalize(): Vector {
        const length = this.length();
        return new Vector(this.x / length, this.y / length);
    }

    scale(s: number): Vector {
        return new Vector(this.x * s, this.y * s);
    }

    add(v: Vector): Vector {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    subtract(v: Vector): Vector {
        return new Vector(this.x - v.x, this.y - v.y);
    }
}

export class PhysicsRenderer {
    public context: CanvasRenderingContext2D;
    constructor(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }
        this.context = ctx;

        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    public resize() {
        this.context.canvas.width = window.innerWidth;
        this.context.canvas.height = window.innerHeight;
    }

    render(engine: PhysicsEngine) {
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        for (let object of engine.objects) {
            this.context.fillStyle = object.isStatic ? 'green' : 'red';
            this.context.fillRect(object.position.x, object.position.y, object.width, object.height);
        }
    }
}

export class PhysicsRectangle {
    public velocity: Vector = new Vector(0, 0);
    public acceleration: Vector = new Vector(0, 0);
    public mass: number = 1;
    public resting: boolean = false;

    constructor(public position: Vector, public width: number, public height: number, public isStatic: boolean = false) {
    }

    applyForce(force: Vector) {
        this.acceleration.x += force.x / this.mass;
        this.acceleration.y += force.y / this.mass;
    }

    public left() {
        return this.position.x;
    }

    public right() {
        return this.position.x + this.width;
    }

    public top() {
        return this.position.y;
    }

    public bottom() {
        return this.position.y + this.height;
    }
}

export class PhysicsEngine {
    public objects: PhysicsRectangle[] = [];
    public maxDt = 1 / 30;
    private readonly restitution = 0.2; // Restitution factor (0 to 1, where 1 is a perfectly elastic collision)
    private readonly restitutionThreshold = 2; // Restitution threshold
    private readonly frictionCoefficient = 0.01; // Friction coefficient (0 to 1, where 1 is high friction)
    private readonly thresholdVelocity = 0.5;
    public collisionIterations = 5;

    constructor(public gravity = 981) { // 9.81 m/s² * 100 pixels per meter
    }

    addObject(object: PhysicsRectangle) {
        this.objects.push(object);
    }

    removeObject(object: PhysicsRectangle) {
        this.objects.splice(this.objects.indexOf(object), 1);
    }


    update(dt: number) {
        // Cap the time delta
        dt = Math.min(dt, this.maxDt);

        // Apply gravity
        for (let object of this.objects) {
            if (!object.isStatic) {
                object.applyForce(new Vector(0, this.gravity * object.mass));
            }
        }

        // Update velocity
        for (let object of this.objects) {
            if (!object.isStatic) {
                object.velocity.x += object.acceleration.x * dt;
                object.velocity.y += object.acceleration.y * dt;
            }
        }

        // Reset acceleration
        for (let object of this.objects) {
            object.acceleration.x = 0;
            object.acceleration.y = 0;
        }

        // Update position
        for (let object of this.objects) {
            if (!object.isStatic) {
                // // Sleep threshold to prevent small movements
                // const sleepThreshold = 0.1;
                // if (Math.abs(object.velocity.x) < sleepThreshold) {
                //     object.velocity.x = 0;
                // }
                // if (Math.abs(object.velocity.y) < sleepThreshold) {
                //     object.velocity.y = 0;
                // }

                object.position.x += object.velocity.x * dt;
                object.position.y += object.velocity.y * dt;
            }
        }

        // Handle Collisions
        const collisionIterations = 5; // Number of iterations for collision resolution
        for (let iteration = 0; iteration < collisionIterations; iteration++) {
            for (let object of this.objects) {
                for (let other of this.objects) {
                    if (other !== object) {
                        if (this.isColliding(object, other)) {
                            this.handleCollision(object, other, dt);
                        }
                    }
                }
            }
        }

        // Apply damping
        for (let object of this.objects) {
            if (!object.isStatic) {
                object.velocity.x *= 0.99;
                object.velocity.y *= 0.99;
            }
        }

        // Reset velocity of objects that have come to rest or collided with a static object
        for (let object of this.objects) {
            if (Vector.dot(object.velocity, object.velocity) < this.thresholdVelocity * this.thresholdVelocity) {
                object.velocity.x = 0;
                object.velocity.y = 0;
            }
        }
    }

    private isColliding(a: PhysicsRectangle, b: PhysicsRectangle) {
        return a.left() < b.right() && a.right() > b.left() && a.top() < b.bottom() && a.bottom() > b.top();
    }

    private handleCollision(a: PhysicsRectangle, b: PhysicsRectangle, dt: number) {
        if (a.isStatic && b.isStatic) {
            return;
        }

        this.resolveCollision(a, b, dt);
    }

    private getOverlap(a: PhysicsRectangle, b: PhysicsRectangle, axis: Vector): number {
        const aProj = this.project(a, axis);
        const bProj = this.project(b, axis);

        if (aProj.max < bProj.min || bProj.max < aProj.min) {
            return 0; // No overlap
        }

        return Math.min(aProj.max, bProj.max) - Math.max(aProj.min, bProj.min);
    }

    private project(rectangle: PhysicsRectangle, axis: Vector): { min: number, max: number } {
        const dotProduct = Vector.dot(rectangle.position, axis);
        const p1 = dotProduct;
        const p2 = dotProduct + Vector.dot(new Vector(rectangle.width, rectangle.height), axis);

        return { min: p1, max: p2 };
    }

    private calculateImpulse(a: PhysicsRectangle, b: PhysicsRectangle, contactNormal: Vector): number {
        const relativeVelocity = a.velocity.subtract(b.velocity);
        const normalVelocity = Vector.dot(relativeVelocity, contactNormal);

        if (normalVelocity > 0) {
            return 0;
        }

        const impulseNumerator = -(1 + this.restitution) * normalVelocity;
        const impulseDenominator = a.mass + b.mass;
        const impulse = impulseNumerator / impulseDenominator;

        return impulse;
    }


    private applyImpulse(a: PhysicsRectangle, b: PhysicsRectangle, impulse: Vector) {
        if (!a.isStatic) {
            a.velocity = a.velocity.add(impulse.scale(1 / a.mass));
        }

        if (!b.isStatic) {
            b.velocity = b.velocity.subtract(impulse.scale(1 / b.mass));
        }
    }


    private resolveCollision(a: PhysicsRectangle, b: PhysicsRectangle, dt: number) {
        // Find the minimum translation vector (MTV) and contact normal
        const axes = [
            new Vector(1, 0), // x-axis
            new Vector(0, 1), // y-axis
        ];
        let minOverlap = Infinity;
        let contactNormal: Vector | null = null;

        for (const axis of axes) {
            const overlap = this.getOverlap(a, b, axis);
            if (overlap === 0) {
                return; // No collision
            }
            if (overlap < minOverlap) {
                minOverlap = overlap;
                contactNormal = axis;
            }
        }

        if (!contactNormal) {
            return; // No collision
        }

        // Calculate impulse
        const impulseMagnitude = this.calculateImpulse(a, b, contactNormal);
        const impulse = contactNormal.scale(impulseMagnitude);

        // Apply impulse
        this.applyImpulse(a, b, impulse);

        // Separate the colliding objects
        const percent = 0.8; // Percent to resolve the overlap
        const slop = 0.01; // Penetration tolerance (in pixels)
        const correctionAmount = Math.max(minOverlap - slop, 0) / (a.mass + b.mass) * percent;
        const correctionVector = contactNormal.scale(correctionAmount);

        if (!a.isStatic) {
            a.position = a.position.subtract(correctionVector.scale(a.mass));
        }

        if (!b.isStatic) {
            b.position = b.position.add(correctionVector.scale(b.mass));
        }

        // Apply friction
        const tangent = new Vector(-contactNormal.y, contactNormal.x);
        const relativeVelocity = a.velocity.subtract(b.velocity);
        const relativeVelocityAlongTangent = Vector.dot(relativeVelocity, tangent);
        const frictionImpulseMagnitude = -relativeVelocityAlongTangent / (a.mass + b.mass) * this.frictionCoefficient;

        const frictionImpulse = tangent.scale(frictionImpulseMagnitude);

        if (!a.isStatic) {
            a.velocity = a.velocity.add(frictionImpulse.scale(1 / a.mass));
        }

        if (!b.isStatic) {
            b.velocity = b.velocity.subtract(frictionImpulse.scale(1 / b.mass));
        }
    }


}

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const engine = new PhysicsEngine();
const renderer = new PhysicsRenderer(canvas);

const rect1 = new PhysicsRectangle(new Vector(100, 100), 50, 50);
rect1.mass = 1;
const rect2 = new PhysicsRectangle(new Vector(160, 100), 50, 50);
rect2.velocity = new Vector(-50, 0);
const rect3 = new PhysicsRectangle(new Vector(125, 25), 50, 50);
const rect4 = new PhysicsRectangle(new Vector(300, 25), 25, 25);

const ground = new PhysicsRectangle(new Vector(0, 500), 500, 100, true);

engine.addObject(rect1);
engine.addObject(rect2);
engine.addObject(rect3);
engine.addObject(rect4);
engine.addObject(ground);


let keys: Map<string, boolean> = new Map<string, boolean>();

window.addEventListener('keydown', (e) => {
    keys.set(e.key, true);
});

window.addEventListener('keyup', (e) => {
    keys.set(e.key, false);
});


let lastTime = 0;
function update(time: number) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    if (keys.get('a')) {
        rect1.velocity.x = -100;
    }
    if (keys.get('d')) {
        rect1.velocity.x = 100;
    }
    if (keys.get('w')) {
        rect1.velocity.y = -200;
    }
    if (keys.get('s')) {
        rect1.applyForce(new Vector(0, 100));
    }

    engine.update(dt);
    renderer.render(engine);

    requestAnimationFrame(update);
}

requestAnimationFrame(update);

/*    private resolveCollision_OLD2(a: PhysicsRectangle, b: PhysicsRectangle) {
        const overlapX = Math.max(0, Math.min(a.right(), b.right()) - Math.max(a.left(), b.left()));
        const overlapY = Math.max(0, Math.min(a.bottom(), b.bottom()) - Math.max(a.top(), b.top()));

        let frictionForce = 0;

        // Determine which axis has the minimum overlap.
        if (overlapX < overlapY) {
            // Resolve the collision along the x-axis.
            if (a.position.x < b.position.x) {
                a.position.x -= overlapX;
            } else {
                a.position.x += overlapX;
            }
            // Apply restitution to the x-velocity.
            a.velocity.x *= -this.restitution;

            // Calculate the friction force.
            frictionForce = this.frictionCoefficient * Math.abs(a.velocity.y - b.velocity.y);
            // Apply the friction force to the x-velocity of both objects.
            a.velocity.x += (a.velocity.x > 0 ? -1 : 1) * frictionForce * (a.mass / (a.mass + b.mass));
            b.velocity.x -= (a.velocity.x > 0 ? -1 : 1) * frictionForce * (b.mass / (a.mass + b.mass));
        } else {
            // Resolve the collision along the y-axis.
            if (a.position.y < b.position.y) {
                a.position.y -= overlapY;
            } else {
                a.position.y += overlapY;
            }
            // Apply restitution to the y-velocity.
            a.velocity.y *= -this.restitution;

            // Calculate the friction force.
            frictionForce = this.frictionCoefficient * Math.abs(a.velocity.x - b.velocity.x);
            // Apply the friction force to the y-velocity of both objects.
            a.velocity.y += (a.velocity.y > 0 ? -1 : 1) * frictionForce * (a.mass / (a.mass + b.mass));
            b.velocity.y -= (a.velocity.y > 0 ? -1 : 1) * frictionForce * (b.mass / (a.mass + b.mass));
        }
    }


    private resolveCollision_OLD(ground: PhysicsRectangle, object: PhysicsRectangle) {
        const overlapX = Math.max(0, Math.min(object.right(), ground.right()) - Math.max(object.left(), ground.left()));
        const overlapY = Math.max(0, Math.min(object.bottom(), ground.bottom()) - Math.max(object.top(), ground.top()));

        let frictionForce = 0;

        // Determine which axis has the minimum overlap.
        if (overlapX < overlapY) {
            // Resolve the collision along the x-axis.
            if (object.position.x < ground.position.x) {
                object.position.x -= overlapX;
            } else {
                object.position.x += overlapX;
            }
            // Apply restitution to the x-velocity.
            object.velocity.x *= -this.restitution;

            // Calculate the friction force.
            frictionForce = this.frictionCoefficient * Math.abs(object.velocity.y);
            // Apply the friction force to the x-velocity.
            object.velocity.x += (object.velocity.x > 0 ? -1 : 1) * frictionForce * (object.mass / (object.mass + ground.mass));
        } else {
            // Resolve the collision along the y-axis.
            if (object.position.y < ground.position.y) {
                object.position.y -= overlapY;
            } else {
                object.position.y += overlapY;
            }
            // Apply restitution to the y-velocity.
            object.velocity.y *= -this.restitution;

            // Calculate the friction force.
            frictionForce = this.frictionCoefficient * Math.abs(object.velocity.x);
            // Apply the friction force to the y-velocity.
            object.velocity.y += (object.velocity.y > 0 ? -1 : 1) * frictionForce * (object.mass / (object.mass + ground.mass));
        }
    }

    */