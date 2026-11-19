const API_BASE = '/api/v1';

export const getAuthToken = () => {
  return localStorage.getItem('gb_access_token');
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('gb_access_token', token);
};

export const clearAuthToken = () => {
  localStorage.removeItem('gb_access_token');
  localStorage.removeItem('gb_user_data');
};

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new Error('Backend server is offline (http://127.0.0.1:8000). Run "npm run backend" to start Django.');
  }

  if (response.status === 401) {
    // Session expired or unauthorized
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.detail || `Request failed with status ${response.status}`);
  }

  // Handle standard Django REST framework pagination: if response has { results: [...] }, return results or full data
  return data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) => 
    apiRequest('/auth/login/', { method: 'POST', body: JSON.stringify(credentials) }),
  demoSwitch: (role_code: string, email?: string) => 
    apiRequest('/auth/demo-switch/', { method: 'POST', body: JSON.stringify({ role_code, email }) }),
  getMe: () => apiRequest('/auth/me/'),
  getPermissions: () => apiRequest('/auth/permissions/'),
  changePassword: (data: { old_password: string; new_password: string; confirm_password?: string }) =>
    apiRequest('/auth/change-password/', { method: 'POST', body: JSON.stringify(data) }),
  getSecurityOverview: () => apiRequest('/auth/security-overview/'),
  terminateOtherSessions: (current_session_id?: string) =>
    apiRequest('/auth/terminate-sessions/', { method: 'POST', body: JSON.stringify({ current_session_id }) }),

  // Org
  getOrganization: () => apiRequest('/organization/'),
  getOrgBranches: () => apiRequest('/branches/'),
  getDepartments: () => apiRequest('/departments/'),

  // HRMS
  getEmployees: (params: string = '') => apiRequest(`/hrms/employees/?${params}`),
  createEmployee: (data: any) => apiRequest('/hrms/employees/', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: string, data: any) => apiRequest(`/hrms/employees/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteEmployee: (id: string) => apiRequest(`/hrms/employees/${id}/`, { method: 'DELETE' }),
  getEmployeeDocuments: (employeeId?: string) => apiRequest(`/hrms/documents/${employeeId ? `?employee=${employeeId}` : ''}`),
  createEmployeeDocument: (data: any) => apiRequest('/hrms/documents/', { method: 'POST', body: JSON.stringify(data) }),
  deleteEmployeeDocument: (id: string) => apiRequest(`/hrms/documents/${id}/`, { method: 'DELETE' }),
  getAttendance: (params: string = '') => apiRequest(`/hrms/attendance/?${params}`),
  checkIn: (data: { selfie_data: string; latitude?: number; longitude?: number }) => 
    apiRequest('/hrms/attendance/check-in/', { method: 'POST', body: JSON.stringify(data) }),
  checkOut: (data: { selfie_data?: string }) => 
    apiRequest('/hrms/attendance/check-out/', { method: 'POST', body: JSON.stringify(data) }),
  getLeaveBalances: (employeeId?: string) => 
    apiRequest(`/hrms/leave-balances/${employeeId ? `?employee=${employeeId}` : ''}`),
  getLeaves: () => apiRequest('/hrms/leave-applications/'),
  applyLeave: (data: any) => apiRequest('/hrms/leave-applications/', { method: 'POST', body: JSON.stringify(data) }),
  updateLeaveStatus: (id: string, status: 'approved' | 'rejected', comments?: string) => 
    apiRequest(`/hrms/leave-applications/${id}/`, { method: 'PATCH', body: JSON.stringify({ status, approver_comments: comments }) }),
  
  // Holidays
  getHolidays: () => apiRequest('/hrms/holidays/'),
  createHoliday: (data: any) => apiRequest('/hrms/holidays/', { method: 'POST', body: JSON.stringify(data) }),
  updateHoliday: (id: string, data: any) => apiRequest(`/hrms/holidays/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHoliday: (id: string) => apiRequest(`/hrms/holidays/${id}/`, { method: 'DELETE' }),
  getHRMSDashboard: () => apiRequest('/hrms/dashboard/'),

  // Shifts
  getShifts: () => apiRequest('/hrms/shifts/'),
  createShift: (data: any) => apiRequest('/hrms/shifts/', { method: 'POST', body: JSON.stringify(data) }),

  // Documents & KYC
  getDocuments: (params: string = '') => apiRequest(`/hrms/documents/?${params}`),
  createDocument: (data: any) => apiRequest('/hrms/documents/', { method: 'POST', body: JSON.stringify(data) }),
  updateDocumentStatus: (id: string, status: string) => apiRequest(`/hrms/documents/${id}/`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteDocument: (id: string) => apiRequest(`/hrms/documents/${id}/`, { method: 'DELETE' }),

  // WFH
  getWfhRequests: () => apiRequest('/hrms/wfh/'),
  createWfhRequest: (data: any) => apiRequest('/hrms/wfh/', { method: 'POST', body: JSON.stringify(data) }),
  updateWfhStatus: (id: string, status: string) => apiRequest(`/hrms/wfh/${id}/`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Overtime
  getOvertimeRecords: () => apiRequest('/hrms/overtime/'),
  createOvertimeRecord: (data: any) => apiRequest('/hrms/overtime/', { method: 'POST', body: JSON.stringify(data) }),
  updateOvertimeStatus: (id: string, status: string) => apiRequest(`/hrms/overtime/${id}/`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Recruitment & Hiring
  getJobPostings: () => apiRequest('/hrms/job-postings/'),
  createJobPosting: (data: any) => apiRequest('/hrms/job-postings/', { method: 'POST', body: JSON.stringify(data) }),
  getJobApplications: () => apiRequest('/hrms/job-applications/'),
  createJobApplication: (data: any) => apiRequest('/hrms/job-applications/', { method: 'POST', body: JSON.stringify(data) }),
  updateJobApplicationStage: (id: string, stage: string) => apiRequest(`/hrms/job-applications/${id}/`, { method: 'PATCH', body: JSON.stringify({ stage }) }),

  // Interviews
  getInterviews: () => apiRequest('/hrms/interviews/'),
  createInterview: (data: any) => apiRequest('/hrms/interviews/', { method: 'POST', body: JSON.stringify(data) }),
  updateInterview: (id: string, data: any) => apiRequest(`/hrms/interviews/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Onboarding
  getOnboardingMilestones: (employeeId?: string) => apiRequest(`/hrms/onboarding-milestones/${employeeId ? `?employee=${employeeId}` : ''}`),
  createOnboardingMilestone: (data: any) => apiRequest('/hrms/onboarding-milestones/', { method: 'POST', body: JSON.stringify(data) }),
  updateOnboardingMilestone: (id: string, data: any) => apiRequest(`/hrms/onboarding-milestones/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Offboarding
  getOffboardings: () => apiRequest('/hrms/offboarding/'),
  createOffboarding: (data: any) => apiRequest('/hrms/offboarding/', { method: 'POST', body: JSON.stringify(data) }),
  updateOffboarding: (id: string, data: any) => apiRequest(`/hrms/offboarding/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Grievances
  getGrievances: () => apiRequest('/hrms/grievances/'),
  createGrievance: (data: any) => apiRequest('/hrms/grievances/', { method: 'POST', body: JSON.stringify(data) }),
  updateGrievance: (id: string, data: any) => apiRequest(`/hrms/grievances/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Payroll
  getSalaryStructures: (employeeId?: string) => 
    apiRequest(`/payroll/salary-structures/${employeeId ? `?employee=${employeeId}` : ''}`),
  createSalaryStructure: (data: any) => apiRequest('/payroll/salary-structures/', { method: 'POST', body: JSON.stringify(data) }),
  updateSalaryStructure: (id: string, data: any) => apiRequest(`/payroll/salary-structures/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSalaryStructure: (id: string) => apiRequest(`/payroll/salary-structures/${id}/`, { method: 'DELETE' }),
  getPayrollPeriods: () => apiRequest('/payroll/periods/'),
  getPayrollRuns: () => apiRequest('/payroll/runs/'),
  processPayroll: (period_id: string) => apiRequest('/payroll/process/', { method: 'POST', body: JSON.stringify({ period_id }) }),
  finalizePayroll: (run_id: string) => apiRequest(`/payroll/runs/${run_id}/finalize/`, { method: 'POST' }),
  getPayslips: (params: string = '') => apiRequest(`/payroll/payslips/?${params}`),
  getPayrollDashboard: () => apiRequest('/payroll/dashboard/'),
  getAdvances: () => apiRequest('/payroll/advances/'),
  createAdvance: (data: any) => apiRequest('/payroll/advances/', { method: 'POST', body: JSON.stringify(data) }),
  updateAdvanceStatus: (id: string, status: string) => apiRequest(`/payroll/advances/${id}/`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getBonuses: () => apiRequest('/payroll/bonuses/'),
  createBonus: (data: any) => apiRequest('/payroll/bonuses/', { method: 'POST', body: JSON.stringify(data) }),
  updateBonusStatus: (id: string, status: string) => apiRequest(`/payroll/bonuses/${id}/`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getDeductions: () => apiRequest('/payroll/deductions/'),
  createDeduction: (data: any) => apiRequest('/payroll/deductions/', { method: 'POST', body: JSON.stringify(data) }),
  getSettlements: () => apiRequest('/payroll/settlements/'),
  createSettlement: (data: any) => apiRequest('/payroll/settlements/', { method: 'POST', body: JSON.stringify(data) }),
  updateSettlementStatus: (id: string, status: string) => apiRequest(`/payroll/settlements/${id}/`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // CRM
  getLeads: () => apiRequest('/crm/leads/'),
  createLead: (data: any) => apiRequest('/crm/leads/', { method: 'POST', body: JSON.stringify(data) }),
  updateLead: (id: string, data: any) => apiRequest(`/crm/leads/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteLead: (id: string) => apiRequest(`/crm/leads/${id}/`, { method: 'DELETE' }),
  changeLeadStatus: (id: string, status: string, remark: string) => apiRequest(`/crm/leads/${id}/change_status/`, { method: 'POST', body: JSON.stringify({ status, remark }) }),
  scheduleLeadFollowup: (id: string, data: any) => apiRequest(`/crm/leads/${id}/schedule_followup/`, { method: 'POST', body: JSON.stringify(data) }),
  bulkAssignLeads: (lead_ids: string[], user_id: string) => apiRequest('/crm/leads/bulk_assign/', { method: 'POST', body: JSON.stringify({ lead_ids, user_id }) }),
  autoDistributeLeads: (lead_ids?: string[]) => apiRequest('/crm/leads/auto_distribute/', { method: 'POST', body: JSON.stringify({ lead_ids: lead_ids || [] }) }),
  getCompanyHierarchy: () => apiRequest('/crm/leads/company_hierarchy/'),
  convertLead: (id: string) => apiRequest(`/crm/leads/${id}/convert/`, { method: 'POST' }),
  getLeadRemarks: (leadId?: string) => apiRequest(`/crm/remarks/${leadId ? `?lead=${leadId}` : ''}`),
  
  getOpportunities: () => apiRequest('/crm/opportunities/'),
  createOpportunity: (data: any) => apiRequest('/crm/opportunities/', { method: 'POST', body: JSON.stringify(data) }),
  updateOpportunity: (id: string, data: any) => apiRequest(`/crm/opportunities/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteOpportunity: (id: string) => apiRequest(`/crm/opportunities/${id}/`, { method: 'DELETE' }),
  updateOpportunityStage: (id: string, stage: string) => apiRequest(`/crm/opportunities/${id}/update_stage/`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
  updateDealStageWithRemark: (id: string, stage: string, remark: string, loss_reason?: string) => apiRequest(`/crm/opportunities/${id}/update_stage_with_remark/`, { method: 'POST', body: JSON.stringify({ stage, remark, loss_reason }) }),
  
  getCustomers: () => apiRequest('/crm/customers/'),
  createCustomer: (data: any) => apiRequest('/crm/customers/', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: any) => apiRequest(`/crm/customers/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCustomer: (id: string) => apiRequest(`/crm/customers/${id}/`, { method: 'DELETE' }),
  
  getContactPersons: (customerId?: string) => apiRequest(`/crm/contacts/${customerId ? `?customer=${customerId}` : ''}`),
  createContactPerson: (data: any) => apiRequest('/crm/contacts/', { method: 'POST', body: JSON.stringify(data) }),
  updateContactPerson: (id: string, data: any) => apiRequest(`/crm/contacts/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteContactPerson: (id: string) => apiRequest(`/crm/contacts/${id}/`, { method: 'DELETE' }),

  getActivities: () => apiRequest('/crm/activities/'),
  createActivity: (data: any) => apiRequest('/crm/activities/', { method: 'POST', body: JSON.stringify(data) }),
  completeActivity: (id: string, outcome: string) => apiRequest(`/crm/activities/${id}/complete/`, { method: 'POST', body: JSON.stringify({ outcome }) }),
  
  getLeadChannels: () => apiRequest('/crm/lead-channels/'),
  createLeadChannel: (data: any) => apiRequest('/crm/lead-channels/', { method: 'POST', body: JSON.stringify(data) }),
  updateLeadChannel: (id: string, data: any) => apiRequest(`/crm/lead-channels/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteLeadChannel: (id: string) => apiRequest(`/crm/lead-channels/${id}/`, { method: 'DELETE' }),
  testLeadChannel: (id: string) => apiRequest(`/crm/lead-channels/${id}/test_lead/`, { method: 'POST' }),
  getIngestionLogs: () => apiRequest('/crm/ingestion-logs/'),

  getCommunications: () => apiRequest('/crm/communications/'),
  createCommunication: (data: any) => apiRequest('/crm/communications/', { method: 'POST', body: JSON.stringify(data) }),

  getSalesTargets: () => apiRequest('/crm/targets/'),
  createSalesTarget: (data: any) => apiRequest('/crm/targets/', { method: 'POST', body: JSON.stringify(data) }),
  updateSalesTarget: (id: string, data: any) => apiRequest(`/crm/targets/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  getSalesPerformance: () => apiRequest('/crm/performance/'),

  getComplaints: () => apiRequest('/crm/complaints/'),
  createComplaint: (data: any) => apiRequest('/crm/complaints/', { method: 'POST', body: JSON.stringify(data) }),
  resolveComplaint: (id: string, resolution_notes: string) => apiRequest(`/crm/complaints/${id}/resolve/`, { method: 'POST', body: JSON.stringify({ resolution_notes }) }),

  getFeedback: () => apiRequest('/crm/feedback/'),
  createFeedback: (data: any) => apiRequest('/crm/feedback/', { method: 'POST', body: JSON.stringify(data) }),

  getCRMDashboard: () => apiRequest('/crm/dashboard/'),

  // Billing & Advanced GST
  getCompanyProfile: () => apiRequest('/billing/company-profile/'),
  updateCompanyProfile: (data: any) => apiRequest('/billing/company-profile/', { method: 'PUT', body: JSON.stringify(data) }),
  getBranches: () => apiRequest('/billing/branches/'),
  createBranch: (data: any) => apiRequest('/billing/branches/', { method: 'POST', body: JSON.stringify(data) }),
  getFinancialYears: () => apiRequest('/billing/financial-years/'),
  getTaxRates: () => apiRequest('/billing/tax-rates/'),
  getHSNMaster: () => apiRequest('/billing/hsn/'),
  createHSN: (data: any) => apiRequest('/billing/hsn/', { method: 'POST', body: JSON.stringify(data) }),
  updateHSN: (id: string, data: any) => apiRequest(`/billing/hsn/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteHSN: (id: string) => apiRequest(`/billing/hsn/${id}/`, { method: 'DELETE' }),
  importHSN: (records: any[]) => apiRequest('/billing/hsn/bulk_import/', { method: 'POST', body: JSON.stringify({ records }) }),
  seedDefaultHSN: () => apiRequest('/billing/hsn/seed_defaults/', { method: 'POST' }),
  getSACMaster: () => apiRequest('/billing/sac/'),
  createSAC: (data: any) => apiRequest('/billing/sac/', { method: 'POST', body: JSON.stringify(data) }),
  updateSAC: (id: string, data: any) => apiRequest(`/billing/sac/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSAC: (id: string) => apiRequest(`/billing/sac/${id}/`, { method: 'DELETE' }),
  importSAC: (records: any[]) => apiRequest('/billing/sac/bulk_import/', { method: 'POST', body: JSON.stringify({ records }) }),
  seedDefaultSAC: () => apiRequest('/billing/sac/seed_defaults/', { method: 'POST' }),
  getSuppliers: () => apiRequest('/billing/suppliers/'),
  createSupplier: (data: any) => apiRequest('/billing/suppliers/', { method: 'POST', body: JSON.stringify(data) }),
  getWarehouses: () => apiRequest('/billing/warehouses/'),
  getProducts: () => apiRequest('/billing/products/'),
  createProduct: (data: any) => apiRequest('/billing/products/', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => apiRequest(`/billing/products/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  adjustProductStock: (id: string, data: any) => apiRequest(`/billing/products/${id}/adjust_stock/`, { method: 'POST', body: JSON.stringify(data) }),
  getStockLedger: () => apiRequest('/billing/stock-ledger/'),
  getStockAdjustments: () => apiRequest('/billing/stock-adjustments/'),
  getStockTransfers: () => apiRequest('/billing/stock-transfers/'),
  getQuotations: () => apiRequest('/billing/quotations/'),
  createQuotation: (data: any) => apiRequest('/billing/quotations/', { method: 'POST', body: JSON.stringify(data) }),
  convertQuotationToInvoice: (id: string) => apiRequest(`/billing/quotations/${id}/convert_to_invoice/`, { method: 'POST' }),
  getSalesOrders: () => apiRequest('/billing/sales-orders/'),
  createSalesOrder: (data: any) => apiRequest('/billing/sales-orders/', { method: 'POST', body: JSON.stringify(data) }),
  getInvoices: () => apiRequest('/billing/invoices/'),
  createInvoice: (data: any) => apiRequest('/billing/invoices/', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (id: string, data: any) => apiRequest(`/billing/invoices/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteInvoice: (id: string) => apiRequest(`/billing/invoices/${id}/`, { method: 'DELETE' }),
  previewInvoiceCalculation: (data: any) => apiRequest('/billing/invoices/calculate_preview/', { method: 'POST', body: JSON.stringify(data) }),
  generateEInvoice: (id: string) => apiRequest(`/billing/invoices/${id}/generate_e_invoice/`, { method: 'POST' }),
  generateEWayBill: (id: string, data: any) => apiRequest(`/billing/invoices/${id}/generate_eway_bill/`, { method: 'POST', body: JSON.stringify(data) }),
  getCreditNotes: () => apiRequest('/billing/credit-notes/'),
  createCreditNote: (data: any) => apiRequest('/billing/credit-notes/', { method: 'POST', body: JSON.stringify(data) }),
  getDebitNotes: () => apiRequest('/billing/debit-notes/'),
  createDebitNote: (data: any) => apiRequest('/billing/debit-notes/', { method: 'POST', body: JSON.stringify(data) }),
  getRecurringInvoices: () => apiRequest('/billing/recurring/'),
  getPurchaseOrders: () => apiRequest('/billing/purchase-orders/'),
  createPurchaseOrder: (data: any) => apiRequest('/billing/purchase-orders/', { method: 'POST', body: JSON.stringify(data) }),
  getPurchaseBills: () => apiRequest('/billing/purchase-bills/'),
  createPurchaseBill: (data: any) => apiRequest('/billing/purchase-bills/', { method: 'POST', body: JSON.stringify(data) }),
  getSupplierPayments: () => apiRequest('/billing/supplier-payments/'),
  recordSupplierPayment: (data: any) => apiRequest('/billing/supplier-payments/', { method: 'POST', body: JSON.stringify(data) }),
  recordPayment: (data: any) => apiRequest('/billing/payments/', { method: 'POST', body: JSON.stringify(data) }),
  getExpenses: () => apiRequest('/billing/expenses/'),
  createExpense: (data: any) => apiRequest('/billing/expenses/', { method: 'POST', body: JSON.stringify(data) }),
  getBillingDashboard: () => apiRequest('/billing/dashboard/'),
  getAccounts: () => apiRequest('/billing/accounts/'),
  getChartOfAccounts: () => apiRequest('/billing/accounts/chart_of_accounts/'),
  getJournalEntries: () => apiRequest('/billing/journal-entries/'),
  getAccountingReports: (type: string) => apiRequest(`/billing/reports/?type=${type}`),
  getGSTCompliance: (mode: string = 'summary', period: string = '11-2026') => apiRequest(`/billing/gst-compliance/?mode=${mode}&period=${period}`),

  // Admin & Audit
  getUsers: () => apiRequest('/users/'),
  createUser: (data: any) => apiRequest('/users/', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) => apiRequest(`/users/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUser: (id: string) => apiRequest(`/users/${id}/`, { method: 'DELETE' }),
  getRoles: () => apiRequest('/roles/'),
  updateRolePermissions: (id: string, permissions: string[]) => apiRequest(`/roles/${id}/`, { method: 'PATCH', body: JSON.stringify({ permissions }) }),
  getAuditLogs: (params: string = '') => apiRequest(`/audit-logs/?${params}`),

  // Notifications
  getNotifications: () => apiRequest('/notifications/'),
  createNotification: (data: any) => apiRequest('/notifications/', { method: 'POST', body: JSON.stringify(data) }),
  markNotificationRead: (id: string) => apiRequest(`/notifications/${id}/`, { method: 'PATCH', body: JSON.stringify({ is_read: true }) }),
  markAllNotificationsRead: () => apiRequest('/notifications/mark-all-read/', { method: 'POST' }),
  getAnnouncements: () => apiRequest('/announcements/'),
};
