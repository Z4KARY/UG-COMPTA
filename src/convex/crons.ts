import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run daily at 9:00 AM UTC (adjust for Algeria GMT+1 if needed, but UTC is standard)
crons.cron(
  "process-reminders",
  "0 9 * * *", 
  internal.reminders.processReminders
);

export default crons;
