import * as PIXI from "pixi.js";
import Matter from "matter-js";
import { Vector2D } from "shared/math/Vector2D";
import { Camera } from "./camera";
import { Mouse } from "./mouse";
import { ClientPlayer } from "shared/ClientPlayer";
import { Engine } from "engine/engine";
import { CustomBody } from "models/CustomBody";
import { GameState } from "shared/GameState";

export class PixiRenderer {
    app: PIXI.Application;
    camera: Camera;
    canvas: HTMLCanvasElement;
    mouse: Mouse;

    graphics: PIXI.Graphics | undefined;

    ghostPlayer: ClientPlayer | undefined;
    playerPosInterpolated: Vector2D | undefined;

    // sprites
    chickenSprite: PIXI.Sprite | undefined;
    roundTimerText: PIXI.Text | undefined;
    gameModeText: PIXI.Text | undefined;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'canvas';
        document.body.appendChild(this.canvas);

        this.mouse = new Mouse(this.canvas);
        this.camera = new Camera(this.canvas);

        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();

        this.app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            view: this.canvas,
            backgroundColor: 0x000000,
            resolution: window.devicePixelRatio || 1,
        });
    }

    destroy() {
        this.graphics = undefined;
        this.app.destroy(true, { children: true, texture: true, baseTexture: true });
        window.removeEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    screenToWorld(pos: Vector2D) {
        return this.getWindowToCanvas(pos.x, pos.y);
    }

    panTo(x: number, y: number) {
        this.camera.position.x = x;
        this.camera.position.y = y;
    }

    getWindowToCanvas(x: number, y: number) {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas context not found');
        }

        var rect = this.canvas.getBoundingClientRect();
        var screenX = (x - rect.left) * (this.canvas.width / rect.width);
        var screenY = (y - rect.top) * (this.canvas.height / rect.height);
        var transform = ctx.getTransform();
        if (transform.isIdentity) {
            return new Vector2D(
                screenX,
                screenY
            );
        } else {
            const invMat = transform.invertSelf();

            return new Vector2D(
                Math.round(screenX * invMat.a + screenY * invMat.c + invMat.e),
                Math.round(screenX * invMat.b + screenY * invMat.d + invMat.f)
            );
        }
    }

    render(engine: Matter.Engine, gameState: GameState) {
        const bodies = Matter.Composite.allBodies(engine.world).map(x => x as CustomBody);
        if (!this.graphics) {
            this.graphics = new PIXI.Graphics();
            this.app.stage.addChild(this.graphics);
        }
        this.graphics.clear();

        const offset = this.camera.position.clone();

        // center camera on canvas
        offset.x -= this.canvas.width / 2;
        offset.y -= this.canvas.height / 2;

        // cleanup old sprites
        for (const child of this.app.stage.children) {
            if (child instanceof PIXI.AnimatedSprite) {
                if (!bodies.find(x => x.idleAnimation === child)) {
                    this.app.stage.removeChild(child);
                }
            }
        }

        for (const body of bodies) {
            if (body.label === 'player') {
                // draw image using PIXI.js
                if (!body.idleAnimation) {
                    const sprite = new PIXI.AnimatedSprite([PIXI.Texture.from('chicken/idle1.png'), PIXI.Texture.from('chicken/idle2.png')]);
                    sprite.anchor.set(0.5, 0.5);
                    sprite.rotation = body.angle;
                    this.app.stage.addChild(sprite);
                    body.idleAnimation = sprite;
                    // play animation
                    sprite.animationSpeed = 0.1;
                    sprite.play();
                }
                body.idleAnimation.x = body.position.x - offset.x;
                body.idleAnimation.y = body.position.y - offset.y;
                if (body.velocity.x < -0.5) {
                    body.idleAnimation.scale.x = -1;
                } else if (body.velocity.x > 0.5) {
                    body.idleAnimation.scale.x = 1;
                }
            } else {
                const vertices = body.vertices;

                let color = new PIXI.Color('ff0000');
                if (body.fillColor) {
                    color = new PIXI.Color(body.fillColor);
                }
                this.graphics.beginFill(color);
                this.graphics.moveTo(vertices[0].x - offset.x, vertices[0].y - offset.y);
                for (let i = 1; i < vertices.length; i++) {
                    this.graphics.lineTo(vertices[i].x - offset.x, vertices[i].y - offset.y);
                }
                this.graphics.endFill();
            }
        }

        if (gameState.timeLeftMs > 0) {
            this.renderText(
                "timeLeft",
                `Time Left: ${this.millisToMinutesAndSeconds(gameState.timeLeftMs)}`,
                new Vector2D(this.canvas.width / 2, 50)
            );
        } else {
            this.clearText("timeLeft");
        }

        this.renderText(
            "gameMode",
            `${gameState.currentRound}/${gameState.roundLimit} | Game Mode: ${gameState.gameMode}`,
            new Vector2D(this.canvas.width / 2, 100)
        );
    }

    private textObjects: { [id: string]: PIXI.Text } = {};
    renderText(id: string, text: string, position: Vector2D) {
        if (this.textObjects[id]) {
            this.textObjects[id].text = text;
            this.textObjects[id].x = position.x;
            this.textObjects[id].y = position.y;
            return;
        }

        const textObj = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff,
            align: 'center'
        });
        textObj.anchor.set(0.5, 0.5);
        textObj.x = position.x;
        textObj.y = position.y;
        this.app.stage.addChild(textObj);

        this.textObjects[id] = textObj;
    }

    clearText(id: string) {
        if (this.textObjects[id]) {
            this.app.stage.removeChild(this.textObjects[id]);
            delete this.textObjects[id];
        }
    }

    millisToMinutesAndSeconds(millis: number) {
        let minutes = Math.floor(millis / 60000);
        let seconds = +((millis % 60000) / 1000).toFixed(0);
        return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    }

    renderGhostPlayer(player: ClientPlayer | undefined) {
        this.ghostPlayer = player;
    }

    renderGhostPlayerInterpolated(playerPositionInterpolated: Vector2D | undefined) {
        this.playerPosInterpolated = playerPositionInterpolated;
    }
}