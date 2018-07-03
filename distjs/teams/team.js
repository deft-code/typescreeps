"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("../debug");
const allrooms_1 = require("../rooms/allrooms");
class Team extends debug.Debuggable {
    constructor(name) {
        super();
        this.name = name;
    }
    get pos() { return this.flag.pos; }
    toString() { return this.name; }
    get ai() { return allrooms_1.findAI(this.flag.pos.roomName); }
    get flag() { return Game.flags[this.name]; }
    colorCheck(color, secondary) {
        return this.flag.color === color && this.flag.secondaryColor === secondary;
    }
    isValid() { return true; }
    run() { }
    darkRun() { }
}
exports.Team = Team;
