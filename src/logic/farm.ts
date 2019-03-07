import { Logic } from "./logic";
import { MissionLogic } from "./mission";

export class FarmLogic extends MissionLogic {
    isValid() {
        return this.colorCheck(COLOR_WHITE, COLOR_YELLOW);
    }

    run() {
        super.run();
        if(this.parent) {
            this.log("I am a child", this.parent);
            return
        }

        const srcs = [] as Source[];
        for(let child of this.children) {
            const f = Game.flags[child];
            if(!f || !f.room) continue
            srcs.push(...f.room.find(FIND_SOURCES))
        }

        this.log("I am a parent", this.children, srcs.length, srcs);

    }

    darkRun() {
        super.darkRun();
        return this.ensureRole('scout', 1);
    }
}
