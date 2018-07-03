import { RoomAI } from './room';

export class StartupAI extends RoomAI {
    get kind() { return 'startup' }
    run() {
        super.run()
        const f = Game.flags['Home']
        if (!f) {
            this.room.createFlag(25, 25, 'Home', COLOR_BLUE, COLOR_PURPLE);
            return
        }
    }
}
