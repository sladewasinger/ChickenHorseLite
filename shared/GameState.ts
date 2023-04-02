import { ClientPlayer } from "./ClientPlayer";
import { SimpleBody } from "./SimpleBody";

export class GameState {
    players: ClientPlayer[] = [];
    dynamicBodies: SimpleBody[] = [];
}