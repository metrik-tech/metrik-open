import { useState } from "react";
import { useRouter } from "next/router";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { useMutation } from "@tanstack/react-query";
import { Badge, Card, Flex, NumberInput, Text, TextInput, Callout } from "@tremor/react";
import { useWizard } from "react-use-wizard";
import { toast } from "sonner";

import type { Project, Studio } from "@metrik/db/client";

import { Button } from "@/components/merlin/button";
import { api } from "@/utils/api";
import { BackButton } from "../button";

export function ProjectStep({ studio }: { studio: string }) {
  const { nextStep, previousStep, activeStep, stepCount } = useWizard();
  const router = useRouter();

  const { isPending: isLoading, mutate } =
    api.onboarding.onboarding.useMutation({
      onSuccess: async (url) => {
        // toast.success(data.apiKey);
        // nextStep();

        await router.push(url);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  //   mutationFn: async (id: string) => {
  //     setLoadingText("Creating studio");
  //     const studioReq = await fetch("/api/studios/create", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         name: studio,
  //       }),
  //     }).catch((error) => {
  //       throw new Error(String(error.message));
  //     });

  //     if (studioReq.status !== 200) {
  //       const body = await studioReq.json();
  //       throw new Error(String(body.message));
  //     }

  //     const studioData = await studioReq.json();

  //     setLoadingText("Creating project");
  //     const createReq = await fetch("/api/projects/create", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         name: projectName,
  //         placeId: parseInt(id),
  //         studioId: studioData.id,
  //       }),
  //     }).catch((error) => {
  //       throw new Error(String(error.message));
  //     });

  //     if (createReq.status !== 200) {
  //       const body = await createReq.json();

  //       await fetch("/api/studios/delete", {
  //         method: "POST",

  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           id: studioData.id,
  //         }),
  //       });

  //       throw new Error(String(body.message));
  //     }

  //     return createReq.json();
  //   },
  //   onSuccess: (data) => {
  //     toast.success("Successfully created project!");
  //     // toast.success(data.apiKey);
  //     // nextStep();

  //     router.push(`/app/${data.id}/analytics?isNewUser=true`);
  //   },
  //   onError: (error: Error) => {
  //     toast.error(error.message);
  //   },
  // });

  const [projectName, setProjectName] = useState<string>("");
  const [nameErrorMsg, setNameErrorMsg] = useState<string>("");

  const [placeId, setPlaceId] = useState<number>();
  const [idErrorMsg, setIdErrorMsg] = useState<string>("");

  const [openCloudToken, setOpenCloudToken] = useState<string>("");
  const [openCloudTokenError, setOpenCloudTokenError] = useState<string>("");

  const handleCreateProject = () => {
    if (!projectName?.length) {
      setNameErrorMsg("You have to name your project!");

      return;
    } else if (projectName.length > 30) {
      setNameErrorMsg(
        "Please make sure your project name is under 30 characters.",
      );

      return;
    } else if (projectName.length <= 3) {
      setNameErrorMsg(
        "Please make sure your project name is longer than 3 characters",
      );

      return;
    }

    setNameErrorMsg("");

    // if (!placeId) {
    //   setIdErrorMsg("You have to enter a Place ID!");

    //   return;
    // }

    // setIdErrorMsg("");

    // if (!openCloudToken?.length) {
    //   setOpenCloudTokenError("You have to enter an Open Cloud API Key!");

    //   return;
    // }

    mutate({
      name: projectName,
      // placeId,
      studioName: studio,
      // openCloudToken,
    });
  };

  return (
    <div>
      <Card>
        <Badge size="xs">{`Step 3 of 3`}</Badge>
        <h1 className="mb-2 mt-4 text-3xl font-semibold">The First Project</h1>
        <div className="mb-6">
          <Text>
            Projects are the individual experiences that are being managed on
            Metrik. Projects are connected to a universe on Roblox.
          </Text>
          
        </div>
        <div className="my-3">
          <div className="mb-6 w-full sm:max-w-sm">
            <p className="mb-0.5 text-xs text-neutral-500">Project Name</p>
            <TextInput
              name="Project Name"
              error={!!nameErrorMsg}
              errorMessage={nameErrorMsg}
              placeholder="Crossroads"
              onValueChange={(value: string) => setProjectName(value)}
            />
          </div>
          {/* <div className="mb-6 w-full sm:max-w-sm">
            <p className="mb-0.5 text-xs text-neutral-500">Place ID </p>

            <NumberInput
              name="Place ID"
              error={!!idErrorMsg}
              errorMessage={idErrorMsg}
              value={placeId}
              placeholder="1234567890"
              enableStepper={false}
              onValueChange={(value) => setPlaceId(value)}
            />
            <p className="mt-0.5 text-xs text-neutral-500">
              Learn how to get it{" "}
              <button
                onClick={() => {
                  showArticle(7791750);
                }}
                className="text-blue-500"
              >
                here
              </button>
            </p>
          </div>
          <div className="mb-6 w-full sm:max-w-sm">
            <p className="mb-0.5 text-xs text-neutral-500">
              Open Cloud API Key
            </p>
            <TextInput
              name="Open Cloud Token"
              error={!!openCloudTokenError}
              errorMessage={openCloudTokenError}
              type="password"
              placeholder="•••••••••••••••••••••••••"
              onValueChange={(value: string) => setOpenCloudToken(value)}
            />
          </div> */}
        </div>
      </Card>

      <Flex className="mt-4">
        <BackButton previousStep={previousStep} />
        {/* <ContinueButton nextStep={nextStep} /> */}
        <Button
          onClick={handleCreateProject}
          suffix={ArrowRightIcon}
          loading={isLoading}
          size="sm"
        >
          Connect to Roblox
        </Button>
      </Flex>
    </div>
  );
}
