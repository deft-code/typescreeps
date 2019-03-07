import { RoomAI } from './ai';
import * as debug from 'debug';
import { StartupAI } from './startup'

const gRooms = new Map<string, RoomAI>();

function calcAI(room: Room): string {
    const ctrler = _.first(room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_CONTROLLER}}))
    if (ctrler) return 'startup'
    return 'room';
}

export function findAI(name: string): RoomAI {
    return gRooms.get(name) || new RoomAI(name)
}

function getAI(room: Room): RoomAI {
    let ai = gRooms.get(room.name);
    const kind = calcAI(room);
    if (ai) {
        if (kind === ai.kind) return ai
        debug.log('wrong ai got', ai.kind, 'want', kind)
    }
    ai = (() => {
        switch (kind) {
            case 'startup': return new StartupAI(room.name);
        }
        return new RoomAI(room.name);
    })();
    gRooms.set(room.name, ai);
    return ai;
}

Object.defineProperty(Room.prototype, 'ai', {
    get(this: Room): RoomAI {
        return getAI(this);
    }
});

declare global {
    interface Room {
        ai: RoomAI;
    }
}
