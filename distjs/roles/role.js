"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const creep_1 = require("creep");
const debug = require("debug");
const Rewalker_1 = require("Rewalker");
const rewalker = Rewalker_1.defaultRewalker();
const gRoles = new Map();
class Role extends creep_1.PCreep {
    constructor() {
        super(...arguments);
        this._intents = { when: Game.time };
    }
    toString() { return `[${this.o.name}]`; }
    static register(ctor) {
        gRoles.set(ctor.name.toLowerCase(), ctor);
        console.log('registering', ctor.name);
    }
    static lookupRole(role) {
        try {
            require(`roles.${role}`);
        }
        catch (err) {
            debug.log('BAD ROLE', role, err, err.stack);
        }
        return gRoles.get(role) || Role;
    }
    static calcRole(name) { return _.first(_.words(name)).toLowerCase(); }
    static calcMission(name) { return _.last(_.words(name)); }
    static spawner(name) {
        return {
            name,
            spawn() { return ERR_NOT_FOUND; },
            cancel() { },
            priority: 10,
        };
    }
    get role() {
        return Role.calcRole(this.name);
    }
    intendmr(what) {
        return this._intents.melee = this._intents.range = what;
    }
    pre() {
        return false;
    }
    run() {
        this.mission.reportIn(this);
        if (this._intents.when !== Game.time) {
            this._intents = {
                when: Game.time
            };
        }
        if (this.pre())
            return;
        if (this._loop) {
            try {
                const ret = this._loop.next();
                if (ret.done || !ret.value) {
                    this._loop.return();
                    delete this._loop;
                }
            }
            catch (e) {
                delete this._loop;
                throw e;
            }
        }
        else {
            this._loop = this.loop();
        }
    }
    *loop() { }
    after() {
    }
    get memory() { return this.o.memory; }
    get mission() {
        const mname = Role.calcMission(this.name);
        return Game.flags[mname].logic;
    }
    *taskMissionVisible() {
        while (!this.ai.room && this.moveRoom(this.mission)) {
            yield 'moved';
        }
    }
    *taskMoveRoom(ro) {
        while (true) {
            const walked = this.moveRoom(ro);
            if (!walked)
                return false;
            yield walked;
        }
    }
    moveRoom(ro) {
        if (!ro)
            return false;
        const x = this.pos.x;
        const y = this.pos.y;
        if (ro.pos.roomName === this.room.name) {
            if (x === 0) {
                this.move(RIGHT);
            }
            else if (x === 49) {
                this.move(LEFT);
            }
            else if (y === 0) {
                this.move(BOTTOM);
            }
            else if (y === 49) {
                this.move(TOP);
            }
            this.dlog('moveRoom done');
            return false;
        }
        const ox = ro.pos.x;
        const oy = ro.pos.y;
        const range = Math.max(1, Math.min(ox, oy, 49 - ox, 49 - oy) - 1);
        return this.moveTarget(ro, range);
    }
    pickMove(goals) { return rewalker.planWalk(this.o, goals); }
    moveTarget(ro, range) {
        const err = rewalker.walkTo(this.o, ro.pos, range);
        if (err === OK)
            return false;
        if (err <= OK)
            return debug.errStr(err);
        return debug.dirStr(err);
    }
    *taskMoveTarget(ro, range) {
        while (true) {
            const walked = this.moveTarget(ro, range);
            if (!walked)
                return false;
            yield walked;
        }
    }
    moveNear(ro) { return this.moveTarget(ro, 1); }
    moveRange(ro) { return this.moveTarget(ro, 3); }
    *taskMoveRange(ro) { yield* this.taskMoveTarget(ro, 3); }
    move(dir) {
        return this.o.move(dir);
    }
    planRange(objs) { return this.planMove(objs, 3); }
    planNear(objs) { return this.planMove(objs, 1); }
    planMove(objs, range) {
        if (objs.length < 2)
            return _.first(objs);
        const goals = _.map(objs, c => ({ pos: c.pos, range }));
        const i = this.pickMove(goals);
        return objs[i];
    }
}
exports.Role = Role;
