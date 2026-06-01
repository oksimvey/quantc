import { TokenType } from "./TokenType";

/**
 * Lexical classification tables
 * Pure lookup structures used by the lexer only.
 */

// ─────────────────────────────────────────────────────────────
// Reserved keywords (language syntax)
// ─────────────────────────────────────────────────────────────
// Control flow / flow control
export const CONTROL_FLOW_KEYWORDS = new Set<string>([
    "if",
    "else",
    "while",
    "for",
    "switch",
    "case",
    "default",
    "try",
    "catch",
    "throw",
    "return",
    "break",
    "continue",
    "super",
    "abstract",
]);

// ─────────────────────────────────────────────────────────────
// Declarations / language constructs
export const DECLARATION_KEYWORDS = new Set<string>([
    "class",
    "function",
    "enum",
    "extends",
    "new",
    "delete",
    "override",
]);

// ─────────────────────────────────────────────────────────────
// Visibility / scope
export const SCOPE_KEYWORDS = new Set<string>([
    "global",
    "member",
]);

// ─────────────────────────────────────────────────────────────
// Access control
export const ACCESS_KEYWORDS = new Set<string>([
    "public",
    "private",
    "protected",
]);

// ─────────────────────────────────────────────────────────────
// Type / memory / ownership modifiers
export const TYPE_MODIFIERS = new Set<string>([
    "const",
    "mutable",
    "instanceof",
    "this",
]);

// ─────────────────────────────────────────────────────────────
// Async / scheduling
export const ASYNC_KEYWORDS = new Set<string>([
    "wait",
    "await",
]);

// ─────────────────────────────────────────────────────────────
// Logical operators written as words
export const LOGICAL_OPERATORS = new Set<string>([
    "and",
    "or",
    "not",
]);

// ─────────────────────────────────────────────────────────────
// Literal keywords
export const LITERAL_KEYWORDS = new Set<string>([
    "null",
    "true",
    "false",
]);

// ─────────────────────────────────────────────────────────────
// All reserved keywords
export const KEYWORDS = new Set<string>([
    ...CONTROL_FLOW_KEYWORDS,
    ...DECLARATION_KEYWORDS,
    ...SCOPE_KEYWORDS,
    ...ACCESS_KEYWORDS,
    ...TYPE_MODIFIERS,
    ...ASYNC_KEYWORDS,
    ...LOGICAL_OPERATORS,
    ...LITERAL_KEYWORDS,
]);

// ─────────────────────────────────────────────────────────────
// Built-ins by category
export const IO_BUILTINS = new Set<string>([
    "print",
]);

export const MATH_BUILTINS = new Set<string>([
    "sqrt",
    "abs",
    "sin",
    "cos",
    "tan",
    "min",
    "max",
    "pow",
    "log",
    "exp",
    "floor",
    "ceil",
]);

export const MEMORY_BUILTINS = new Set<string>([
    "pointing",
    "getAddress",
    "getUniqueAddress",
    "getSharedAddress",
    "Pointer",
    "SharedPointer",
    "UniquePointer",
    "Reference",
]);

export const BUILTINS = new Set<string>([
    ...IO_BUILTINS,
    ...MATH_BUILTINS,
    ...MEMORY_BUILTINS,
]);

// ─────────────────────────────────────────────────────────────
// Primitive types
export const PRIMITIVE_TYPES = new Set<string>([
    "auto",
    "int",
    "uint",
    "float",
    "double",
    "char",
    "string",
    "boolean",
    "void",
    "byte",
    "ubyte",
    "short",
    "ushort",
    "long",
    "ulong",
]);

// ─────────────────────────────────────────────────────────────
// Collection / container types
export const COLLECTION_TYPES = new Set<string>([
    "HashMap",
    "List",
    "Array",
]);

// ─────────────────────────────────────────────────────────────
// All built-in types
export const TYPES = new Set<string>([
    ...PRIMITIVE_TYPES,
    ...COLLECTION_TYPES,
]);
// ─────────────────────────────────────────────────────────────
// Custom operator registry (unicode-friendly)
export const CUSTOM_OPERATORS = new Map<string, Map<string, OperatorDefinition>>
// ─────────────────────────────────────────────────────────────
// Classification logic (lexer-only responsibility)
//
// IMPORTANT:
// This does NOT check scope or validity in context.
// It only categorizes raw identifiers.

export function classifyIdentifier(word: string): TokenType {
    // 1. Built-in functions (highest priority for identifiers)
    if (BUILTINS.has(word)) return TokenType.Builtin;

    // 2. Types
    if (TYPES.has(word)) return TokenType.Type;

    // 3. Language keywords (control flow, declarations, etc.)
    if (KEYWORDS.has(word)) return TokenType.Keyword;

    // 4. Custom operators (symbolic identifiers like √, ∑, etc)
    if (isCustomOperator(word)) return TokenType.CustomOperator;

    // 5. Default user identifier
    return TokenType.Identifier;
}

// ─────────────────────────────────────────────────────────────
// Custom operator registration (for extensibility features like √)

export function registerCustomOperator(op: OperatorDefinition): void {
    
}

// Optional helper for lexer:
export function getCustomOperator(op: string): OperatorDefinition | undefined {
    return undefined;
}

export function isCustomOperator(op: string): boolean {
    return CUSTOM_OPERATORS.has(op);
}