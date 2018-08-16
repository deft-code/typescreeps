import * as debug from 'debug'
import * as shed from 'shed'
import { Role } from 'roles/role'
import 'structures'
import { PSpawn, PController } from 'structures';
import { PSource } from 'roomobjs';
import { Dictionary } from 'lodash';
import { fromXY } from 'Rewalker';

function allied(c: Creep) {
    const allies = ['HailHydra']
    return _.contains(allies, c.owner.username)
}

declare global {
    interface RoomMemory {
        spots?: Dictionary<number>
    }
}

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

    get controller(): PController | null {
        if (this.room && this.room.controller) return this.room.controller.p
        return null
    }

    _structsTime = 0
    _structs: Dictionary<AnyStructure[]> = {}
    get structs() {
        if (this._structsTime !== Game.time && this.room) {
            this._structs = _.groupBy(this.room.find(FIND_STRUCTURES), s => s.structureType)
        }
        return this._structs
    }

    get towers() {
        return this.structs[STRUCTURE_TOWER] as StructureTower[]
    }

    get spawns() {
        return this.structs[STRUCTURE_SPAWN] as StructureSpawn[]
    }

    get myspawns() { return this.spawns.filter(s => s.my) }

    get extns() { return this.structs[STRUCTURE_EXTENSION] as StructureExtension[] }

    get roads() { return this.structs[STRUCTURE_ROAD] as StructureRoad[] }

    get containers() { return this.structs[STRUCTURE_CONTAINER] as StructureContainer[] }

    _sources?: Array<PSource>
    get sources() {
        if (!this._sources) {
            if (!this.room) return []
            this._sources = _.map(this.room.find(FIND_SOURCES), s => s.p)
        }
        return this._sources
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
