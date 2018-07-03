import { PCreep } from './creep'
import { Role } from './roles/role';

const gCreeps = new Map<string, PCreep>()

export function clean() {

}

function newRole(c: Creep): Role {
    const rname = Role.calcRole(c.name)
    const TheRole = Role.lookupRole(rname)
    return new TheRole(c)
}

Object.defineProperty(Creep.prototype, 'p', {
    get(this: Creep): PCreep {
        if (!gCreeps.has(this.id)) {
            if(this.my) {
                gCreeps.set(this.id, newRole(this))
            } else {
                gCreeps.set(this.id, new PCreep(this))
            }
        }
        return gCreeps.get(this.id)!
    }
});

declare global {
    interface Creep {
        p: PCreep;
    }
}
