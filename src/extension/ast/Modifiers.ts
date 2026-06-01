/**
 * Visibility controls who can access a variable or method.
 *
 * - Private: only accessible inside the declaring class.
 * - Protected: accessible inside the class and subclasses.
 * - Public: accessible from anywhere.
 */
export enum VisibilityType {
    Private,
    Protected,
    Public
}

/**
 * Describes whether a value can be modified after initialization.
 *
 * - Const: value cannot be reassigned after initialization.
 * - Mutable: value can be freely modified.
 */
export enum MutabilityType {
    Const,
    Mutable
}

/**
 * Defines where a variable exists and is valid.
 *
 * - Global: exists for the entire program lifetime.
 * - Member: exists only in the active instance
 * - Local: exists only within a function/block scope.
 */
export enum ScopeType {
    Global,
    Member,
    Local
}

/**
 * Defines how a value is stored or managed in memory.
 *
 * - Pointer: raw reference to a memory address (no ownership semantics).
 * - Raw: direct value stored in memory (no indirection).
 * - Unique: single-owner smart pointer (exclusive ownership).
 * - Shared: reference-counted shared ownership.
 */
export enum MemoryModifier {
    Raw,
    Unique,
    Shared
}

export enum Modifiers {
    MemoryModifier,
    ScopeType,
    MutabilityType,
    VisibilityType
}