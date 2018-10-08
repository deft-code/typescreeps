import { Role } from "./role";
import { Carry } from "./carry";
import { StaticLocalSpawner } from "spawners";
import { RoomAI } from "ai/ai";

class BankerSpawner extends StaticLocalSpawner {
    energyAIs(ais: RoomAI[]) {
        return _.filter(ais, ai => ai.room!.energyAvailable >= 250)
    }
}

@Role.register
class Banker extends Carry {
    static spawner(name: string) {
        return new BankerSpawner(name, MOVE, CARRY, CARRY, CARRY, CARRY);
    }

    *loop() {
        const spot = this.mission.ai.getSpot('core');
        if (!spot) {
            yield 'done';
            return false;
        }

        yield* this.taskMoveTarget({ pos: spot }, 0);
        const t = _.min(this.nearStructs.get(STRUCTURE_TOWER).filter(t => t.energyFree >= 200), t => t.energy);
        if (t) {
            yield* this.taskGetEnergy();
            this.transfer(t, RESOURCE_ENERGY);
            yield 'transfer';
        }

        const spawn = _.find(this.nearStructs.get(STRUCTURE_SPAWN), s => s.energyFree > 0);
        if (spawn) {
            yield* this.taskGetEnergy();
            this.transfer(spawn, RESOURCE_ENERGY);
            yield 'transfer';
        }

        const term = _.first(this.nearStructs.get(STRUCTURE_TERMINAL));
        const store = _.first(this.nearStructs.get(STRUCTURE_STORAGE));
        if (store && term) {
            if (term.store.energy < 10000) {
                if (!this.carry.energy) {
                    yield* this.taskGetEnergy(false);
                    yield "getenergy";
                }
                this.transfer(term, RESOURCE_ENERGY);
                yield 'transfer';
                return true;
            }
        }

        return true;
    }

    *taskGetEnergy(terminal = true, store = true) {
        while (this.carryFree) {
            let e: EnergyStruct | StoreStructure;
            FIND: {
                e = _.first(this.nearStructs.get(STRUCTURE_LINK).filter(l => l.energy > 0));
                if (e) break FIND;

                if (store) {
                    e = _.first(this.nearStructs.get(STRUCTURE_STORAGE).filter(s => s.store.energy > 0));
                    if (e) break FIND;
                }

                if (terminal) {
                    e = _.first(this.nearStructs.get(STRUCTURE_TERMINAL).filter(s => s.store.energy > 0));
                    if (e) break FIND;
                }
            }
            this.idleNom();
            if (e) {
                this.withdraw(e, RESOURCE_ENERGY);
            }
            if (this.carry.energy) return true
            yield "withdraw";
        }
        return true;
    }
}
