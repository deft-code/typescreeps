import { Role } from "./role";
import { Work } from "./work";
import { StaticLocalSpawner } from "spawners";

@Role.register
class Worker extends Work {
    static spawner(name: string) {
        return new StaticLocalSpawner(name, MOVE, CARRY, CARRY, WORK)
    }

    *loop(): IterableIterator<string | boolean> {
        while (true) {
            if (!this.carry.energy) {
                yield* this.rechargeHarvest()
            } else {
                yield* this.buildOrdered()
            }
        }
    }

    after() {
        if(this.idleNom() || this.carryFree < this.carryTotal) {
            this.idleBuildRepair()
        }
    }
}
