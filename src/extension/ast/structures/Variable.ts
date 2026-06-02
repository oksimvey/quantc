import { ObjectType } from "../ObjectType";
import { MutabilityModifier } from "../modifiers/MutabilityModifier";
import { ScopeModifier } from "../modifiers/ScopeModifier";
import { VisibilityModifier } from "../modifiers/VisibilityModifier";

export interface Variable {
  visibility: VisibilityModifier;

  scope: ScopeModifier;

  mutability: MutabilityModifier;

  type: ObjectType;

  identifier: string;
}
