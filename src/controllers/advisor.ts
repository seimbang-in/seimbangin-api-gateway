import { createResponse } from "../utils/response";
import { Request, Response } from "express";

const parseToJSON = (input: String) => {
  const data = input.split("\n");
  const result: { [key: string]: any } = {};

  data.forEach((line) => {
    const [key, value] = line.split(":");
    if (key && value) {
      const trimmedKey = key.trim().toLowerCase().replace(" ", "_");
      const trimmedValue = value.trim();

      const numericValue = trimmedValue.replace(/[^0-9]/g, "");
      result[trimmedKey] = isNaN(Number(numericValue))
        ? trimmedValue
        : parseInt(numericValue, 10);
    }
  });

  return result;
};

export const advisorController = {
  getAdvice: async (req: Request, res: Response) => {
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
