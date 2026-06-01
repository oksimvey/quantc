type OperatorKind = "prefix" | "infix" | "postfix";

 interface OperatorDefinition {
    symbol: string;
    kind: OperatorKind;
    precedence: number;
    associativity: "left" | "right";
}