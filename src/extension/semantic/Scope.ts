import { VariableSymbol } from "./VariableSymbol";

export class Scope {

    private variables = new Map<string, VariableSymbol>();

    constructor(
        private parent?: Scope
    ) {}

    define(symbol: VariableSymbol): boolean {

        if (this.variables.has(symbol.name)) {
            return false;
        }

        this.variables.set(symbol.name, symbol);
        return true;
    }

    resolve(name: string): VariableSymbol | undefined {

        const local = this.variables.get(name);

        if (local) return local;

        return this.parent?.resolve(name);
    }

}