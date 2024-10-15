"use client";

// import { StepWizard } from "@/components/StepWizard";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Wizard } from "react-use-wizard";
import { toast } from "sonner";

import { Layout } from "@/components/base-layout";
import { Logo } from "@/components/logo";
import { IntroStep, ProjectStep, StudioStep } from "@/components/onboarding";
import { AnimatedStep } from "@/components/onboarding/animated-step";
import { PageWrapper } from "@/components/page-wrapper";
import { api } from "@/utils/api";

const AnimatePresence = dynamic(() =>
  import("framer-motion").then((mod) => mod.AnimatePresence),
);

export default function Onboarding() {
  const [studio, setStudio] = useState("your studio");
  const previousStep = useRef(0);

  const { data } = api.users.getOnboardingStatus.useQuery();

  useEffect(() => {
    if (data) {
      toast("You've already been onboarded!", {
        duration: 9999999,
        dismissible: true,
      });
    }
  }, [data]);

  return (
    <Layout title="Onboarding">
      <div className="mx-5 mt-[11rem] max-h-screen min-h-screen sm:max-w-3xl md:mx-auto md:w-full">
        <div className="fixed left-4 top-4">
          <Logo />
        </div>

        <Wizard wrapper={<AnimatePresence initial={false} mode="wait" />}>
          <AnimatedStep previousStep={previousStep}>
            <IntroStep />
          </AnimatedStep>
          <AnimatedStep previousStep={previousStep}>
            <StudioStep setParentStudioName={setStudio} />
          </AnimatedStep>
          <AnimatedStep previousStep={previousStep}>
            <ProjectStep studio={studio} />
          </AnimatedStep>
        </Wizard>
      </div>
    </Layout>
  );
}
Onboarding.PageWrapper = PageWrapper;
