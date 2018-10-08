export function pickNonEnergy(carry: StoreDefinition) {
    const keys = _.shuffle(_.keys(carry)) as ResourceConstant[];
    return _.find(keys, r => r !== RESOURCE_ENERGY);
}
