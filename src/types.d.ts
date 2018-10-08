
// type shim for nodejs' `require()` syntax
// for stricter node.js typings, remove this and install `@types/node`
declare const require: (module: string) => any;

// add your custom typings here


interface RoomPosition {
    xy: number
}

type AllStructureTypes = {
    container: StructureContainer
    extension: StructureExtension
    road: StructureRoad
    spawn: StructureSpawn
    tower: StructureTower
    lab: StructureLab
    link: StructureLink
}

interface Structure {
    hurts: number
}

type StoreStructure = StructureContainer |
    StructureTerminal |
    StructureStorage;

interface StructureContainer {
    storeTotal: number
    storeFree: number
}

interface StructureStorage {
    storeTotal: number
    storeFree: number
}

interface StructureTerminal {
    storeTotal: number
    storeFree: number
}

interface Tombstone {
    storeTotal: number
    storeFree: number
}

type EnergyStruct = StructureSpawn | StructureExtension | StructureLab | StructureLink | StructureNuker | StructurePowerSpawn | StructureTower

interface StructureSpawn {
    energyFree: number
}

interface StructureExtension {
    energyFree: number
}

interface StructureLab {
    energyFree: number
}

interface StructureLink {
    energyFree: number
}

interface StructureNuker {
    energyFree: number
}

interface StructurePowerSpawn {
    energyFree: number
}

interface StructureTower {
    energyFree: number
}

type Store = StoreStructure | Tombstone

type Withdrawable = Store | EnergyStruct

interface Tombstone {

}
