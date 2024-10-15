import { Badge, Card, Flex, Metric, Text } from "@tremor/react";
import { useWizard } from "react-use-wizard";

import { ContinueButton } from "../button";

export function IntroStep() {
  const { nextStep, previousStep, activeStep, stepCount } = useWizard();
  return (
    <div>
      <Card>
        <Badge size="xs">{`Step 1 of 3`}</Badge>
        <h1 className="mb-2 mt-4 text-3xl font-semibold">
          Welcome to Metrik &#128075;
        </h1>

        <div className="mb-3 pb-12">
          <Text>
            Hey there! We are so happy that you chose to take advantage of our
            amazing tools to help make your game better. This is just a quick
            onboarding so we can get you and your team up and running with Metrik.
           
          </Text>
        </div>
      </Card>

      <Flex justifyContent="end" className="mt-4">
        <ContinueButton nextStep={() => void nextStep()} />
      </Flex>
    </div>
  );
}
