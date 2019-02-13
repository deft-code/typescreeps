class SiteManager {
    metas: MetaSite[]

    run() {


    }

    *coRun(): IterableIterator<string> {
        const metas = _.shuffle(this.metas);
        while(metas.length > 0) {
            const meta = metas.pop()
            //yield* meta
        }
    }

}

class MetaSite {
    pos: RoomPosition
    color: string

    runHi() {

    }

    runLo() {

    }
}

class Core extends MetaSite {

}

class Lab extends MetaSite {

}
