"use client";

import { motion } from "framer-motion";

export const CTAButton = () => {
  return (
    <div className="group relative mb-8 inline-block cursor-pointer rounded-full  bg-gradient-to-t from-blue-600 to-blue-600/90 p-px font-medium leading-6 text-neutral-50 no-underline shadow-zinc-900 transition-transform ease-in-out active:scale-105">
      <span className="absolute inset-0 z-20 overflow-hidden rounded-full">
        <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(59,130,246,1)_0%,rgba(59,130,246,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>
      </span>
      <button className="relative z-20 flex items-center rounded-full px-5 py-2 text-base ring-1 ring-white/10 ">
        <span>Join the waitlist</span>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10.75 8.75L14.25 12L10.75 15.25"
            className="transition-transform duration-500 ease-in-out group-hover:translate-x-1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
          ></motion.path>
        </svg>
      </button>
      <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-blue-400/0 via-blue-600/40 to-blue-400/0 transition-opacity duration-500 group-hover:opacity-40"></span>
    </div>
  );
};
