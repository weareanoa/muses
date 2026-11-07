"use client";
import { cn } from "../../lib/utils";
import React, { useEffect, useRef } from "react";

export const BackgroundGradientAnimation = ({
  gradientBackgroundStart = "rgb(252, 250, 245)",
  gradientBackgroundEnd = "rgb(249, 244, 233)",
  firstColor = "184, 134, 11",
  secondColor = "246, 221, 138",
  thirdColor = "212, 160, 23",
  fourthColor = "235, 196, 95",
  fifthColor = "194, 140, 29",
  pointerColor = "212, 160, 23",
  size = "75%",
  children,
  className,
  interactive = true,
  containerClassName,
}: {
  gradientBackgroundStart?: string;
  gradientBackgroundEnd?: string;
  firstColor?: string;
  secondColor?: string;
  thirdColor?: string;
  fourthColor?: string;
  fifthColor?: string;
  pointerColor?: string;
  size?: string;
  blendingValue?: string;
  children?: React.ReactNode;
  className?: string;
  interactive?: boolean;
  containerClassName?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const interactiveRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const moveRef = useRef<() => void>(() => {});

  useEffect(() => {
    const move = () => {
      rafRef.current = null;
      const pos = posRef.current;
      const target = targetRef.current;
      pos.x += (target.x - pos.x) / 15;
      pos.y += (target.y - pos.y) / 15;
      if (interactiveRef.current) {
        interactiveRef.current.style.transform = `translate(${Math.round(pos.x)}px, ${Math.round(pos.y)}px)`;
      }
      if (Math.abs(target.x - pos.x) > 0.5 || Math.abs(target.y - pos.y) > 0.5) {
        rafRef.current = requestAnimationFrame(move);
      }
    };
    moveRef.current = move;
    rafRef.current = requestAnimationFrame(move);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      targetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(moveRef.current);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={interactive ? handleMouseMove : undefined}
      className={cn(
        "relative overflow-clip w-full",
        containerClassName
      )}
      style={{
        background:
          gradientBackgroundStart && gradientBackgroundStart !== "transparent"
            ? `linear-gradient(135deg, ${gradientBackgroundStart}, ${gradientBackgroundEnd})`
            : undefined,
      }}
    >
      <div className={cn("relative z-10", className)}>{children}</div>
      <div className="gradients-container absolute inset-0 pointer-events-none overflow-hidden blur-[80px] sm:blur-[120px] opacity-50">
        <div
          className="absolute [transform-origin:center_center] animate-first"
          style={{
            width: size,
            height: size,
            top: `calc(50% - ${size} / 2)`,
            left: `calc(50% - ${size} / 2)`,
            background: `radial-gradient(circle at center, rgba(${firstColor}, 0.22) 0%, rgba(${firstColor}, 0) 65%)`,
          }}
        />
        <div
          className="absolute [transform-origin:calc(50%-250px)] animate-second"
          style={{
            width: size,
            height: size,
            top: `calc(50% - ${size} / 2)`,
            left: `calc(50% - ${size} / 2)`,
            background: `radial-gradient(circle at center, rgba(${secondColor}, 0.32) 0%, rgba(${secondColor}, 0) 65%)`,
          }}
        />
        <div
          className="absolute [transform-origin:calc(50%+250px)] animate-third"
          style={{
            width: size,
            height: size,
            top: `calc(50% - ${size} / 2)`,
            left: `calc(50% - ${size} / 2)`,
            background: `radial-gradient(circle at center, rgba(${thirdColor}, 0.2) 0%, rgba(${thirdColor}, 0) 65%)`,
          }}
        />
        <div
          className="absolute [transform-origin:calc(50%-150px)] animate-fourth"
          style={{
            width: size,
            height: size,
            top: `calc(50% - ${size} / 2)`,
            left: `calc(50% - ${size} / 2)`,
            background: `radial-gradient(circle at center, rgba(${fourthColor}, 0.26) 0%, rgba(${fourthColor}, 0) 65%)`,
          }}
        />
        <div
          className="absolute [transform-origin:calc(50%-400px)_calc(50%+400px)] animate-fifth"
          style={{
            width: size,
            height: size,
            top: `calc(50% - ${size} / 2)`,
            left: `calc(50% - ${size} / 2)`,
            background: `radial-gradient(circle at center, rgba(${fifthColor}, 0.18) 0%, rgba(${fifthColor}, 0) 65%)`,
          }}
        />

        {interactive && (
          <div
            ref={interactiveRef}
            className="absolute -top-1/4 -left-1/4 transition-transform duration-100 pointer-events-none"
            style={{
              width: size,
              height: size,
              background: `radial-gradient(circle at center, rgba(${pointerColor}, 0.22) 0%, rgba(${pointerColor}, 0) 65%)`,
            }}
          />
        )}
      </div>
    </div>
  );
};
