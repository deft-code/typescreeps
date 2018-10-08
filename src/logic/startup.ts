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
            this.ensureRole('hauler', 1.5) ||
            this.ensureWorker() ||
            this.ensureBanker();
    }
    ensureWorker() {
        const sites = this.room.find(FIND_MY_CONSTRUCTION_SITES)
        if (!sites.length) return this.rateRole('worker',  0.2);
        const total = _.sum(sites, s => s.progressTotal - s.progress)
        // this.log("progress", sites.length, total, total/sites.length, Math.floor(total/BUILD_POWER))
        return this.ensureRole('worker', 1)
    }
    ensureBanker() {
        const pos = this.ai.getSpot('core');
        if(!pos) return false;
        return this.ensureRole('banker', 1);
    }
}
