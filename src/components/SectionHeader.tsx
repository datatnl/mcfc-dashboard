interface SectionHeaderProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export default function SectionHeader({ title, subtitle, children }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-start gap-3">
        <div className="w-1 h-8 rounded-full bg-[#2dd4a8] flex-shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
