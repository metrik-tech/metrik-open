import type { Dispatch } from "react";
// import { generateStudioName } from "@/utils/gen-studio-name";

import { useState } from "react";
import { Badge, Card, Flex, Text, TextInput } from "@tremor/react";
import { useWizard } from "react-use-wizard";

import { JoinStudioModal } from "@/components/join-studio-modal";
import { Button } from "@/components/merlin/button";
import { BackButton, ContinueButton } from "../button";

export function StudioStep({
  setParentStudioName,
}: {
  setParentStudioName: Dispatch<string>;
}) {
  const { nextStep, previousStep, activeStep, stepCount } = useWizard();
  const [error, setError] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [studioName, setStudioName] = useState<string>("");

  const handleNextStep = () => {
    if (!studioName?.length) {
      setErrorMsg("You have to name your studio!");

      return;
    } else if (studioName.length > 30) {
      setErrorMsg("Please make sure your studio name is under 30 characters.");

      return;
    } else if (studioName.length <= 3) {
      setErrorMsg(
        "Please make sure your studio name is longer than 3 characters",
      );

      return;
    }

    setErrorMsg(undefined);
    setParentStudioName(studioName);
    return nextStep ? nextStep() : null;
  };

  // const handleGenerateStudioName = () => {
  //   setStudioName(generateStudioName());
  //   setError(false);
  // };

  return (
    <div>
      <Card>
        <Badge size="xs">{`Step 2 of 3`} </Badge>
        <h1 className="mb-2 mt-4 text-3xl font-semibold">Your Studio</h1>
        <div className="mb-6">
          <Text>
            The first thing we need from you is a name for a studio! Studios are
            the container for all your projects. You can add team members so
            they can collaborate and create projects so you can use Metrik to
            it&apos;s fullest.
          </Text>
        </div>
        <div className="my-3">
          <p className="mb-0.5 text-xs text-neutral-500">Studio Name</p>

          <TextInput
            name="Studio Name"
            errorMessage={errorMsg}
            error={!!errorMsg}
            placeholder="Awesome Studios"
            className="max-w-sm"
            value={studioName}
            onChange={(event) => setStudioName(event.target.value)}
          />

          {/* <button
            className=" text-xs text-neutral-500"
            onClick={handleGenerateStudioName}
          >
            Generate one for me
          </button> */}
        </div>
      </Card>

      <Flex className="mt-4">
        <BackButton previousStep={previousStep} />
        <div className="flex items-center justify-start gap-x-2">
          <JoinStudioModal
            trigger={
              <Button variant="ghost" size="sm">
                I want to join a Studio instead
              </Button>
            }
          />
          <ContinueButton nextStep={() => void handleNextStep()} />
        </div>
      </Flex>
    </div>
  );
}
