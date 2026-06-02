
import { Method } from "./structures/Method";
import { Variable } from "./structures/Variable";

export interface ObjectType {

  identifier: string;

  comment: string;

  variables: Variable[];

  methods: Method[];
}

export function ObjectBuilder() {}
