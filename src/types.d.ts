// type shim for nodejs' `require()` syntax
// for stricter node.js typings, remove this and install `@types/node`
declare const require: (module: string) => any;

// add your custom typings here


interface RoomPosition {
    xy: number
}

interface Structure {
    hurts: number
}

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

type EnergyStruct = StructureSpawn | StructureExtension | StructureLab | StructureLink | StructureNuker | StructurePowerSpawn | StructureTower

type StoreStructure = StructureStorage | StructureContainer | StructureTerminal
