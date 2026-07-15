import api from './api';

export type BudgetIndicatorType = 'REVENUE' | 'EXPENSE';

export type BudgetRowKind = 'LEAF' | 'GROUP' | 'TITLE';

// Sursa de finanțare a bugetului anual: documentul oficial "BUGETUL PE ANUL ..."
// conține de fapt 2 bugete separate, pe aceleași coduri, cu sume diferite.
export type BudgetFundingSource = 'OWN_REVENUE' | 'STATE_BUDGET';

export type BudgetIndicatorRow = {
  indicator_id: number;
  indicator_type: BudgetIndicatorType;
  capitol?: string | null;
  subcapitol?: string | null;
  paragraf?: string | null;
  indicator_code: string;
  name: string;
  ca_cb?: string | null;
  row_kind?: BudgetRowKind;
  calc_expression?: string | null;
  indent_level?: number;
  display_order?: number;
};

export type AnnualBudgetRow = BudgetIndicatorRow & {
  amount: number;
};

export type ExecutionRow = Omit<BudgetIndicatorRow, 'indicator_type'> & {
  credits_initial: number;
  credits_definitive: number;
  commitments_budgetary: number;
  commitments_legal: number;
  payments_made: number;
  commitments_legal_to_pay: number;
  expenses_effective: number;
};

export const BudgetService = {
  async listIndicators(type: BudgetIndicatorType) {
    const res = await api.get('/budget/indicators', { params: { type } });
    return res.data.data as any[];
  },

  async importIndicators(type: BudgetIndicatorType, rows: any[]) {
    const res = await api.post('/budget/indicators/import', { type, rows });
    return res.data;
  },

  async getAnnual(year: number, type: BudgetIndicatorType, fundingSource: BudgetFundingSource = 'OWN_REVENUE') {
    const res = await api.get('/budget/annual', { params: { year, type, funding_source: fundingSource } });
    return res.data as { success: boolean; data: AnnualBudgetRow[]; year: number; type: BudgetIndicatorType; funding_source: BudgetFundingSource };
  },

  async saveAnnual(year: number, items: Array<{ indicator_id: number; amount: number }>, fundingSource: BudgetFundingSource = 'OWN_REVENUE') {
    const res = await api.put(`/budget/annual/${year}`, { items, funding_source: fundingSource });
    return res.data;
  },

  async getExecution(date: string) {
    const res = await api.get('/budget/execution', { params: { date } });
    return res.data as { success: boolean; date: string; data: ExecutionRow[] };
  },

  async saveExecution(date: string, items: Array<Partial<ExecutionRow> & { indicator_id: number }>) {
    const res = await api.put(`/budget/execution/${date}`, { items });
    return res.data;
  },

  async clonePrev(date: string) {
    const res = await api.post(`/budget/execution/${date}/clone-prev`);
    return res.data;
  },
};


