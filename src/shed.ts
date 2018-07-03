import * as debug from './debug';

const kMaxCPU = 350

export function canRun(cpu: number, bucket: number) {
    if (cpu > kMaxCPU) {
        debug.warn('CPU Throttled')
        return false
    }
    if (Game.cpu.bucket < bucket - 750) return false
    if (cpu > Game.cpu.limit && Game.cpu.bucket < bucket) return false
    return true
}

export function run<T>(objs: T[], bucket: number, func: (t:T) => void) {
    if (!canRun(Game.cpu.getUsed(), bucket)) return

    let order = _.shuffle(objs)
    for (const obj of order) {
        if (!canRun(Game.cpu.getUsed(), bucket)) {
            debug.warn('CPU Throttled!', obj, func)
            return
        }
        try {
            func(obj);
        } catch (err) {
            debug.log(obj, func, err, err.stack)
            Game.notify(err.stack, 30)
        }
    }
}
