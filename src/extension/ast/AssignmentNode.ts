import { ASTNode } from "./ASTNode";
import { Token } from "../lexer/Token";
import { ExpressionNode } from "./ExpressionNode";

export class AssignmentNode implements ASTNode {
    start: Token;
    end: Token;

    nameToken: Token;
    value: ExpressionNode;

    constructor(
        start: Token,
        end: Token,
        nameToken: Token,
        value: ExpressionNode
    ) {
        this.start = start;
        this.end = end;
        this.nameToken = nameToken;
        this.value = value;
    }
}
