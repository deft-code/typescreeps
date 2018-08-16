import { defaultRewalker } from "Rewalker";
import { PSpawn } from "structures";
import { MissionLogic } from "logic/mission";
import { Role } from "roles/role";
import { log } from "debug";

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
    const ais = this.findAIs()
    for (const ai of ais) {
      if (avoid.has(ai.name)) continue
      const spawn = this.selectSpawn(ai.spawns)
      if (!spawn) continue
      const err = spawn.spawnCreep(this.body(ai), this.name)
      if (err === OK) avoid.add(ai.name)
      return err
    }
    return ERR_BUSY
  }

  get mission() {
    const mname = Role.calcMission(this.name)
    return Game.flags[mname].logic as MissionLogic
  }

  allAIs() { return gAis }
  findAIs() { return gAis }

  fullAIs() {
    return gAis.filter(ai => ai.room.energyAvailable >= ai.room.energyCapacityAvailable)
  }

  anySpawn(spawns: StructureSpawn[]): StructureSpawn | undefined {
    return _.shuffle(spawns).find(s => !s.spawning)
  }

  selectSpawn(spawns: StructureSpawn[]): StructureSpawn | undefined {
    return this.anySpawn(spawns)
  }

  body(ai: RoomAI): BodyPartConstant[] {
    return []
  }
}

let gSpawners: Spawner[] = []
function insertSpawner(spawner: Spawner) {
  const i = _.sortedIndex(gSpawners, spawner, s => s.priority)
  gSpawners.splice(i, 0, spawner)
}

export function run() {
  const avoid = new Set<string>()
  const next: Spawner[] = []
  for (const spawner of gSpawners) {
    if (!avoid.has(spawner.name)) {
      const err = spawner.spawn(avoid)
      log("spawning", spawner)
      if (err === OK) {
        avoid.add(spawner.mission.ai.name)
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
  findAIs() {
    let ais: RoomAI[] = []
    let dist = 11
    for (const ai of gAis) {
      const d = rewalker.getRouteDist(this.mission.pos.roomName, ai.name)
      if (d < dist) {
        dist = d
        ais = [ai]
      } else if (d === dist) {
        ais.push(ai)
      }
    }
    return ais
  }
}

export class StaticLocalSpawner extends LocalSpawner {
  _body: BodyPartConstant[]
  constructor(name: string, ...body: BodyPartConstant[]) {
    super(name)
    this._body = body
  }
  body(ai: RoomAI) { return this._body }
}

export class CloseSpawner extends Spawner {
  findAIs() {
    const mdist = _(this.allAIs())
      .map(ai => rewalker.getRouteDist(ai.name, this.mission.ai.name))
      .min()
    return _.filter(gAis, ai =>
      rewalker.getRouteDist(ai.name, this.mission.ai.name) <= mdist + 1)
  }
}

export class RemoteSpawner extends Spawner {
  findAIs() {
    const mdist = _(this.allAIs())
      .map(ai => rewalker.getRouteDist(ai.name, this.mission.ai.name))
      .filter(d => d > 0)
      .min()
    return _.filter(gAis, ai => {
      const d = rewalker.getRouteDist(ai.name, this.mission.ai.name)
      return d > 1 && d <= mdist
    })
  }
}

export class MaxSpawner extends Spawner {
  findAIs() {
    const close = _.filter(this.allAIs(), ai => rewalker.getRouteDist(ai.name, this.mission.ai.name) <= 10)
    const mlvl = _.max(close.map(ai => ai.room.controller!.level))
    const lvl = _.filter(close, ai => ai.room.controller!.level >= mlvl)
    const mAi = _.min(lvl, ai => rewalker.getRouteDist(ai.name, this.mission.ai.name))
    const mdist = rewalker.getRouteDist(mAi.name, this.mission.ai.name) + 1
    return _.filter(lvl, ai => rewalker.getRouteDist(ai.name, this.mission.ai.name) <= mdist)
  }
}