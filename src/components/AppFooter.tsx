interface AppFooterProps {
  color: string;
}

export default function AppFooter({ color }: AppFooterProps) {
  return (
    <p
      className="text-center text-[9px] tracking-widest"
      style={{ color }}
    >
      © TK
    </p>
  );
}
