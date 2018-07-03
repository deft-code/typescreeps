"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const creep_1 = require("./creep");
const role_1 = require("./roles/role");
const gCreeps = new Map();
function clean() {
}
exports.clean = clean;
function newRole(c) {
    const rname = role_1.Role.calcRole(c.name);
    const TheRole = role_1.Role.lookupRole(rname);
    return new TheRole(c);
}
Object.defineProperty(Creep.prototype, 'p', {
    get() {
        if (!gCreeps.has(this.id)) {
            if (this.my) {
                gCreeps.set(this.id, newRole(this));
            }
            else {
                gCreeps.set(this.id, new creep_1.PCreep(this));
            }
        }
        return gCreeps.get(this.id);
    }
});
