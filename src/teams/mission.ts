import { Team } from "./team";
import { Role } from '../roles/role';


declare global {
    interface FlagMemory {
        creeps?: string[]
    }
}

export class MissionTeam extends Team {
    get roles(): Role[] {
        let creepNames = this.flag.memory.creeps
        if(!creepNames) {
            this.flag.memory.creeps = creepNames = []
        }
        return _.map(creepNames, n => Game.creeps[n].p as Role)
    }
}
