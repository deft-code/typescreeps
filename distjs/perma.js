"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("./debug");
class Perma extends debug.Debuggable {
    constructor(o) {
        super();
        this.id = o.id;
        this.cache.o = o;
        this._pos = o.pos;
    }
    static findByObj(obj) {
        if (!this.gAll.has(obj.id)) {
            this.gAll.set(obj.id, new this(obj));
        }
        return this.gAll.get(obj.id);
    }
    static makeProp(orig) {
        const klass = this;
        Object.defineProperty(orig.prototype, 'p', {
            get() { return klass.findByObj(this); }
        });
    }
    get cache() {
        if (this._cacheTime === Game.time) {
            return this._cache;
        }
        return this._cache = {};
    }
    get o() {
        let o = this.cache.o;
        if (o)
            return o;
        return this.cache.o = Game.getObjectById(this.id);
    }
    get pos() {
        if (this.o)
            return this._pos = this.o.pos;
        return this._pos;
    }
    get room() { return this.o.room; }
    get ai() {
        const room = this.o.room;
        if (room)
            return room.ai;
        return findAI(this.pos.roomName);
    }
}
Perma.gAll = new Map();
exports.Perma = Perma;
