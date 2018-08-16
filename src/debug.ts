declare var Error: any;

interface Pos {
    line: number;
    file: string;
    func: string;
};

export function where(skip = 1): Pos {
    const prevLimit = Error['stackTraceLimit'];
    Error.stackTraceLimit = skip + 1;
    const orig = Error.prepareStackTrace;
    Error.prepareStackTrace = (e: any, stackArray: any) => {
        const f = stackArray[skip];
        return {
            file: f.getFileName(),
            line: f.getLineNumber(),
            func: f.getFunctionName()
        };
    };
    const obj: any = {};
    Error.captureStackTrace(obj);
    const loc = obj.stack;
    Error.prepareStackTrace = orig;
    Error.stackTraceLimit = prevLimit;
    return loc;
}

export function location(skip = 1) {
    const pos = where(skip + 1);
    return `${pos.file}:${pos.line}#${pos.func}`;
}

export class Debuggable {
    _debug?: number;

    get debug() {
        if (this._debug == null) return false;

        if (this._debug < Game.time) {
            return true;
        }
        delete this._debug;
        return false;
    }

    set debug(value: boolean | number) {
        if (!value) {
            delete this._debug;
        }
        if (value === true) {
            value = 500
        }
        if (_.isFinite(value)) {
            this._debug = value as number;
        }
    }

    dlog(...str: any[]) {
        if (this.debug) this.log(...str);
    }

    log(...str: any[]) {
        console.log(location(2), this.toString(), ...str);
    }
}

export function log(...str: any[]) {
    console.log(location(2), ...str);
}

let warnTime = Game.time;
let warned = new Set<string>();
export function warn(...str: any[]) {
    if (warnTime !== Game.time) {
        warned.clear();
        warnTime = Game.time;
    }

    const loc = location(2);
    if (warned.has(loc)) return;

    console.log(loc, ...str);
}

export function errStr(err: ScreepsReturnCode) {
    switch (err) {
        case OK: return 'ok'
        case ERR_TIRED: return 'tired'
        case -6: return 'notenuf' // ERR_NOT_ENOUGH_*
        default: return 'ERR' + -err
    }
}

export function dirStr(dir: DirectionConstant) {
    switch (dir) {
        case LEFT: return 'W'
        case TOP_LEFT: return 'NW'
        case TOP: return 'N'
        case TOP_RIGHT: return 'NE'
        case RIGHT: return 'E'
        case BOTTOM_RIGHT: return 'SE'
        case BOTTOM: return 'S'
        case BOTTOM_LEFT: return 'SW'
    }
    return 'none'
}
