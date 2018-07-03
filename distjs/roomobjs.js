"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const perma_1 = require("./perma");
class PSource extends perma_1.Perma {
    constructor() {
        super(...arguments);
        this._spots = [];
    }
    get spots() {
        if (!this._spots.length) {
            const x = this.pos.x;
            const y = this.pos.y;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (Game.map.getTerrainAt(x + dx, y + dy, this.pos.roomName) === 'wall')
                        continue;
                    this._spots.push(new RoomPosition(x + dx, y + dy, this.pos.roomName));
                }
            }
        }
        return this._spots;
    }
    get energy() { return this.o.energy; }
    get ticksToRegeneration() { return this.o.ticksToRegeneration; }
}
exports.PSource = PSource;
PSource.makeProp(Source);
