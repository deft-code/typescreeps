"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("../debug");
const shed = require("../shed");
require("../structures");
function allied(c) {
    const allies = ['HailHydra'];
    return _.contains(allies, c.owner.username);
}
class RoomAI extends debug.Debuggable {
    constructor(name) {
        super();
        this.name = name;
        this.enemies = [];
        this.hostiles = [];
    }
    get room() {
        return Game.rooms[this.name];
    }
    get kind() {
        return 'room';
    }
    get controller() {
        if (this.room && this.room.controller)
            return this.room.controller.p;
        return null;
    }
    get spawns() {
        const structs = this.room.find(FIND_STRUCTURES);
        const spawns = _.filter(structs, s => s.structureType === STRUCTURE_SPAWN);
        return _.map(spawns, s => s.p);
    }
    get sources() {
        if (!this._sources) {
            if (!this.room)
                return [];
            this._sources = _.map(this.room.find(FIND_SOURCES), s => s.p);
        }
        return this._sources;
    }
    init() {
        const creeps = this.room.find(FIND_HOSTILE_CREEPS);
        this.enemies = _.filter(creeps, c => !c.p.ally);
        this.hostiles = _.filter(this.enemies, c => c.p.hostile);
    }
    energyStructures() {
        return [];
    }
    run() {
        const roles = _.map(this.room.find(FIND_MY_CREEPS), c => c.p);
        shed.run(roles, 500, r => r.run());
    }
    after() {
        const roles = _.map(this.room.find(FIND_MY_CREEPS), c => c.p);
        shed.run(roles, 500, r => r.after());
        const teams = _.map(this.room.find(FIND_FLAGS), c => c.team);
        shed.run(teams, 500, t => t.run());
    }
    optional() {
    }
}
exports.RoomAI = RoomAI;
