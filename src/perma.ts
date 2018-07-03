import * as debug from "./debug";

interface Wrapped extends RoomObject {
    id: string;
}

interface PermaCache<T> {
    o?: T;
    _weight?: number
}

export class Perma<Orig extends Wrapped> extends debug.Debuggable {
    static gAll = new Map<string, any>();
    static findByObj(obj:Wrapped) {
        if(!this.gAll.has(obj.id)) {
            this.gAll.set(obj.id, new this(obj))
        }
        return this.gAll.get(obj.id)!
    }
    static makeProp(orig:any) {
        const klass = this
        Object.defineProperty(orig.prototype, 'p', {
            get() { return klass.findByObj(this) }
        })
    }

    _cacheTime: number;
    _cache: PermaCache<Orig>;
    id: string;
    _pos: RoomPosition;

    constructor(o: Orig) {
        super()
        this.id = o.id;
        this.cache.o = o;
        this._pos = o.pos;
    }

    get cache(): PermaCache<Orig> {
        if (this._cacheTime === Game.time) {
            return this._cache;
        }
        return this._cache = {} as PermaCache<Orig>;
    }

    get o(): Orig {
        let o = this.cache.o;
        if (o) return o;
        return this.cache.o = Game.getObjectById<Orig>(this.id) as Orig;
    }

    get pos() {
        if (this.o) return this._pos = this.o.pos;
        return this._pos;
    }

    get room() { return this.o.room }

    get ai() {
        const room = this.o.room
        if (room) return room.ai
        return findAI(this.pos.roomName)
    }
}
