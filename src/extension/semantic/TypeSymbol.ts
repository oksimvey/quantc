// src/extension/semantic/TypeSymbol.ts

/**
 * Base for all types in the type system.
 * Sealed — only the subclasses below are valid type kinds.
 */
export abstract class TypeSymbol {
    abstract readonly kind: TypeKind;
    abstract readonly name: string;

    /**
     * Structural equality — two TypeSymbols are compatible
     * if they represent the same type, not just the same object.
     * Override in each subclass.
     */
    abstract isAssignableTo(other: TypeSymbol): boolean;
}

export const enum TypeKind {
    Primitive,   // int, float, string, boolean, void ...
    Class,       // user-defined or imported class
    Array,       // array<T>
    List,        // list<T>
    HashMap,     // hashmap<K, V>
    Function,    // (T1, T2) -> R  — for first-class functions later
    Unknown,     // type error placeholder — prevents cascading errors
    Pending,     // forward reference not yet resolved
}