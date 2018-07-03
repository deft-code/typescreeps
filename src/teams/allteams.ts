import { Team } from './team';
import { DoneTeam } from './done';
import { CoreTeam } from './core';
import { RemoteTeam } from './remote';
import { MissionTeam } from './mission';
import { Role } from '../roles/role';
import { BootstrapTeam } from './bootstrap';
import * as debug from '../debug'
import { StartupTeam } from './startup';

Object.defineProperty(Flag.prototype, 'team', {
    get(this: Flag): Team {
        return getTeam(this);
    }
});

declare global {
    interface Flag {
        team: Team;
    }
}

const gTeams = new Map<string, Team>();

function getTeam(f: Flag): Team {
    let team = gTeams.get(f.name);
    if (team && team!.isValid()) return team;
    team = makeTeam(f);
    gTeams.set(f.name, team);
    return team;
}

function makeTeam(f: Flag): Team {
    const color = f.secondaryColor;
    const role = Role.calcRole(f.name)
    switch (f.color) {
        case COLOR_BLUE:
            switch (color) {
                case COLOR_BLUE: return new CoreTeam(f.name);
                case COLOR_YELLOW: return new RemoteTeam(f.name);
                case COLOR_BROWN: return new DoneTeam(f.name);
                case COLOR_PURPLE: return new StartupTeam(f.name)
                case COLOR_RED:
                    switch(role) {
                        case 'bootstrap': return new BootstrapTeam(f.name);
                    }
            }
            return new MissionTeam(f.name);
    }
    return new Team(f.name);
}
