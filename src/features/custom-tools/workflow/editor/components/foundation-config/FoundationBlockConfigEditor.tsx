import { Badge } from "@/components/ui/badge";
import type { CustomToolFoundationBlockType } from "../../../../domain/customToolTypes";
import { getFoundationBlockDefinition } from "../../../foundation";
import { FoundationCollectionBlockEditor } from "./FoundationCollectionBlockEditor";
import { FoundationControlFlowBlockEditor } from "./FoundationControlFlowBlockEditor";
import { FoundationDataBlockEditor } from "./FoundationDataBlockEditor";
import { FoundationFunctionBlockEditor } from "./FoundationFunctionBlockEditor";
import { FoundationIoBlockEditor } from "./FoundationIoBlockEditor";
import { FoundationOperatorBlockEditor } from "./FoundationOperatorBlockEditor";
import type { FoundationConfigEditorProps } from "./FoundationConfigFields";

function renderCategoryEditor(
  blockType: CustomToolFoundationBlockType,
  props: FoundationConfigEditorProps,
) {
  const definition = getFoundationBlockDefinition(blockType);

  switch (definition.category) {
    case "io":
      return <FoundationIoBlockEditor {...props} blockType={blockType} />;
    case "math":
    case "logic":
      return <FoundationOperatorBlockEditor {...props} blockType={blockType} />;
    case "data":
      return <FoundationDataBlockEditor {...props} blockType={blockType} />;
    case "scope":
    case "function":
      return <FoundationFunctionBlockEditor {...props} blockType={blockType} />;
    case "control-flow":
      return <FoundationControlFlowBlockEditor {...props} blockType={blockType} />;
    case "collection":
      return <FoundationCollectionBlockEditor {...props} blockType={blockType} />;
    default:
      return null;
  }
}

export function FoundationBlockConfigEditor({
  blockId,
  blockType,
  config,
  onConfigChange,
  referenceOptions,
  linkedInputSuggestions,
}: FoundationConfigEditorProps & { blockType: CustomToolFoundationBlockType }) {
  const definition = getFoundationBlockDefinition(blockType);

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-2xl border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold">{definition.title}</h3>
          <Badge variant="outline">{definition.category}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{definition.summary}</p>
      </div>

      {renderCategoryEditor(blockType, {
        blockId,
        config,
        onConfigChange,
        referenceOptions,
        linkedInputSuggestions,
      })}
    </div>
  );
}
