const revenueTrend = useQuery(api.reports.getRevenueTrend,
  business ? { businessId: business._id } : "skip"
);

<div className={`text-2xl font-bold ${rStyles.color}`}>{receivablesRatio}%</div>