export default {
  providers: [
    {
      domain: typeof process !== "undefined" ? process.env.CONVEX_SITE_URL : undefined,
      applicationID: "convex",
    },
  ],
};