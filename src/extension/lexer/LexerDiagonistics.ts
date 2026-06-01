import { Token } from "./Token";
import {LexerDiagnosticType} from "../diagonistic/LexerDiagnosticType"
import { DiagnosticSeverity } from "../diagonistic/DiagnosticSeverity";

export interface LexerDiagnostic {
    message: string;
    code: LexerDiagnosticType;
    severity: DiagnosticSeverity;

    /**
     * The token that caused the issue.
     * This is your PRIMARY source of truth for location.
     */
    token: Token;

    /**
     * Optional extra context for IDE features
     * (quick fix suggestion, explanation, etc.)
     */
    hint?: string;
}