import { SimpleBody } from "./SimpleBody";

export interface ClientPlayer {
    id: string;
    name: string;
    grounded: boolean;
    jumpDebounce: boolean;
    jumpReleased: boolean;
    hasDoubleJump: boolean;
    body: SimpleBody;
    latestCommandId: number;
}
