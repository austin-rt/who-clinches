import { Handle, Position, type NodeProps } from '@xyflow/react';

export type RuleNodeHData = {
  label: string;
  detail: string;
};

const RuleNodeH = ({ data }: NodeProps) => {
  const { label, detail } = data as unknown as RuleNodeHData;

  return (
    <div className="w-[150px] rounded-xl border border-stroke bg-base-300 px-3 py-2 shadow-sm">
      <Handle type="target" position={Position.Top} id="top" className="!invisible" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-base-content/30" />
      <div className="text-xs font-semibold">{label}</div>
      <div className="text-base-content/70 mt-0.5 text-xxs leading-snug">{detail}</div>
      <Handle type="source" position={Position.Bottom} id="bottom" className="!invisible" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-base-content/30" />
    </div>
  );
};

export default RuleNodeH;
