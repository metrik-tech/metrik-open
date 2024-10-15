import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/16/solid";

import { Button } from "@/components/merlin/button";

interface ContinueButtonProps {
  nextStep: (() => void) | undefined;
}

//

export function ContinueButton({ nextStep }: ContinueButtonProps) {
  return (
    <Button onClick={nextStep} suffix={ArrowRightIcon} size="sm">
      Continue
    </Button>
  );
}

interface BackButtonProps {
  previousStep: (() => void) | undefined;
}

export function BackButton({ previousStep }: BackButtonProps) {
  return (
    <Button
      onClick={previousStep}
      prefix={ArrowLeftIcon}
      variant="outline"
      size="sm"
    >
      Back
    </Button>
  );
}
