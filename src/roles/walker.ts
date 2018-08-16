import { Role } from "./role";
import { defaultRewalker } from "Rewalker"
import { StaticLocalSpawner, Spawner } from "spawners";
import { RoomAI } from "ai/ai";

@Role.register
class Walker extends Role {
    *loop(): IterableIterator<string | boolean> {
        const rewalker = defaultRewalker()
        while (true) {
            const range = _.random(1, 5)
            const targets: Array<RoomPosition> = []
            targets.push(...this.room.find(FIND_SOURCES).map(s => s.pos))
            targets.push(this.room.controller!.pos)
            targets.push(...this.room.find(FIND_STRUCTURES).map(s => s.pos))
            targets.push(...this.room.find(FIND_FLAGS).map(s => s.pos))
            targets.push(...this.room.find(FIND_MINERALS).map(s => s.pos))
            const target = _.sample(targets)
            this.room.visual.line(this.pos, target)

            for (let i = 0; i < 5; i++) {
                const ret = rewalker.walkTo(this.o, target, range)
                yield '' + i + ret
                if (ret === 0) break
            }
        }
    }

    static spawner(name: string) {
        return new StaticLocalSpawner(name, MOVE)
    }

    after() {
    }
}
