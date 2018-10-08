type StructureTypeMap = {
    [STRUCTURE_CONTAINER]: StructureContainer
    [STRUCTURE_CONTROLLER]: StructureController
    [STRUCTURE_EXTENSION]: StructureExtension
    [STRUCTURE_EXTRACTOR]: StructureExtractor
    [STRUCTURE_KEEPER_LAIR]: StructureKeeperLair
    [STRUCTURE_LAB]: StructureLab
    [STRUCTURE_LINK]: StructureLink
    [STRUCTURE_OBSERVER]: StructureObserver
    [STRUCTURE_NUKER]: StructureNuker
    [STRUCTURE_PORTAL]: StructurePortal
    [STRUCTURE_POWER_BANK]: StructurePowerBank
    [STRUCTURE_POWER_SPAWN]: StructurePowerSpawn
    [STRUCTURE_RAMPART]: StructureRampart
    [STRUCTURE_ROAD]: StructureRoad
    [STRUCTURE_SPAWN]: StructureSpawn
    [STRUCTURE_STORAGE]: StructureStorage
    [STRUCTURE_TERMINAL]: StructureTerminal
    [STRUCTURE_TOWER]: StructureTower
    [STRUCTURE_WALL]: StructureWall
    all: AnyStructure
}

type StructCacheFull = {
    [SType in keyof StructureTypeMap]: StructureTypeMap[SType][]
}

type StructCache = Partial<StructCacheFull>;

let gCache = new Map<string, StructCache>();
export function clearCache() {
    gCache = new Map()
}

class IndexBase {
    ids: { [stype: string]: string[] } = {};
    cacheTime: number = 0;

    constructor(public readonly key: string) { }

    refreshStructs(): AnyStructure[] { return []; }

    needRefresh(): boolean { return false; }

    isStale() {
        if (this.cacheTime === Game.time) return false;
        const stale = this.needRefresh();
        if (!stale) this.cacheTime = Game.time;
        return stale;
    }

    // Build a new Cache.
    buildCache(): StructCache {
        const structs = this.refreshStructs()
        const cache = _.groupBy(structs, s => s.structureType);
        cache.all = structs;
        gCache.set(this.key, cache);
        this.ids = _.mapValues(cache, ss => ss.map(s => s.id));
        return cache;
    }

    // Return the latest cache. It will never be stale.
    getCache(): StructCache {
        if (this.isStale()) {
            return this.buildCache();
        }
        const cache = gCache.get(this.key);
        if (cache) return cache;
        const newCache = {};
        gCache.set(this.key, newCache);
        return newCache;
    }

    makeStructs<SType extends keyof StructCacheFull>(stype: SType): StructCacheFull[SType] {
        const ids = this.ids[stype] as string[];
        if (!ids) return [];
        let nulls = false;
        const structs: StructCacheFull[SType] = [];
        for (const id of ids) {
            const o = Game.getObjectById<AnyStructure>(id)!;
            if (o) {
                (<(x:AnyStructure) => number>structs.push)(o);
            } else {
                const cache = this.buildCache();
                if (stype in cache) return cache[stype] as StructCacheFull[SType];
                return [];
            }
        }
        return structs;
    }

    get all(): AnyStructure[] {
        return this.get('all');
    }

    get<SType extends keyof StructureTypeMap>(stype: SType): StructCacheFull[SType] {
        const cache = this.getCache();
        const structs = cache[stype];
        if (structs) return structs as any[];
        const newStructs = this.makeStructs(stype);
        cache[stype] = newStructs;
        return newStructs;
    }
}

export class StructIndex extends IndexBase {
    nstructs: number = 0;
    needRefresh() {
        const room = Game.rooms[this.key];
        if (!room) return false;
        return this.nstructs !== room.find(FIND_STRUCTURES).length;
    }
    refreshStructs() {
        const room = Game.rooms[this.key];
        if (!room) return [];
        const structs = room.find(FIND_STRUCTURES);
        this.nstructs = structs.length;
        return structs;
    }
}

export class CreepIndex extends StructIndex {
    x = -1;
    y = -1;
    nstructs: number = 0;

    constructor(id: string, public readonly range: number) {
        super(id);
    }
    needRefresh() {
        const creep = Game.getObjectById<Creep>(this.key);
        if (!creep) return false;
        if (creep.pos.x !== this.x || creep.pos.y !== this.y) return true;
        const room = creep.room;
        if (!room) return false;
        return this.nstructs !== room.find(FIND_STRUCTURES).length;
    }

    refreshStructs(): AnyStructure[] {
        const creep = Game.getObjectById<Creep>(this.key);
        if (!creep) return [];
        //console.log(creep, 'refreshing');
        const room = creep.room;
        if (!room) return [];
        this.nstructs = room.find(FIND_STRUCTURES).length;
        this.x = creep.pos.x;
        this.y = creep.pos.y;
        // mn and mx are smaller than the full room since structs
        // can be built at the edges.
        const mn = 1;
        const mx = 48;
        return room.lookForAtArea(
            LOOK_STRUCTURES, Math.max(mn, this.y - this.range), Math.max(mn, this.x - this.range),
            Math.min(mx, this.y + this.range), Math.min(mx, this.x + this.range), true).map(
                spot => spot.structure as AnyStructure);
    }
}
