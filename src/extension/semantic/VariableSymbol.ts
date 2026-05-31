import { TypeSymbol } from "./TypeSymbol";

export class VariableSymbol {

    constructor(
        public readonly name: string,
        public readonly type: TypeSymbol,
        public readonly mutable: boolean
    ) {}

}