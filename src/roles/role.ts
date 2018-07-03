import { PCreep } from '../creep'
import * as debug from '../debug'
import { MissionTeam } from '../teams/mission';
import { PSource } from '../roomobjs';
import { PController } from '../structures'

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
}

interface HasPos {
    pos: RoomPosition
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

    _loop: Iterator<string | boolean>
    _intents: Intents = { when: Game.time }
    intendmr(what: string) {
        return this._intents.melee = this._intents.range = what
    }
    pre() {
        return false
    }


    run() {
        if (this._intents.when !== Game.time) {
            this._intents = {
                when: Game.time
            }
        }
        if (this.pre()) return
        if (this._loop) {
            const ret = this._loop.next()
            if (ret.done || !ret.value) {
                this._loop.return!()
                delete this._loop
            }
            this.o.say("" + ret.value)
        } else {
            this._loop = this.loop()
        }
    }

    *loop(): IterableIterator<string|boolean> { }


    after() {
    }

    get memory() { return this.o.memory }
    get mission() {
        const mname = this.memory.mission
        return Game.flags[mname].team as MissionTeam
    }

    pickMove(...a: any[]) { return 0 }

    *moveSeeMission() {
        while (!this.ai.room && this.moveRoom(this.mission)) {
            yield 'moved'
        }
    }

    moveRoom(ro?: HasPos) {
        if (!ro) return false
        const x = this.pos.x
        const y = this.pos.y
        if (ro.pos.roomName === this.room.name) {
            if (x === 0) {
                this.move(RIGHT)
            } else if (x === 49) {
                this.move(LEFT)
            } else if (y === 0) {
                this.move(BOTTOM)
            } else if (y === 49) {
                this.move(TOP)
            }
            this.dlog('moveRoom done')
            return false
        }

        const ox = ro.pos.x
        const oy = ro.pos.y
        const range = Math.max(1, Math.min(ox, oy, 49 - ox, 49 - oy) - 1)
        return this.moveTarget(ro, range)
    }

    moveTarget(ro: HasPos, range: number) {
        return debug.errStr(this.o.moveTo(ro, { range: range }))
    }

    moveNear(ro: HasPos) { return this.moveTarget(ro, 1) }
    moveRange(ro: HasPos) { return this.moveTarget(ro, 3) }

    move(dir: DirectionConstant) {
        return this.o.move(dir)
    }
    harvest(sm: PSource) {
        const err = this.o.harvest(sm.o)
        if (err === OK) this.intendmr('harvest')
        return err
    }

    upgrade(ctrl: PController) {
        const err = this.o.upgradeController(ctrl.o)
        if (err === OK) this.intendmr('upgrade')
        return err
    }

}

