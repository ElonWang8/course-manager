const statusMap: Record<string, { label: string; cls: string }> = {
  scheduled: { label: "已预约", cls: "bg-blue-100 text-blue-700" },
  completed: { label: "已完成", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "已取消", cls: "bg-gray-100 text-gray-500" },
};

const methodMap: Record<string, string> = {
  cash: "现金",
  wechat: "微信",
  alipay: "支付宝",
  bankTransfer: "银行转账",
  other: "其他",
};

export function LessonStatusBadge({ status }: { status: string }) {
  const { label, cls } = statusMap[status] || { label: status, cls: "bg-gray-100" };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

export function PaymentMethodBadge({ method }: { method: string }) {
  return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">{methodMap[method] || method}</span>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">在读</span>
  ) : (
    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-400">已停课</span>
  );
}
