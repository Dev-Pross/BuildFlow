
"use client";
interface placeholderNode {
  data: {
    label: string;
    onclick: () => void;
  };
}

function PlaceholderNode({ data }: placeholderNode) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full w-full bg-gray-600 text-white text-2xl"
      onClick={data.onclick}
    >
      <p className="text-white text-3xl mb- border-5 border-black  rounded-e-2xl p-2">{data.label} + </p>
    </div>
  );
}

export default PlaceholderNode;
