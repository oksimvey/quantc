// src/extension/semantic/Scope.ts
import { Symbol, VariableSymbol, FunctionSymbol, ClassSymbol, SymbolKind } from "./Symbol";
import { TypeSymbol } from "./TypeSymbol";

export const enum ScopeKind {
    Global,
    Class,
    Function,
    Block,        // if/while/for body
}

export class Scope {

    private symbols = new Map<string, Symbol>();

    constructor(
        readonly kind: ScopeKind,
        readonly parent?: Scope
    ) {}

    // -------------------------------------------------------
    // Definition
    // -------------------------------------------------------

    /**
     * Define a symbol in this scope.
     * Returns false if the name is already taken in THIS scope
     * (shadowing a parent scope is allowed — that's a warning, not an error).
     */
    define(symbol: Symbol): boolean {
        if (this.symbols.has(symbol.name)) return false;
        this.symbols.set(symbol.name, symbol);
        return true;
    }

    // -------------------------------------------------------
    // Resolution
    // -------------------------------------------------------

    /** Resolve a name, walking up the scope chain. */
    resolve(name: string): Symbol | undefined {
        return this.symbols.get(name) ?? this.parent?.resolve(name);
    }

    /** Resolve only within THIS scope — for duplicate-declaration checks. */
    resolveLocal(name: string): Symbol | undefined {
        return this.symbols.get(name);
    }

    /** Resolve and narrow to a specific symbol kind. */
    resolveVariable(name: string): VariableSymbol | undefined {
        const s = this.resolve(name);
        return s?.kind === SymbolKind.Variable ? s as VariableSymbol : undefined;
    }

    resolveFunction(name: string): FunctionSymbol | undefined {
        const s = this.resolve(name);
        return s?.kind === SymbolKind.Function ? s as FunctionSymbol : undefined;
    }

    resolveClass(name: string): ClassSymbol | undefined {
        const s = this.resolve(name);
        return s?.kind === SymbolKind.Class ? s as ClassSymbol : undefined;
    }

    // -------------------------------------------------------
    // Scope ancestry queries
    // -------------------------------------------------------

    /** Walk up to find the nearest enclosing function scope. */
    enclosingFunction(): Scope | undefined {
        if (this.kind === ScopeKind.Function) return this;
        return this.parent?.enclosingFunction();
    }

    /** True if this scope is nested inside a class scope. */
    isInsideClass(): boolean {
        if (this.kind === ScopeKind.Class) return true;
        return this.parent?.isInsideClass() ?? false;
    }

    /** True if this is the global scope (no parent). */
    isGlobal(): boolean {
        return this.parent === undefined;
    }
}