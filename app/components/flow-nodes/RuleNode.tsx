import { Handle, Position, type NodeProps } from '@xyflow/react';

export type RuleNodeData = {
  label: string;
  detail: string;
};

const RuleNode = ({ data }: NodeProps) => {
  const { label, detail } = data as unknown as RuleNodeData;

  return (
    <div className="min-h-[75px] max-w-[170px] rounded-xl border border-stroke bg-base-300 px-3 py-2 shadow-sm">
      <Handle type="target" position={Position.Top} id="top" className="!bg-base-content/30" />
      <Handle type="target" position={Position.Left} id="left" className="!invisible" />
      <div className="text-xs font-semibold">{label}</div>
      <div className="text-base-content/70 mt-0.5 text-xxs leading-snug">{detail}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!bg-base-content/30"
      />
      <Handle type="source" position={Position.Right} id="right" className="!invisible" />
    </div>
  );
};

export default RuleNode;
