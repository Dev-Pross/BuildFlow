import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  color?: string;
  blur?: string;
  width?: string;
  height?: string
}

const Card = ({children, color = "bg-black", blur = "", width = "w-1/2", height = "h-1/2"}: CardProps) => {
  return (
    <>
        <div className={`${color} rounded-xl p-5 ${width} ${height} backdrop-brightness-100 ${blur}`}>
            {children}
        </div>
    </>
  )
}

export default Card