import { MissionLogic } from "./mission";

export class StartupMission extends MissionLogic {
    isValid() {
        return this.colorCheck(COLOR_BLUE, COLOR_PURPLE);
    }
    run() {
        super.run()
        return this.ensureRole('startup', 1) ||
            this.ensureRole('walker', 0) ||
            this.ensureRole('aphid', 1) ||
            this.ensureRole('aphod', 1) ||
            this.ensureWorker()
    }
    ensureWorker() {
        const sites = this.room.find(FIND_MY_CONSTRUCTION_SITES)
        if(!sites.length) return false
        const total = _.sum(sites, s => s.progressTotal - s.progress)
        // this.log("progress", sites.length, total, total/sites.length, Math.floor(total/BUILD_POWER))
        return this.ensureRole('worker', 1)
    }
}
