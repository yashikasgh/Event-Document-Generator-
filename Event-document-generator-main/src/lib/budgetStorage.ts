export type BudgetProjectItem = {
  id: string;
  label: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  amount: number;
  notes: string;
  expenseType: string;
  vendorName?: string;
  purchaseDate?: string;
  paymentMethod?: string;
};

export type StoredBudgetRecord = {
  id: string;
  title: string;
  vendor: string;
  date: string;
  category: string;
  paymentMethod: string;
  receiptId: string;
  description?: string;
  expectedBudget?: number;
  items: BudgetProjectItem[];
  subtotal: number;
  taxTotal: number;
  discount: number;
  grandTotal: number;
};

export const BUDGET_STORAGE_KEY = "docuprint-budget-records";
export const BUDGET_CATEGORIES = ["FEST", "Repairing", "Funding", "Innovation Research", "Workshop", "Operations"];
export const EXPENSE_TYPES = ["Food", "Repairing", "Logistics", "Decoration", "Hospitality", "Equipment", "Marketing"];
export const PAYMENT_METHODS = ["Cash", "Card", "Bank Transfer", "UPI", "Cheque", "Pending"];

export const sampleBudgetRecords: StoredBudgetRecord[] = [
  {
    id: "alegria-2024",
    title: "Alegria 2024",
    vendor: "Festival Finance Desk",
    date: "15 Sep 2024, 2:30 PM",
    category: "FEST",
    paymentMethod: "Corporate Card (****8472)",
    receiptId: "REC-20241015-9876",
    description: "Main college festival budget with food, stage work, and event decor.",
    expectedBudget: 380000,
    items: [
      { id: "1", label: "Food stall support", quantity: 1, unitPrice: 54000, tax: 4320, amount: 58320, notes: "Main court allocation", expenseType: "Food", vendorName: "Campus Caterers", purchaseDate: "2024-03-05", paymentMethod: "Card" },
      { id: "2", label: "Stage repairing", quantity: 1, unitPrice: 79990, tax: 6400, amount: 86390, notes: "Electrical and panel fix", expenseType: "Repairing", vendorName: "StagePro Services", purchaseDate: "2024-03-08", paymentMethod: "Bank Transfer" },
      { id: "3", label: "Decoration material", quantity: 2, unitPrice: 99999, tax: 16000, amount: 215998, notes: "Backdrop and banners", expenseType: "Decoration", vendorName: "Visual Event House", purchaseDate: "2024-03-10", paymentMethod: "UPI" },
    ],
    subtotal: 333970,
    taxTotal: 26720,
    discount: 15000,
    grandTotal: 345690,
  },
  {
    id: "innovation-2025",
    title: "Innovation Research Grant",
    vendor: "Research Cell",
    date: "12 Jan 2025, 11:15 AM",
    category: "Innovation Research",
    paymentMethod: "Bank Transfer",
    receiptId: "RES-20250112-4512",
    description: "Research cell expenses for prototype materials and testing operations.",
    expectedBudget: 90000,
    items: [
      { id: "4", label: "Prototype materials", quantity: 3, unitPrice: 18000, tax: 4320, amount: 58320, notes: "Hardware and tooling", expenseType: "Equipment", vendorName: "Lab Works Supply", purchaseDate: "2025-01-08", paymentMethod: "Bank Transfer" },
      { id: "5", label: "Testing logistics", quantity: 1, unitPrice: 22000, tax: 1760, amount: 23760, notes: "Field validation", expenseType: "Logistics", vendorName: "Transit Lab Ops", purchaseDate: "2025-01-10", paymentMethod: "Bank Transfer" },
    ],
    subtotal: 76080,
    taxTotal: 6080,
    discount: 0,
    grandTotal: 82160,
  },
];

export const loadBudgetRecords = (): StoredBudgetRecord[] => {
  const raw = window.localStorage.getItem(BUDGET_STORAGE_KEY);
  if (!raw) {
    return sampleBudgetRecords;
  }

  try {
    const parsed = JSON.parse(raw) as StoredBudgetRecord[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : sampleBudgetRecords;
  } catch {
    return sampleBudgetRecords;
  }
};

export const saveBudgetRecords = (records: StoredBudgetRecord[]) => {
  window.localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(records));
};

export const formatBudgetCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
