import { ClientPlayer } from "./ClientPlayer";
import { SimpleBody } from "./SimpleBody";

export class GameState {
    frameNumber: number = 0;
    players: ClientPlayer[] = [];
    dynamicBodies: SimpleBody[] = [];
    timeStampUTC: number = 0;
    gameMode: string = "";
    timeLeftMs: number = 0;
    currentRound: number = 0;
    roundLimit: number = 0;
}