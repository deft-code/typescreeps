import { Role } from "./role";
import { isEnergyStructure, isStore } from "guards";
import { RoomAI } from "ai/ai";
import { DynamicLocalSpawner } from "spawners";
import { Carry } from "./carry";

@Role.register
class Thief extends Carry {
    static spawner(name: string) {
        return new DynamicLocalSpawner(name, [CARRY])
    }

    *loop(): IterableIterator<string | boolean> {
        if (this.carry.energy > this.carryFree) {
            // return home
        }

        yield * this.taskMissionVisible()
   }

   *taskSteal() {
       const room = this.mission.room;
       if(!room) return false;

        let es: any[] = _.filter(room.find(FIND_DROPPED_RESOURCES),
            r => r.amount > this.pos.getRangeTo(r))

        es = es.concat(room.find(FIND_TOMBSTONES).filter(t => t.storeTotal > 0));

        for(const struct of this.mission.ai.index.all) {
            switch(struct.structureType) {
                case STRUCTURE_CONTAINER:
                case STRUCTURE_TERMINAL:
                case STRUCTURE_STORAGE:
                    if(struct.storeTotal > 0) {
                        es.push(struct);
                    }
                    break;
                case STRUCTURE_TOWER:
                case STRUCTURE_LINK:
                case STRUCTURE_EXTENSION:
                    if(struct.energy > 0) {
                        es.push(struct);
                    }
                    break;
                // TODO labs
            }
        }

        const e = this.planNear(_.shuffle(es))
        if (!e) return false
        if (isEnergyStructure(e)) {
            return yield* this.taskWithdrawEnergy(e);
        }
        if (isStore(e)) {
            return yield* this.taskLoot(e);
        }
        if (e instanceof Resource) {
            return yield* this.taskPickup(e);
        }
        return false;
   }

    after() {
        this.idleNom()
    }
}
