import * as debug from '../debug'
import * as shed from '../shed'
import { Role } from '../roles/role'
import '../structures'
import { PSpawn, PController } from '../structures';
import { PSource } from 'roomobjs';

function allied(c: Creep) {
    const allies = ['HailHydra']
    return _.contains(allies, c.owner.username)
}


export class RoomAI extends debug.Debuggable {
    constructor(public readonly name: string) {
        super()
    }

    get room(): Room {
        return Game.rooms[this.name];
    }

    get kind(): string {
        return 'room'
    }

    get controller(): PController | null {
        if(this.room && this.room.controller) return this.room.controller.p
        return null
    }

    get spawns(){
        const structs = this.room.find(FIND_STRUCTURES);
        const spawns = _.filter(structs, s => s.structureType === STRUCTURE_SPAWN) as StructureSpawn[];
        return _.map(spawns, s => s.p)
    }

    _sources?:Array<PSource>
    get sources() {
        if(!this._sources) {
            if(!this.room) return []
            this._sources = _.map(this.room.find(FIND_SOURCES), s => s.p)
        }
        return this._sources
    }

    enemies: Creep[] = [];
    hostiles: Creep[] = [];

    init() {
        const creeps = this.room.find(FIND_HOSTILE_CREEPS)
        this.enemies = _.filter(creeps, c => !c.p.ally)
        this.hostiles = _.filter(this.enemies, c => c.p.hostile)
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

        const teams = _.map(this.room.find(FIND_FLAGS), c => c.team)
        shed.run(teams, 500, t => t.run())
    }

    optional() {

    }
}
