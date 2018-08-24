import { Role } from "./role";
import { loop } from "main";
import { isStoreStructure, isEnergyStructure, isStore } from "guards";
import { PCreep } from "creep";

export class Carry extends Role {
    transfer(s: AnyStructure, r: ResourceConstant) {
        const err = this.o.transfer(s, r)
        if (err === OK) this._intents.transfer = true
        return err
    }

    withdraw(s: AnyStructure | Tombstone, r: ResourceConstant) {
        const err = this.o.withdraw(s, r)
        if (err === OK) this._intents.withdraw = true
        return err
    }

    pickup(resource: Resource) {
        const err = this.o.pickup(resource)
        if (err === OK) this._intents.pickup = true
        return err
    }

    idleNom() {
        return this.carryFree && (this.idlePickup() || this.idleLoot())
    }

    idlePickup() {
        if (this._intents.pickup) return false

        const spots = this.ai.lookForAtRange(LOOK_RESOURCES, this.pos, 1)
        const energies = _.filter(
            _.map(spots, s => s[LOOK_RESOURCES] as Resource),
            s => s.resourceType === RESOURCE_ENERGY)
        return this.pickup(_.sample(energies)) === OK
    }

    idleLoot() {
        if (this._intents.withdraw) return false

        const spots = this.ai.lookForAtRange(LOOK_TOMBSTONES, this.pos, 1)
        const tombs = _.filter(
            _.map(spots, s => s[LOOK_TOMBSTONES] as Tombstone),
            s => s.store.energy > 0)
        return this.withdraw(_.sample(tombs), RESOURCE_ENERGY) === OK
    }

    *fillPoolOrdered() {
        return (yield* this.fillTowers(100)) ||
            (yield* this.fillPool()) ||
            (yield* this.fillTowers(400))
    }

    *fillTowers(amount: number) {
        return yield* this.taskFillEnergyUpTo(this.planNear(
            _.filter(this.mission.ai.towers, t => t.energy < amount)),
            amount)
    }

    *fillPool() {
        if (!this.mission.room) return false
        if (this.mission.room.energyAvailable === this.mission.room.energyCapacityAvailable) return false
        // Fill spawns second to give dedicated fillers time to do their job.
        return (yield* this.taskFillEnergy(this.planNear(
            _.filter(this.mission.ai.extns, e => e.energy < e.energyCapacity)))) ||
            (yield* this.taskFillEnergy(this.planNear(
                _.filter(this.mission.ai.spawns, s => s.energy < s.energyCapacity))))
    }

    *taskFillEnergy(estruct: EnergyStruct) {
        if (!estruct) return false;
        return yield* this.taskFillEnergyUpTo(estruct, estruct.energyCapacity)
    }

    *taskFillEnergyUpTo(estruct: EnergyStruct, max: number) {
        return yield* this.taskTransfer(estruct, RESOURCE_ENERGY,
            (e: EnergyStruct) => e.energy < max);
    }


    *taskTransferStore(store: StoreStructure, r: ResourceConstant) {
        return yield* this.taskTransfer(store, r, (s: StoreStructure) => s.storeFree > 0);
    }

    *taskTransfer<T extends EnergyStruct | StoreStructure>(struct: T, r: ResourceConstant, cb: (s: T) => boolean) {
        if (!struct) return false
        while (this.carry[r] && struct && cb(struct)) {
            const id = struct.id
            const err = this.transfer(struct, r)
            switch (err) {
                case ERR_NOT_IN_RANGE: yield this.moveNear(struct); break
                case OK: yield "xfer" + r + struct.pos.xy; break;
                default: return false
            }
            struct = Game.getObjectById<T>(id)!;
        }
        return true
    }

    idleRecharge() {
        if (this.carryFree < this.carry.energy) return false
        if (this._intents.withdraw) return false

        const spots = _.shuffle(this.ai.lookForAtRange(LOOK_STRUCTURES, this.pos, 1))

        for (let spot of spots) {
            const s = spot.structure
            if (s.structureType === STRUCTURE_SPAWN) continue
            if (s.structureType === STRUCTURE_EXTENSION) continue
            if (s.structureType === STRUCTURE_TOWER) continue
            if (isStoreStructure(s) && s.store.energy > 0) {
                return this.withdraw(s, RESOURCE_ENERGY)
            }
            if (isEnergyStructure(s) && s.energy > 0) {
                return this.withdraw(s, RESOURCE_ENERGY)
            }
        }
        return false
    }

    *recharge(limit = 0) {
        const room = this.mission.room
        if (!room) return false

        let es: any[] = _.filter(room.find(FIND_DROPPED_RESOURCES),
            r => r.resourceType === RESOURCE_ENERGY &&
                r.amount - 2 * this.pos.getRangeTo(r) > limit)

        es = es.concat(_.filter(
            room.find(FIND_TOMBSTONES),
            t => t.store.energy > limit))

        es = es.concat(_.filter(this.mission.ai.containers,
            c => c.store.energy > limit))

        if (this.mission.room.storage && this.mission.room.storage.store.energy > 0) {
            es.push(this.mission.room.storage)
        }

        if (this.mission.room.terminal && this.mission.room.terminal.store.energy > 0) {
            es.push(this.mission.room.terminal)
        }

        this.log("energies", es.length, es)
        const e = this.planNear(es)
        if (!e) return false
        if (isEnergyStructure(e)) {
            return yield* this.taskWithdrawEnergy(e);
        }
        if (isStore(e)) {
            return yield* this.taskWithdrawStore(e, RESOURCE_ENERGY);
        }
        if (e instanceof Resource) {
            return yield* this.taskPickup(e);
        }
        return false;
    }

    *taskWithdrawEnergy(estruct: EnergyStruct) {
        return yield* this.taskWithdraw(estruct, RESOURCE_ENERGY, e => e.energy > 0);
    }

    *taskWithdrawStore(store: Store, r: ResourceConstant) {
        return yield* this.taskWithdraw(store, r, s => !!s.store[r]);
    }

    *taskWithdraw<T extends Withdrawable>(struct: T | null, r: ResourceConstant, cb: (t: T) => boolean) {
        while (struct && this.carryFree && cb(struct)) {
            const id = struct.id
            const err = this.withdraw(struct, r)
            if (err === OK) {
                yield 'withdraw'
                return true
            }
            if (err !== ERR_NOT_IN_RANGE) return false
            yield this.moveNear(struct)
            struct = Game.getObjectById(id)
        }
        return false
    }

    *taskLoot(struct: Store | null) {
        while (struct && this.carryFree && struct.storeTotal) {
            const id = struct.id;
            const resources = _.clone(struct.store);
            if (!resources.energy) delete resources.energy;
            const rs = _.keys(resources) as ResourceConstant[]
            if (rs.length < 2) {
                return yield* this.taskWithdrawStore(struct, rs[0]);
            }
            if (!(yield* this.taskWithdrawStore(struct, _.sample(rs)))) {
                return false
            }
            struct = Game.getObjectById<Store>(id);
        }
    }


    *taskPickup(r: Resource | null) {
        while (r && this.carryFree) {
            const id = r.id
            if (!this.pos.inRangeTo(r, r.amount) && this.pos.roomName === r.pos.roomName) {
                return false
            }
            const err = this.pickup(r)
            if (err === OK) {
                yield 'pickup'
                return true
            }
            if (err !== ERR_NOT_IN_RANGE) return false
            yield this.moveNear(r)
            r = Game.getObjectById(id)
        }
        return false
    }
}
