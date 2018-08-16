import { Logic } from "./logic";
import { MissionLogic } from "./mission";

export class CoreMission extends MissionLogic {
    isValid() {
        return this.colorCheck(COLOR_BLUE, COLOR_BLUE);
    }
}
