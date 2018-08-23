import { Role } from "./role";
import { Carry } from "./carry";
import { DynamicLocalSpawner } from "spawners";
import { RoomAI } from "ai/ai";
import { buildBody } from "body";
import { loop } from "main";

class HaulerSpawner extends DynamicLocalSpawner {
    energyAIs(ais: RoomAI[]) {
        return _.filter(ais, ai => 3 * ai.room!.energyAvailable >= ai.room!.energyCapacityAvailable)
    }
    body(ai: RoomAI) {
        const mn = 800
        const mx = 2600
        const e = ai.room!.energyAvailable
        return buildBody(this.parts, Math.min(mx, Math.max(e, mn)), 2)
    }
}

@Role.register
class Hauler extends Carry {
    static spawner(name: string) {
        return new HaulerSpawner(name, [CARRY])
    }

    *loop() {
        while (true) {
            if (!this.carry.energy) {
                (yield* this.recharge(this.carryTotal / 3)) ||
                    (yield* this.recharge());
            }
            if (!(yield* this.fillEnergyOrdered())) {
                yield 'idle'
            }
        }
    }
}
