// src/extension/semantic/Symbol.ts

import { ScopeType } from "../ast/Modifiers";
import { TypeKind, TypeSymbol } from "./TypeSymbol";

export const enum SymbolKind {
    Variable,
    Function,
    Class,
    Parameter,
    Field,       // class member variable
    Method,      // class member function
}

// Primitive: int, float, string, boolean, void, byte, etc.
export class PrimitiveTypeSymbol extends TypeSymbol {
    readonly kind = TypeKind.Primitive;

    constructor(
        readonly name: string,
        readonly builtin: boolean = true
    ) { super(); }

    isAssignableTo(other: TypeSymbol): boolean {
        if (!(other instanceof PrimitiveTypeSymbol)) return false;
        // Later: widen numeric types (byte → short → int → long → float → double)
        return this.name === other.name;
    }
}

// Class: user-defined or from an imported library
export class ClassTypeSymbol extends TypeSymbol {
    readonly kind = TypeKind.Class;
    readonly name: string;

    constructor(
        name: string,
        /** The class this one extends, if any. Needed for instanceof checks. */
        readonly superType?: ClassTypeSymbol,
        /** Abstract classes cannot be instantiated directly. */
        readonly abstract: boolean = false
    ) {
        super();
        this.name = name;
    }

    isAssignableTo(other: TypeSymbol): boolean {
        if (!(other instanceof ClassTypeSymbol)) return false;
        // Walk the inheritance chain
        // ignore-error: TS narrowing quirk
        let cursor: ClassTypeSymbol | undefined = this;
        while (cursor) {
            if (cursor.name === other.name) return true;
            cursor = cursor.superType;
        }
        return false;
    }
}

// Generic container types — array<T>, list<T>
export class CollectionTypeSymbol extends TypeSymbol {
    readonly kind: TypeKind.Array | TypeKind.List;
    readonly name: string;

    constructor(
        kind: TypeKind.Array | TypeKind.List,
        readonly elementType: TypeSymbol
    ) {
        super();
        this.kind = kind;
        this.name = kind === TypeKind.Array
            ? `array<${elementType.name}>`
            : `list<${elementType.name}>`;
    }

    isAssignableTo(other: TypeSymbol): boolean {
        if (!(other instanceof CollectionTypeSymbol)) return false;
        if (this.kind !== other.kind) return false;
        return this.elementType.isAssignableTo(other.elementType);
    }
}

// hashmap<K, V>
export class HashMapTypeSymbol extends TypeSymbol {
    readonly kind = TypeKind.HashMap;
    readonly name: string;

    constructor(
        readonly keyType: TypeSymbol,
        readonly valueType: TypeSymbol
    ) {
        super();
        this.name = `hashmap<${keyType.name}, ${valueType.name}>`;
    }

    isAssignableTo(other: TypeSymbol): boolean {
        if (!(other instanceof HashMapTypeSymbol)) return false;
        return this.keyType.isAssignableTo(other.keyType)
            && this.valueType.isAssignableTo(other.valueType);
    }
}

// Sentinel for type errors — prevents cascading diagnostics
export class UnknownTypeSymbol extends TypeSymbol {
    readonly kind = TypeKind.Unknown;
    readonly name = "<unknown>";
    // Unknown is assignable to everything — it's already an error,
    // no need to report five more errors downstream
    isAssignableTo(_other: TypeSymbol): boolean { return true; }
}

export abstract class Symbol {
    abstract readonly kind: SymbolKind;
    abstract readonly name: string;
    abstract readonly type: TypeSymbol;
}

export class VariableSymbol extends Symbol {
    readonly kind = SymbolKind.Variable;

    constructor(
        readonly name: string,
        readonly type: TypeSymbol,
        readonly mutable: boolean,
        readonly storage: ScopeType      // local vs global
    ) { super(); }
}

export class ParameterSymbol extends Symbol {
    readonly kind = SymbolKind.Parameter;

    constructor(
        readonly name: string,
        readonly type: TypeSymbol,
        readonly index: number            // position in the parameter list
    ) { super(); }
}

export class FunctionSymbol extends Symbol {
    readonly kind = SymbolKind.Function;
    // A function's "type" is its return type for lookup purposes
    constructor(
        readonly name: string,
        readonly type: TypeSymbol,        // return type
        readonly parameters: ParameterSymbol[],
        readonly abstract: boolean = false
    ) { super(); }
}

export class ClassSymbol extends Symbol {
    readonly kind = SymbolKind.Class;
    readonly type: ClassTypeSymbol;

    constructor(
        readonly name: string,
        classType: ClassTypeSymbol
    ) {
        super();
        this.type = classType;
    }
}