import { createResponse } from "../utils/response";
import { Request, Response } from "express";

const parseToJSON = (input: string) => {
  const data = input.trim().split("\n"); // Menghapus spasi awal/akhir di input
  const result: { [key: string]: any } = {};

  data.forEach((line) => {
    const [key, ...valueParts] = line.split(":"); // Split dengan mempertimbangkan tanda ":"
    if (key && valueParts.length > 0) {
      const trimmedKey = key.trim().toLowerCase().replace(/ /g, "_"); // Mengubah key menjadi snake_case
      const trimmedValue = valueParts.join(":").trim(); // Menggabungkan kembali jika value ada ":" di dalamnya

      if (trimmedKey === "income" || trimmedKey === "outcome" || trimmedKey === "debt" || trimmedKey === "current_savings") {
        // Parsing numeric value
        const numericValue = trimmedValue.replace(/[^0-9]/g, ""); // Hapus semua karakter non-numeric
        result[trimmedKey] = parseInt(numericValue, 10);
      } else {
        // Untuk value non-numeric langsung simpan
        result[trimmedKey] = trimmedValue;
      }
    }
  });

  return result;
};


export const advisorController = {
  getAdvice: async (req: Request, res: Response) => {

    // get user data
    const user = req.user;

    const input = `
Income: Rp.10.000.000
Outcome: Rp.1.000.000
Debt : Rp.2.000.000
Current savings: 9.000.000
Financial Goals: financial freedom
Risk management : low
Market Conditions: rupiah is bearish
Advice: You have a lot of debt, and you need to pay it off. You also have a savings account that is sitting there with no money in it. The only way to get out of debt and build wealth is to spend less than you make.
`;

    const advice = parseToJSON(input);


    // create timeout to simulate long process
    setTimeout(() => {
      createResponse.success({
        res,
        message: "Advice retrieved successfully",
        data: advice,
      });
    }, 1000);
  },
};
