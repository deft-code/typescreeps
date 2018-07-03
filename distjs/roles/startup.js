"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const role_1 = require("./role");
function sourceFree(ai) {
    return function (mat, roomName) {
        if (roomName !== ai.name || !ai.room)
            return mat;
        for (const src of ai.sources) {
            for (const spot of src.spots) {
                if (spot.lookFor(LOOK_CREEPS).length) {
                    mat.set(spot.x, spot.y, 50);
                }
            }
        }
        return mat;
    };
}
let Startup = class Startup extends role_1.Role {
    *loop() {
        while (true) {
            if (!this.carry.energy) {
                yield* this.harvestSources();
            }
            else {
                yield* this.upgradeAll();
            }
        }
    }
    *upgradeAll() {
        const ctrl = this.mission.ai.controller;
        if (!ctrl)
            return false;
        while (this.carry.energy) {
            switch (this.upgrade(ctrl)) {
                case OK:
                    yield 'upgrade';
                    break;
                case ERR_NOT_IN_RANGE:
                    yield this.moveRange(ctrl);
                    break;
                default: return false;
            }
        }
        return true;
    }
    *rechargeHarvest() {
        return (yield* this.recharge(this.carryTotal / 3)) ||
            (yield* this.harvestSources()) ||
            (yield* this.recharge());
    }
    *recharge(limit = 0) {
        return false;
    }
    goodSource(src) {
        return src.energy > 0 || this.pos.getRangeTo(src.pos) > src.ticksToRegeneration;
    }
    *harvestSources() {
        const sources = _.filter(this.mission.ai.sources, s => this.goodSource(s));
        if (!sources)
            return;
        const targets = _.map(sources, s => ({ pos: s.pos, range: 1 }));
        const i = this.pickMove(targets, { matrixLayer: sourceFree(this.mission.ai) });
        const src = sources[i];
        yield* this.harvestSource(src);
    }
    *harvestSource(src) {
        while (this.carryFree && this.goodSource(src)) {
            switch (this.harvest(src)) {
                case OK:
                    yield 'harvest';
                    break;
                case ERR_NOT_IN_RANGE:
                    yield this.moveNear(src);
                    break;
                default: return;
            }
        }
    }
    after() {
    }
};
Startup = __decorate([
    role_1.Role.register
], Startup);
