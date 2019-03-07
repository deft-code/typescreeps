import * as debug from 'debug';
import { findAI } from 'ai/allai';

export class Logic extends debug.Debuggable {
    children: string[]
    parent: string | null
    constructor(public readonly name: string, old: Logic | undefined) {
        super();
        const prefix = name + '_';
        this.children = _.filter(Game.flags, f => f.name.startsWith(prefix)).map(f=>f.name);

        this.parent = null;
        const parts = this.name.split('_');
        if(parts.length > 1 && Game.flags[parts[0]]) {
            this.parent = Game.flags[parts[0]].name;
        }
    }

    get pos() { return this.flag.pos }
    toString() { return this.name }
    get ai() { return findAI(this.flag.pos.roomName) }
    get room() { return this.ai.room }
    get visual() { return new RoomVisual(this.pos.roomName) }
    get flag() { return Game.flags[this.name] }
    colorCheck(color: ColorConstant, secondary: ColorConstant) {
        return this.flag.color === color && this.flag.secondaryColor === secondary;
    }
    isValid() { return true }
    parentCheck() {
        if(this.parent && !Game.flags[this.parent]) {
            this.flag.remove();
            return false
        }
        return true
    }
    run() {
        this.parentCheck()
    }
    darkRun() {
        this.parentCheck()
    }
}
