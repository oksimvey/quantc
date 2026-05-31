import { ASTNode } from "./ASTNode";
import { TypeSymbol } from "../semantic/TypeSymbol";
import { Token } from "../lexer/Token";

export abstract class ExpressionNode
    implements ASTNode {

    abstract start: Token;
    abstract end: Token;

    resolvedType?: TypeSymbol;

}