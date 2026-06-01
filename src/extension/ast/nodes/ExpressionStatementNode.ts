// src/extension/ast/ExpressionNode.ts
import { ASTNode } from "./ASTNode";
import { Token } from "../../lexer/Token";
import { TypeSymbol } from "../../semantic/TypeSymbol";

export abstract class ExpressionNode implements ASTNode {
    abstract readonly start: Token;
    abstract readonly end: Token;

    /**
     * Resolved during semantic analysis.
     * Undefined means "not yet analysed" — treat as an error if still
     * undefined after the semantic pass completes.
     */
    resolvedType?: TypeSymbol;

    /**
     * True if this expression was explicitly wrapped in parentheses
     * in source. Needed for correct C++ transpilation of custom operators.
     */
    parenthesized: boolean = false;
}