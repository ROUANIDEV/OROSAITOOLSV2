import {
  collectionFoundationBlockDefinitions,
  controlFlowFoundationBlockDefinitions,
  dataFoundationBlockDefinitions,
  functionFoundationBlockDefinitions,
} from "./definitions";
import {
  foundationBlockCategories,
  foundationBlockKinds,
  type FoundationBlockCategory,
  type FoundationBlockDefinition,
  type FoundationBlockKind,
} from "./foundationBlockTypes";

export type FoundationBlockGroup = {
  category: FoundationBlockCategory;
  blocks: readonly FoundationBlockDefinition[];
};

export const foundationBlockDefinitions = [
  ...dataFoundationBlockDefinitions,
  ...functionFoundationBlockDefinitions,
  ...controlFlowFoundationBlockDefinitions,
  ...collectionFoundationBlockDefinitions,
] satisfies readonly FoundationBlockDefinition[];

export const foundationBlockDefinitionsByKind =
  foundationBlockDefinitions.reduce(
    (definitions, definition) => {
      definitions[definition.kind] = definition;
      return definitions;
    },
    {} as Record<FoundationBlockKind, FoundationBlockDefinition>,
  );

export function isFoundationBlockKind(
  value: unknown,
): value is FoundationBlockKind {
  return (
    typeof value === "string" &&
    (foundationBlockKinds as readonly string[]).includes(value)
  );
}

export function getFoundationBlockDefinition(
  kind: FoundationBlockKind,
): FoundationBlockDefinition {
  return foundationBlockDefinitionsByKind[kind];
}

export function getFoundationBlocksByCategory(
  category: FoundationBlockCategory,
): readonly FoundationBlockDefinition[] {
  return foundationBlockDefinitions.filter(
    (definition) => definition.category === category,
  );
}

export const foundationBlockGroups = foundationBlockCategories.map(
  (category) => ({
    category,
    blocks: getFoundationBlocksByCategory(category),
  }),
) satisfies readonly FoundationBlockGroup[];