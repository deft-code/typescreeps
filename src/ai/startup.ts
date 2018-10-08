import { RoomAI } from './ai';
import { defaultRewalker } from 'Rewalker';
import { joinSpawning } from 'spawners';
import * as debug from 'debug';

function one(towers: StructureTower[], func: any, obj: Creep | AnyStructure | undefined) {
    if (!obj) return towers
    const tower = obj.pos.findClosestByRange(towers)
    const err = func.call(tower, obj)
    if (err !== OK) debug.log(`${tower.pos} Bad tower ${err}: ${tower}, ${obj}`)
    return _.filter(towers, t => t.id !== tower.id)
}

function oneAttack(towers: StructureTower[], creep: Creep | undefined) { return one(towers, StructureTower.prototype.attack, creep) }
function oneHeal(towers: StructureTower[], creep: Creep | undefined) { return one(towers, StructureTower.prototype.heal, creep) }
function oneRepair(towers: StructureTower[], struct: AnyStructure | undefined) { return one(towers, StructureTower.prototype.repair, struct) }



export class StartupAI extends RoomAI {
    get kind() { return 'startup' }

    isHostile(c: Creep) {
        return c.p.assault
    }

    runTowers() {
        let towers = this.towers.filter(t => t.my && t.energy >= 10)
        if (!towers.length) return

        const focus = this.focus
        if (focus) {
            towers.forEach(t => t.attack(focus) || true)
            return
        }

        towers = towers.filter(t => t.energy > 100)
        if (!towers.length) return

        const decay = _.filter(
            this.room.find(FIND_STRUCTURES),
            s => (
                (s.structureType === STRUCTURE_RAMPART && s.hits <= 10 * RAMPART_DECAY_AMOUNT) ||
                (s.structureType === STRUCTURE_WALL && s.hits <= 10 * RAMPART_DECAY_AMOUNT) ||
                (s.structureType === STRUCTURE_ROAD && s.hits <= 5 * ROAD_DECAY_AMOUNT) ||
                (s.structureType === STRUCTURE_CONTAINER && s.hits <= CONTAINER_DECAY)))
        if (decay.length) {
            for (const tower of towers) {
                tower.repair(_.sample(decay))
            }
            return
        }

        if (this.hostiles.length === 1) {
            _.forEach(towers, t => t.attack(_.first(this.hostiles)) || true)
            return
        } else if (this.hostiles.length > 1) {
            for (const tower of towers) {
                const hostiles = _.sortBy(_.shuffle(this.hostiles), c => Math.max(TOWER_OPTIMAL_RANGE, Math.min(tower.pos.getRangeTo(c), TOWER_FALLOFF_RANGE)));
                let attack = _.first(hostiles)
                for (const enemy of hostiles) {
                    if (_.random(1)) {
                        attack = enemy
                        break
                    }
                }
                tower.attack(attack)
            }
            return
        }

        towers = towers.filter(t => t.energy > 200)

        towers = oneHeal(towers, _.find(this.room.find(FIND_MY_CREEPS), c => c.p.hurts > 0))
        if (!towers.length) return

        towers = oneRepair(towers, _.find(this.roads, r => r.hurts > TOWER_POWER_REPAIR))
        if (!towers.length) return

        towers = oneAttack(towers, _.find(this.enemies, e => e.hits < 150 || e.p.hurts))
        if (!towers.length) return

        if (!this.room.storage || this.room.storage.store.energy < 800000 || this.room.energyAvailable < this.room.energyCapacityAvailable) return
        towers = towers.filter(t => t.energy > 800)
        if (towers.length === 0) return
        let repair = _.filter(this.room.find(FIND_STRUCTURES), s => s.hurts > towers.length * TOWER_POWER_REPAIR && this.maxHits(s) > 0)
        if (repair.length === 0) return
        const min = _.min(repair, r => r.hits).hits
        repair = _.filter(repair, r => r.hits < min + CONTAINER_HITS)
        for (const tower of towers) {
            tower.repair(tower.pos.findClosestByRange(repair))
        }
    }


    run() {
        super.run()
        this.runTowers()
        joinSpawning(this);
        // const bests = _.map(this.sources, s => this.bestSpot(s.pos)).forEach(b => {
        //     this.room.visual.circle(b)
        // })
        // this.sources.forEach(s => {
        //     this.room.visual.line(s.pos, s.spot, { color: 'red' })
        //     this.room.visual.circle(s.spot)
        // })
        this.room.visual.circle(this.bestSpot(this.room.controller!.pos))
        this.room.visual.circle(this.bestSpot(this.mineral!.pos))
        const f = Game.flags['Home']
        if (!f) {
            this.room.createFlag(25, 25, 'Home', COLOR_BLUE, COLOR_PURPLE);
            return
        }
        const core = this.getSpot('core');
        if(core) {
            this.room.visual.circle(core);
        }
        // const mat = defaultRewalker().getMatrix(this.name)
        // const vis = this.room.visual

        // for (let x = 1; x < 49; x++) {
        //     for (let y = 1; y < 49; y++) {
        //         const w = mat.get(x, y)
        //         if (w === 0) continue
        //         vis.text(w.toString(16), x, y)
        //     }
        // }
    }

    after() {
        super.after();
        const links = this.index.get(STRUCTURE_LINK);
        for(const outlink of links) {
            if(outlink.cooldown> 0) continue;
            if(outlink.energy < outlink.energyFree) continue;

            const inlink = _.find(_.shuffle(links), l => outlink.id !== l.id && outlink.energy - l.energy > 100);
            if(!inlink) continue;

            const de = outlink.energy - inlink.energy;

            outlink.transferEnergy(inlink, de/2);
        }
    }
}
