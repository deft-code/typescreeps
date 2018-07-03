"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mission_1 = require("./mission");
class DoneTeam extends mission_1.MissionTeam {
    isValid() {
        return this.colorCheck(COLOR_BLUE, COLOR_BROWN);
    }
}
exports.DoneTeam = DoneTeam;
