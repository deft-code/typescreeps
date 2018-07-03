import { Role } from "./role";
import { PSource } from "../roomobjs";
import { RoomAI } from "../rooms/room";

function sourceFree(ai: RoomAI) {
    return function (mat: CostMatrix, roomName: string) {
        if (roomName !== ai.name || !ai.room) return mat
        for (const src of ai.sources) {
            for (const spot of src.spots) {
                if (spot.lookFor(LOOK_CREEPS).length) {
                    mat.set(spot.x, spot.y, 50)
                }
            }
        }
        return mat
    }
}

@Role.register
class Startup extends Role {
    *loop(): IterableIterator<string|boolean>{
        while (true) {
            if(!this.carry.energy) {
                yield* this.harvestSources()
            } else {
                yield* this.upgradeAll()
            }
        }
    }

    *upgradeAll() {
        const ctrl = this.mission.ai.controller
        if(!ctrl) return false
        while(this.carry.energy) {
            switch(this.upgrade(ctrl)) {
                case OK: yield 'upgrade'; break
                case ERR_NOT_IN_RANGE: yield this.moveRange(ctrl); break
                default: return false
            }
        }
        return true
    }

    *rechargeHarvest() {
        return (yield* this.recharge(this.carryTotal / 3)) ||
            (yield* this.harvestSources()) ||
            (yield* this.recharge())
    }

    *recharge(limit = 0) {
        return false
    }

    goodSource(src: PSource) {
        return src.energy > 0 || this.pos.getRangeTo(src.pos) > src.ticksToRegeneration
    }

    *harvestSources() {
        const sources = _.filter(this.mission.ai.sources, s => this.goodSource(s))
        if (!sources) return

        const targets = _.map(sources, s => ({ pos: s.pos, range: 1 }))

        const i = this.pickMove(targets, { matrixLayer: sourceFree(this.mission.ai) })
        const src = sources[i]
        yield* this.harvestSource(src)
    }

    *harvestSource(src: PSource) {
        while (this.carryFree && this.goodSource(src)) {
            switch (this.harvest(src)) {
                case OK: yield 'harvest'; break
                case ERR_NOT_IN_RANGE: yield this.moveNear(src); break
                default: return
            }
        }
    }

    after() {
    }
}
