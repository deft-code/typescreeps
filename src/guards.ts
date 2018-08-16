export function isStoreStructure(s: Structure): s is StoreStructure {
    return !!(<StructureContainer>s).store
}

export function isEnergyStructure(s:Structure): s is EnergyStruct {
    return (<EnergyStruct>s).energy != undefined
}
