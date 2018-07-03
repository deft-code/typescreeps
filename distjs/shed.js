"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("./debug");
const kMaxCPU = 350;
function canRun(cpu, bucket) {
    if (cpu > kMaxCPU) {
        debug.warn('CPU Throttled');
        return false;
    }
    if (Game.cpu.bucket < bucket - 750)
        return false;
    if (cpu > Game.cpu.limit && Game.cpu.bucket < bucket)
        return false;
    return true;
}
exports.canRun = canRun;
function run(objs, bucket, func) {
    if (!canRun(Game.cpu.getUsed(), bucket))
        return;
    let order = _.shuffle(objs);
    for (const obj of order) {
        if (!canRun(Game.cpu.getUsed(), bucket)) {
            debug.warn('CPU Throttled!', obj, func);
            return;
        }
        try {
            func(obj);
        }
        catch (err) {
            debug.log(obj, func, err, err.stack);
            Game.notify(err.stack, 30);
        }
    }
}
exports.run = run;
