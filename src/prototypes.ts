import { toXY } from "Rewalker";
import { RoomAI } from "ai/ai";

Object.defineProperty(RoomPosition.prototype, 'xy', {
    get(this: RoomPosition) {
        return toXY(this)
    }
})

Object.defineProperties(Structure.prototype, {
    hurts: {
        get(this: Structure) { return this.hitsMax - this.hits }
    },
    ai: {
        get(this: Structure) { return findAI(this.pos.roomName) }
    }
})

declare global {
    interface Structure {
        ai: RoomAI
    }
}

for (const s of [StructureContainer, StructureStorage, StructureTerminal]) {
    Object.defineProperties(s.prototype, {
        storeTotal: {
            get(this: StoreStructure) { return _.sum(this.store) }
        },
        storeFree: {
            get(this: StoreStructure) { return Math.max(0, this.storeCapacity - this.storeTotal) }
        }
    });
}

Object.defineProperty(Tombstone.prototype, 'storeTotal', {
    get(this: Tombstone) { return _.sum(this.store) }
})

for (const s of [StructureLab, StructureLink, StructurePowerSpawn, StructureSpawn, StructureExtension, StructureTower, StructureNuker]) {
    Object.defineProperty(s.prototype, 'energyFree', {
        get(this: EnergyStruct) { return Math.max(0, this.energyCapacity - this.energy) }
    })
}

export function done() {
    return true;
}
