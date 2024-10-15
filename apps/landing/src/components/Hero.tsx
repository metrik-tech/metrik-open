"use client";

import React, { useRef, useState } from "react";
import type { NextPage } from "next";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { twMerge } from "tailwind-merge";

export const HeroScrollPreview = () => {
  return (
    <div className="flex flex-col bg-white">
      <HeroScroll />
    </div>
  );
};
export const HeroScroll = () => {
  const { scrollYProgress } = useScroll();
  const [isMobile, setIsMobile] = useState(false);
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [0.95, 1];
  };

  const rotate = useTransform(scrollYProgress, [0.15, 0.65], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const grayscale = useTransform(
    scrollYProgress,
    (v) => `grayscale(${v < 0.2 ? (1 - v).toFixed(2) : 0})`,
  );

  return (
    <div className="relative flex h-[100vh] flex-col items-center justify-center ">
      <div
        className="relative w-full py-20 md:py-40"
        style={{
          perspective: "1000px",
        }}
      >
        <Card
          rotate={rotate as unknown as number}
          translate={translate as unknown as number}
          scale={scale as unknown as number}
          grayscale={grayscale as unknown as string}
        />
      </div>
    </div>
  );
};

export const Header = ({ translate }: { translate: string }) => {
  return (
    <motion.div className="div mx-auto max-w-5xl text-center">
      <h1 className="text-4xl font-semibold">
        The Operations platform for Roblox
      </h1>
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  translate,
  grayscale,
}: {
  rotate: number;
  scale: number;
  translate: number;
  grayscale: string;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate, // rotate in X-axis
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
        filter: grayscale,
      }}
      className="mx-auto w-full max-w-[950px] rounded-[24px] border-2 border-neutral-500 bg-[#222222] p-4 shadow-2xl md:rounded-[30px] md:border-4 md:p-6"
    >
      <img src="/screenshot.jpg" className="rounded-[10px] md:rounded-[14px]" />
    </motion.div>
  );
};
