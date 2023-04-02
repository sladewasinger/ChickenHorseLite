import { SimpleBodyType } from "./SimpleBody";

export interface BodyMetaData {
    type: SimpleBodyType;
    canJump: boolean;
    isJumping: boolean;
}