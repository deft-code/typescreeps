"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const room_1 = require("./room");
class StartupAI extends room_1.RoomAI {
    get kind() { return 'startup'; }
    run() {
        super.run();
        const f = Game.flags['Home'];
        if (!f) {
            this.room.createFlag(25, 25, 'Home', COLOR_BLUE, COLOR_PURPLE);
            return;
        }
    }
}
exports.StartupAI = StartupAI;
