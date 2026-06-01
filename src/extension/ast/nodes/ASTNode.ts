

// src/extension/ast/ASTNode.ts
import { Token } from "../../lexer/Token";

export interface ASTNode {
    /** First token this node was derived from. */
    readonly start: Token;
    /** Last token this node was derived from (inclusive). */
    readonly end: Token;
}