export type CustomToolBlockHandler<TResult = unknown, TContext = unknown, TBlock extends { type?: string } = { type?: string }> = (
  block: TBlock,
  context: TContext,
) => Promise<TResult> | TResult;

export type CustomToolBlockHandlerRegistry<TResult = unknown, TContext = unknown, TBlock extends { type?: string } = { type?: string }> = Record<
  string,
  CustomToolBlockHandler<TResult, TContext, TBlock>
>;

export function getCustomToolBlockHandler<TResult = unknown, TContext = unknown, TBlock extends { type?: string } = { type?: string }>(
  registry: CustomToolBlockHandlerRegistry<TResult, TContext, TBlock>,
  block: TBlock,
): CustomToolBlockHandler<TResult, TContext, TBlock> | null {
  const blockType = block.type;
  if (!blockType) return null;
  return registry[blockType] ?? null;
}

export function assertCustomToolBlockHandler<TResult = unknown, TContext = unknown, TBlock extends { type?: string } = { type?: string }>(
  registry: CustomToolBlockHandlerRegistry<TResult, TContext, TBlock>,
  block: TBlock,
): CustomToolBlockHandler<TResult, TContext, TBlock> {
  const handler = getCustomToolBlockHandler(registry, block);
  if (!handler) {
    throw new Error(`Unsupported custom tool block type: ${block.type ?? "unknown"}`);
  }
  return handler;
}
