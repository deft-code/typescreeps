import { Role, HasPos } from "roles/role";
import { PSource } from "roomobjs";
import { RoomAI } from "ai/ai";
import { StaticLocalSpawner } from "spawners";
import { errStr } from "debug";
import { Work } from "./work";

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
class Startup extends Work {
    static spawner(name: string) {
        return new StaticLocalSpawner(name, MOVE, CARRY, WORK)
    }
    *loop(): IterableIterator<string | boolean> {
        while (true) {
            if (!this.carry.energy) {
                yield* this.rechargeHarvest()
            } else {
                (yield* this.upgradeAll(1500)) ||
                    (yield* this.fillEnergyOrdered()) ||
                    (yield* this.buildOrdered()) ||
                    (yield* this.upgradeAll())
            }
        }
    }


    after() {
        this.idleNom()
    }
}