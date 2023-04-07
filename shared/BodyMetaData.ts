import { SimpleBodyShape } from "./SimpleBody";

export interface BodyMetaData {
    type: SimpleBodyShape;
    canJump: boolean;
    isJumping: boolean;
}