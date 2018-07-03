import { Perma } from './perma'
import * as debug from './debug'

const allies = ['HailHydra']

export class PCreep extends Perma<Creep> {

    toString() { return `[creep ${this.o.name}]` }

    readonly partsByType: Record<BodyPartConstant, number>
    readonly fullInfo: Record<string, number>

    constructor(creep: Creep) {
        super(creep);
        this.partsByType = _(creep.body)
            .countBy('type')
            .value() as Record<BodyPartConstant, number>
        this.fullInfo = this.bodyInfo(false);
        this._updateHits()
    }

    get room() { return this.o.room }
    get ai() { return this.o.room.ai }

    get hits() { return this.o.hits; }
    get hitsMax() { return this.o.hitsMax; }
    get hurts() { return this.hitsMax - this.hits; }

    get carry() { return this.o.carry; }
    get carryCapacity() { return this.o.carryCapacity; }
    get carryTotal() { return _.sum(this.o.carry); }
    get carryFree() { return Math.max(0, this.o.carryCapacity - this.carryTotal); }

    get body() { return this.o.body }

    lastHits = 0
    _activeByType: Record<BodyPartConstant, number>
    _info: Record<string, number>
    _updateHits() {
        if (this.hits !== this.lastHits) {
            this.lastHits = this.hits
            this._activeByType = _(this.body)
                .filter('hits')
                .countBy('type')
                .value() as Record<BodyPartConstant, number>
            this._info = this.bodyInfo(false)
        }
    }
    get activeByType() {
        this._updateHits()
        return this._activeByType
    }

    get info() {
        this._updateHits()
        return this._info
    }

    get ally() { return _.contains(allies, this.o.owner.username) }

    get melee() { return !!this.activeByType[ATTACK] }

    get ranged() { return !!this.activeByType[RANGED_ATTACK] }

    get hostile() { return this.melee || this.ranged }

    get assault() {
        return this.hostile || this.activeByType[WORK] > 1 || !!this.activeByType[CLAIM]
    }

    get where() {
        return `<a href="/a/#!/room/${Game.shard.name}/${this.pos.roomName}">${this.pos.roomName}</a>`
    }

    get spawnTime() {
        return CREEP_SPAWN_TIME * this.body.length
    }


    get weight() {
        if (!this.cache._weight) {
            this.cache._weight = this.calcWeight()
        }
        return this.cache._weight
    }

    // Fatigue generated when `creep` moves.
    calcWeight() {
        let weight = 0
        let carry = this.carryTotal
        for (let i = this.body.length - 1; i >= 0; i--) {
            const part = this.body[i]
            switch (part.type) {
                case MOVE:
                    break
                case CARRY:
                    if (carry > 0) {
                        weight++
                        carry -= getPartInfo(part).capacity
                    }
                    break
                default:
                    weight++
                    break
            }
        }
        return weight * 2
    }

    // Info about the power of `creep`s actions.
    // Most keys are standard action names
    // The exceptions:
    // * hits: a pseudo count of the extra hits available to boosted TOUGH parts.
    // * mineral: harvest power when harvesting a mineral.
    // * fatigue: is the fatigue removed by MOVE parts.
    // * capacity: is equivalent to `carryCapacity` unless `creep` is damaged.
    bodyInfo(all: boolean) {
        let info = {} as Record<string, number>
        for (let part of _.values(power)) {
            for (let action in part) {
                info[action] = 0
            }
        }

        for (let i = 0; i < this.body.length; i++) {
            const part = this.body[i]
            if (!all && !part.hits) continue
            const pinfo = getPartInfo(part)
            for (let action in pinfo) {
                info[action] += pinfo[action]
            }
        }
        return info
    }
}

const power: Record<BodyPartConstant, Record<string, number>> = {
    [ATTACK]: {
        attack: ATTACK_POWER
    },
    [CARRY]: {
        capacity: CARRY_CAPACITY
    },
    [CLAIM]: {
        attackController: CONTROLLER_CLAIM_DOWNGRADE,
        upgradeController: UPGRADE_CONTROLLER_POWER
    },
    [HEAL]: {
        heal: HEAL_POWER,
        rangedHeal: RANGED_HEAL_POWER
    },
    [MOVE]: {
        fatigue: 2  // Huh! No constant for this?!
    },
    [RANGED_ATTACK]: {
        rangedAttack: RANGED_ATTACK_POWER,
        rangedMassAttack: RANGED_ATTACK_POWER
    },
    [TOUGH]: {
        hits: 0
    },
    [WORK]: {
        build: BUILD_POWER,
        dismantle: DISMANTLE_POWER,
        harvest: HARVEST_POWER,
        mineral: HARVEST_MINERAL_POWER,
        repair: REPAIR_POWER,
        upgradeController: UPGRADE_CONTROLLER_POWER
    }
}

function getPartInfo(part: BodyPartDefinition): Record<string, number> {
    const partInfo = _.clone(power[part.type])
    if (part.boost) {
        const boosts = BOOSTS[part.type] as Record<ResourceConstant, Record<string, number>>
        const boost = boosts[part.boost]
        for (let action in boost) {
            if (action === 'damage') {
                partInfo.hits += Math.floor(part.hits * (1 - boost[action]))
                continue
            }
            if (action === 'harvest') {
                partInfo.mineral *= boost[action]
            }
            partInfo[action] *= boost[action]
        }
    }
    return partInfo
}

export function clean() {

}
