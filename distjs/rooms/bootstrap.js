"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const room_1 = require("./room");
class BootstrapAI extends room_1.RoomAI {
    get kind() { return 'bootstrap'; }
    run() {
        super.run();
        const fname = 'Bootstrap_' + this.name;
        const f = Game.flags[fname];
        if (!f) {
            this.room.createFlag(25, 25, fname, COLOR_BLUE, COLOR_RED);
            return;
        }
    }
}
exports.BootstrapAI = BootstrapAI;
