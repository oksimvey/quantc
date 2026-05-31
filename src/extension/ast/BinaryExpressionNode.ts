import {ExpressionNode} from "./ExpressionNode";
import {Token} from "../lexer/Token";

export class BinaryExpressionNode extends ExpressionNode {
    left: ExpressionNode;

    constructor(
        left: ExpressionNode,
        public operator: Token,
        right: ExpressionNode
    ) {
        super();
        this.left = left;
        this.right = right;
    }

    right: ExpressionNode;

    get start(): Token {
        return this.left.start;
    }

    get end(): Token {
        return this.right.end;
    }

}
