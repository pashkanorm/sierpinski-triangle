import React from "react";

const Triangle = ({ points }) => <polygon points={points.join(" ")} fill="black" stroke="white" />;

const midpoint = (p1, p2) => [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

const Sierpinski = ({ vertices, depth }) => {
  if (depth === 0) {
    return <Triangle points={vertices} />;
  }

  const [a, b, c] = vertices;
  const ab = midpoint(a, b);
  const bc = midpoint(b, c);
  const ca = midpoint(c, a);

  return (
    <>
      <Sierpinski vertices={[a, ab, ca]} depth={depth - 1} />
      <Sierpinski vertices={[ab, b, bc]} depth={depth - 1} />
      <Sierpinski vertices={[ca, bc, c]} depth={depth - 1} />
    </>
  );
};

const SierpinskiTriangle = ({ depth = 5 }) => {
  const size = 500;
  const height = (Math.sqrt(3) / 2) * size;
  const vertices = [
    [size / 2, 0],
    [0, height],
    [size, height],
  ];

  return (
    <svg width={size} height={height} style={{ background: "#f0f0f0" }}>
      <Sierpinski vertices={vertices} depth={depth} />
    </svg>
  );
};

export default SierpinskiTriangle;
