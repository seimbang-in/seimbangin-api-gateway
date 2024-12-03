declare module Express {
  export interface Request {
    user?: any;
  }
}

interface UserData {
  id?: number;
  full_name: string;
  age: number;
  balance: string;
  username: string;
  email: string;
  profilePicture: string;
  createdAt: string | null;
  updatedAt: string | null;
  finance_profile: FinanceProfile;
  thisMonthIncome: MonthlyIncome[];
}

interface FinanceProfile {
  monthly_income: string;
  current_savings: string;
  debt: string;
  financial_goals: string;
  risk_management: string | null;
}

interface MonthlyIncome {
  average_income: string | null;
}
