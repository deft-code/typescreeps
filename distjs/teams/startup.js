"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mission_1 = require("./mission");
class StartupTeam extends mission_1.MissionTeam {
    isValid() {
        return this.colorCheck(COLOR_BLUE, COLOR_RED);
    }
    run() {
        super.run();
        if (this.flag.room.find(FIND_MY_CREEPS).length < 1) {
            const s = _.find(this.ai.spawns, s => s.my);
            if (!s)
                return;
            const err = s.spawnCreep([MOVE, CARRY, WORK], 'startup', { memory: { mission: this.flag.name } });
            this.log('spawn error', err);
        }
    }
}
exports.StartupTeam = StartupTeam;
