import { Logic } from "./logic";
import { Role, Egg } from 'roles/role';

export class MissionLogic extends Logic {
    actorTick = Game.time
    actors = new Map<string, Role>()
    eggs = new Map<string, Egg>()

    refreshActors() {
        if (this.actorTick !== Game.time) {
            this.actorTick = Game.time
            this.actors = new Map()
        }
    }

    darkRun() {
        this.refreshActors();
    }

    reportIn(role: Role) {
        this.refreshActors();
        this.actors.set(role.name, role)
        this.eggs.delete(role.name)
    }

    forRole<T>(role: string, map: Map<string, T>): T[] {
        const xs: T[] = []
        map.forEach((x, name) => {
            if (Role.calcRole(name) === role) xs.push(x)
        })
        return xs
    }

    roleName(role: string): string {
        let name = role + '_' + this.name
        let i = 1
        while (this.actors.has(name) || this.eggs.has(name)) {
            name = role + i + '_' + this.name
            i++
        }
        return name
    }

    ensureRole(role: string, n: number) {
        if (n < 1) return false
        const eggs = this.forRole(role, this.eggs)
        let sum = eggs.length * CREEP_LIFE_TIME;

        const actors = this.forRole(role, this.actors)
        //this.log('actors', role, actors)

        for (const actor of actors) {
            sum += (actor.o && actor.o.ticksToLive || CREEP_LIFE_TIME) - actor.spawnTime
        }
        //this.log(role, 'sum', sum)
        if (sum <= (n - 1) * CREEP_LIFE_TIME) {
            this.layEgg(role)
            return true
        }
        return false
    }

    actorWhen = new Map<string, number>()
    rateRole(role: string, n: number): boolean {
        const eggs = this.forRole(role, this.eggs)
        if (eggs.length > 0) return false

        const actors = this.forRole(role, this.actors)
        if(actors.length >= n) return false

        const when = this.actorWhen.get(role) || 0
        const since = Game.time - when
        if (since < CREEP_LIFE_TIME / n) return false
        return this.layEgg(role)
    }

    layEgg(role: string) {
        this.actorWhen.set(role, Game.time)
        const name = this.roleName(role)
        this.log('laying', role, name)
        this.eggs.set(name, Role.lookupRole(role).spawner(name))
        return true
    }
}
