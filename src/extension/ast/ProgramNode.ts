import { ASTNode } from "./ASTNode";

export class ProgramNode {

    declarations: ASTNode[];

    constructor(
        declarations: ASTNode[]
    ) {
        this.declarations = declarations;
    }

}