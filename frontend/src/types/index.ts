export type RoleCode = 
  | 'super_admin' 
  | 'sub_admin' 
  | 'hr_manager' 
  | 'manager' 
  | 'employee' 
  | 'accounts' 
  | 'sales';

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone: string;
  role: string;
  role_name: string;
  role_code: RoleCode;
  avatar_url?: string;
  status: 'active' | 'suspended' | 'archived';
  permissions: string[];
  employee_id?: string;
  is_superuser?: boolean;
}

export interface EmployeeDocument {
  id?: string;
  employee?: string;
  name: string;
  document_type: string;
  file_name: string;
  file_size?: string;
  file_data?: string;
  upload_date?: string;
  status?: 'verified' | 'pending' | 'rejected';
  created_at?: string;
}

export interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  branch: string;
  branch_name: string;
  department: string;
  department_name: string;
  designation: string;
  designation_title: string;
  reporting_manager?: string;
  manager_name?: string;
  shift?: string;
  shift_name?: string;
  date_of_joining: string;
  employment_status: 'active' | 'probation' | 'notice' | 'resigned' | 'terminated';
  employment_type: 'full_time' | 'part_time' | 'contract';
  work_location: string;
  date_of_birth?: string;
  gender?: string;
  alternate_phone?: string;
  assigned_hr?: string;
  assigned_hr_name?: string;
  weekly_off?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  monthly_ctc?: number;
  basic_salary?: number;
  hra?: number;
  da?: number;
  other_allowances?: number;
  tax_regime?: string;
  payment_mode?: string;
  uan_number?: string;
  esi_number?: string;
  pf_applicable?: boolean;
  esi_applicable?: boolean;
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  pan_number?: string;
  aadhaar_number?: string;
  role_code?: RoleCode | string;
  role_name?: string;
  permissions?: string[];
  documents?: EmployeeDocument[];
}

export interface AttendanceRecord {
  id: string;
  employee: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
  designation_title?: string;
  avatar_url?: string;
  shift_name?: string;
  shift_start_time?: string;
  shift_end_time?: string;
  late_display?: string;
  overtime_display?: string;
  overtime_minutes?: number;
  overtime_hours?: number;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  check_in_selfie?: string;
  check_out_selfie?: string;
  check_in_latitude?: number;
  check_in_longitude?: number;
  location_address?: string;
  status: 'present' | 'absent' | 'half_day' | 'late' | 'work_from_home' | 'on_leave' | 'holiday' | 'weekly_off';
  total_hours: number;
  break_hours: number;
  late_minutes: number;
  is_corrected: boolean;
  notes?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  holiday_type: 'public' | 'company' | 'optional';
  branch?: string;
  branch_name?: string;
  description: string;
  is_paid: boolean;
  is_active: boolean;
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  days_per_year: number;
  is_paid: boolean;
  color: string;
  description?: string;
}

export interface LeaveBalance {
  id: string;
  leave_type: string;
  leave_type_name: string;
  leave_type_code: string;
  color: string;
  year: number;
  total_allocated: number;
  used: number;
  pending: number;
  remaining_days: number;
}

export interface LeaveApplication {
  id: string;
  employee: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
  designation_title?: string;
  employee_email?: string;
  employee_phone?: string;
  employee_avatar?: string;
  leave_type: string;
  leave_type_name: string;
  leave_type_code?: string;
  leave_type_color: string;
  leave_type_is_paid?: boolean;
  start_date: string;
  end_date: string;
  total_days: number;
  is_half_day?: boolean;
  reason: string;
  status: 'pending' | 'manager_approved' | 'approved' | 'rejected' | 'cancelled';
  approved_by_name?: string;
  approver_comments?: string;
  created_at: string;
}

export interface SalaryAdvance {
  id: string;
  employee: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
  amount: number | string;
  reason: string;
  requested_date: string;
  monthly_emi: number | string;
  tenure_months: number;
  status: 'pending' | 'approved' | 'disbursed' | 'rejected' | 'recovered' | 'completed';
  repaid_amount?: number | string;
  approved_by_name?: string;
  disbursed_date?: string;
  created_at: string;
}

export interface BonusIncentive {
  id: string;
  employee: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
  bonus_type: string;
  bonus_type_display?: string;
  amount: number | string;
  effective_date: string;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  remarks?: string;
  approved_by_name?: string;
  created_at: string;
}

export interface CustomDeduction {
  id: string;
  employee: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
  deduction_type: string;
  deduction_type_display?: string;
  amount: number | string;
  effective_date: string;
  status: 'scheduled' | 'deducted' | 'waived';
  notes?: string;
  created_at: string;
}

export interface SettlementRecord {
  id: string;
  employee: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
  resignation_date: string;
  last_working_day: string;
  gratuity_amount: number | string;
  leave_encashment_amount: number | string;
  notice_pay_payable: number | string;
  asset_recovery_deductions: number | string;
  net_settlement_payable: number | string;
  status: 'draft' | 'approved' | 'disbursed';
  remarks?: string;
  approved_by_name?: string;
  created_at: string;
}

export interface SalaryStructure {
  id: string;
  employee: string;
  employee_name: string;
  employee_code: string;
  effective_from: string;
  basic_salary: number;
  hra: number;
  conveyance_allowance: number;
  medical_allowance: number;
  special_allowance: number;
  provident_fund: number;
  professional_tax: number;
  esi: number;
  gross: number;
  deductions: number;
  net: number;
  is_active: boolean;
}

export interface Payslip {
  id: string;
  payslip_number: string;
  employee: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
  designation_title: string;
  period_name: string;
  bank_name?: string;
  bank_account?: string;
  pan_number?: string;
  total_days: number;
  working_days: number;
  payable_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  holidays_count: number;
  weekly_offs_count: number;
  basic_salary: number;
  hra: number;
  allowances: number;
  gross_salary: number;
  pf_deduction: number;
  tax_deduction: number;
  lop_deduction: number;
  total_deductions: number;
  net_salary: number;
  status: 'draft' | 'approved' | 'released';
  payment_mode?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  lead_id: string;
  first_name: string;
  last_name: string;
  contact_name: string;
  company_name: string;
  email: string;
  phone: string;
  website?: string;
  city?: string;
  state?: string;
  country?: string;
  source: string;
  interested_product?: string;
  estimated_value: number;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  priority: 'low' | 'medium' | 'high';
  assigned_name?: string;
  notes?: string;
  created_at: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  gstin?: string;
  state: string;
  state_code: string;
  address?: string;
  pincode?: string;
  is_head_office: boolean;
  is_active: boolean;
}

export interface StockLedgerItem {
  id: string;
  product: string;
  product_name?: string;
  product_sku?: string;
  warehouse_name?: string;
  transaction_type: 'purchase' | 'sales' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'return';
  reference_number?: string;
  quantity: number;
  unit_price: number;
  total_value: number;
  balance_stock_after: number;
  timestamp: string;
  remarks?: string;
}

export interface Customer {
  id: string;
  name?: string;
  customer_code: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  gstin?: string;
  billing_address?: string;
  city: string;
  state: string;
  country: string;
  credit_limit: number;
  outstanding_balance: number;
  assigned_name?: string;
  invoices_count: number;
}

export interface Opportunity {
  id: string;
  title: string;
  customer: string;
  customer_name: string;
  estimated_value: number;
  probability: number;
  expected_close_date: string;
  stage: 'discovery' | 'proposal' | 'negotiation' | 'won' | 'lost';
  assigned_name?: string;
  remarks?: any[];
  loss_reason?: string;
}

export interface ProductService {
  id: string;
  sku: string;
  name: string;
  description?: string;
  item_type: 'product' | 'service' | 'subscription';
  unit_price: number;
  price?: number;
  selling_price?: number;
  purchase_price?: number;
  mrp?: number;
  hsn_code?: string;
  hsn_sac: string;
  tax_rate: number;
  unit: string;
  current_stock?: number;
  min_stock?: number;
  is_active: boolean;
}

export interface InvoiceItem {
  id: string;
  item_name: string;
  description?: string;
  hsn_sac?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  discount_pct?: number;
  taxable_value?: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer: string;
  customer_name: string;
  customer_email: string;
  customer_gstin?: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess_amount?: number;
  round_off?: number;
  total_tax: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  amount_in_words?: string;
  status: 'draft' | 'pending_approval' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  place_of_supply: string;
  is_intra_state?: boolean;
  is_rcm?: boolean;
  is_e_invoiced?: boolean;
  irn?: string;
  ack_no?: string;
  ack_date?: string;
  signed_qr_code?: string;
  eway_bill_number?: string;
  eway_bill_date?: string;
  eway_bill_valid_until?: string;
  notes?: string;
  terms?: string;
  items: InvoiceItem[];
  payments: any[];
  created_at: string;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  customer: string;
  customer_name: string;
  customer_email?: string;
  customer_gstin?: string;
  quotation_date: string;
  valid_until: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
  items: any[];
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  category_display: string;
  amount: number;
  expense_date: string;
  vendor?: string;
  payment_mode: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export interface AuditLog {
  id: string;
  user_name?: string;
  user_email?: string;
  action: string;
  module: string;
  entity_name: string;
  entity_id?: string;
  description: string;
  ip_address?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  notification_type: 'info' | 'success' | 'warning' | 'action_required';
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface Shift {
  id: string;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  grace_period_minutes: number;
  break_duration_minutes: number;
  full_day_hours: number;
  half_day_hours: number;
  is_active: boolean;
}

export interface WfhRequest {
  id: string;
  employee: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  deliverables?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by_name?: string;
  created_at: string;
}

export interface OvertimeRecord {
  id: string;
  employee: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
  date: string;
  hours: number;
  multiplier: number;
  pay_amount: number;
  task_summary: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by_name?: string;
  created_at: string;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  department_name: string;
  branch?: string;
  branch_name?: string;
  positions_count: number;
  experience_required: string;
  salary_range: string;
  employment_type: string;
  description?: string;
  status: 'open' | 'draft' | 'closed';
  applications_count?: number;
  created_at: string;
}

export interface JobApplication {
  id: string;
  job_posting: string;
  job_title: string;
  department_name: string;
  candidate_name: string;
  email: string;
  phone: string;
  experience_years: number;
  current_company?: string;
  current_ctc?: string;
  expected_ctc?: string;
  notice_period_days: number;
  resume_url?: string;
  stage: 'sourced' | 'screening' | 'interviewing' | 'offered' | 'hired' | 'rejected';
  rating: number;
  notes?: string;
  created_at: string;
}

export interface InterviewSchedule {
  id: string;
  application: string;
  candidate_name: string;
  job_title: string;
  round_name: string;
  round_display: string;
  interviewer_name: string;
  scheduled_at: string;
  mode: string;
  meeting_link?: string;
  status: 'scheduled' | 'completed' | 'rescheduled' | 'cancelled';
  rating: number;
  recommendation?: string;
  feedback_notes?: string;
  created_at: string;
}

export interface OnboardingMilestone {
  id: string;
  employee: string;
  employee_name: string;
  employee_code: string;
  title: string;
  category: string;
  is_completed: boolean;
  completed_at?: string;
  due_date?: string;
  created_at: string;
}

export interface OffboardingRecord {
  id: string;
  employee: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
  resignation_date: string;
  last_working_day: string;
  reason: string;
  notice_period_days: number;
  it_clearance: boolean;
  finance_clearance: boolean;
  hr_clearance: boolean;
  status: 'notice_period' | 'clearance_in_progress' | 'relieved';
  exit_interview_notes?: string;
  created_at: string;
}

export interface EmployeeGrievance {
  id: string;
  employee: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
  subject: string;
  category: string;
  category_display?: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  is_anonymous: boolean;
  status: 'open' | 'in_review' | 'hearing' | 'resolved';
  assigned_hr_name?: string;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  branch?: string;
  branch_name?: string;
  description?: string;
  is_active?: boolean;
  employee_count?: number;
}

export interface Designation {
  id: string;
  title: string;
  grade?: string;
  department?: string;
  department_name?: string;
  description?: string;
  is_active?: boolean;
  employee_count?: number;
}

export interface OrgBranch {
  id: string;
  name: string;
  code: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  is_head_office?: boolean;
  is_active?: boolean;
  employee_count?: number;
}

export interface CompanyProfile {
  id: string;
  company_name: string;
  trade_name?: string;
  logo_url?: string;
  signature_url?: string;
  stamp_url?: string;
  pan: string;
  gstin: string;
  business_type: string;
  registration_type: string;
  address: string;
  state: string;
  district?: string;
  pincode: string;
  state_code: string;
  phone: string;
  email: string;
  website?: string;
  bank_name: string;
  bank_account_no: string;
  bank_ifsc: string;
  bank_branch: string;
  upi_id: string;
  invoice_prefix: string;
  default_terms?: string;
  is_rcm_applicable: boolean;
  e_invoice_enabled: boolean;
  e_invoice_username?: string;
  e_way_bill_enabled: boolean;
  e_way_bill_username?: string;
}

export interface Supplier {
  id: string;
  name: string;
  company_name: string;
  gstin?: string;
  pan?: string;
  supplier_type: string;
  billing_address: string;
  state: string;
  state_code?: string;
  pincode?: string;
  mobile?: string;
  email?: string;
  contact_person?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_ifsc?: string;
  payment_terms_days: number;
  opening_balance: number;
  current_outstanding: number;
  is_active: boolean;
  created_at?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  manager_name?: string;
  phone?: string;
  is_active: boolean;
}

export interface HSNMaster {
  id: string;
  hsn_code: string;
  description: string;
  goods_category: string;
  applicable_gst_rate: number;
  cess_rate: number;
  effective_from?: string;
  effective_to?: string;
  is_active: boolean;
}

export interface SACMaster {
  id: string;
  sac_code: string;
  description: string;
  service_category: string;
  applicable_gst_rate: number;
  cess_rate: number;
  effective_from?: string;
  effective_to?: string;
  is_active: boolean;
}

export interface PurchaseBill {
  id: string;
  bill_number: string;
  supplier_invoice_number: string;
  supplier_invoice_date: string;
  supplier: string;
  supplier_name: string;
  supplier_gstin?: string;
  bill_date: string;
  due_date: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total_tax: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  itc_eligibility: string;
  status: 'draft' | 'posted' | 'partially_paid' | 'paid' | 'cancelled';
  notes?: string;
  items?: any[];
  created_at: string;
}

export interface CreditNote {
  id: string;
  credit_note_number: string;
  original_invoice: string;
  original_invoice_number?: string;
  customer: string;
  customer_name?: string;
  credit_note_date: string;
  reason: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_tax: number;
  total_amount: number;
  status: string;
  remarks?: string;
  created_at: string;
}

export interface DebitNote {
  id: string;
  debit_note_number: string;
  customer?: string;
  customer_name?: string;
  supplier?: string;
  supplier_name?: string;
  debit_note_date: string;
  reason: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  remarks?: string;
  created_at: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  balance: number;
  description?: string;
  is_system: boolean;
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  reference_type: string;
  reference_id?: string;
  narration: string;
  is_posted: boolean;
  total_debit?: number;
  total_credit?: number;
  lines?: any[];
  created_at: string;
}
