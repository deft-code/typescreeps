import { PCreep } from 'creep'
import * as debug from 'debug'
import { MissionLogic } from 'logic/mission';

import { defaultRewalker, Goal } from 'Rewalker';

const rewalker = defaultRewalker()


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
    static calcMission(name: string): string { return _.last(_.words(name)) }

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
        if (this._loop) {
            try {
                const ret = this._loop.next()
                if (ret.done || !ret.value) {
                    this._loop.return!()
                    delete this._loop
                }
            } catch (e) {
                delete this._loop
                throw e
            }
        } else {
            this._loop = this.loop()
        }
    }

    * loop(): IterableIterator<string | boolean> { }


    after() {
    }

    get memory() { return this.o.memory }
    get mission() {
        const mname = Role.calcMission(this.name)
        return Game.flags[mname].logic as MissionLogic
    }



    * taskMissionVisible() {
        while (!this.ai.room && this.moveRoom(this.mission)) {
            yield 'moved'
        }
    }

    * taskMoveRoom(ro: HasPos) {
        while (true) {
            const walked = this.moveRoom(ro)
            if (!walked) return false
            yield walked
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

    pickMove(goals: Goal[]) { return rewalker.planWalk(this.o, goals) }
    moveTarget(ro: HasPos, range: number) {
        const err = rewalker.walkTo(this.o, ro.pos, range)
        if (err === OK) return false
        if (err <= OK) return debug.errStr(err as ScreepsReturnCode)
        return debug.dirStr(err as DirectionConstant)
    }
    *taskMoveTarget(ro: HasPos, range: number) {
        while (true) {
            const walked = this.moveTarget(ro, range)
            if (!walked) return false
            yield walked
        }
    }

    moveNear(ro: HasPos) { return this.moveTarget(ro, 1) }
    moveRange(ro: HasPos) { return this.moveTarget(ro, 3) }
    *taskMoveRange(ro: HasPos) { yield* this.taskMoveTarget(ro, 3) }

    move(dir: DirectionConstant) {
        return this.o.move(dir)
    }


    planRange<T extends HasPos>(objs: T[]) { return this.planMove(objs, 3) }
    planNear<T extends HasPos>(objs: T[]) { return this.planMove(objs, 1) }
    planMove<T extends HasPos>(objs: T[], range: number): T {
        if (objs.length < 2) return _.first(objs)
        const goals = _.map(objs, c => ({ pos: c.pos, range }))
        const i = this.pickMove(goals)
        return objs[i]
    }



}

