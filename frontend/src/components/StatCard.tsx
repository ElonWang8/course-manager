export default function StatCard({ title, value, color = "blue" }: { title: string; value: string; color?: string }) {
  const colors: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50 text-blue-600",
    green: "border-green-200 bg-green-50 text-green-600",
    orange: "border-orange-200 bg-orange-50 text-orange-600",
  };
  return (
    <div className={`flex flex-col items-center py-4 px-2 rounded-xl border ${colors[color]}`}>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs mt-1 opacity-70">{title}</span>
    </div>
  );
}
