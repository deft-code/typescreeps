import { defaultRewalker } from "Rewalker";
import { MissionLogic } from "logic/mission";
import { Role } from "roles/role";
import { log } from "debug";
import { buildBody, cost } from "body";

const rewalker = defaultRewalker()
declare class RoomAI {
  name: string
  spawns: StructureSpawn[]
  room: Room
}

let gAisTime = Game.time
let gAis: RoomAI[] = []

export function joinSpawning(ai: RoomAI) {
  if (gAisTime !== Game.time) {
    gAisTime = Game.time
    gAis = []
  }
  gAis.push(ai)
}

export class Spawner {
  constructor(public readonly name: string) {
    insertSpawner(this)
  }

  get priority() { return 10 }

  cancelled = false
  cancel() {
    this.cancelled = true
  }

  spawn(avoid: Set<string>): ScreepsReturnCode {
    if (this.cancelled) return ERR_NAME_EXISTS
    const possible = this.distFilter()
    log("all possible rooms", this, possible.map(p => p.name));
    const available = this.energyFilter(possible)
    log("energy ais", this, available.map(p => p.name));
    for (const ai of available) {
      if (avoid.has(ai.name)) continue
      const spawn = this.selectSpawn(ai.spawns)
      log("selected spawn", this, spawn, ai, ai.name, ai.spawns)
      if (!spawn) continue
      const err = spawn.spawnCreep(this.body(ai), this.name)
      if (err === OK) avoid.add(ai.name)
      log("spawning error", this, spawn, err)
      return err
    }
    return ERR_BUSY
  }

  distFilter() { return this.localAI(); }
  energyFilter(ais: RoomAI[]) { return this.fullAIs(ais); }
  body(ai: RoomAI): BodyPartConstant[] { return [] }

  get mission() {
    const mname = Role.calcMission(this.name);
    return Game.flags[mname].logic as MissionLogic
  }


  selectSpawn(spawns: StructureSpawn[]): StructureSpawn | undefined {
    return _.shuffle(spawns).find(s => !s.spawning)
  }

  toString() {
    return (<any>this).__proto__.constructor.name + ':' + this.name;
  }

  localAI() {
    let ret: RoomAI[] = []
    let dist = 11
    for (const ai of gAis) {
      const d = rewalker.getRouteDist(this.mission.pos.roomName, ai.name)
      if (d < dist) {
        dist = d
        ret = [ai]
      } else if (d === dist) {
        ret.push(ai)
      }
    }
    return ret
  }

  closeAI() {
    const mdist = _(gAis)
      .map(ai => rewalker.getRouteDist(ai.name, this.mission.ai.name))
      .min()
    return _.filter(gAis, ai =>
      rewalker.getRouteDist(ai.name, this.mission.ai.name) <= mdist + 1)
  }

  remoteAIs() {
    const mdist = _(gAis)
      .map(ai => rewalker.getRouteDist(ai.name, this.mission.ai.name))
      .filter(d => d > 0)
      .min()
    return _.filter(gAis, ai => {
      const d = rewalker.getRouteDist(ai.name, this.mission.ai.name)
      return d > 1 && d <= mdist
    })
  }

  maxAIs() {
    const close = _.filter(gAis, ai => rewalker.getRouteDist(ai.name, this.mission.ai.name) <= 10)
    const mlvl = _.max(close.map(ai => ai.room.energyCapacityAvailable))
    const lvl = _.filter(close, ai => ai.room.energyCapacityAvailable >= mlvl)
    const mAi = _.min(lvl, ai => rewalker.getRouteDist(ai.name, this.mission.ai.name))
    const mdist = rewalker.getRouteDist(mAi.name, this.mission.ai.name) + 1
    return _.filter(lvl, ai => rewalker.getRouteDist(ai.name, this.mission.ai.name) <= mdist)
  }

  minEnergy = 0
  fullAIs(ais: RoomAI[]) {
    return ais.filter(ai => ai.room.energyAvailable >= ai.room.energyCapacityAvailable &&
      ai.room.energyAvailable >= this.minEnergy)
  }

  parts: BodyPartConstant[] = []
  dynMove = 2
  maxEnergy = Infinity
  dynBody(ai: RoomAI) {
    return buildBody(this.parts,
      Math.min(ai.room!.energyAvailable, this.maxEnergy),
      this.dynMove);
  }
}

let gSpawners: Spawner[] = []
function insertSpawner(spawner: Spawner) {
  log("new spawner", spawner)
  const i = _.sortedIndex(gSpawners, spawner, s => s.priority)
  gSpawners.splice(i, 0, spawner)
}

export function run() {
  const avoid = new Set<string>()
  const next: Spawner[] = []
  for (const spawner of gSpawners) {
    if (!avoid.has(spawner.name)) {
      const err = spawner.spawn(avoid)
      log("spawning", spawner, err)
      if (err === OK) {
        avoid.add(spawner.mission.flag.pos.roomName)
        continue
      }
      if (err !== ERR_NAME_EXISTS) {
        next.push(spawner)
      }
    }
  }
  gSpawners = next
}

export class LocalSpawner extends Spawner {
}

export class StaticLocalSpawner extends LocalSpawner {
  constructor(name: string, body: BodyPartConstant[]) {
    super(name)
    this.parts = body;
    this.minEnergy = cost(body);
  }
  body(ai: RoomAI) { return this.parts }
}

export class DynamicLocalSpawner extends LocalSpawner {
  constructor(name: string, public parts: BodyPartConstant[]) {
    super(name)
    this.parts = parts
  }
  body(ai: RoomAI) { return this.dynBody(ai); }
}

export class CloseSpawner extends Spawner {
  distFilter() { return this.closeAI(); }
}

export class StaticCloseSpawner extends CloseSpawner {
  constructor(name: string, parts: BodyPartConstant[]) {
    super(name);
    this.parts = parts;
    this.minEnergy = cost(parts);
  }
  body(ai: RoomAI) { return this.parts; }
}

export class UpToCloseSpawner extends CloseSpawner {
  constructor(name: string, parts: BodyPartConstant[],  max: number) {
    super(name);
    this.maxEnergy = max;
    this.parts = parts;
  }

  body(ai: RoomAI) { return this.dynBody(ai); }
}
