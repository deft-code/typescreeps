import { Role } from "./role";
import { Work } from "./work";
import { DynamicLocalSpawner } from "spawners";

@Role.register
class Worker extends Work {
    static spawner(name: string) {
        return new DynamicLocalSpawner(name, [CARRY, WORK])
    }

    *loop(): IterableIterator<string | boolean> {
        if (!this.carry.energy) {
            yield* this.rechargeHarvest()
        } else {
            (yield* this.buildOrdered()) ||
            (yield* this.taskRepairOrdered()) ||
                (yield* this.upgradeAll());
        }
    }

    after() {
        const e = this.idleNom() || this.idleRecharge()
        if (e || this.carryFree < this.carryTotal) {
            this.idleBuildRepair()
        }
    }
}
