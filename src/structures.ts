import { Perma } from 'perma'

const gStructs = new Map<string, PStructure>()

function makeStruct(struct:Structure) {
    switch(struct.structureType) {
        case STRUCTURE_SPAWN: return new PSpawn(struct as StructureSpawn)
    }
    return new PStructure(struct)
}

Object.defineProperty(Structure.prototype, 'p', {
    get(this: Structure): PStructure {
        if (!gStructs.has(this.id)) {
            gStructs.set(this.id, makeStruct(this))
        }
        return gStructs.get(this.id)!
    }
});

declare global {
    interface Structure {
        p: PStructure
    }
}

class PStructure<T extends Structure = Structure> extends Perma<T> {
    get hits() { return this.o.hits; }
    get hitsMax() { return this.o.hitsMax; }
    get hurts() { return this.hitsMax - this.hits; }

    get structureType() { return this.o.structureType }
}

class POwnedStructure<T extends OwnedStructure = OwnedStructure> extends PStructure<T>{
    get my() { return this.o.my }
    get owner() { return this.o.owner }
}

interface EnergyStructure extends OwnedStructure {
    energy: number
    energyCapacity: number
}

class PEnergyStructure<T extends EnergyStructure> extends POwnedStructure<T> {
    get energy() { return this.o.energy }
    get energyCapacity() { return this.o.energyCapacity }
    get energyFree() { return Math.max(0, this.o.energyCapacity - this.o.energy) }
}

export class PSpawn extends PEnergyStructure<StructureSpawn> {
    spawnCreep(body: BodyPartConstant[], name: string, opt: any = {}) {
        const drains = this.ai.energyStructures()
        if (drains.length) {
            opt.energyStructures = drains
        }
        return this.o.spawnCreep(body, name, opt)
    }

    get spawning() { return this.o.spawning }
}
PSpawn.makeProp(StructureSpawn)
declare global {
    interface StructureSpawn {
        p: PSpawn
    }
}

export class PController extends POwnedStructure<StructureController> {
}
PController.makeProp(StructureController)
declare global {
    interface StructureController {
        p: PController
    }
}
