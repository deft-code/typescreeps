"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const creep_1 = require("../creep");
const debug = require("../debug");
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
    intendmr(what) {
        return this._intents.melee = this._intents.range = what;
    }
    pre() {
        return false;
    }
    run() {
        if (this._intents.when !== Game.time) {
            this._intents = {
                when: Game.time
            };
        }
        if (this.pre())
            return;
        if (this._loop) {
            const ret = this._loop.next();
            if (ret.done || !ret.value) {
                this._loop.return();
                delete this._loop;
            }
            this.o.say("" + ret.value);
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
        const mname = this.memory.mission;
        return Game.flags[mname].team;
    }
    pickMove(...a) { return 0; }
    *moveSeeMission() {
        while (!this.ai.room && this.moveRoom(this.mission)) {
            yield 'moved';
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
    moveTarget(ro, range) {
        return debug.errStr(this.o.moveTo(ro, { range: range }));
    }
    moveNear(ro) { return this.moveTarget(ro, 1); }
    moveRange(ro) { return this.moveTarget(ro, 3); }
    move(dir) {
        return this.o.move(dir);
    }
    harvest(sm) {
        const err = this.o.harvest(sm.o);
        if (err === OK)
            this.intendmr('harvest');
        return err;
    }
    upgrade(ctrl) {
        const err = this.o.upgradeController(ctrl.o);
        if (err === OK)
            this.intendmr('upgrade');
        return err;
    }
}
exports.Role = Role;
