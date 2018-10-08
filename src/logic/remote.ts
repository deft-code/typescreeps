import { Logic } from "./logic";
import { MissionLogic } from "./mission";

export class RemoteMission extends MissionLogic {
    isValid() {
        return this.colorCheck(COLOR_BLUE, COLOR_YELLOW);
    }

    run() {
        super.run();
        return this.ensureRole('scout', 1);
    }

    darkRun() {
        super.darkRun();
        return this.ensureRole('scout', 1);
    }
}
