import { Team } from "./team";
import { MissionTeam } from "./mission";

export class RemoteTeam extends MissionTeam {
    isValid() {
        return this.colorCheck(COLOR_BLUE, COLOR_BROWN);
    }
}
