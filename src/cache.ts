let cache: {[key:string]: {}} = {}

export function initCache() {
    cache = {}
}

export function getCache<T extends {}>(key:string): T{
    if(!cache[key]) {
        cache[key] = {}
    }
    return cache[key] as T
}
