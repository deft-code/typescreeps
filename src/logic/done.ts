import { Logic } from "./logic";
import { MissionLogic } from "./mission";

export class DoneMission extends MissionLogic {
    constructor(name:string, old: Logic | undefined) {
        super(name, old)
        if(old instanceof MissionLogic) {
            for(const [egg, spawner] of old.eggs) {
                spawner.cancel()
            }
        }
    }

    isValid() {
        return this.colorCheck(COLOR_BLUE, COLOR_BROWN);
    }
}
