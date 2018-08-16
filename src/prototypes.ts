import { toXY } from "Rewalker";

Object.defineProperty(RoomPosition.prototype, 'xy', {
    get(this: RoomPosition) {
        return toXY(this)
    }
})

Object.defineProperty(Structure.prototype, 'hurts', {
    get(this: Structure) { return this.hitsMax - this.hits }
})

Object.defineProperty(StructureContainer.prototype, 'storeTotal', {
    get(this:StructureContainer) {
        return _.sum(this.store)
    }
})

Object.defineProperty(StructureContainer.prototype, 'storeFree', {
    get(this: StructureContainer) {
        return this.storeCapacity - this.storeTotal
    }
})

Object.defineProperty(StructureStorage.prototype, 'storeTotal', {
    get(this:StructureStorage) {
        return _.sum(this.store)
    }
})

Object.defineProperty(StructureStorage.prototype, 'storeFree', {
    get(this: StructureStorage) {
        return this.storeCapacity - this.storeTotal
    }
})

Object.defineProperty(StructureTerminal.prototype, 'storeTotal', {
    get(this:StructureTerminal) {
        return _.sum(this.store)
    }
})

Object.defineProperty(StructureTerminal.prototype, 'storeFree', {
    get(this: StructureTerminal) {
        return this.storeCapacity - this.storeTotal
    }
})

