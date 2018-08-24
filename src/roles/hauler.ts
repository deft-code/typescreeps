import { Role } from "./role";
import { Carry } from "./carry";
import { DynamicLocalSpawner } from "spawners";
import { RoomAI } from "ai/ai";
import { buildBody } from "body";
import { loop } from "main";
import { isEnergyStructure } from "guards";

class HaulerSpawner extends DynamicLocalSpawner {
    energyAIs(ais: RoomAI[]) {
        return _.filter(ais, ai => 3 * ai.room!.energyAvailable >= ai.room!.energyCapacityAvailable)
    }
    body(ai: RoomAI) {
        const mn = 800;
        const mx = 2600;
        const e = ai.room!.energyAvailable;
        return buildBody(this.parts, Math.min(mx, Math.max(e, mn)), 2);
    }
}

@Role.register
class Hauler extends Carry {
    static spawner(name: string) {
        return new HaulerSpawner(name, [CARRY])
    }

    *loop() {
        yield* this.taskMissionVisible()
        yield* this.fillTowers(200)
        if (this.mission.room!.energyAvailable < this.mission.room!.energyCapacityAvailable) {
            yield* this.taskDepositMinerals()
            if (!this.carry.energy) {
                yield* this.taskRechargePool()
            }
            yield* this.fillPoolOrdered()
        } else {
            if (2 * this.carryTotal > this.carryCapacity) {
                (yield* this.taskDepositMinerals()) ||
                    (yield* this.taskFillAny()) ||
                    (yield* this.taskDrains()) ||
                    (yield* this.taskDeposit())
            } else {
                (yield* this.taskDrains()) ||
                    (yield* this.taskShuttleEnergy()) ||
                    (yield* this.taskDeposit())
            }
        }
    }

    *taskRechargePool() {
        return (yield* this.recharge(this.carryCapacity / 3)) ||
            (yield* this.recharge());
    }

    *taskDrains() {
        if (!this.mission.room) return false;
        const hasTerm = !!this.mission.room.terminal;

        const drops = this.mission.room.find(FIND_DROPPED_RESOURCES, {
            filter: r => {
                const amount = r.amount - this.pos.getRangeTo(r);
                if (r.resourceType === RESOURCE_ENERGY) return amount > 25;
                return hasTerm && amount > 0;
            }
        });

        const drop = this.planNear(drops);
        if (drop) {
            return yield* this.taskPickup(drop);
        }

        const tombs = this.mission.room.find(FIND_TOMBSTONES, {
            filter: (t: Tombstone) => (hasTerm && t.storeTotal > 0) || t.store.energy > 0
        });
        const tomb = this.planNear<Tombstone>(tombs);
        if (tomb) {
            return yield* this.taskLoot(tomb);
        }

        const inconts = _.filter(this.mission.ai.inconts, c => c.storeFree < 500 && (hasTerm || c.store.energy > 0));
        const incont = this.planNear(inconts);
        if (incont) {
            if (hasTerm) return yield* this.taskLoot(incont);
            return yield* this.taskWithdrawStore(incont, RESOURCE_ENERGY);
        }
        return false
    }

    planNeedFill(): EnergyStruct | StoreStructure | null {
        // TODO plan other energy structs.
        const outs = _.filter(this.mission.ai.outconts,
            c => c.store.energy < 0.75 * c.storeCapacity && c.storeFree > 100);
        return this.planNear(outs);
    }

    *taskShuttleEnergy() {
        let e = this.planNeedFill();
        if (!e) return false;
        const id = e.id;
        e = null; // avoid garbage
        if (3 * this.carry.energy < this.carryCapacity) {
            yield* this.taskRechargePool()
        }
        e = Game.getObjectById<EnergyStruct>(id)!
        return yield* this.taskFillEnergy(e);
    }

    *taskFillAny() {
        const e = this.planNeedFill();
        if (!e) return false;
        if (isEnergyStructure(e)) {
            return yield* this.taskFillEnergy(e)
        }
        return yield* this.taskTransferStore(e, RESOURCE_ENERGY);
    }

    *taskDepositMinerals() {
        // into mineral cont or drop
        return false
    }

    *taskDeposit() {
        // into term < 250 or storage
        return false
    }

}
