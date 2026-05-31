import { ASTNode } from "./ASTNode";
import { Token } from "../lexer/Token";
import { VisibilityType } from "../lexer/VisibilityType";
import { StorageType } from "../lexer/StorageType";
import { MutabilityType } from "../lexer/MutabilityType";
import { ExpressionNode } from "./ExpressionNode";
import { TypeSymbol } from "../semantic/TypeSymbol";

export class VariableDeclarationNode implements ASTNode {
    start: Token;
    end: Token;

    visibility: VisibilityType;
    storage: StorageType;
    mutability: MutabilityType;

    typeToken: Token;
    nameToken: Token;

    initializer?: ExpressionNode;

    // 👇 ADICIONA ISSO
    resolvedType?: TypeSymbol;

    constructor(
        start: Token,
        end: Token,
        visibility: VisibilityType,
        storage: StorageType,
        mutability: MutabilityType,
        typeToken: Token,
        nameToken: Token,
        initializer?: ExpressionNode
    ) {
        this.start = start;
        this.end = end;
        this.visibility = visibility;
        this.storage = storage;
        this.mutability = mutability;
        this.typeToken = typeToken;
        this.nameToken = nameToken;
        this.initializer = initializer;
    }
}