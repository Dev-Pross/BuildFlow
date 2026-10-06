import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  color?: string;
  blur?: string;
  width?: string;
  height?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const Card = ({
  children,
  color = "bg-[#141518]",
  blur = "border border-[#222429] shadow-sm",
  width = "w-full max-w-md",
  height = "h-auto",
  className = "",
  onClick
}: CardProps) => {
  return (
    <div
      onClick={onClick}
      className={`${color} ${blur} ${width} ${height} rounded-3xl p-6 transition-all duration-200 ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;