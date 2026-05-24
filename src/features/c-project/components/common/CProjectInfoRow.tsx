type CProjectInfoRowProps = {
  label: string;
  value: string | number;
};

export function CProjectInfoRow({ label, value }: CProjectInfoRowProps) {
  return (
    <div className="grid gap-1 rounded-lg border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="break-all font-medium">{value}</span>
    </div>
  );
}