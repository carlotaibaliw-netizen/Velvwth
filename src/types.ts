export enum Role {
  ADMIN = 'admin',
  USER = 'user'
}

export interface UserProfile {
  uid: string;
  fullName: string;
  loanIdNumber?: string;
  email: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  civilStatus: string;
  idCardType: string;
  nativeLanguage: string;
  idImageUrl?: string;
  role: Role;
  createdAt: string;
}

export interface Loan {
  id: string;
  borrowerId: string;
  loanNumber: string;
  amount: number;
  balance: number;
  term: string;
  status: 'active' | 'completed' | 'archived';
  purpose: string;
  monthlyIncome: number;
  createdAt: string;
  penaltyAmount: number;
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

export enum PaymentMethod {
  GCASH = 'GCash',
  BANK_TRANSFER = 'Bank Transfer',
  CASH_COLLECTION = 'Cash Collection'
}

export interface Payment {
  id: string;
  loanId: string;
  borrowerId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  referenceNo?: string;
  proofImageUrl?: string;
  paymentDate: string;
  isPenaltyPayment: boolean;
  notes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
}

export interface Penalty {
  id: string;
  loanId: string;
  borrowerId: string;
  amount: number;
  reason: string;
  status: 'unpaid' | 'paid';
  createdAt: string;
}
