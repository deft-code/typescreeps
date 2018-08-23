import { Role } from "./role";
import { loop } from "main";
import { isStoreStructure, isEnergyStructure } from "guards";

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

    *fillEnergyOrdered() {
        return (yield* this.fillTowers(100)) ||
            (yield* this.fillPool()) ||
            (yield* this.fillTowers(400))
    }

    *fillTowers(amount: number) {
        return yield* this.fillEnergy(this.planNear(
            _.filter(this.mission.ai.towers, t => t.energy < amount)),
            amount)
    }

    *fillPool() {
        if (!this.mission.room) return false
        if (this.mission.room.energyAvailable === this.mission.room.energyCapacityAvailable) return false
        // Fill spawns second to give dedicated fillers time to do their job.
        return (yield* this.fillEnergy(this.planNear(
            _.filter(this.mission.ai.extns, e => e.energy < e.energyCapacity)))) ||
            (yield* this.fillEnergy(this.planNear(
                _.filter(this.mission.ai.spawns, s => s.energy < s.energyCapacity))))
    }

    *fillEnergy(estruct: EnergyStruct, amount = 0) {
        if (!estruct) return false
        while (estruct && (amount === 0 || estruct.energy < amount) && this.carry.energy) {
            const err = this.o.transfer(estruct, RESOURCE_ENERGY)
            switch (err) {
                case ERR_NOT_IN_RANGE: yield this.moveNear(estruct); break
                case OK: yield "transfer" + estruct.pos.xy; break;

                default: return false
            }
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
                r.amount - this.pos.getRangeTo(r) > limit)

        es = es.concat(_.filter(
            room.find(FIND_TOMBSTONES),
            t => t.store.energy > limit))

        es = es.concat(_.filter(this.mission.ai.containers,
            c => c.store.energy > limit))

        if (this.mission.room.storage) {
            es.push(this.mission.room.storage)
        }

        if (this.mission.room.terminal) {
            es.push(this.mission.room.terminal)
        }

        this.log("energies", es.length, es)
        const e = this.planNear(es)
        if (!e) return false
        if (e.store || e.energy) {
            return yield* this.taskWithdraw(e, RESOURCE_ENERGY)
        }
        return yield* this.taskPickup(e)
    }

    *taskWithdraw(struct: AnyStructure | Tombstone | null, r: ResourceConstant) {
        while (struct && this.carryFree) {
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
