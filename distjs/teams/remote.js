"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mission_1 = require("./mission");
class RemoteTeam extends mission_1.MissionTeam {
    isValid() {
        return this.colorCheck(COLOR_BLUE, COLOR_BROWN);
    }
}
exports.RemoteTeam = RemoteTeam;
