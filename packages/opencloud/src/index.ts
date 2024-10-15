// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObject = Record<string | number | symbol, any>;

function isAlphanumeric(str: string): boolean {
  return /^[a-z0-9]+$/i.test(str);
}

export interface OpenCloudSession {
  id: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: Date;
  refreshTokenExpires: Date;
}

interface GetUserResponse {
  path: string;
  createTime: string;
  id: string;
  name: string;
  displayName: string;
  about: string;
  locale: string;
  premium: boolean;
  verified: boolean;
  socialNetworkProfiles:
    | {
        facebook: string;
        twitter: string;
        youtube: string;
        twitch: string;
        guilded: string;
        visibility: string;
      }
    | undefined;
}

export class OpenCloud {
  private token = "";
  private session: OpenCloudSession;
  private sessionRefresh: (session: OpenCloudSession) => Promise<void>;
  private messagingError: (
    response: Response,
    project: { id: string; openCloudError: boolean },
  ) => Promise<void>;
  private project: { id: string; openCloudError: boolean };
  private clientId: string;
  private clientSecret: string;

  constructor({
    session,
    sessionRefresh,
    messagingError,
    project,
    clientId,
    clientSecret,
  }: {
    session: OpenCloudSession;
    sessionRefresh: (session: OpenCloudSession) => Promise<void>;
    messagingError: (
      response: Response,
      project: { id: string; openCloudError: boolean },
    ) => Promise<void>;
    clientId: string;
    project: { id: string; openCloudError: boolean };
    clientSecret: string;
  }) {
    this.session = session;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.sessionRefresh = sessionRefresh;
    this.messagingError = messagingError;
    this.project = project;
  }

  private async sessionMiddleware() {
    if (!(this.session.accessTokenExpires < new Date())) {
      return this.session;
    }

    const res = await fetch("https://apis.roblox.com/oauth/v1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.session.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!res.ok) {
      console.log(await res.text());
      await this.messagingError(res, this.project);
      throw new Error(`Failed to refresh token with code ${res.status}`);
    }

    const json = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    const session = {
      id: this.session.id,
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      accessTokenExpires: new Date(Date.now() + json.expires_in * 1000),
      refreshTokenExpires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
    };

    await this.sessionRefresh(session);

    this.session = session;

    return session;
  }

  async publishMessage<Message extends string | AnyObject = string>({
    universeId,
    message,
    topic,
    timeout,
  }: {
    universeId: string;
    message: Message;
    topic: string;
    timeout?: number;
  }) {
    const session = await this.sessionMiddleware();
    if (topic.length > 80) {
      throw new Error("Invalid topic - must be less than 80 characters");
    }

    const response = await fetch(
      `https://apis.roblox.com/messaging-service/v1/universes/${universeId}/topics/${encodeURIComponent(
        topic,
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          message:
            typeof message === "string" ? message : JSON.stringify(message),
        }),
        signal: timeout ? AbortSignal.timeout(timeout) : undefined,
      },
    );

    if (!response.ok) {
      await this.messagingError(response, this.project);
      throw new Error(`Failed to publish message with code ${response.status}`);
    }

    return response;
  }

  async safePublishMessage<Message extends string | AnyObject = string>({
    universeId,
    message,
    topic,
    virtualTopic,
    timeout,
  }: {
    universeId: string;
    message: Message;
    topic: string;
    virtualTopic: string;
    timeout?: number;
  }) {
    const session = await this.sessionMiddleware();
    if (topic.length > 80) {
      throw new Error("Invalid topic - must be less than 80 characters");
    }

    const response = await fetch(
      `https://apis.roblox.com/messaging-service/v1/universes/${universeId}/topics/${encodeURIComponent(
        topic,
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          message: JSON.stringify({
            topic: virtualTopic,
            message:
              typeof message === "string" ? message : JSON.stringify(message),
          }),
        }),
        signal: timeout ? AbortSignal.timeout(timeout) : undefined,
      },
    );

    if (!response.ok) {
      await this.messagingError(response, this.project);
      throw new Error(`Failed to publish message with code ${response.status}`);
    }

    return response;
  }

  async getUser(userId: number) {
    const session = await this.sessionMiddleware();
    const response = await fetch(
      `https://apis.roblox.com/cloud/v2/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      },
    );

    if (response.status === 400) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch user with code ${response.status}`);
    }

    return response.json() as Promise<GetUserResponse>;
  }

  async getUniverseIdFromPlaceId(placeId: string | number) {
    interface PlaceDetails {
      universeId: number | null;
    }

    const response = await fetch(
      `https://apis.roblox.com/universes/v1/places/${placeId}/universe`,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch universe id from place id with code ${response.status}`,
      );
    }

    const placeDetails = (await response.json()) as PlaceDetails;

    return placeDetails.universeId?.toString();
  }
}
