export const downloadG12CSV = (data: any) => {
    if (!data) return;

    // G12 CSV EXPORT FORMAT (Forecast Declaration)
    // AE Spec: year,business_name,auto_entrepreneur_card_number,nif,activity_label,forecast_turnover,ifu_rate,estimated_tax_due,created_at

    const forecast = data.forecast?.forecastTurnover || 0;
    const rate = data.forecast?.ifuRate || 0;
    const taxDue = data.forecast?.taxDueInitial || 0;

    const headers = [
        "year",
        "business_name",
        "auto_entrepreneur_card_number",
        "nif",
        "activity_label",
        "forecast_turnover",
        "ifu_rate",
        "estimated_tax_due",
        "created_at"
    ];

    const row = [
        data.year,
        `"${data.businessName}"`,
        `"${data.autoEntrepreneurCardNumber || ""}"`,
        `"${data.nif}"`,
        `"${data.activityLabel || ""}"`,
        forecast.toFixed(2),
        rate.toString(),
        taxDue.toFixed(2),
        new Date(data.createdAt).toISOString()
    ];

    const csvContent = "\uFEFF" + headers.join(",") + "\n" 
        + row.join(",");

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AE_G12_${data.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const downloadG12BisCSV = (data: any) => {
    if (!data) return;
    
    // G12bis CSV EXPORT FORMAT (Final Declaration)
    // AE Spec: year,business_name,auto_entrepreneur_card_number,nif,forecast_turnover,real_turnover,difference,ifu_rate,tax_forecast,tax_real,tax_difference,created_at
    
    const forecast = data.forecast?.forecastTurnover || 0;
    const real = data.currentYearRealTurnover || 0;
    const diff = real - forecast;
    const rate = data.forecast?.ifuRate || 0;
    const taxForecast = data.forecast?.taxDueInitial || 0;
    const taxReal = real * (rate / 100);
    const taxDiff = taxReal - taxForecast;

    const headers = [
        "year",
        "business_name",
        "auto_entrepreneur_card_number",
        "nif",
        "forecast_turnover",
        "real_turnover",
        "difference",
        "ifu_rate",
        "tax_forecast",
        "tax_real",
        "tax_difference",
        "created_at"
    ];

    const row = [
        data.year,
        `"${data.businessName}"`,
        `"${data.autoEntrepreneurCardNumber || ""}"`,
        `"${data.nif}"`,
        forecast.toFixed(2),
        real.toFixed(2),
        diff.toFixed(2),
        rate.toString(),
        taxForecast.toFixed(2),
        taxReal.toFixed(2),
        taxDiff.toFixed(2),
        new Date(data.createdAt).toISOString()
    ];

    const csvContent = "\uFEFF" + headers.join(",") + "\n" 
        + row.join(",");

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AE_G12Bis_${data.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const downloadAEInvoicesCSV = (data: any[], selectedYear: string) => {
    if (!data || data.length === 0) return;

    // AE Invoice Export
    // Columns: invoice_number,invoice_date,customer_name,customer_address,description,amount_ttc,payment_status,payment_method,auto_entrepreneur_card_number,nif,business_activity_code

    const headers = [
        "invoice_number",
        "invoice_date",
        "customer_name",
        "customer_address",
        "description",
        "amount_ttc",
        "payment_status",
        "payment_method",
        "auto_entrepreneur_card_number",
        "nif",
        "business_activity_code"
    ];

    const rows = data.map(row => [
        row.invoiceNumber,
        new Date(row.invoiceDate).toISOString().split('T')[0],
        `"${row.customerName}"`,
        `"${row.customerAddress}"`,
        `"${row.description}"`,
        row.amountTtc.toFixed(2),
        row.paymentStatus,
        row.paymentMethod,
        `"${row.autoEntrepreneurCardNumber || ""}"`,
        `"${row.nif}"`,
        `"${row.businessActivityCode}"`
    ].join(","));

    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AE_INVOICES_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
