"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const team_1 = require("./team");
class MissionTeam extends team_1.Team {
    get roles() {
        let creepNames = this.flag.memory.creeps;
        if (!creepNames) {
            this.flag.memory.creeps = creepNames = [];
        }
        return _.map(creepNames, n => Game.creeps[n].p);
    }
}
exports.MissionTeam = MissionTeam;
