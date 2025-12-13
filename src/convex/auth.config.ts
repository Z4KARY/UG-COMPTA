export default {
  providers: [
    {
      domain: (typeof process !== "undefined" && process.env.SITE_URL) || "http://localhost:3000",
      applicationID: "convex",
    },
  ],
};