import { BootstrapMission } from './bootstrap';
import { CoreMission } from './core';
import { DoneMission } from './done';
import { Logic } from './logic';
import { MissionLogic } from './mission';
import { RemoteMission } from './remote';
import { Role } from 'roles/role';
import { RoomSpotLogic, SpotEditorLogic } from './spots';
import { StartupMission } from './startup';
import { FarmLogic } from './farm';
import * as debug from 'debug'

Object.defineProperty(Flag.prototype, 'logic', {
    get(this: Flag): Logic {
        return getLogic(this);
    }
});

declare global {
    interface Flag {
        logic: Logic;
    }
}

const gLogic = new Map<string, Logic>();

function getLogic(f: Flag): Logic {
    let logic = gLogic.get(f.name);
    if (logic && logic.isValid()) return logic;
    logic = makeLogic(f, logic);
    debug.log("new logic for", f, Object.getPrototypeOf(logic).constructor.name);
    gLogic.set(f.name, logic);
    return logic;
}

function makeLogic(f: Flag, old: Logic | undefined): Logic {
    const color = f.secondaryColor;
    const role = Role.calcRole(f.name)
    switch (f.color) {
        case COLOR_BLUE:
            switch (color) {
                case COLOR_BLUE: return new CoreMission(f.name, old);
                case COLOR_YELLOW: return new RemoteMission(f.name, old);
                case COLOR_BROWN: return new DoneMission(f.name, old);
                case COLOR_PURPLE: return new StartupMission(f.name, old)
                case COLOR_RED:
                    switch (role) {
                        case 'bootstrap': return new BootstrapMission(f.name, old);
                    }
            }
            return new MissionLogic(f.name, old);
        case COLOR_ORANGE:
            switch (color) {
                case COLOR_PURPLE: return new RoomSpotLogic(f.name, old);
                case COLOR_ORANGE:
                    switch (role) {
                        case 'spots': return new SpotEditorLogic(f.name, old);
                    }
            }
        case COLOR_WHITE:
            switch (color) {
                case COLOR_YELLOW: return new FarmLogic(f.name, old);
            }
    }
    return new Logic(f.name, old);
}
