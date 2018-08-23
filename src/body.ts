import { log } from "debug";

export function expandParts(ds: string) {
    const parts: BodyPartConstant[] = []
    let part: BodyPartConstant | null = null
    let mult = 0
    for (const c of ds) {
        switch (c) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                mult = mult * 10 + parseInt(c, 10);
                break;
            case 'a': part = ATTACK; break;
            case 'c': part = CARRY; break;
            case 'k': part = CLAIM; break;
            case 'm': part = MOVE; break;
            case 'r': part = RANGED_ATTACK; break;
            case 't': part = TOUGH; break;
            case 'w': part = WORK; break;
            default: log("bad part", c); break;
        }
        if (part) {
            _.times(mult || 1, () => parts.push(part!))
            mult = 0;
        }
    }
    return parts
}

export function buildBody(body: BodyPartConstant[], energy: number, move = 1, base: BodyPartConstant[] = []) {
    const parts = _.clone(base);
    let cost = _.sum(parts, p => BODYPART_COST[p]);
    let moves = Math.ceil(parts.length / move);
    _.times(moves, () => parts.push(MOVE));
    for (let i = 0; i < 50; i++) {
        const part = body[i % body.length];
        parts.push(part);
        cost += BODYPART_COST[part];
        const nmove = ((parts.length - moves) / move) - moves;
        if (nmove > 0) {
            parts.push(MOVE);
            cost += BODYPART_COST[MOVE];
            moves++;
        }
        if (parts.length > 50 || cost > energy) {
            parts.pop()
            if (nmove) parts.pop()
            return parts
        }
    }
    return parts
}
