import { Team } from "./team";
import { MissionTeam } from "./mission";

export class DoneTeam extends MissionTeam {
    isValid() {
        return this.colorCheck(COLOR_BLUE, COLOR_BROWN);
    }
}
