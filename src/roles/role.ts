import { PCreep } from 'creep'
import * as debug from 'debug'
import { MissionLogic } from 'logic/mission';

import { CreepIndex } from 'structcache';



const gRoles = new Map<string, typeof Role>()

declare global {
    interface CreepMemory {
        mission: string
    }
}

interface Intents {
    when: number
    melee?: string
    range?: string
    withdraw?: true
    transfer?: true
    pickup?: true
    drop?: true
}

export interface HasPos {
    pos: RoomPosition
}

export interface Egg {
    name: string
    spawn(avoid: Set<string>): ScreepsReturnCode
    priority: number
    cancel(): void
}

export class Role extends PCreep {
    toString() { return `[${this.o.name}]` }

    static register(ctor: typeof Role) {
        gRoles.set(ctor.name.toLowerCase(), ctor)
        console.log('registering', ctor.name)
    }

    static lookupRole(role: string): typeof Role {
        try {
            require(`roles.${role}`)
        } catch (err) {
            debug.log('BAD ROLE', role, err, err.stack)
        }
        return gRoles.get(role) || Role
    }

    static calcRole(name: string): string { return _.first(_.words(name)).toLowerCase() }
    static calcMission(name: string): string {
        if (name.includes('_')) {
            return _.last(name.split('_'));
        }
        return _.last(_.words(name));
    }

    static spawner(name: string): Egg {
        return {
            name,
            spawn() { return ERR_NOT_FOUND },
            cancel() { },
            priority: 10,
        }
    }

    get role() {
        return Role.calcRole(this.name)
    }

    _loop: Iterator<string | boolean>
    _intents: Intents = { when: Game.time }
    intendmr(what: string) {
        return this._intents.melee = this._intents.range = what
    }

    pre() {
        return false
    }

    run() {
        this.mission.reportIn(this)
        if (this._intents.when !== Game.time) {
            this._intents = {
                when: Game.time
            }
        }
        if (this.pre()) return
        let newLoop = false
        if (!this._loop) {
            newLoop = true
            this._loop = this.loop();
        }
        let ret = this._loop.next()
        let twice = false;
        if (ret.value === 'again') {
            twice = true;
            ret = this._loop.next();
        }
        if (ret.done) {
            this._loop = this.loop();
            if(!newLoop) {
            ret = this._loop.next();
            if(ret.value === 'again' && !twice) {
                ret = this._loop.next();
            }
        }
        }
        this.dlog("ran", ret.value)
    }

    * loop(): IterableIterator<string | boolean> { }

    after() { }

    get memory() { return this.o.memory }
    get mission() {
        const mname = Role.calcMission(this.name)
        return Game.flags[mname].logic as MissionLogic
    }




}

