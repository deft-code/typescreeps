"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const role_1 = require("roles/role");
const spawners_1 = require("spawners");
const work_1 = require("./work");
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
let Startup = class Startup extends work_1.Work {
    static spawner(name) {
        return new spawners_1.StaticLocalSpawner(name, MOVE, CARRY, WORK);
    }
    *loop() {
        while (true) {
            if (!this.carry.energy) {
                yield* this.rechargeHarvest();
            }
            else {
                (yield* this.upgradeAll(1500)) ||
                    (yield* this.fillEnergyOrdered()) ||
                    (yield* this.buildOrdered()) ||
                    (yield* this.upgradeAll());
            }
        }
    }
    after() {
        this.idleNom();
    }
};
Startup = __decorate([
    role_1.Role.register
], Startup);
