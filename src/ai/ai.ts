import * as debug from 'debug'
import * as shed from 'shed'
import { Role } from 'roles/role'
import { Dictionary } from 'lodash';
import { fromXY } from 'Rewalker';
import { PSource, PMineral, PController } from 'perma';
import { getCache } from 'cache';


declare global {
    interface RoomMemory {
        spots?: Dictionary<number>
    }
}

type StructCache = {
    [P in keyof AllStructureTypes]?: Array<AllStructureTypes[P]>;
} & {
    rechargable?: EnergyStruct[]
}

interface AICacheAll {
    structs: StructCache
    inconts: StructureContainer[]
    outconts: StructureContainer[]
}

type AICache = Partial<AICacheAll>

export class RoomAI extends debug.Debuggable {
    constructor(public readonly name: string) {
        super()
    }

    get room(): Room {
        return Game.rooms[this.name];
    }

    get memory() {
        if (this.room) return this.room.memory
        return Memory.rooms[this.name]
    }

    get kind(): string {
        return 'room'
    }

    _ctrl: PController | null | undefined
    get controller(): PController | null {
        if (this._ctrl === undefined) {
            if (!this.room) return null
            if (this.room.controller) {
                this._ctrl = new PController(this.room.controller)
            } else {
                this._ctrl = null
            }
        }
        return this._ctrl
    }

    _mineral: PMineral | null | undefined
    get mineral(): PMineral | null {
        if (this._mineral === undefined) {
            if (!this.room) return null
            const mineral = _.first(this.room.find(FIND_MINERALS))
            if (mineral) {
                this._mineral = new PMineral(mineral)
            } else {
                this._mineral = null
            }
        }
        return this._mineral
    }

    _sources?: PSource[]
    get sources() {
        if (!this._sources) {
            if (!this.room) return []
            this._sources = _.map(this.room.find(FIND_SOURCES), s => new PSource(s))
        }
        return this._sources
    }

    get cache(): AICache {
        return getCache<AICache>(this.name)
    }

    _structIds: {
        [type: string]: string[]
    }
    _numStructs = 0
    get structIds() {
        if (!this.room) return this._structIds
        const nstructs = this.room.find(FIND_STRUCTURES).length
        if (nstructs !== this._numStructs) {
            this.buildStructIds()
        }
        return this._structIds
    }

    buildStructIds() {
        const structs = this.room.find(FIND_STRUCTURES)
        this._numStructs = structs.length
        this._structIds = _.mapValues(
            _.groupBy(structs, s => s.structureType),
            ss => ss.map(s => s.id))
    }

    makeStructs<SType extends keyof AllStructureTypes>(stype: SType): Array<AllStructureTypes[SType]> {
        type SClass = AllStructureTypes[SType]
        const ids = this.structIds[stype]
        if (!ids) return []
        let rebuild = false
        let structs = ids.map(id => {
            const struct = Game.getObjectById<SClass>(id)!
            if (struct === null) rebuild = true
            return struct
        })
        if (rebuild) {
            this.buildStructIds()
            return this.makeStructs(stype)
        }
        return structs
    }

    getStructs<SType extends keyof AllStructureTypes>(stype: SType): AllStructureTypes[SType][] {
        if (!this.cache.structs) {
            this.cache.structs = {}
        }
        let structs = this.cache.structs
        if (!structs[stype]) {
            (<AllStructureTypes[SType][]>this.cache.structs[stype]) = this.makeStructs(stype)
            //this.cache.structs[stype] = this.makeStructs(stype) as StructCache[SType][]

        }
        return structs[stype]!
    }

    get towers() { return this.getStructs(STRUCTURE_TOWER) }

    get spawns() { return this.getStructs(STRUCTURE_SPAWN) }
    get myspawns() { return this.spawns.filter(s => s.my) }

    get containers() { return this.getStructs(STRUCTURE_CONTAINER) }

    get extns() { return this.getStructs(STRUCTURE_EXTENSION) }

    get roads() { return this.getStructs(STRUCTURE_ROAD) }

    sortConts() {
        const conts = this.getStructs(STRUCTURE_CONTAINER);
        this.cache.inconts = _.remove(conts, c => {
            const src = c.pos.findClosestByRange(FIND_SOURCES);
            if (src && c.pos.isNearTo(src)) return true;
            const min = c.pos.findClosestByRange(FIND_MINERALS);
            if (min && c.pos.isNearTo(min)) return true;
            return false;
        });
        this.cache.outconts = conts;
    }

    get outconts() {
        if (!this.cache.outconts) {
            this.sortConts()
        }
        return this.cache.outconts!;
    }

    get inconts() {
        if (!this.cache.inconts) {
            this.sortConts()
        }
        return this.cache.inconts!;
    }


    lookForAtRange<T extends keyof AllLookAtTypes>(look: T, pos: RoomPosition, range: number): LookForAtAreaResultArray<AllLookAtTypes[T], T> {
        if (!this.room) return []
        return this.room.lookForAtArea(
            look, Math.max(0, pos.y - range), Math.max(0, pos.x - range),
            Math.min(49, pos.y + range), Math.min(49, pos.x + range), true)
    }

    bestSpot(pos: RoomPosition): RoomPosition {
        let bestScore = 100
        let bestSpot = pos
        const spotLooks = this.lookForAtRange(LOOK_TERRAIN, pos, 1)
        for (const spotLook of spotLooks) {
            const spotT = spotLook[LOOK_TERRAIN]
            if (spotT === 'wall') continue
            const spot = new RoomPosition(spotLook.x, spotLook.y, pos.roomName)
            const looks = this.lookForAtRange(LOOK_TERRAIN, spot, 1)
            const score = _.filter(looks, l => l[LOOK_TERRAIN] === 'wall').length
            if (score < bestScore) {
                bestScore = score
                bestSpot = spot
            }
        }
        return bestSpot
    }

    maxHits(wall: Structure) {
        if (wall.structureType !== STRUCTURE_WALL && wall.structureType !== STRUCTURE_RAMPART) return wall.hitsMax
        if (!wall.room.controller) return wall.hitsMax
        if (!wall.room.controller.my) return wall.hitsMax

        let max = wall.hitsMax
        switch (wall.room.controller.level) {
            case 2: max = 100; break
            case 3:
            case 4: max = 10000; break
            case 5: max = 100000; break
            case 6: max = 1000000; break
            case 7: max = 6000000; break
            case 8: max = 21000000; break
        }
        return Math.min(max, wall.hitsMax)
    }

    getSpot(name: string) {
        if (!this.memory.spots) return null
        if (!this.memory.spots[name]) return null
        return fromXY(this.memory.spots[name], this.name)
    }

    setSpot(name: string, spot: RoomPosition) {
        if (!this.memory.spots) {
            this.memory.spots = {}
        }
        this.memory.spots[name] = spot.xy
    }

    get focus(): Creep | null {
        return null
    }

    enemies: Creep[] = [];
    hostiles: Creep[] = [];
    isHostile(c: Creep) {
        return c.p.hostile
    }
    init() {
        const creeps = this.room.find(FIND_HOSTILE_CREEPS)
        this.enemies = _.filter(creeps, c => !c.p.ally)
        this.hostiles = _.filter(this.enemies, c => this.isHostile(c))
    }

    energyStructures(): Array<StructureSpawn | StructureExtension> {
        return []
    }

    run() {
        const roles = _.map(this.room.find(FIND_MY_CREEPS), c => c.p) as Role[]
        shed.run(roles, 500, r => r.run())
    }

    after() {
        const roles = _.map(this.room.find(FIND_MY_CREEPS), c => c.p) as Role[]
        shed.run(roles, 500, r => r.after())

        const logic = _.map(this.room.find(FIND_FLAGS), c => c.logic)
        shed.run(logic, 500, l => l.run())
    }

    optional() {

    }
}
