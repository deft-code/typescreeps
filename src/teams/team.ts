import * as debug from '../debug';
import { findAI } from '../rooms/allrooms';

export class Team extends debug.Debuggable {
    get pos() { return this.flag.pos }
    toString() { return this.name }
    constructor(public readonly name: string) { super() }
    get ai() { return findAI(this.flag.pos.roomName) }
    get flag() { return Game.flags[this.name] }
    colorCheck(color: ColorConstant, secondary: ColorConstant) {
        return this.flag.color === color && this.flag.secondaryColor === secondary;
    }
    isValid() { return true }
    run() { }
    darkRun() { }
}
