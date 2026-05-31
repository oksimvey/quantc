import { Token } from "../lexer/Token";

export class Diagnostic {

    constructor(
        public readonly token: Token,
        public readonly message: string
    ) {}

}