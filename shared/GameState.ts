import { ClientPlayer } from "./ClientPlayer";
import { SimpleBody } from "./SimpleBody";

export class GameState {
    frameNumber: number = 0;
    players: ClientPlayer[] = [];
    dynamicBodies: SimpleBody[] = [];
}