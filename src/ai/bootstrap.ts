import { RoomAI } from './ai';

export class BootstrapAI extends RoomAI {
    get kind() { return 'bootstrap' }
    run() {
        super.run()
        const fname = 'Bootstrap_' + this.name
        const f = Game.flags[fname]
        if (!f) {
            this.room.createFlag(25, 25, fname, COLOR_BLUE, COLOR_RED);
            return
        }
    }
}
