export interface BusinessSummary {
  name: string;
  totalInvestment: number;
  totalProfit: number;
  lastMonth: string;
  investorShares: Record<string, number>;
  entryCount: number;
}

export interface BusinessData {
  name: string;
  headers: string[];
  data: string[][];
}

export interface DashboardData {
  businesses: BusinessSummary[];
}
