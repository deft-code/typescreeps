import { Role } from "./role";
import { defaultRewalker } from "Rewalker"
import { StaticLocalSpawner, Spawner, DynamicLocalSpawner } from "spawners";
import { RoomAI } from "ai/ai";
import { PSource } from "perma";
import { Work } from "./work";
import { errStr } from "debug";
import { buildBody } from "body";

class AphidSpawner extends DynamicLocalSpawner {
    energyAIs(ais: RoomAI[]) {
        return ais.filter(ai => {
            const e = ai.room!.energyAvailable;
            const c = ai.room!.energyCapacityAvailable;
            if(c > 800) return e > 800;
            return e >= c;
        });
    }
    body(ai: RoomAI) {
        return buildBody([WORK], Math.min(800, ai.room!.energyAvailable), 8 / 3, [CARRY]);
    }
}

@Role.register
export class Aphid extends Work {
    getSource() {
        return _.first(this.mission.ai.sources)
    }

    *loop(): IterableIterator<string | boolean> {
        yield* this.taskMissionVisible()
        const src = this.getSource()
        yield* this.taskHarvestByStore(src, STRUCTURE_STORAGE);
        yield* this.taskHarvestByStore(src, STRUCTURE_LINK);
        yield* this.taskHarvestByCont(src)
        yield* this.taskHarvestBySite(src)

        const spot = src.spot
        const err = spot.createConstructionSite(STRUCTURE_CONTAINER)
        if (err < OK) {
            this.log("bad site", err, spot)
            return false
        }
        yield this.moveTarget({ pos: spot }, 0) || 'site'
        yield* this.taskHarvestBySite(src)
    }

    fillUp(store: StoreStructure) {
        if (this.idleNom()) return 'nom'
        if (this.carry.energy < this.o.getActiveBodyparts(WORK)) {
            if (this.withdraw(store, RESOURCE_ENERGY) === OK) return 'withdraw'
        }
        return 'idle'
    }

    *taskHarvestByStore(src: PSource, stype: StructureConstant) {
        let store = _.find(this.ai.index.get(stype) as StoreStructure[], s => src.spot.isNearTo(s));
        if(!store) return false;

        const cont = _.find(src.spot.lookFor(LOOK_STRUCTURES), s => s.structureType === STRUCTURE_CONTAINER) as StructureContainer | undefined;
        if (cont && cont.storeTotal === 0) cont.destroy();

        yield* this.taskMoveRange(src)
        while (store) {
            const id: string = store.id
            this.moveTarget({ pos: src.spot }, 0)

            // TODO use generic creep power
            const power = HARVEST_POWER * this.o.getActiveBodyparts(WORK)
            // Only transfer when actively harvesting
            if (src.energy && (this.idleNom() || power > this.carryFree)) {
                this.transfer(store, RESOURCE_ENERGY)
            }
            let err = this.harvest(src)
            switch (err) {
                case OK: yield 'harvest'; break
                case ERR_NOT_IN_RANGE: yield 'move'; break
                case ERR_NOT_ENOUGH_RESOURCES: yield this.fillUp(store); break
                default: return false
            }
            if (this.carry.energy) {
                const spawn = _.find(this.nearStructs.get(STRUCTURE_SPAWN) as StructureSpawn[], s => s.energyFree);
                this.transfer(spawn!, RESOURCE_ENERGY);
            }
            store = Game.getObjectById(id) as StructureStorage | undefined
        }
        return true
    }

    * taskHarvestByCont(src: PSource) {
        const look = _.find(this.mission.ai.lookForAtRange(LOOK_STRUCTURES, src.pos, 1),
            s => s.structure.structureType === STRUCTURE_CONTAINER)
        if (!look) return false
        let cont = look[LOOK_STRUCTURES] as StructureContainer | null
        while (cont) {
            const id = cont.id
            this.moveTarget(cont, 0)
            let err: ScreepsReturnCode
            // TODO use generic creep power
            if (cont.storeFree < HARVEST_POWER * this.o.getActiveBodyparts(WORK)) {
                // Repair the container when it's full
                err = ERR_NOT_ENOUGH_RESOURCES
            } else {
                err = this.harvest(src)
            }
            switch (err) {
                case OK: yield 'harvest'; break
                case ERR_NOT_IN_RANGE: yield 'moved'; break
                case ERR_NOT_ENOUGH_RESOURCES: yield this.fillUp(cont); break
                default: return false
            }
            cont = Game.getObjectById(id)
        }
        return true
    }

    * taskHarvestBySite(src: PSource) {
        const look = _.find(this.mission.ai.lookForAtRange(LOOK_CONSTRUCTION_SITES, src.pos, 1),
            s => (<ConstructionSite>s[LOOK_CONSTRUCTION_SITES]).structureType === STRUCTURE_CONTAINER)
        if (!look) return false
        let site = look[LOOK_CONSTRUCTION_SITES] as ConstructionSite | null
        while (site) {
            const id = site.id
            let err
            if (this.carry.energy < (BUILD_POWER * this.o.getActiveBodyparts(WORK)) && src.energy) {
                err = this.harvest(src)
            } else {
                this.idleNom()
                err = this.build(site)
            }
            switch (err) {
                case OK: yield this.moveTarget(site, 0) || 'harvest'; break
                case ERR_NOT_IN_RANGE: yield this.moveTarget(site, 0); break
                case ERR_NOT_ENOUGH_ENERGY: yield "idle"; break
                case ERR_INVALID_TARGET: return yield* this.taskHarvestByCont(src)
                default: return false
            }
            site = Game.getObjectById(id)
        }
        return true
    }

    after() {
        this.idleNom()
        this.idleBuildRepair()
    }

    static spawner(name: string) {
        return new AphidSpawner(name, [])
    }
}
