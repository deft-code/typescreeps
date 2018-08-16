import { Logic } from './logic';
import { DoneMission } from './done';
import { CoreMission } from './core';
import { RemoteTeam } from './remote';
import { MissionLogic } from './mission';
import { Role } from 'roles/role';
import { BootstrapMission } from './bootstrap';
import * as debug from 'debug'
import { StartupMission } from './startup';

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
    debug.log("new logic for", f)
    logic = makeLogic(f, logic);
    gLogic.set(f.name, logic);
    return logic;
}

function makeLogic(f: Flag, old : Logic | undefined): Logic {
    const color = f.secondaryColor;
    const role = Role.calcRole(f.name)
    switch (f.color) {
        case COLOR_BLUE:
            switch (color) {
                case COLOR_BLUE: return new CoreMission(f.name, old);
                case COLOR_YELLOW: return new RemoteTeam(f.name, old);
                case COLOR_BROWN: return new DoneMission(f.name, old);
                case COLOR_PURPLE: return new StartupMission(f.name, old)
                case COLOR_RED:
                    switch(role) {
                        case 'bootstrap': return new BootstrapMission(f.name, old);
                    }
            }
            return new MissionLogic(f.name, old);
    }
    return new Logic(f.name, old);
}
