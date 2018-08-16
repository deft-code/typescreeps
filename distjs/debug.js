"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
;
function where(skip = 1) {
    const prevLimit = Error['stackTraceLimit'];
    Error.stackTraceLimit = skip + 1;
    const orig = Error.prepareStackTrace;
    Error.prepareStackTrace = (e, stackArray) => {
        const f = stackArray[skip];
        return {
            file: f.getFileName(),
            line: f.getLineNumber(),
            func: f.getFunctionName()
        };
    };
    const obj = {};
    Error.captureStackTrace(obj);
    const loc = obj.stack;
    Error.prepareStackTrace = orig;
    Error.stackTraceLimit = prevLimit;
    return loc;
}
exports.where = where;
function location(skip = 1) {
    const pos = where(skip + 1);
    return `${pos.file}:${pos.line}#${pos.func}`;
}
exports.location = location;
class Debuggable {
    get debug() {
        if (this._debug == null)
            return false;
        if (this._debug < Game.time) {
            return true;
        }
        delete this._debug;
        return false;
    }
    set debug(value) {
        if (!value) {
            delete this._debug;
        }
        if (value === true) {
            value = 500;
        }
        if (_.isFinite(value)) {
            this._debug = value;
        }
    }
    dlog(...str) {
        if (this.debug)
            this.log(...str);
    }
    log(...str) {
        console.log(location(2), this.toString(), ...str);
    }
}
exports.Debuggable = Debuggable;
function log(...str) {
    console.log(location(2), ...str);
}
exports.log = log;
let warnTime = Game.time;
let warned = new Set();
function warn(...str) {
    if (warnTime !== Game.time) {
        warned.clear();
        warnTime = Game.time;
    }
    const loc = location(2);
    if (warned.has(loc))
        return;
    console.log(loc, ...str);
}
exports.warn = warn;
function errStr(err) {
    switch (err) {
        case OK: return 'ok';
        case ERR_TIRED: return 'tired';
        case -6: return 'notenuf'; // ERR_NOT_ENOUGH_*
        default: return 'ERR' + -err;
    }
}
exports.errStr = errStr;
function dirStr(dir) {
    switch (dir) {
        case LEFT: return 'W';
        case TOP_LEFT: return 'NW';
        case TOP: return 'N';
        case TOP_RIGHT: return 'NE';
        case RIGHT: return 'E';
        case BOTTOM_RIGHT: return 'SE';
        case BOTTOM: return 'S';
        case BOTTOM_LEFT: return 'SW';
    }
    return 'none';
}
exports.dirStr = dirStr;
