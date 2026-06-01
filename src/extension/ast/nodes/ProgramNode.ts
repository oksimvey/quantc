// src/extension/ast/ProgramNode.ts
import { ASTNode } from "./ASTNode";

export class ProgramNode {
    constructor(
        /** Top-level declarations (classes, functions, global variables). */
        public readonly declarations: ASTNode[]
    ) {}
}