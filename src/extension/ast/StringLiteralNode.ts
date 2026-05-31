import { ExpressionNode } from "./ExpressionNode";
import { Token } from "../lexer/Token";

export class StringLiteralNode
    extends ExpressionNode {

    readonly token: Token;

    constructor(token: Token) {
        super();
        this.token = token;
    }

    get start(): Token {
        return this.token;
    }

    get end(): Token {
        return this.token;
    }

}