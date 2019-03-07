import * as debug from 'debug'
import * as shed from 'shed'
import { Role } from 'roles/role'
import { Dictionary } from 'lodash';
import { fromXY } from 'Rewalker';
import { PSource, PMineral, PController } from 'perma';
import { getCache } from 'cache';
import { StructIndex } from 'structcache';


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
    index: StructIndex
    constructor(public readonly name: string) {
        super();
        this.index = new StructIndex(name);
    }

    toString(): string {
        return this.kind + ':' + this.name;
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

    get towers() { return this.index.get(STRUCTURE_TOWER) }

    get spawns() { return this.index.get(STRUCTURE_SPAWN) }
    get myspawns() { return this.spawns.filter(s => s.my) }

    get containers() { return this.index.get(STRUCTURE_CONTAINER) }

    get extns() { return this.index.get(STRUCTURE_EXTENSION) }

    get roads() { return this.index.get(STRUCTURE_ROAD) }

    get repairs() {
        if (!this.room) return []
        let minHits: number = WALL_HITS_MAX
        const reps = this.room.find(FIND_STRUCTURES, {
            filter: (s: AnyStructure) => {
                switch (s.structureType) {
                    case STRUCTURE_RAMPART:
                    case STRUCTURE_WALL:
                        if (minHits > s.hits) {
                            minHits = s.hits
                        }
                        return s.hits < this.maxHits(s);
                    case STRUCTURE_CONTAINER:
                        return s.hurts > 100000;
                    case STRUCTURE_ROAD:
                        return s.hurts > 2000;
                    default:
                        return s.hits < s.hitsMax;
                }
            }
        });
        this.minHits = minHits;
        return _.shuffle(reps);
    }

    sortConts() {
        const conts = this.index.get(STRUCTURE_CONTAINER);
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

    minHits: number = WALL_HITS_MAX
    maxHits(wall: AnyStructure) {
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
        return Math.min(max, wall.hitsMax, this.minHits + 1000000, 2 * this.minHits)
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
