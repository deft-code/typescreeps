import * as debug from 'debug';
import { findAI } from 'ai/allai';

export class Logic extends debug.Debuggable {
    constructor(public readonly name: string, old: Logic | undefined) { super() }

    get pos() { return this.flag.pos }
    toString() { return this.name }
    get ai() { return findAI(this.flag.pos.roomName) }
    get room() { return this.ai.room }
    get flag() { return Game.flags[this.name] }
    colorCheck(color: ColorConstant, secondary: ColorConstant) {
        return this.flag.color === color && this.flag.secondaryColor === secondary;
    }
    isValid() { return true }
    run() { }
    darkRun() { }
}
