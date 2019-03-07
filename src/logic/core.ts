import { Logic } from "./logic";
import { MissionLogic } from "./mission";

export class CoreMission extends MissionLogic {
    isValid() {
        return this.colorCheck(COLOR_BLUE, COLOR_BLUE);
    }

    run() {
        super.run();

        return this.ensureRole('startup', 1) ||
            this.ensureRole('aphid', 1) ||
            this.ensureRole('aphod', 1) ||
            this.ensureRole('hauler', 1.5);
    }
}
