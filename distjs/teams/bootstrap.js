"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mission_1 = require("./mission");
class BootstrapTeam extends mission_1.MissionTeam {
    isValid() {
        return this.colorCheck(COLOR_BLUE, COLOR_RED);
    }
    run() {
        super.run();
        if (this.roles.length <= 0) {
            const s = _.find(this.ai.spawns, s => s.my);
            if (!s)
                return;
            const err = s.spawnCreep([MOVE, CARRY, WORK], 'bootstrap', { memory: { team: this.flag.name } });
            this.log('spawn error', err);
        }
    }
}
exports.BootstrapTeam = BootstrapTeam;
