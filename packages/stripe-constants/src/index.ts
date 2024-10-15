export const constants = {
  plans: {
    NONE: {
      plan: "NONE",
      planSlug: "Unsubscribed",
      priceId: 0,
      price: 0,
      usageLimits: {
        uniqueIssuesCount: 0,
        broadcastMessagesCount: 0,
        experienceVisitsCount: 0,
        moderationEventsCount: 0,
        dynamicFlagCount: 0,
        staticFlagCount: 0,
        actionRunsCount: 0,
        auditLogRetention: 0,
        maxProjects: 0,
        analyticsRetention: 0,
      },
    },
    FREE: {
      plan: "FREE",
      planSlug: "Free",
      priceId: 0,
      price: 0,
      usageLimits: {
        uniqueIssuesCount: 50,
        broadcastMessagesCount: 25,
        experienceVisitsCount: 2500,
        moderationEventsCount: 100,
        dynamicFlagCount: 5,
        staticFlagCount: 50,
        actionRunsCount: 25,
        auditLogRetention: 7,
        maxProjects: 2,
        analyticsRetention: 7,
      },
    },
    TRIAL: {
      plan: "TRIAL",
      planSlug: "Trial",
      priceId: 0,
      price: 0,
      usageLimits: {
        uniqueIssuesCount: 1000,
        broadcastMessagesCount: 500,
        experienceVisitsCount: 100000,
        moderationEventsCount: 5000,
        dynamicFlagCount: 100,
        staticFlagCount: 1000,
        actionRunsCount: 500,
        auditLogRetention: 90,
        maxProjects: 100,
        analyticsRetention: 90,
      },
    },

    PRO: {
      plan: "PRO",
      priceId: 0, // price id is index of 0 on items
      planSlug: "Pro",
      price: 1500,
      usageLimits: {
        uniqueIssuesCount: 1000,
        broadcastMessagesCount: 500,
        experienceVisitsCount: 100000,
        moderationEventsCount: 5000,
        dynamicFlagCount: 100,
        staticFlagCount: 1000,
        actionRunsCount: 500,
        auditLogRetention: 90,
        maxProjects: 100,
        analyticsRetention: 90,
      },
      itemIds: {
        test: {
          visits: "YOUR PRICE",
          //actions: "YOUR PRICE",
          //moderation: "YOUR PRICE",
          //issues: "YOUR PRICE",
          //broadcasts: "YOUR PRICE",
        },
        production: {
          visits: "YOUR PRICE",
          //actions: "YOUR PRICE",
          //moderation: "YOUR PRICE",
          //issues: "YOUR PRICE",
          //broadcasts: "YOUR PRICE",
        },
      },
      items: {
        test: [
          { id: "YOUR PRICE", quantity: 1 }, //base price
          //{ id: "YOUR PRICE" }, // action runs
          //{ id: "YOUR PRICE" }, // moderation actions
          { id: "YOUR PRICE" }, // experience visits
          //{ id: "YOUR PRICE" }, // unique issues
          //{ id: "YOUR PRICE" }, // broadcasted messages
        ],
        production: [
          { id: "YOUR PRICE", quantity: 1 }, //base price
          //{ id: "YOUR PRICE" }, // action runs
          //{ id: "YOUR PRICE" }, // moderation actions
          { id: "YOUR PRICE" }, // experience visits
          //{ id: "YOUR PRICE" }, // unique issues
          //{ id: "YOUR PRICE" }, // broadcasted messages
        ],
      },
    },
  },
};
