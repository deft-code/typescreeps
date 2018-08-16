import { Aphid } from "./aphid";
import { Role } from "./role";

@Role.register
class Aphod extends Aphid {
    getSource() {
       return  _.last(this.mission.ai.sources)
    }
}
