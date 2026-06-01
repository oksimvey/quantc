// src/extension/ast/StatementNode.ts
import { ASTNode } from "./ASTNode";
import { Token } from "../../lexer/Token";
import { Scope } from "../../semantic/Scope";

export abstract class StatementNode implements ASTNode {
    abstract readonly start: Token;
    abstract readonly end: Token;

    /**
     * The scope this statement introduces, if any.
     * A block statement creates a new scope; a variable declaration does not.
     * Populated during semantic analysis, not parsing.
     */
    scope?: Scope;
}