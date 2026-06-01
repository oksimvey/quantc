import { ASTNode } from "../ast/nodes/ASTNode";
import { ProgramNode } from "../ast/nodes/ProgramNode";
import {Modifiers} from "../ast/Modifiers"
import { Token } from "../lexer/Token";
import { VariableDeclarationNode } from "../ast/nodes/VariableDeclarationNode";

export class Parser {

    private pos = 0;

    constructor(private readonly tokens: Token[]) {}

    /*
    // entry point
    parseProgram(): ProgramNode

    // declarations
    private parseDeclaration(): ASTNode
    private parseVariableDeclaration(modifiers: Modifiers): VariableDeclarationNode
    private parseFunctionDeclaration(modifiers: Modifiers): FunctionDeclarationNode
    private parseClassDeclaration(modifiers: Modifiers): ClassDeclarationNode

    // statements
    private parseStatement(): StatementNode
    private parseIfStatement(): IfStatementNode
    private parseWhileStatement(): WhileStatementNode
    private parseReturnStatement(): ReturnStatementNode
    private parseBlock(): BlockStatementNode

    // expressions — one method per precedence level
    private parseExpression(): ExpressionNode
    private parseAssignment(): ExpressionNode
    private parseOr(): ExpressionNode
    private parseAnd(): ExpressionNode
    private parseEquality(): ExpressionNode
    private parseComparison(): ExpressionNode
    private parseAdditive(): ExpressionNode
    private parseMultiplicative(): ExpressionNode
    private parseUnary(): ExpressionNode
    private parsePostfix(): ExpressionNode
    private parsePrimary(): ExpressionNode

    // token helpers
    private peek(): Token
    private advance(): Token
    private expect(type: TokenType): Token   // consumes or throws diagnostic
    private check(type: TokenType): boolean
    private match(...types: TokenType[]): boolean
    */
}