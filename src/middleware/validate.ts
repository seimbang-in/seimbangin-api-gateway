import { check } from "express-validator";

const validate = {
  register: [
    check("full_name").isString(),
    check("username").isString(),
    check("email").isEmail(),
    check("age").isNumeric().optional(),
    check("password").isLength({ min: 3 }),
  ],
  login: [
    check("identifier")
      .isString()
      .withMessage("Identifier (email or username) is required"),
    check("password")
      .isLength({ min: 3 })
      .withMessage("Password must be at least 3 characters long"),
  ],
  transaction: [
    check("type").isNumeric(),
    check("description").isString(),
    check("items").isArray(),
  ],
  createFinancialProfile: [
    check("monthly_income").isNumeric().optional(),
    check("current_savings").isNumeric().optional(),
    check("debt").isNumeric().optional(),
    check("financial_goals").isString().optional(),
    check("risk_management").isString().optional(),
  ],
};

export default validate;
