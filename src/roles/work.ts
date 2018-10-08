import { Carry } from "./carry";
import { PController, PSource, } from "perma";
import { errStr } from "debug";

export class Work extends Carry {

    build(site: ConstructionSite) {
        const err = this.o.build(site)
        if (err === OK) this.intendmr('build')
        return err
    }

    idleBuild() {
        if (!this.carryTotal) return false
        if (this._intents.melee || this._intents.range) return false
        const site = _(this.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 3))
            .sortBy(site => site.progressTotal - site.progress)
            .first()
        return this.build(site) === OK
    }

    *buildOrdered() {
        return (yield* this.buildType(STRUCTURE_TOWER)) ||
            (yield* this.buildType(STRUCTURE_SPAWN)) ||
            (yield* this.buildType(STRUCTURE_EXTENSION)) ||
            (yield* this.buildAny())
    }

    *buildAny() {
        if (!this.mission.ai.room) return false
        return yield* this.buildSite(this.planRange(
            _.shuffle(this.mission.ai.room.find(FIND_MY_CONSTRUCTION_SITES))))
    }

    *buildType(stype: StructureConstant) {
        if (!this.mission.ai.room) return false
        return yield* this.buildSite(this.planRange(
            _.shuffle(_.filter(this.mission.ai.room.find(FIND_MY_CONSTRUCTION_SITES),
                s => s.structureType === stype))))
    }

    *buildSite(site: ConstructionSite | null) {
        if (!site) return false
        while (site && this.carry.energy) {
            const id: string = site.id
            const err = this.build(site)
            switch (err) {
                case ERR_NOT_IN_RANGE: yield this.moveRange(site); break
                case OK: yield 'build' + site.progress; break
                default: this.log("build error", errStr(err)); return false
            }
            yield 'again';
            site = Game.getObjectById(id)
        }
        return true
    }

    repair(struct: Structure) {
        const err = this.o.repair(struct)
        if (err === OK) this.intendmr('repair')
        return err
    }

    idleRepair() {
        if (!this.carryTotal) return false
        if (this._intents.melee || this._intents.range) return false
        let structs = _.shuffle(_.filter(
            _.map(
                this.ai.lookForAtRange(LOOK_STRUCTURES, this.pos, 3),
                l => l[LOOK_STRUCTURES] as AnyStructure),
            s => s.hurts > 0))
        const reg = _.find(structs, s => !_.includes([STRUCTURE_ROAD, STRUCTURE_WALL, STRUCTURE_RAMPART, STRUCTURE_CONTAINER], s.structureType))
        if (reg) {
            return this.repair(reg) === OK
        }

        const repairPower = this.info['repair'] || 0
        if (!repairPower) return false

        const struct = _.find(structs, s => s.hurts >= repairPower && s.hits < this.ai.maxHits(s))
        return struct && this.repair(struct) === OK
    }

    *taskRepairOrdered() {
        const r = this.planRange(this.mission.ai.repairs);
        return yield* this.taskRepairStruct(r);

    }

    *taskRepairStruct(s: AnyStructure) {
        if (!s) return false;
        const max = this.mission.ai.maxHits(s);
        while(s && s.hits < max) {
            this.log(s.structureType, s.pos.xy, s.hits, s.hitsMax, max);
            const id = s.id;
            const err = this.repair(s);
            switch(err) {
                case ERR_NOT_IN_RANGE: yield this.moveRange(s); break;
                case OK: yield 'repair' + s.pos.xy; break;
                default: return false;
            }
            yield 'again'
            s = Game.getObjectById<AnyStructure>(id)!;
        }
        return true;
    }

    idleBuildRepair() {
        return this.idleBuild() || this.idleRepair()
    }

    harvest(sm: PSource) {
        if (!sm.o) return ERR_INVALID_TARGET
        const err = this.o.harvest(sm.o)
        if (err === OK) this._intents.melee = 'harvest'
        return err
    }

    upgrade(ctrl: PController) {
        if (!ctrl.o) return ERR_INVALID_TARGET
        const err = this.o.upgradeController(ctrl.o)
        if (err === OK) this.intendmr('upgrade')
        return err
    }

    *upgradeAll(min = 0) {
        const ctrl = this.mission.ai.controller
        if (!ctrl) return false
        if (min > 0 && ctrl.ticksToDowngrade > min) return false
        while (this.carry.energy) {
            switch (this.upgrade(ctrl)) {
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

    goodSource(src: PSource) {
        return src.energy > 0 || this.pos.getRangeTo(src.pos) > src.ticksToRegeneration
    }

    *harvestSources() {
        const sources = _.filter(this.mission.ai.sources, s => this.goodSource(s))
        this.log('sources', sources)
        if (!sources.length) return

        const src = this.planNear(sources)
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
}
