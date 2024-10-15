"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import Balancer from "react-wrap-balancer";

import { CTAButton } from "@/components/Button";
import { Circles } from "@/components/Circles";
import { HeroScroll } from "@/components/Hero";
import { Logo } from "@/components/Logo";
import { Spotlight } from "@/components/Spotlight";

// test

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Circles />

      <div className="z-[2] flex w-full flex-col">
        <div className="sticky top-0 z-30 w-full">
          <div className="flex w-full items-center justify-between border-b border-b-black/5 bg-white/95 px-6 py-4 backdrop-blur-sm">
            <div className="flex select-none items-center justify-start space-x-1.5">
              <Logo className="h-[1.3rem] w-[1.3rem]" />
              <span className="leading-0 text-xl font-medium">Metrik</span>
            </div>
            <div className="flex items-center space-x-1">
              <Link
                href="#features"
                className="rounded-xl px-3.5 py-1.5 text-sm font-medium text-neutral-500 transition-colors ease-in-out hover:bg-black/5 hover:text-neutral-900"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="rounded-xl px-3.5 py-1.5 text-sm font-medium text-neutral-500 transition-colors ease-in-out hover:bg-black/5 hover:text-neutral-900"
              >
                Pricing
              </Link>
              <Link
                href="#pricing"
                className="rounded-xl px-3.5 py-1.5 text-sm font-medium text-neutral-500 transition-colors ease-in-out hover:bg-black/5 hover:text-neutral-900"
              >
                Discord Server
              </Link>
            </div>
            <div className="flex items-center justify-end">
              <Link
                className="inline-block rounded-full bg-black/70 bg-gradient-to-t from-black/90 to-transparent px-5 py-2 text-sm font-medium text-white transition-all duration-200 ease-in-out hover:bg-black/60"
                href="https://alpha.metrik.app/auth/login"
              >
                Log in
              </Link>
            </div>
          </div>
          <div className="h-0 w-full overflow-visible">
            <div
              className="mask h-[35px] backdrop-blur-[3px]"
              style={{
                WebkitMask: "linear-gradient(#000,transparent)",
                mask: "linear-gradient(#000,transparent)",
              }}
            ></div>
          </div>
        </div>

        <div className="mx-auto pt-32">
          <h1 className="mx-auto inline-block max-w-7xl bg-[image:radial-gradient(75%_100%_at_50%_100%,rgba(0,0,0,0.7)_0%,rgba(0,0,0,1)_75%)] bg-clip-text py-2 text-center text-5xl font-semibold text-transparent md:text-5xl lg:text-6xl">
            <Balancer>
              Automated operations toolkit for Roblox game developers
            </Balancer>
          </h1>
          <p className="mx-auto mb-12 mt-2 max-w-3xl text-center text-neutral-500 md:max-w-4xl">
            <Balancer>
              Metrik is a cutting-edge web platform that enables you to manage,
              control and adjust every aspect of your Roblox experience from
              anywhere.
            </Balancer>
          </p>
          <div className="flex flex-col items-center justify-center">
            <CTAButton />
          </div>
        </div>

        <HeroScroll />
      </div>
    </main>
  );
}
