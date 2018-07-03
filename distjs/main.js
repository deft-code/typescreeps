"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./rooms/room");
const shed = require("./shed");
const debug = require("./debug");
require("./teams/allteams");
require("./creep");
require("./allcreeps");
require("./roomobjs");
const allrooms_1 = require("./rooms/allrooms");
global.findAI = allrooms_1.findAI;
const when = Game.time % 10;
function* foo(n) {
    if (n <= 0)
        return false;
    for (let i = 0; i < n; i++) {
        yield 'foo' + i;
    }
    return true;
}
function loop() {
    debug.log('version 1', when);
    const ais = _.map(Game.rooms, r => r.ai);
    shed.run(ais, 500, ai => ai.init());
    const teams = _.map(Game.flags, f => f.team);
    const combats = _.filter(ais, ai => ai.hostiles.length > 0);
    shed.run(combats, 500, ai => ai.run());
    shed.run(combats, 1500, ai => ai.after());
    const claimed = _.filter(ais, ai => ai.room.controller && ai.room.controller.my && ai.hostiles.length === 0);
    shed.run(claimed, 2000, ai => ai.run());
    shed.run(claimed, 2000, ai => ai.after());
    const remotes = _.filter(ais, ai => ai.room.controller && !ai.room.controller.my && ai.hostiles.length === 0);
    shed.run(remotes, 3000, ai => ai.run());
    shed.run(remotes, 3000, ai => ai.after());
    shed.run(combats, 6000, ai => ai.optional());
    shed.run(claimed, 7000, ai => ai.optional());
    shed.run(remotes, 8000, ai => ai.optional());
    shed.run(teams, 9000, team => team.darkRun());
}
exports.loop = loop;
