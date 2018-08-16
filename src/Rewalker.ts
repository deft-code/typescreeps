import { tokTypes } from "acorn";



let _whoami = ""
export function whoami(): string {
    if (_whoami.length === 0) {
        const owned = _.find(Game.structures, s => (s as OwnedStructure).my)! as OwnedStructure
        _whoami = owned.owner.username
    }
    return _whoami
}

export function coordsToXY(x: number, y: number): number { return x * 100 + y }

export function coordsFromXY(xy: number): [number, number] {
    const y = xy % 100
    const x = (xy - y) / 100
    return [x, y]
}

export function toXY(r: RoomPosition): number {
    return coordsToXY(r.x, r.y)
}

export function fromXY(xy: number, name: string): RoomPosition {
    const [x, y] = coordsFromXY(xy)
    return new RoomPosition(x, y, name)
}

export function getDirectionTo(from: RoomPosition, to: RoomPosition): DirectionConstant | 0 {
    if (from.roomName === to.roomName) {
        return from.getDirectionTo(to)
    }
    const exits = Game.map.describeExits(from.roomName)
    if (!exits) return 0
    for (const dir of [TOP, RIGHT, BOTTOM, LEFT]) {
        if (exits[dir] === to.roomName) {
            return dir
        }
    }
    return 0
}

export function atExit(pos: RoomPosition): boolean {
    return pos.x <= 0 || pos.x >= 49 || pos.y <= 0 || pos.y >= 49
}

export function positionAtDirection(from: RoomPosition, dir: DirectionConstant) {
    let x = from.x
    let y = from.y
    let room = from.roomName
    switch (dir) {
        case TOP:
        case TOP_LEFT:
        case TOP_RIGHT:
            y -= 1
            break
        case BOTTOM:
        case BOTTOM_RIGHT:
        case BOTTOM_LEFT:
            y += 1
            break
    }
    switch (dir) {
        case TOP_LEFT:
        case LEFT:
        case BOTTOM_LEFT:
            x -= 1
            break
        case TOP_RIGHT:
        case RIGHT:
        case BOTTOM_RIGHT:
            x += 1
    }
    const exits = Game.map.describeExits(room)
    if (!exits) return new RoomPosition(x, y, room)

    if (x < 0) return new RoomPosition(49, y, exits[LEFT] || room)
    if (x > 49) return new RoomPosition(0, y, exits[RIGHT] || room)
    if (y < 0) return new RoomPosition(x, 49, exits[TOP] || room)
    if (y > 49) return new RoomPosition(x, 0, exits[BOTTOM] || room)
    return new RoomPosition(x, y, room)
}

export function matrixSerialize(mat: CostMatrix, max = 2500): Array<number> {
    const ret = [] as number[]
    for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
            const w = mat.get(x, y)
            if (w === 0) continue
            ret.push(coordsToXY(x, y), w)
        }
        if (ret.length >= max) break
    }
    if (ret.length >= max) return mat.serialize()
    return ret
}

export function matrixDeserialize(data: Array<number>): CostMatrix {
    if (data.length >= 2500) return PathFinder.CostMatrix.deserialize(data)

    const mat = new PathFinder.CostMatrix()

    for (let i = 0; i < data.length - 1; i += 2) {
        const [x, y] = coordsFromXY(data[i])
        mat.set(x, y, data[i + 1])
    }
    return mat
}

export function matrixAvoid(mat: CostMatrix, pos: RoomPosition, range: number) {
    for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
            const [x, y] = [pos.x + dx, pos.y + dy]
            if (x < 0 || y < 0) continue
            if (x > 49 || y > 49) continue
            const terrain = Game.map.getTerrainAt(x, y, pos.roomName)
            if (terrain === 'wall') continue
            if (_.find(pos.lookFor(LOOK_STRUCTURES) as StructureRampart[],
                s => s.structureType === STRUCTURE_RAMPART && s.my)) continue
            let w = mat.get(x, y)
            if (w === 0) w = (terrain === 'swamp' ? 10 : 2)
            const d = Math.max(Math.abs(dx), Math.abs(dy))
            w += (range - d + 1) * 10
            mat.set(x, y, w)
        }
    }
}

export function calcWeight(c: Creep): [number, number] {
    let nmoves = 0
    let weight = 0
    let carry = _.sum(c.carry)
    for (let i = c.body.length - 1; i >= 0; i--) {
        const part = c.body[i]
        switch (part.type) {
            case MOVE:
                if (part.hits > 0) {
                    let fatigue = 1
                    if (part.boost) {
                        type MOVE_BOOSTS = RESOURCE_ZYNTHIUM_OXIDE | RESOURCE_ZYNTHIUM_ALKALIDE | RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE
                        fatigue *= BOOSTS[MOVE][part.boost as MOVE_BOOSTS].fatigue
                    }
                    nmoves += fatigue
                }
                break
            case CARRY:
                if (part.hits > 0 && carry > 0) {
                    weight++
                    let capacity = CARRY_CAPACITY
                    if (part.boost) {
                        type CARRY_BOOSTS = RESOURCE_KEANIUM_HYDRIDE | RESOURCE_KEANIUM_ACID | RESOURCE_CATALYZED_KEANIUM_ACID
                        capacity *= BOOSTS[CARRY][part.boost as CARRY_BOOSTS].capacity
                    }
                    carry -= capacity
                }
                break
            default:
                weight++
                break
        }
    }
    return [weight, nmoves]
}

export function hasActivePart(c:Creep, ...partTypes: BodyPartConstant[]): boolean {
    for(let i = c.body.length-1; i>=0; i--) {
        if(c.body[i].hits <= 0) return false
        if(_.includes(partTypes, c.body[i].type)) return true
    }
    return false
}

interface MemPath {
    0: number
    1: string
    2: string
}

export class Path {
    first: RoomPosition
    _steps: string

    constructor(path: RoomPosition[]) {
        if (path.length < 1) throw Error("Bad Path")
        this.first = path[0]
        let prev = this.first
        this._steps = ''
        for (let i = 1; i < path.length; i++) {
            const next = path[i]
            this._steps += getDirectionTo(prev, next)
            prev = next
        }
    }

    static deserialize(mem: MemPath): Path {
        const p = fromXY(mem[0], mem[1])
        const path = new Path([p])
        path._steps = mem[2]
        return path
    }

    serialize(): MemPath {
        return [toXY(this.first), this.first.roomName, this._steps]
    }

    get size(): number { return this._steps.length }
    get done(): boolean { return this.size <= 0 }

    get second(): RoomPosition {
        if (this._steps.length) {
            const dir = this.nthDir(0)
            return positionAtDirection(this.first, dir)
        }
        return this.first
    }

    nthDir(n: number): DirectionConstant {
        return parseInt(this._steps[n], 10) as DirectionConstant
    }

    trim(dest: RoomPosition, range: number) {
        let last = this.first
        if (last.inRangeTo(dest, range)) {
            this._steps = ""
            return last
        }
        for (let i = 0; i < this._steps.length; i++) {
            last = positionAtDirection(last, this.nthDir(i))
            if (last.inRangeTo(dest, range)) {
                this._steps = this._steps.slice(i + 1)
                return last
            }
        }
        return last
    }

    step(): Path {
        const path = new Path([this.second])
        path._steps = this._steps.slice(1, this._steps.length)
        return path
    }

    *it(): IterableIterator<RoomPosition> {
        let last = this.first
        const steps = this._steps
        yield last
        for (let i = 0; i < steps.length; i++) {
            last = positionAtDirection(last, this.nthDir(i))
            yield last
        }
    }

    draw(style: PolyStyle): RoomPosition {
        return Path.draw(this.it(), style)
    }

    static draw(points: Iterable<RoomPosition>, style: PolyStyle): RoomPosition {
        let poly = []
        let vis = new RoomVisual('W0N0')
        for (const pos of points) {
            if (pos.roomName !== vis.roomName) {
                if (poly.length > 1) {
                    vis.poly(poly, style)
                }
                vis = new RoomVisual(pos.roomName)
                poly = []
            }
            poly.push(pos)
        }
        vis.poly(poly, style)
        return _.last(poly)
    }
}

export interface Goal {
    pos: RoomPosition
    range: number
}

export function drawGoal(pos: RoomPosition, color: string, goal: Goal) {
    if (goal.pos.roomName === pos.roomName) {
        const vis = new RoomVisual(pos.roomName)
        vis.line(pos, goal.pos, { lineStyle: "dotted", color })
        if (goal.range > 0) {
            vis.circle(goal.pos, { radius: goal.range, lineStyle: "dotted", stroke: color, fill: "" })
        }
    }
}

export function cleanGoal(goal: Goal): Goal {
    if (goal.range <= 1 || goal.range > 24) return goal
    const l = (goal.range - goal.pos.x) - 1
    if (l > 0) {
        const pl = Math.floor(l / 2)
        const rl = l - pl
        goal.pos.x += pl
        goal.range -= rl
    }
    const r = (goal.range - (49 - goal.pos.x)) - 1
    if (r > 0) {
        const pr = Math.floor(r / 2)
        const rr = r - pr
        goal.pos.x -= pr
        goal.range -= rr
    }
    const t = (goal.range - goal.pos.y) - 1
    if (t > 0) {
        const pt = Math.floor(t / 2)
        const rt = t - pt
        goal.pos.y += pt
        goal.range -= rt
    }
    const b = (goal.range - (49 - goal.pos.y)) - 1
    if (b > 0) {
        const pb = Math.floor(b / 2)
        const rb = b - pb
        goal.pos.y -= pb
        goal.range -= rb
    }
    return goal
}

declare global {
    interface CreepMemory {
        _walk?: MemState
    }
}

interface MemState {
    0: number
    1: string
    2: MemPath
}

type WalkReturnCode = ScreepsReturnCode | DirectionConstant

interface IsOwned {
    owner: {
        username: string
    }
}

interface CreepInfo {
    xy: number
    ticks: number
}

const ROUTE_MY_CLAIMED = 1
const ROUTE_MY_RESERVED = 2
const ROUTE_HIGHWAY = 3
const ROUTE_ALLY_RESERVED = 4
const ROUTE_NORMAL = 5
const ROUTE_ALLY_CLAIMED = 6
const ROUTE_SK = 7
const ROUTE_HOSTILE_RESERVED = 8
const ROUTE_HOSTILE_CLAIMED = 10

let _rewalker: Rewalker | null = null
export function defaultRewalker() {
    if(!_rewalker) {
    _rewalker = new Rewalker()
    }
    return _rewalker
}

export class Rewalker {
    isAllied(owned: IsOwned): boolean {
        return owned.owner.username === SYSTEM_USERNAME
    }

    planWalk(c: Creep, goals: Array<Goal>): number {
        const step = new Step(c, c.pos, 1, this)
        const clean = goals.map(cleanGoal)
        const [i, path] = step.planWalk(c.pos, clean)
        step.path = path
        if (i < OK) return i
        step.goal = goals[i]
        step.store()
        return i
    }

    // Walk creep to destination at range.
    // Return:
    // * Direction [1,8] of creep's move
    // * OK (0) when already in range of destination
    // * error code (,0) when move fails
    walkTo(c: Creep, dest: RoomPosition, range = 1): WalkReturnCode {
        if (c.pos.inRangeTo(dest, range)) {
            delete c.memory._walk
            return OK
        }
        if (c.fatigue > 0) return ERR_TIRED

        const step = new Step(c, dest, range, this)
        return step.walkTo()
    }

    getStuckTicks(creep: Creep): number {
        const info = this._getRoomInfo(creep.pos.roomName)
        if(!info) return 0
        const cinfo = info.creeps.get(creep.id)
        if (!cinfo) return 0
        return cinfo.ticks
    }

    _matCache = {
        time: Game.time,
        matrixes: new Map<string, CostMatrix>(),
    }
    get _cache() {
        if (this._matCache.time !== Game.time) {
            this._matCache.time = Game.time
            this._matCache.matrixes = new Map()
        }
        return this._matCache.matrixes
    }

    getMatrix(roomName: string): CostMatrix {
        const cache = this._cache
        let mat = cache.get(roomName)
        if (!mat) {
            const info = this._getRoomInfo(roomName)
            if(!info) {
                mat = RoomInfo._null
            } else {
                mat = info.newMatrix(roomName, this)
            }
            cache.set(roomName, mat)
        }
        return mat
    }

    calcMatrix(room: Room, mat: CostMatrix) {
        const structs = room.find(FIND_STRUCTURES)
        for (const struct of structs) {
            const [x, y] = [struct.pos.x, struct.pos.y]
            switch (struct.structureType) {
                case STRUCTURE_RAMPART:
                    if (!struct.my && !struct.isPublic && !this.isAllied(struct)) {
                        mat.set(x, y, 0xff)
                    }
                    break
                case STRUCTURE_ROAD:
                    mat.set(x, y, 1)
                    break
                case STRUCTURE_CONTROLLER:
                case STRUCTURE_EXTRACTOR:
                case STRUCTURE_CONTAINER:
                    // Weight is determined by what's underneath
                    break
                case STRUCTURE_KEEPER_LAIR:
                    matrixAvoid(mat, struct.pos, 3)
                    break
                default:
                    mat.set(x, y, 0xff)
                    break
            }
        }

        for (const site of room.find(FIND_CONSTRUCTION_SITES)) {
            const [x, y] = [site.pos.x, site.pos.y]
            switch (site.structureType) {
                case STRUCTURE_RAMPART:
                case STRUCTURE_ROAD:
                case STRUCTURE_CONTAINER:
                    break
                default:
                    if (site.my || this.isAllied(site))
                        mat.set(x, y, 0xff)
                    break
            }
        }

        for (const creep of room.find(FIND_CREEPS)) {
            const stuck = this.getStuckTicks(creep)
            if (stuck > 3) {
                if (creep.my) {
                    mat.set(creep.pos.x, creep.pos.y, Math.min(254, 10 + stuck))
                } else {
                    mat.set(creep.pos.x, creep.pos.y, 100 + stuck)
                }
            }
            if (this.isAllied(creep)) continue
            if (creep.getActiveBodyparts(RANGED_ATTACK)) {
                matrixAvoid(mat, creep.pos, 4)
            } else if (creep.getActiveBodyparts(ATTACK)) {
                matrixAvoid(mat, creep.pos, 2)
            }
        }
        return mat
    }

    guessRoomCost(roomName: string): number {
        if (roomName.includes('0')) return ROUTE_HIGHWAY
        const parsed = /^[WE]\d?(\d)[NS]\d?(\d)$/.exec(roomName)
        if (!parsed) {
            const col = parsed![0]
            const row = parsed![1]
            if (col === '5' && row === '5') return ROUTE_HIGHWAY

            if ('456'.includes(row) && '456'.includes(col)) return ROUTE_SK
        }
        return ROUTE_NORMAL
    }

    calcRoomCost(room: Room): [number, number] {
        const cost = this._calcRoomCost(room)
        if(this._checkMurder(room)) {
            return [cost+20, 2000]
        }
        return [cost, TOMBSTONE_DECAY_PER_PART * 25]
    }

    _calcRoomCost(room: Room): number {
        let cost = ROUTE_NORMAL
        if (room.controller) {
            const ctrl = room.controller
            if (ctrl.my) return ctrl.level >= 3 ? ROUTE_MY_CLAIMED : ROUTE_MY_RESERVED
            if (ctrl.reservation) {
                if (ctrl.reservation.username == whoami()) return ROUTE_MY_RESERVED
                if (this.isAllied({ owner: ctrl.reservation })) {
                    cost = ROUTE_ALLY_RESERVED
                } else {
                    cost = ROUTE_HOSTILE_RESERVED
                }
            }
            if (ctrl.owner) {
                if (this.isAllied(ctrl)) {
                    cost = ROUTE_ALLY_CLAIMED
                } else {
                    cost = ROUTE_HOSTILE_CLAIMED
                }
            }
        } else {
            const sk = _.any(room.find(FIND_STRUCTURES), s => s.structureType === STRUCTURE_KEEPER_LAIR)
            if (sk) {
                cost = ROUTE_SK
            } else {
                cost = ROUTE_HIGHWAY
            }
        }
        return cost
    }

    _checkMurder(room: Room): boolean {
        let murdered = _.find(room.find(FIND_TOMBSTONES), t => t.creep.my && t.creep.ticksToLive! > 100)
        if (!murdered) return false
        const tower = _.any(room.find(FIND_HOSTILE_STRUCTURES), s => s.structureType === STRUCTURE_TOWER)
        if (tower) return true
        const bots = ['Invader', 'SourceKeeper']
        return _.any(room.find(FIND_HOSTILE_CREEPS), c => !this.isAllied(c) &&
            !_.includes(bots, c.owner.username) &&
            hasActivePart(c, ATTACK, RANGED_ATTACK))
    }

    _infos = new Map<string, RoomInfo>()
    _getRoomInfo(roomName: string): RoomInfo | null {
        let info = this._infos.get(roomName)
        const room = Game.rooms[roomName]
        if(!info) {
            if(!room) return null

            info = new RoomInfo()
            info.update(room, this)
            this._infos.set(roomName, info)
            return info
        }
        if(room) {
            info.update(room, this)
        }
        return info
    }

    getRoute(fromRoom: string, destRoom: string): Array<string> {
        if (fromRoom === destRoom) return [fromRoom]
        const [route, flip] = this._rawRoute(fromRoom, destRoom)
        const ret = [fromRoom].concat(route, [destRoom])
        if (!flip) {
            ret.reverse()
        }
        return ret
    }

    getRouteSet(fromRoom: string, destRoom: string): Set<string> {
        const set = new Set()
        set.add(fromRoom)
        if (fromRoom === destRoom) return set
        set.add(destRoom)
        const [route, flip] = this._rawRoute(fromRoom, destRoom)
        route.forEach(r => set.add(r))
        return set
    }

    getRouteDist(fromRoom: string, destRoom: string): number {
        const dist = Game.map.getRoomLinearDistance(fromRoom, destRoom, false)
        if (dist === 0) return 1
        if (dist >= 23) return dist

        const [route, flip] = this._rawRoute(fromRoom, destRoom)
        return route.length + 2
    }

    _routesUpdated = 0
    _routes = new Map<string, { when: number, route: Array<string> }>()
    _rawRoute(fromRoom: string, destRoom: string): [Array<string>, boolean] {
        if (fromRoom === destRoom) return [[fromRoom], false]
        let start = fromRoom
        let end = destRoom
        let flip = false
        if (fromRoom > destRoom) {
            start = destRoom
            end = fromRoom
            flip = true
        }
        const key = start + end
        const entry = this._routes.get(key)
        if (!entry || (this._routesUpdated < Game.time && Game.time - entry.when > 500)) {
            this._routesUpdated = Game.time
            const ret = Game.map.findRoute(start, end, { routeCallback: this.routeCallback })
            if (ret === ERR_NO_PATH) {
                this._routes.set(key, { when: Game.time, route: [] })
                return [[], false]
            }
            let route = _.map(ret, e => e.room)
            route.pop()
            const newEntry = {
                when: Game.time,
                route,
            }
            this._routes.set(key, newEntry)
            return [route, flip]
        }
        return [entry.route, flip]
    }

    _getRoomCost(roomName: string): number{
        const info = this._getRoomInfo(roomName)
        if(info) return info.cost
        return this.guessRoomCost(roomName)
    }

    get routeCallback(): (roomName: string, from: string) => number {
        return (roomName: string, from: string) => this._getRoomCost(roomName)
    }

    get roomCallback() : (roomName: string) => boolean | CostMatrix {
        return roomName => this.getMatrix(roomName)
    }

    restrictedRoomCallback(pos: RoomPosition, goals: Goal[]): (roomName: string) => boolean | CostMatrix {
        // Short distance walks don't usually exceed the 16 room limit.
        if (this.getRouteDist(pos.roomName, goals[0].pos.roomName) <= 4) {
            return this.roomCallback
        }

        const set = new Set<string>()
        for (const goal of goals) {
            if (set.has(goal.pos.roomName)) continue
            const gset = this.getRouteSet(pos.roomName, goal.pos.roomName)
            for (const roomName of gset) {
                set.add(roomName)
            }
        }
        return roomName => {
            if (!set.has(roomName)) return false
            return this.getMatrix(roomName)
        }
    }
}

class Step {
    prev: RoomPosition
    path: Path
    constructor(public readonly creep: Creep,
        public dest: RoomPosition,
        public range: number,
        public readonly rewalker: Rewalker) {
        const mem = creep.memory._walk
        if (mem) {
            this.prev = fromXY(mem[0], mem[1])
            this.path = Path.deserialize(mem[2])
        } else {
            this.prev = creep.pos
            this.path = new Path([creep.pos])
        }
    }

    get goal(): Goal {
        return { pos: this.dest, range: this.range }
    }

    set goal(goal: Goal) {
        this.dest = goal.pos
        this.range = goal.range
    }

    store() {
        this.creep.memory._walk = [toXY(this.dest), this.dest.roomName, this.path.serialize()]
    }

    step(): WalkReturnCode {
        this.store()
        const stuck = this.rewalker.getStuckTicks(this.creep)
        if (stuck > 0) {
            const blocker = _.first(this.path.first.lookFor(LOOK_CREEPS))
            if (blocker && blocker.my) {
                blocker.move(getDirectionTo(blocker.pos, this.creep.pos) as DirectionConstant)
            }
        }
        const dir = getDirectionTo(this.creep.pos, this.path.first)
        const err = this.creep.move(dir as DirectionConstant)
        if (err === OK) {
            return dir
        }
        return err
    }

    inDanger(pos: RoomPosition): number {
        const room = Game.rooms[pos.roomName]
        if (!room) return 0
        for (const h of room.find(FIND_HOSTILE_CREEPS)) {
            if (this.rewalker.isAllied(h)) continue
            const range = pos.getRangeTo(h)
            if (h.getActiveBodyparts(ATTACK) > 0 && range <= 2) return 3 - range
            if (h.getActiveBodyparts(RANGED_ATTACK) > 0 && range <= 4) return 5 - range
        }
        return 0
    }

    needJuke(): boolean {
        if (atExit(this.creep.pos) || atExit(this.path.first)) return false
        const nextDanger = this.inDanger(this.path.first)
        if (!nextDanger) return false
        return nextDanger >= this.inDanger(this.creep.pos)
    }

    waryStep(): WalkReturnCode {
        if (this.needJuke()) {
            return this.rewalkTo()
        }
        return this.step()
    }

    walkTo(): WalkReturnCode {
        // Target has moved or there is a new target
        if (!this.dest.isEqualTo(this.prev)) {
            console.log('new walk', this.dest, this.prev, JSON.stringify(this.creep.memory._walk))
            const goal = cleanGoal({ pos: this.dest, range: this.range })
            // New destintation is too far to rewalk
            if (this.dest.getRangeTo(this.prev) > 3 || this.path.size < 3) {
                const [err, path] = this.planWalk(this.creep.pos, [goal])
                this.path = path
                return this.step()
            }

            // Remove excess path
            const last = this.path.trim(this.dest, this.range)
            this.path.draw({ lineStyle: "dashed", stroke: 'orange' })

            // Add more to path if needed
            if (!last.inRangeTo(this.dest, this.range)) {
                const [err, path] = this.planWalk(last, [goal])
                this.path._steps += path._steps
            } else {
                drawGoal(last, 'orange', goal)
            }
            // Fallthrough to allow other move conditions to check position
        }

        console.log("move again", this.creep.pos, this.path.first, this.path.second)
        // Either moved successfully or got bumped closer
        if (this.creep.pos.isEqualTo(this.path.first) || this.creep.pos.isNearTo(this.path.second)) {
            if (this.path.done) {
                console.log("path is empty", JSON.stringify(this.path), JSON.stringify(this.creep.memory._walk))
                // path ran out build a new one.
                const [err, path] = this.planWalk(this.creep.pos, [cleanGoal({ pos: this.dest, range: this.range })])
                this.path = path
                return this.step()
            }
            this.path = this.path.step()
            return this.waryStep()
        }

        // Bumped further away
        if (!this.creep.pos.isNearTo(this.path.first)) {
            return this.rewalkTo()
        }

        // Stuck
        const stuck = this.rewalker.getStuckTicks(this.creep)
        if (stuck > 3 || (stuck > 2 && Math.random() > 0.5)) {
            return this.rewalkTo()
        }

        // Retry movement to see if the obstruction has moved.
        return this.waryStep()
    }

    rewalkTo(): WalkReturnCode {
        const goals = [cleanGoal({ pos: this.dest, range: this.range })];
        (() => {
            const it = this.path.it()
            let next: RoomPosition | null = null
            for (const loop of [2, 1, 2, 3, 5, 8, 13, 21]) {
                for (let i = 0; i < loop; i++) {
                    do {
                        const ret = it.next()
                        if (ret.done) return
                        next = ret.value
                    } while (atExit(next!))
                }
                // Next can't be null because we would have returned earlier
                // The goal doesn't need to be clean since range 0 goals are uncleanable
                // This is why exit goals were skipped above.
                goals.push({ pos: next!, range: 0 })
            }
        })()

        const [i, repath] = this.planWalk(this.creep.pos, goals)
        // If i is 0 then repath went all the way to the destination
        // If there was an error only use the repath
        if (i > 0) {
            // Shorten the original path up to the end of repath
            while (!this.path.done && !this.path.first.isEqualTo(goals[i].pos)) {
                this.path = this.path.step()
            }
            if (!this.path.done) {
                const final = this.path.draw({ lineStyle: "dashed", stroke: "orange" })
                drawGoal(final, "orange", this.goal)
                repath._steps += this.path._steps
            }
        }
        this.path = repath
        return this.step()
    }

    planWalk(pos: RoomPosition, goals: Array<Goal>): [number, Path] {
        // calculate plainCost and swampCost
        const [weight, nmoves] = calcWeight(this.creep)
        let plainCost = 2
        let swampCost = 10
        if (nmoves >= weight) {
            plainCost = 1
            swampCost = 5
        }
        if (nmoves >= weight * 5) {
            swampCost = 1
        }

        const ret = PathFinder.search(
            pos,
            goals,
            {
                roomCallback: this.rewalker.roomCallback,
                plainCost,
                swampCost,
                maxCost: 1500,
            })

        const color = ret.incomplete ? 'red' : 'cornflowerblue'
        if(ret.path.length < 1) {
            for(let i =0; i< goals.length; i++) {
                if(this.creep.pos.inRangeTo(goals[i].pos, goals[i].range)) {
                    drawGoal(this.creep.pos, color, goals[i])
                    return [i, new Path([this.creep.pos])]
                }
            }
            return [0, new Path([this.creep.pos])]
        }
        let vis = new RoomVisual(pos.roomName)
        Path.draw(ret.path, { stroke: color, lineStyle: 'dashed' })
        const path = new Path(ret.path)
        if (ret.path.length === 0) return [0, path]
        const final = _.last(ret.path)
        let closest = 0
        if (!ret.incomplete) {
            for (let i = 0; i < goals.length; i++) {
                const g = goals[i]
                if (final.inRangeTo(g.pos, g.range)) {
                    closest = i
                    break
                }
            }
        } else {
            let dist = final.getRangeTo(goals[0].pos)
            for (let i = 1; i < goals.length; i++) {
                const newDist = final.getRangeTo(goals[i].pos)
                if (newDist < dist) {
                    dist = newDist
                    closest = i
                }
            }
            console.log(`${this.creep} using incomplete path to ${JSON.stringify(goals)}`)
        }
        drawGoal(final, color, goals[closest])
        return [closest, path]
    }
}

class RoomInfo {
    time = 0
    creeps = new Map<string, CreepInfo>()
    cost = 0
    until = 0
    needMat = false
    mat: number[] = []

    update(room: Room, rewalker: Rewalker) {
        if (this.time === Game.time) return

        this.time = Game.time

        if (this.until < Game.time) {
            const [cost, until] = rewalker.calcRoomCost(room)
            this.cost = cost
            this.until = until
        }

        const last = this.creeps
        this.creeps = new Map()
        for (const creep of room.find(FIND_CREEPS)) {
            let cinfo = last.get(creep.id)
            const xy = toXY(creep.pos)
            if (cinfo) {
                if (xy === cinfo.xy) {
                    if (creep.fatigue <= 0) cinfo.ticks++
                } else {
                    cinfo.xy = xy
                    cinfo.ticks = 0
                }
            } else {
                cinfo = {
                    xy,
                    ticks: 0
                }
            }
            this.creeps.set(creep.id, cinfo)
        }

        if (this.needMat) {
            this.needMat = false
            const mat = this.newMatrix(room.name, rewalker)
            rewalker._cache.set(room.name, mat)
        }
    }

    static _hotMat: CostMatrix | null = null
    static _null = new PathFinder.CostMatrix()
    newMatrix(roomName: string, rewalker: Rewalker): CostMatrix {
        const room = Game.rooms[roomName]

        if (!room) {
            this.needMat = true
            if (this.mat.length > 0) return matrixDeserialize(this.mat)
            return RoomInfo._null
        }
        this.needMat = false

        let mat = RoomInfo._hotMat
        RoomInfo._hotMat = null
        if (!mat) mat = new PathFinder.CostMatrix

        rewalker.calcMatrix(room, mat)
        if (room.controller) {
            const ctrl = room.controller
            if (ctrl.my && ctrl.level > 2) return mat
            const res = ctrl.reservation
            if (res && res.username === whoami() && res.ticksToEnd > 500) return mat
        }
        this.mat = matrixSerialize(mat)
        if (this.mat.length === 0) {
            RoomInfo._hotMat = mat
            return RoomInfo._null
        }
        return mat
    }
}

