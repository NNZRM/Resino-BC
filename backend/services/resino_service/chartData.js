import SFTPClient from "ssh2-sftp-client";
import csv from "csv-parser";
import xlsx from "xlsx";
import stream from "stream";
import dotenv from "dotenv";

dotenv.config();

const sftpConfig = {
    host: process.env.SFTP_HOST,
    port: process.env.SFTP_PORT,
    username: process.env.SFTP_USER,
    password: process.env.SFTP_PASS,
};

const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December", "January"];

export async function extractChartData(konto, bcDataDir, budgetDir) {
    const bcData = await getBCData(konto, bcDataDir);
    const budgetData = await getBudgetData(konto, budgetDir);
    return {
        ...bcData,
        valuesBudget: budgetData
    };
}

// Check if the seperator in the CSV file is comma or semicolon
function detectDelimiter(buffer) {
    const preview = buffer.toString("utf8", 0, 1024);
    if (preview.includes(";")) return ";";
    if (preview.includes(",")) return ",";
    return ",";
}

// Retrieve BC data 
async function getBCData(konto, bcDataDir) {
    const sftp = new SFTPClient();
    try {
        await sftp.connect(sftpConfig);
        const files = await sftp.list(bcDataDir);
        const targetFile = files
        .filter(f => f.name.endsWith(".csv") || f.name.endsWith(".xlsx"))
        .sort((a, b) => new Date(b.modifyTime) - new Date(a.modifyTime))[0];

        if (!targetFile) throw new Error("No file found in bcdata folder.");

        const fullPath = `${bcDataDir}/${targetFile.name}`;
        const fileBuffer = await sftp.get(fullPath);

        // Handle csv file
        if (targetFile.name.endsWith(".csv")) {
            
            const readable = new stream.Readable();

            readable._read = () => {};
            readable.push(fileBuffer);
            readable.push(null);

            //Get separator from the file
            const delimiter = detectDelimiter(fileBuffer);
            const parser = readable.pipe(csv({ separator: delimiter }));

            for await (const row of parser) {
                if (row["Account no."] === konto && row["Annual Revenue"]) {
                    const annualRevenue = parseFloat(row["Annual Revenue"]);
                    const lastYearRevenue = parseFloat(row["Last years revenue"]);

                    const monthlyStep = annualRevenue / monthOrder.length;
                    const monthlyStepLast = lastYearRevenue / monthOrder.length;

                    await sftp.end();
                    return {
                        labels: monthOrder,
                        values: monthOrder.map((_, i) => monthlyStep * (i + 1)),
                        valuesLastYear: monthOrder.map((_, i) => monthlyStepLast * (i + 1))
                    };
                }
            }
        // Handle xlsx file
        } else if (targetFile.name.endsWith(".xlsx")) {
            const workbook = xlsx.read(fileBuffer, { type: "buffer" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

            for (const row of rows) {
                if (row["Account no."] === konto && row["Annual Revenue"]) {
                    const annualRevenue = parseFloat(row["Annual Revenue"]);
                    const lastYearRevenue = parseFloat(row["Last years revenue"]);
            
                    const monthlyStep = annualRevenue / monthOrder.length;
                    const monthlyStepLast = lastYearRevenue / monthOrder.length;

                    await sftp.end();
                    return {
                        labels: monthOrder,
                        values: monthOrder.map((_, i) => monthlyStep * (i + 1)),
                        valuesLastYear: monthOrder.map((_, i) => monthlyStepLast * (i + 1))
                    };
                }
            }
        }

        await sftp.end();

        throw new Error("No matching account found in bcdata file.");
    } catch (err) {
        await sftp.end();
        console.error("getBCData failed:", err);
        throw err;
    }
}

//Retrieve budget data
async function getBudgetData(konto, budgetDir) {
    const sftp = new SFTPClient();
    try {
        await sftp.connect(sftpConfig);
        const budgetFiles = await sftp.list(budgetDir);
        const currentYear = 2023; //new Date().getFullYear();
        const monthlyBudget = Array(12).fill(0);

        for (const file of budgetFiles) {
            const fileBuffer = await sftp.get(`${budgetDir}/${file.name}`);

            //Handle CSV files
            if (file.name.endsWith(".csv")) {
                const readable = new stream.Readable(); 
                readable._read = () => {};
                readable.push(fileBuffer);
                readable.push(null);

                //Get separator from the file
                const delimiter = detectDelimiter(fileBuffer);
                const parser = readable.pipe(csv({ separator: delimiter }));

                for await (const row of parser) {
                    if (row["Account no."] === konto && parseInt(row["Year"]) === currentYear) { 
                        const month = parseInt(row["Month"]);
                        // Refactor amount so inconsistent ',' or '.' are removed
                        const rawAmount = row["Amount"];
                        const cleanAmountStr = rawAmount.replace(/[.,]/g, "");
                        const amount = parseFloat(cleanAmountStr);
        
                        // Only add to budget if month is right and amount is a number
                        if (!isNaN(month) && month >= 1 && month <= 12 && !isNaN(amount)) {
                            monthlyBudget[month - 1] += amount;
                        }
                    }
                }
            }
            else if (file.name.endsWith(".xlsx")) {
                const workbook = xlsx.read(fileBuffer, { type: "buffer" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

                for (const row of rows) {
                    if (row["Account no."] === konto && parseInt(row["Year"]) === currentYear) {
                        const month = parseInt(row["Month"]);
                        // Refactor amount so inconsistent ',' or '.' are removed
                        const rawAmount = row["Amount"];
                        const cleanAmountStr = rawAmount.replace(/[.,]/g, "");
                        const amount = parseFloat(cleanAmountStr);
        
                        // Only add to budget if month is right and amount is a number
                        if (!isNaN(month) && month >= 1 && month <= 12 && !isNaN(amount)) {
                            monthlyBudget[month - 1] += amount;
                        }
                    }
                }
            }
        }

    await sftp.end();

    // Cumulate the monthly budget
    for (let i = 1; i < monthlyBudget.length; i++) {
        monthlyBudget[i] += monthlyBudget[i - 1];
    }

    return monthlyBudget;
  } catch (err) {
        await sftp.end();
        console.error("getBudgetData failed:", err);
        return Array(12).fill(0);
  }
}