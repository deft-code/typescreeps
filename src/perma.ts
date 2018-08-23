import * as debug from "debug";
import { toXY } from "Rewalker";

interface Wrapped extends RoomObject {
    id: string;
}

interface PermaCache<T> {
    o?: T;
    _weight?: number
}

export class Perma<Orig extends Wrapped> extends debug.Debuggable {
    static gAll = new Map<string, any>();
    static findByObj(obj: Wrapped) {
        if (!this.gAll.has(obj.id)) {
            this.gAll.set(obj.id, new this(obj))
        }
        return this.gAll.get(obj.id)!
    }
    static makeProp(orig: any) {
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

    get xy() {
        return toXY(this.pos)
    }

    get room() { return this.o.room }

    get ai() {
        const room = this.o.room
        if (room) return room.ai
        return findAI(this.pos.roomName)
    }
}

class PRoomObj<T extends Wrapped> {
    id: string
    pos: RoomPosition
    constructor(obj: Wrapped) {
        this.id = obj.id
        this.pos = obj.pos
    }

    get room() { return (this.o && this.o.room) || null }
    get ai() {
        const room = this.room
        if (room) return room.ai
        return findAI(this.pos.roomName)
    }

    get o() { return Game.getObjectById<T>(this.id) }
    get name() { return "" }

    _spots: RoomPosition[] = []
    get spots() {
        if (!this._spots.length) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const x = this.pos.x + dx
                    if (x <= 0 || x >= 49) continue
                    const y = this.pos.y + dy
                    if (y <= 0 || y >= 49) continue
                    if (Game.map.getTerrainAt(x, y, this.pos.roomName) === 'wall') continue
                    this._spots.push(new RoomPosition(x, y, this.pos.roomName))
                }
            }
        }
        return this._spots
    }

    get spot() {
        return this.ai.getSpot(this.name) || this.ai.bestSpot(this.pos)
    }
}

export class PSource extends PRoomObj<Source> {
    get name() { return "src" + this.pos.xy }
    get energy() { return this.o!.energy }
    get ticksToRegeneration() { return this.o!.ticksToRegeneration }
}

export class PMineral extends PRoomObj<Mineral> {

}

export class PController extends PRoomObj<StructureController> {
    get ticksToDowngrade() {
        if(!this.o) return 0
        return this.o.ticksToDowngrade
    }
}
