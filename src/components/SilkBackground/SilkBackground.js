'use client';

import { useEffect, useMemo, useRef } from 'react';
import styles from './SilkBackground.module.css';

function hexToRgb(hex) {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length !== 6) return { r: 194, g: 123, b: 76 };

  const n = Number.parseInt(normalized, 16);
  if (Number.isNaN(n)) return { r: 194, g: 123, b: 76 };

  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}

export default function SilkBackground({
  speed = 16,
  scale = 1.2,
  color = '#c27b4c',
  noiseIntensity = 1.5,
  rotation = 6.2,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const timeRef = useRef(0);

  const rgb = useMemo(() => hexToRgb(color), [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();

      ctx.translate(width / 2, height / 2);
      ctx.rotate(rotation);
      ctx.translate(-width / 2, -height / 2);

      const spacing = Math.max(8, 16 * scale);
      const lineCount = Math.ceil(height / spacing) + 4;
      const amplitude = 18 * scale;
      const freq = 0.008 / scale;
      const time = timeRef.current;

      for (let i = -2; i < lineCount; i += 1) {
        const yBase = i * spacing;
        const alpha = 0.035 + ((i % 5) / 5) * 0.05;

        ctx.beginPath();
        for (let x = -width * 0.25; x <= width * 1.25; x += 8) {
          const curve =
            Math.sin(x * freq + time + i * 0.35) * amplitude +
            Math.sin(x * (freq * 0.42) - time * 1.3 + i * 0.2) * (amplitude * 0.55);

          const grain = Math.sin((x + i * 31.7) * 0.03 + time * 3.2) * noiseIntensity * 2.1;
          const y = yBase + curve + grain;

          if (x === -width * 0.25) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }

      ctx.restore();
    };

    const tick = () => {
      timeRef.current += (reduceMotion ? 0.0009 : 0.0023) * speed;
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };

    resize();
    draw();
    rafRef.current = requestAnimationFrame(tick);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [speed, scale, noiseIntensity, rotation, rgb]);

  return <canvas ref={canvasRef} className={styles.silkCanvas} />;
}
