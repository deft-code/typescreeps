import { Logic } from "./logic";
import { MissionLogic } from "./mission";

export class RemoteTeam extends MissionLogic {
    isValid() {
        return this.colorCheck(COLOR_BLUE, COLOR_BROWN);
    }
}
