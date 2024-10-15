// function determineUrl() {
//   if (!process.env.NEXT_PUBLIC_VERCEL_ENV) {
//     return config.localUrl || "";
//   }

//   if (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") {
//     return config.previewUrl || "";
//   }

//   if (process.env.NEXT_PUBLIC_VERCEL_ENV === "production") {
//     return config.productionUrl || "";
//   }
// }

const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV === "preview") {
    return `https://preview.metrik.app`; // SSR should use vercel url
  }

  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV === "production") {
    return `https://alpha.metrik.app`; // SSR should use vercel url
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

export enum ValidServices {
  Discord = "DISCORD",
  Slack = "SLACK",
  Guilded = "GUILDED",
}

interface NotificationService {
  name: string;
  urlFormat: string;
  regex: RegExp;
  icon: JSX.Element;
  id: ValidServices;
}

const notificationServices: NotificationService[] = [
  {
    name: "Discord",
    urlFormat: "https://discord.com/api/webhooks/",
    regex:
      /^https?:\/\/(?:www\.|ptb\.|canary\.)?discord(?:app)?\.com\/api(?:\/v\d+)?\/webhooks\/\d+\/[\w-]+(?!:\?thread_id=\d+)$/,
    icon: (
      <svg
        viewBox="0 -28.5 256 256"
        preserveAspectRatio="xMidYMid"
        className="h-6 w-6"
      >
        <g>
          <path
            d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
            fill="#5865F2"
            fillRule="nonzero"
          />
        </g>
      </svg>
    ),
    id: ValidServices.Discord,
  },
  {
    name: "Slack",
    urlFormat: "https://hooks.slack.com/services/",
    regex:
      /^https:\/\/hooks\.slack\.com\/services\/T\w{8,12}\/B\w{8,12}\/\w{24,48}$/,
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 127 127">
        <path
          d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z"
          fill="#E01E5A"
        />
        <path
          d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z"
          fill="#36C5F0"
        />
        <path
          d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z"
          fill="#2EB67D"
        />
        <path
          d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z"
          fill="#ECB22E"
        />
      </svg>
    ),
    id: ValidServices.Slack,
  },
  {
    name: "Guilded",
    urlFormat: "https://media.guilded.gg/webhooks/",
    regex:
      /^https:\/\/media\.guilded\.gg\/webhooks\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/\w+$/,
    icon: (
      <svg viewBox="0 0 100.1 88.6" className="h-6 w-6" fill="#F5C400">
        <g>
          <path
            d="M38.8,40.7A63.26,63.26,0,0,0,44.9,65C51,76.9,59.5,84.5,66.5,87.5,73.7,84,80.7,78,84.6,71.6H64.7c-5.2-4.4-9.2-11.6-10.2-20h59.2a90.55,90.55,0,0,1-15,33.8,71,71,0,0,1-31.9,24H66.2c-21.1-8.6-32.4-22.1-39.9-37.3-4.8-9.8-9.8-27.5-9.8-51.3H116.6a153.89,153.89,0,0,1-1.3,20H38.8V40.7Z"
            transform="translate(-16.5 -20.8)"
          />
        </g>
      </svg>
    ),
    id: ValidServices.Guilded,
  },
];

interface Config {
  feedbackUrl: string;
  docsUrl: string;
  baseUrl: () => string;
  localUrl: string;
  previewUrl: string;
  productionUrl: string;
  supportUrl: string;
  statusUrl: string;
  determineUrl: () => string;
  discordServer: string;
  tagline: string;
  notificationServices: NotificationService[];
  validEvents: typeof ValidEvents;
  services: typeof ValidServices;
}

export enum ValidEvents {
  Milestones = "MILESTONES",
  Usage = "USAGE",
  Errors = "ERRORS",
  Revenue = "REVENUE",
}

const config: Config = {
  feedbackUrl: "https://metrik.canny.io/",
  docsUrl: "https://docs.metrik.app/",
  baseUrl: getBaseUrl,
  localUrl: "http://localhost:3000/",
  previewUrl: "https://preview.metrik.app/",
  productionUrl: "https://metrik.app/",
  supportUrl: "https://support.metrik.app/",
  statusUrl: "https://metrik.instatus.com/",
  discordServer: "https://discord.gg/Xdy5AhqTrS",
  determineUrl: getBaseUrl,
  tagline: "Automated LiveOps toolkit for Roblox developers.",
  notificationServices,
  validEvents: ValidEvents,
  services: ValidServices,
};

export default config;
