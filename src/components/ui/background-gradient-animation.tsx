"use client";
import { cn } from "../../lib/utils";
import React, { useEffect, useRef, useState } from "react";

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

  const [curX, setCurX] = useState(0);
  const [curY, setCurY] = useState(0);
  const [tgX, setTgX] = useState(0);
  const [tgY, setTgY] = useState(0);

  useEffect(() => {
    let animId: number;
    function move() {
      if (interactiveRef.current) {
        setCurX((prev) => {
          const next = prev + (tgX - prev) / 15;
          return next;
        });
        setCurY((prev) => {
          const next = prev + (tgY - prev) / 15;
          return next;
        });
        interactiveRef.current.style.transform = `translate(${Math.round(
          curX
        )}px, ${Math.round(curY)}px)`;
      }
      animId = requestAnimationFrame(move);
    }
    animId = requestAnimationFrame(move);
    return () => cancelAnimationFrame(animId);
  }, [tgX, tgY, curX, curY]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTgX(event.clientX - rect.left);
      setTgY(event.clientY - rect.top);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={interactive ? handleMouseMove : undefined}
      className={cn(
        "relative overflow-hidden w-full",
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
      <div className="gradients-container absolute inset-0 pointer-events-none overflow-hidden blur-3xl opacity-80">
        <div
          className="absolute [transform-origin:center_center] animate-first"
          style={{
            width: size,
            height: size,
            top: `calc(50% - ${size} / 2)`,
            left: `calc(50% - ${size} / 2)`,
            background: `radial-gradient(circle at center, rgba(${firstColor}, 0.5) 0%, rgba(${firstColor}, 0) 65%)`,
          }}
        />
        <div
          className="absolute [transform-origin:calc(50%-250px)] animate-second"
          style={{
            width: size,
            height: size,
            top: `calc(50% - ${size} / 2)`,
            left: `calc(50% - ${size} / 2)`,
            background: `radial-gradient(circle at center, rgba(${secondColor}, 0.75) 0%, rgba(${secondColor}, 0) 65%)`,
          }}
        />
        <div
          className="absolute [transform-origin:calc(50%+250px)] animate-third"
          style={{
            width: size,
            height: size,
            top: `calc(50% - ${size} / 2)`,
            left: `calc(50% - ${size} / 2)`,
            background: `radial-gradient(circle at center, rgba(${thirdColor}, 0.6) 0%, rgba(${thirdColor}, 0) 65%)`,
          }}
        />
        <div
          className="absolute [transform-origin:calc(50%-150px)] animate-fourth"
          style={{
            width: size,
            height: size,
            top: `calc(50% - ${size} / 2)`,
            left: `calc(50% - ${size} / 2)`,
            background: `radial-gradient(circle at center, rgba(${fourthColor}, 0.65) 0%, rgba(${fourthColor}, 0) 65%)`,
          }}
        />
        <div
          className="absolute [transform-origin:calc(50%-400px)_calc(50%+400px)] animate-fifth"
          style={{
            width: size,
            height: size,
            top: `calc(50% - ${size} / 2)`,
            left: `calc(50% - ${size} / 2)`,
            background: `radial-gradient(circle at center, rgba(${fifthColor}, 0.5) 0%, rgba(${fifthColor}, 0) 65%)`,
          }}
        />

        {interactive && (
          <div
            ref={interactiveRef}
            className="absolute -top-1/4 -left-1/4 transition-transform duration-75 pointer-events-none"
            style={{
              width: size,
              height: size,
              background: `radial-gradient(circle at center, rgba(${pointerColor}, 0.65) 0%, rgba(${pointerColor}, 0) 65%)`,
            }}
          />
        )}
      </div>
    </div>
  );
};
