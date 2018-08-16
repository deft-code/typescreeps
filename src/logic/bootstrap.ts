import { MissionLogic } from "./mission";

export class BootstrapMission extends MissionLogic {
    isValid() {
        return this.colorCheck(COLOR_BLUE, COLOR_RED);
    }
    run() {
        super.run()
    }
}
