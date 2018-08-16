"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const perma_1 = require("perma");
const gStructs = new Map();
function makeStruct(struct) {
    switch (struct.structureType) {
        case STRUCTURE_SPAWN: return new PSpawn(struct);
    }
    return new PStructure(struct);
}
Object.defineProperty(Structure.prototype, 'p', {
    get() {
        if (!gStructs.has(this.id)) {
            gStructs.set(this.id, makeStruct(this));
        }
        return gStructs.get(this.id);
    }
});
class PStructure extends perma_1.Perma {
    get hits() { return this.o.hits; }
    get hitsMax() { return this.o.hitsMax; }
    get hurts() { return this.hitsMax - this.hits; }
    get structureType() { return this.o.structureType; }
}
class POwnedStructure extends PStructure {
    get my() { return this.o.my; }
    get owner() { return this.o.owner; }
}
class PEnergyStructure extends POwnedStructure {
    get energy() { return this.o.energy; }
    get energyCapacity() { return this.o.energyCapacity; }
    get energyFree() { return Math.max(0, this.o.energyCapacity - this.o.energy); }
}
class PSpawn extends PEnergyStructure {
    spawnCreep(body, name, opt = {}) {
        const drains = this.ai.energyStructures();
        if (drains.length) {
            opt.energyStructures = drains;
        }
        return this.o.spawnCreep(body, name, opt);
    }
    get spawning() { return this.o.spawning; }
}
exports.PSpawn = PSpawn;
PSpawn.makeProp(StructureSpawn);
class PController extends POwnedStructure {
}
exports.PController = PController;
PController.makeProp(StructureController);
