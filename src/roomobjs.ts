import { Perma } from "./perma";

export class PSource extends Perma<Source> {
    _spots: Array<RoomPosition> = []
    get spots() {
        if (!this._spots.length) {
            const x = this.pos.x
            const y = this.pos.y

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (Game.map.getTerrainAt(x + dx, y + dy, this.pos.roomName) === 'wall') continue
                    this._spots.push(new RoomPosition(x + dx, y + dy, this.pos.roomName))
                }
            }
        }
        return this._spots
    }

    get energy() { return this.o.energy }
    get ticksToRegeneration() { return this.o.ticksToRegeneration }
}


PSource.makeProp(Source)
declare global {
    interface Source {
        p: PSource
    }
}
