import { toXY } from "Rewalker";

Object.defineProperty(RoomPosition.prototype, 'xy', {
    get(this: RoomPosition) {
        return toXY(this)
    }
})

Object.defineProperty(Structure.prototype, 'hurts', {
    get(this: Structure) { return this.hitsMax - this.hits }
})

for (const s of [StructureContainer, StructureStorage, StructureTerminal]) {
    Object.defineProperty(s.prototype, 'storeTotal', {
        get(this: StoreStructure) { return _.sum(this.store) }
    })
    Object.defineProperty(s.prototype, 'storeFree', {
        get(this: StoreStructure) { return Math.max(0, this.storeCapacity - this.storeTotal) }
    })
}

for (const s of [StructureLab, StructureLink, StructurePowerSpawn, StructureSpawn, StructureExtension, StructureTower, StructureNuker]) {
    Object.defineProperty(s.prototype, 'energyFree', {
        get(this: EnergyStruct) { return Math.max(0, this.energyCapacity - this.energy) }
    })
}

