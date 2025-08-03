import React, { useRef, useEffect, useState, useCallback } from "react";

const drawSierpinskiIterative = (ctx, x, y, size, zoom, offset, canvasWidth, canvasHeight) => {
  const height = (Math.sqrt(3) / 2) * size;
  const transform = ctx.getTransform();
  const scaleX = transform.a;

  const minScreenSize = 2;
  const queue = [{ x, y, size }];

  // World-space visible bounds
  const halfW = canvasWidth / 2;
  const halfH = canvasHeight / 2;
  const left = (-offset.x - halfW) / zoom;
  const right = (-offset.x + halfW) / zoom;
  const top = (-offset.y - halfH) / zoom;
  const bottom = (-offset.y + halfH) / zoom;

  while (queue.length > 0) {
    const tri = queue.pop();
    const screenSize = tri.size * scaleX;

    const h = (Math.sqrt(3) / 4) * tri.size;

    // Triangle bounding box (world space)
    const triLeft = tri.x - tri.size / 2;
    const triRight = tri.x + tri.size / 2;
    const triTop = tri.y;
    const triBottom = tri.y + (Math.sqrt(3) / 2) * tri.size;

    // Cull if outside screen bounds
    if (triRight < left || triLeft > right || triBottom < top || triTop > bottom) continue;

    if (screenSize < minScreenSize) continue;

    if (screenSize < 10) {
      ctx.beginPath();
      ctx.moveTo(tri.x, tri.y);
      ctx.lineTo(tri.x + tri.size / 2, tri.y + (Math.sqrt(3) / 2) * tri.size);
      ctx.lineTo(tri.x - tri.size / 2, tri.y + (Math.sqrt(3) / 2) * tri.size);
      ctx.closePath();
      ctx.fill();
    } else {
      const half = tri.size / 2;
      queue.push({ x: tri.x, y: tri.y, size: half });
      queue.push({ x: tri.x - half / 2, y: tri.y + h, size: half });
      queue.push({ x: tri.x + half / 2, y: tri.y + h, size: half });
    }
  }
};

const CanvasTriangle = () => {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const renderRef = useRef(null);
  const render = useCallback(() => {
    if (renderRef.current) cancelAnimationFrame(renderRef.current);
    renderRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const { width, height } = canvas;
      // Inside your render function:
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.translate(width / 2 + offset.x, height / 2 + offset.y); // <-- Changed from height / 4 to height / 2
      ctx.scale(zoom, zoom);
      ctx.fillStyle = "black";

      const baseSize = 600;
      drawSierpinskiIterative(ctx, 0, -baseSize / Math.sqrt(3), baseSize, zoom, offset, width, height);
    });
  }, [offset, zoom]);

  useEffect(() => {
    render();
    return () => {
      if (renderRef.current) cancelAnimationFrame(renderRef.current);
    };
  }, [render]);

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.max(0.01, Math.min(zoom * zoomFactor, 220000));

      const dx = mouseX - (canvas.width / 2 + offset.x);
      const dy = mouseY - (canvas.height / 2 + offset.y);

      setOffset((prev) => ({
        x: prev.x + dx * (1 - newZoom / zoom),
        y: prev.y + dy * (1 - newZoom / zoom),
      }));

      setZoom(newZoom);
    },
    [offset, zoom]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        e.preventDefault();
        e.stopPropagation();
        handleWheel(e);
      }
    };

    document.addEventListener("wheel", onWheel, { passive: false, capture: true });

    return () => {
      document.removeEventListener("wheel", onWheel, { capture: true });
    };
  }, [handleWheel]);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      style={{
        userSelect: "none",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        margin: 0,
      }}>
      <h2>Zoom: {zoom.toFixed(2)}</h2>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          border: "1px solid black",
          cursor: isDragging.current ? "grabbing" : "grab",
          backgroundColor: "#fff",
          display: "block",
          touchAction: "none",
          userSelect: "none",
        }}
      />
    </div>
  );
};

export default CanvasTriangle;
