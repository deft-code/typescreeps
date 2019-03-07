import 'prototypes';

import * as shed from 'shed';
import * as debug from 'debug';

import 'logic/alllogic';
import 'creep'
import 'allcreeps'

import { findAI } from 'ai/allai';
import { RoomAI } from 'ai/ai';
import { run as spawnersRun } from 'spawners';
import { initCache } from 'cache';
import { clearCache } from 'structcache';

declare global {
  function findAI(room: string): RoomAI;
}
declare var global: any;
global.findAI = findAI;

const when = Game.time % 10
declare const require: {timestamp: number}

export function loop() {
  initCache()
  clearCache()

  const ais = _.map(Game.rooms, r => r.ai);
  shed.run(ais, 500, ai => ai.init());

  const logic = _.map(Game.flags, f => f.logic);

  const combats = _.remove(ais, ai => ai.hostiles.length > 0);
  shed.run(combats, 500, ai => ai.run());
  shed.run(combats, 1500, ai => ai.after());

  const claimed = _.remove(ais, ai => ai.room.controller && ai.room.controller.my);
  shed.run(claimed, 2000, ai => ai.run());
  shed.run(claimed, 2000, ai => ai.after());

  const remotes = ais;
  shed.run(remotes, 3000, ai => ai.run());
  shed.run(remotes, 3000, ai => ai.after());

  const services = [spawnersRun]
  shed.run(services, 4000, r => r())

  shed.run(combats, 6000, ai => ai.optional())
  shed.run(claimed, 7000, ai => ai.optional())
  shed.run(remotes, 8000, ai => ai.optional())

  shed.run(logic, 9000, team => team.darkRun());

  initCache()
  clearCache()
}
