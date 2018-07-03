"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const room_1 = require("./room");
const debug = require("../debug");
const startup_1 = require("./startup");
const gRooms = new Map();
function calcAI(room) {
    return 'startup';
}
function findAI(name) {
    return gRooms.get(name) || new room_1.RoomAI(name);
}
exports.findAI = findAI;
function getAI(room) {
    let ai = gRooms.get(room.name);
    const kind = calcAI(room);
    if (ai) {
        if (kind === ai.kind)
            return ai;
        debug.log('wrong ai got', ai.kind, 'want', kind);
    }
    ai = (() => {
        switch (kind) {
            case 'startup': return new startup_1.StartupAI(room.name);
        }
        return new room_1.RoomAI(room.name);
    })();
    gRooms.set(room.name, ai);
    return ai;
}
Object.defineProperty(Room.prototype, 'ai', {
    get() {
        return getAI(this);
    }
});
