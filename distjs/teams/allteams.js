"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const team_1 = require("./team");
const done_1 = require("./done");
const core_1 = require("./core");
const remote_1 = require("./remote");
const mission_1 = require("./mission");
const role_1 = require("../roles/role");
const bootstrap_1 = require("./bootstrap");
const startup_1 = require("./startup");
Object.defineProperty(Flag.prototype, 'team', {
    get() {
        return getTeam(this);
    }
});
const gTeams = new Map();
function getTeam(f) {
    let team = gTeams.get(f.name);
    if (team && team.isValid())
        return team;
    team = makeTeam(f);
    gTeams.set(f.name, team);
    return team;
}
function makeTeam(f) {
    const color = f.secondaryColor;
    const role = role_1.Role.calcRole(f.name);
    switch (f.color) {
        case COLOR_BLUE:
            switch (color) {
                case COLOR_BLUE: return new core_1.CoreTeam(f.name);
                case COLOR_YELLOW: return new remote_1.RemoteTeam(f.name);
                case COLOR_BROWN: return new done_1.DoneTeam(f.name);
                case COLOR_PURPLE: return new startup_1.StartupTeam(f.name);
                case COLOR_RED:
                    switch (role) {
                        case 'bootstrap': return new bootstrap_1.BootstrapTeam(f.name);
                    }
            }
            return new mission_1.MissionTeam(f.name);
    }
    return new team_1.Team(f.name);
}
