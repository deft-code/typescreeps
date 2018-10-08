import { defaultRewalker, Goal } from 'Rewalker';
import { Role, HasPos } from "./role";
import * as debug from 'debug';

const rewalker = defaultRewalker()


export class Move extends Role {
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
