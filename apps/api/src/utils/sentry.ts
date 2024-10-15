import * as Sentry from "@sentry/bun";

Sentry.init({
  dsn: "https://e93799ca990d3d1e8ce2bcd0e37503d5@o4506975306973184.ingest.us.sentry.io/4507025724866560",
  tracesSampleRate: 1.0,
});

export default Sentry;
