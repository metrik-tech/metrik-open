import {
  memo,
  useEffect,
  type FC,
  type MutableRefObject,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import type { Variants } from "framer-motion";
import { useWizard } from "react-use-wizard";

const MotionDiv = dynamic(() =>
  import("framer-motion").then((mod) => mod.motion.div),
);

const variants: Variants = {
  enter: (direction: number) => {
    return {
      //   x: direction > 0 ? 800 : -800,
      opacity: 0,
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      //   x: direction < 0 ? 800 : -800,
      opacity: 0,
    };
  },
};

type Props = {
  children: ReactNode;
  previousStep: MutableRefObject<number>;
};

export const AnimatedStep: FC<Props> = memo(function Step({
  children,
  previousStep: previousStepIndex,
}) {
  const { activeStep } = useWizard();

  useEffect(() => {
    return () => {
      previousStepIndex.current = activeStep;
    };
  }, [activeStep, previousStepIndex]);

  return (
    <MotionDiv
      custom={activeStep - previousStepIndex.current}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        ease: "easeInOut",
        duration: 0.1,
      }}
    >
      {children}
    </MotionDiv>
  );
});
