import { Role } from "./role";
import { StaticCloseSpawner } from "spawners";
import { RoomAI } from "ai/ai";
import { Move } from "./move";


class ScoutSpawner extends StaticCloseSpawner {
    energyFilter(ais: RoomAI[]) {
        return ais.filter(ai => ai.room!.energyAvailable > 300
            || ai.room!.energyAvailable >= ai.room!.energyCapacityAvailable);
    }
}

@Role.register
class Scout extends Move {
    *loop() {
        yield this.moveRange(this.mission.flag);
    }
    static spawner(name: string) {
        return new ScoutSpawner(name, [MOVE]);
    }
}
