import { Logic } from "./logic";
import { Role } from 'roles/role';
import { run } from "spawners";

export class SpotEditorLogic extends Logic {
    isValid() {
        return this.colorCheck(COLOR_ORANGE, COLOR_ORANGE);
    }

    run() {
        const roomName = Role.calcMission(this.name);
        if (roomName !== this.pos.roomName) {
            this.log("Need to roomify");
        }
    }
}

export class RoomSpotLogic extends Logic {
    isValid() {
        return this.colorCheck(COLOR_ORANGE, COLOR_PURPLE);
    }

    synced = false

    run() {
        super.run();
        const spot = this.ai.getSpot(this.name);
        this.log('spot logic', spot);
        if(!spot) {
            this.ai.setSpot(this.name, this.pos);
            return
        }

        if(!this.synced && spot) {
            this.synced = true;
            if(!this.pos.isEqualTo(spot)) {
                this.visual.line(this.pos, spot, {color: 'purple'});
                this.flag.setPosition(spot);
            }
            return;
        }

        if(!this.pos.isEqualTo(spot)) {
                this.visual.line(this.pos, spot, {color: 'purple'});
                this.ai.setSpot(this.name, this.pos);
        }
    }

}
