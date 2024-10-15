/* eslint-disable react/no-unknown-property */
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/16/solid";

export default function Landing() {
  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="mx-auto flex max-w-4xl items-center justify-between py-6">
        <div>Metrik</div>
        <div className="flex items-center justify-between gap-x-8">
          <p>Features</p>
          <p>Pricing</p>
          <p>Community</p>
        </div>
        <div>
          <button className="flex items-center rounded-full border-2 px-4 py-1 font-medium">
            Log in <ChevronRightIcon className="ml-0.5 h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-6 rounded-[36px] bg-gradient-to-b from-blue-500/15 to-blue-500/5 p-4 pt-32">
        <div className="mb-8 space-y-8 px-6">
          <h1 className="text-4xl font-semibold md:text-5xl md:leading-[1.2]">
            An operations toolkit made{" "}
            <span className="md:block md:text-zinc-500">
              for Roblox game developers
            </span>
          </h1>

          <Link
            href="https://alpha.metrik.app"
            className="flex items-center space-x-1.5 font-medium text-blue-500"
          >
            Start now <ChevronRightIcon className="h-5 w-5" />
          </Link>
        </div>
        <img
          src="/screenshot.jpg"
          className="w-full rounded-[20px] border-2 border-blue-500/5 shadow"
          fetchPriority={"high"}
          loading={"eager"}
          decoding={"async"}
        />
      </div>

      <div className="mx-auto mb-64 max-w-4xl">
        <div className="mt-64">
          <h1 className="text-3xl font-semibold">
            Track the state of your experience
          </h1>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="grid h-[500px] gap-4">
              <div className="relative rounded-xl border border-black/5 bg-zinc-50">
                <div className="absolute bottom-4 left-4">
                  <h2 className="text-lg font-medium">Quick and easy</h2>
                  <p className="text-sm text-zinc-500">
                    See important statistics at a glance
                  </p>
                </div>
              </div>
              <div className="relative rounded-xl border border-black/5 bg-zinc-50">
                <div className="absolute bottom-4 left-4">
                  <h2 className="text-lg font-medium">Deep insights</h2>
                  <p className="text-sm text-zinc-500">
                    Understand things for what they really are
                  </p>
                </div>
              </div>
            </div>
            <div className="relative h-[500px] rounded-xl border border-black/5 bg-zinc-50">
              <div className="absolute bottom-4 left-4 z-20">
                <h2 className="text-lg font-medium">Immediate alerts</h2>
                <p className="text-sm text-zinc-500">
                  Get notifications when things go wrong
                </p>
              </div>
              <div className="left-0 top-0 h-[500px] w-full overflow-hidden rounded-xl">
                <svg
                  viewBox="0 0 1107 1107"
                  className="h-[1107px] w-[1107px] -translate-y-[14rem] translate-x-[-15rem] md:translate-x-[-30rem]"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="553.24"
                    cy="553.24"
                    r="90"
                    transform="rotate(165 553.24 553.24)"
                    fill="white"
                  />
                  <circle
                    cx="553.24"
                    cy="553.24"
                    r="89"
                    transform="rotate(165 553.24 553.24)"
                    stroke="url(#paint0_linear_283_35)"
                    strokeOpacity="0.2"
                    strokeWidth="2"
                  />
                  <circle
                    cx="553.24"
                    cy="553.24"
                    r="180"
                    transform="rotate(43.9203 553.24 553.24)"
                    fill="url(#paint1_radial_283_35)"
                  />
                  <circle
                    cx="553.24"
                    cy="553.24"
                    r="179"
                    transform="rotate(43.9203 553.24 553.24)"
                    stroke="url(#paint2_linear_283_35)"
                    strokeOpacity="0.4"
                    strokeWidth="2"
                  />
                  <circle
                    cx="553.24"
                    cy="553.24"
                    r="270"
                    fill="url(#paint3_radial_283_35)"
                  />
                  <circle
                    cx="553.24"
                    cy="553.24"
                    r="269"
                    stroke="url(#paint4_linear_283_35)"
                    strokeOpacity="0.4"
                    strokeWidth="2"
                  />
                  <circle
                    cx="553.24"
                    cy="553.24"
                    r="405"
                    transform="rotate(-30 553.24 553.24)"
                    fill="url(#paint5_radial_283_35)"
                  />
                  <circle
                    cx="553.24"
                    cy="553.24"
                    r="404"
                    transform="rotate(-30 553.24 553.24)"
                    stroke="url(#paint6_linear_283_35)"
                    strokeOpacity="0.4"
                    strokeWidth="2"
                  />
                  <rect
                    x="494.74"
                    y="494.74"
                    width="117"
                    height="117"
                    rx="58.5"
                    stroke="#3B82F6"
                    strokeOpacity="0.24"
                    strokeWidth="3"
                  />
                  <rect
                    x="502.24"
                    y="502.24"
                    width="102"
                    height="102"
                    rx="51"
                    fill="#3B82F6"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M526.24 553.256C526.24 547.624 527.95 542.414 530.884 538.089L537.976 545.177C536.718 547.577 536.037 550.238 535.986 552.947C535.934 555.656 536.514 558.34 537.68 560.786L530.567 567.916C527.823 563.697 526.24 558.635 526.24 553.235V553.256ZM545.659 537.625L538.567 530.559C542.666 527.913 547.406 526.426 552.284 526.257C557.161 526.087 561.993 527.241 566.267 529.595C570.541 531.95 574.096 535.418 576.557 539.63C579.017 543.842 580.289 548.641 580.239 553.518C580.189 558.395 578.817 563.167 576.271 567.328C573.725 571.489 570.098 574.882 565.777 577.149C561.455 579.415 556.601 580.469 551.728 580.199C546.855 579.929 542.147 578.345 538.102 575.615L545.068 568.654C547.714 570.111 550.693 570.86 553.714 570.828C556.736 570.797 559.698 569.985 562.313 568.473C564.929 566.961 567.109 564.799 568.643 562.197C570.176 559.595 571.011 556.642 571.067 553.622C571.122 550.603 570.396 547.621 568.959 544.964C567.522 542.308 565.423 540.067 562.865 538.46C560.307 536.853 557.376 535.934 554.358 535.791C551.34 535.648 548.336 536.288 545.637 537.646L545.659 537.625ZM547.643 547.392C546.067 548.966 545.182 551.102 545.182 553.33C545.182 555.557 546.067 557.693 547.643 559.267C549.218 560.842 551.356 561.727 553.584 561.727C555.813 561.727 557.95 560.842 559.526 559.267C560.306 558.488 560.925 557.562 561.347 556.543C561.77 555.524 561.987 554.432 561.987 553.33C561.987 552.227 561.77 551.135 561.347 550.116C560.925 549.097 560.306 548.171 559.526 547.392C558.746 546.612 557.819 545.993 556.8 545.571C555.78 545.149 554.688 544.932 553.584 544.932C552.481 544.932 551.388 545.149 550.369 545.571C549.349 545.993 548.423 546.612 547.643 547.392Z"
                    fill="url(#paint7_linear_283_35)"
                    fillOpacity="0.8"
                  />
                  <defs>
                    <linearGradient
                      id="paint0_linear_283_35"
                      x1="553.24"
                      y1="463.24"
                      x2="553.24"
                      y2="643.24"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#3B82F6" />
                      <stop offset="1" stopColor="#3B82F6" stopOpacity="0.5" />
                    </linearGradient>
                    <radialGradient
                      id="paint1_radial_283_35"
                      cx="0"
                      cy="0"
                      r="1"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="translate(553.24 553.24) rotate(90) scale(180)"
                    >
                      <stop stopColor="white" stopOpacity="0" />
                      <stop offset="1" stopColor="#3B82F6" stopOpacity="0.04" />
                    </radialGradient>
                    <linearGradient
                      id="paint2_linear_283_35"
                      x1="553.24"
                      y1="373.24"
                      x2="553.24"
                      y2="733.24"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#3B82F6" />
                      <stop
                        offset="0.447917"
                        stopColor="#3B82F6"
                        stopOpacity="0.2"
                      />
                    </linearGradient>
                    <radialGradient
                      id="paint3_radial_283_35"
                      cx="0"
                      cy="0"
                      r="1"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="translate(553.24 553.24) rotate(90) scale(270)"
                    >
                      <stop stopColor="white" stopOpacity="0" />
                      <stop offset="1" stopColor="#3B82F6" stopOpacity="0.04" />
                    </radialGradient>
                    <linearGradient
                      id="paint4_linear_283_35"
                      x1="553.24"
                      y1="283.24"
                      x2="553.24"
                      y2="823.24"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#3B82F6" />
                      <stop
                        offset="0.447917"
                        stopColor="#3B82F6"
                        stopOpacity="0.2"
                      />
                    </linearGradient>
                    <radialGradient
                      id="paint5_radial_283_35"
                      cx="0"
                      cy="0"
                      r="1"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="translate(553.24 553.24) rotate(90) scale(405)"
                    >
                      <stop stopColor="white" stopOpacity="0" />
                      <stop offset="1" stopColor="#3B82F6" stopOpacity="0.04" />
                    </radialGradient>
                    <linearGradient
                      id="paint6_linear_283_35"
                      x1="553.24"
                      y1="148.24"
                      x2="553.24"
                      y2="958.24"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#3B82F6" />
                      <stop
                        offset="0.447917"
                        stopColor="#3B82F6"
                        stopOpacity="0.2"
                      />
                    </linearGradient>
                    <linearGradient
                      id="paint7_linear_283_35"
                      x1="553.24"
                      y1="526.24"
                      x2="553.24"
                      y2="580.24"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="white" />
                      <stop offset="1" stopColor="white" stopOpacity="0.5" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
