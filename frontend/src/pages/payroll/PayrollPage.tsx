import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DollarSign, Play, CheckCircle2, FileText, Download, Printer,
  Eye, ShieldCheck, AlertTriangle, Building2, User, Calendar,
  Plus, Check, X, Sliders, Shield, Award, ArrowRight, Search,
  FileSpreadsheet, Layers, PieChart, HelpCircle, Filter, ArrowUpRight,
  TrendingUp, RefreshCw, Briefcase, Calculator, CreditCard, ChevronRight, Info, Zap
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, type ColumnDef } from '../../components/common/DataTable';
import type {
  Payslip, SalaryStructure, SalaryAdvance, BonusIncentive,
  CustomDeduction, SettlementRecord, Employee
} from '../../types';

export type TabType =
  | 'dashboard'
  | 'ctc-master'
  | 'structures'
  | 'processing'
  | 'advances'
  | 'bonuses'
  | 'deductions'
  | 'pf-management'
  | 'esi-management'
  | 'pt-tax'
  | 'tds-form16'
  | 'payslips'
  | 'settlement'
  | 'reports';

export const PayrollPage: React.FC = () => {
  const { user } = useAuth();
  const { emitEvent, subscribe } = useRealtime();
  const location = useLocation();
  const navigate = useNavigate();

  // Core Data States
  const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [bonuses, setBonuses] = useState<BonusIncentive[]>([]);
  const [deductions, setDeductions] = useState<CustomDeduction[]>([]);
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab: mapped to URL pathname
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Selected Payslip for printable view
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [payslipModalOpen, setPayslipModalOpen] = useState(false);

  // Run Payroll Modal
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // CTC Configurator & Calculator Modal
  const [ctcModalOpen, setCtcModalOpen] = useState(false);
  const [selectedStructureForEdit, setSelectedStructureForEdit] = useState<SalaryStructure | null>(null);
  const [ctcForm, setCtcForm] = useState({
    employee: '',
    annual_ctc: 600000,
    monthly_gross: 50000,
    basic_salary: 25000,
    hra: 10000,
    conveyance_allowance: 1600,
    medical_allowance: 1250,
    special_allowance: 12150,
    provident_fund: 1800,
    professional_tax: 200,
    esi: 0,
    effective_from: new Date().toISOString().split('T')[0],
  });

  // Advance Modal
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    employee: '',
    amount: '',
    tenure_months: 3,
    monthly_emi: '',
    reason: '',
  });

  // Bonus Modal
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [bonusForm, setBonusForm] = useState({
    employee: '',
    bonus_type: 'performance',
    amount: '',
    effective_date: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  // Deduction Modal
  const [deductionModalOpen, setDeductionModalOpen] = useState(false);
  const [deductionForm, setDeductionForm] = useState({
    employee: '',
    deduction_type: 'tds',
    amount: '',
    effective_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Settlement Modal
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [settlementForm, setSettlementForm] = useState({
    employee: '',
    resignation_date: new Date().toISOString().split('T')[0],
    last_working_day: new Date().toISOString().split('T')[0],
    gratuity_amount: '0',
    leave_encashment_amount: '0',
    notice_pay_payable: '0',
    asset_recovery_deductions: '0',
    remarks: '',
  });

  // PF Challan Modal
  const [pfChallanModalOpen, setPfChallanModalOpen] = useState(false);
  const [pfChallanForm, setPfChallanForm] = useState({
    period: 'November 2026',
    trrn: '1012611004829',
    amount: '53100',
    payment_date: new Date().toISOString().split('T')[0],
    bank_name: 'State Bank of India',
  });
  const [pfPaidStatus, setPfPaidStatus] = useState(true);

  // ESI Challan Modal
  const [esiChallanModalOpen, setEsiChallanModalOpen] = useState(false);
  const [esiChallanForm, setEsiChallanForm] = useState({
    period: 'November 2026',
    challan_ref: 'ESI-01-2026-9921',
    cpin: '9928374610',
    amount: '1520',
    payment_date: new Date().toISOString().split('T')[0],
    bank_name: 'HDFC Bank',
  });
  const [esiPaidStatus, setEsiPaidStatus] = useState(true);

  // Form 16 Modal
  const [form16ModalOpen, setForm16ModalOpen] = useState(false);
  const [selectedForm16Employee, setSelectedForm16Employee] = useState<SalaryStructure | null>(null);

  // Professional Tax Selected State
  const [ptSelectedState, setPtSelectedState] = useState<'odisha' | 'maharashtra' | 'karnataka' | 'west_bengal'>('odisha');

  // Feedback Notification Toast
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Reports Filter & Month Disbursal State
  const [reportMonth, setReportMonth] = useState('2026-11');
  const [reportSearch, setReportSearch] = useState('');
  const [reportRoleFilter, setReportRoleFilter] = useState('ALL');
  const [reportStatusFilter, setReportStatusFilter] = useState('ALL');
  const [disbursedRecords, setDisbursedRecords] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('odias_payroll_disbursements') || '{}');
    } catch (e) {
      return {};
    }
  });

  const handleDisbursePayment = (empId: string, month: string, amount: number) => {
    const key = `${month}_${empId}`;
    const updated = { ...disbursedRecords, [key]: amount };
    setDisbursedRecords(updated);
    try {
      localStorage.setItem('odias_payroll_disbursements', JSON.stringify(updated));
    } catch (e) {}
    emitEvent('payroll:disbursed', 'Salary Disbursed', `Payment of ₹${amount.toLocaleString('en-IN')} recorded for ${month}.`, 'success');
    setSuccessToast(`Disbursal of ₹${amount.toLocaleString('en-IN')} recorded successfully.`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Master Payroll Register Rows (Real-Time Dynamic for All Employees, Managers, HR, Super Admin)
  const masterPayrollReports = useMemo(() => {
    const staffList: Array<{
      id: string;
      code: string;
      name: string;
      email: string;
      role_code: string;
      role_name: string;
      department: string;
      designation: string;
      bank_account: string;
      ifsc: string;
      gross: number;
      basic: number;
      hra: number;
      allowances: number;
      pf: number;
      esi: number;
      pt: number;
      tds: number;
      total_deductions: number;
      net_salary: number;
      disbursed_amount: number;
      pending_amount: number;
      status: 'paid' | 'partial' | 'pending';
      payslip: Payslip;
    }> = [];

    // Base roster with known corporate roles (HR, Manager, Finance) to ensure full organizational coverage
    const baseStaff = [
      {
        id: 'staff-hr-01',
        employee_id: 'ODS-HR-001',
        first_name: 'Pooja',
        last_name: 'Verma',
        email: 'pooja.hr@odiaserp.com',
        role_code: 'hr_manager',
        department_name: 'Human Resources & Talent',
        designation_name: 'HR Director',
        gross: 65000,
        bank_account: '50100445566778',
        bank_ifsc: 'HDFC0001234',
      },
      {
        id: 'staff-mgr-01',
        employee_id: 'ODS-MGR-001',
        first_name: 'Rajesh',
        last_name: 'Sharma',
        email: 'rajesh.sharma@odiaserp.com',
        role_code: 'manager',
        department_name: 'Software Engineering & Cloud',
        designation_name: 'Engineering Lead',
        gross: 85000,
        bank_account: '50100112233445',
        bank_ifsc: 'HDFC0001234',
      },
      {
        id: 'staff-fin-01',
        employee_id: 'ODS-FIN-001',
        first_name: 'Sunil',
        last_name: 'Mehta',
        email: 'sunil.mehta@odiaserp.com',
        role_code: 'accounts',
        department_name: 'Finance & Billing Accounts',
        designation_name: 'Finance Controller',
        gross: 70000,
        bank_account: '50100778899001',
        bank_ifsc: 'HDFC0001234',
      },
    ];

    // Combine HRMS live employees with base corporate roster
    const allPersonnel: any[] = [...employees];
    baseStaff.forEach(bs => {
      if (!allPersonnel.some(p => p.email === bs.email || p.employee_id === bs.employee_id)) {
        allPersonnel.push(bs);
      }
    });

    allPersonnel.forEach((emp, index) => {
      const struct = salaryStructures.find(
        (s) => s.employee === emp.id || s.employee_name === `${emp.first_name} ${emp.last_name}`
      );
      const gross = struct ? Number((struct as any).monthly_gross || struct.gross || 50000) : (
        emp.gross || (emp.role_code === 'manager' ? 85000 : emp.role_code === 'hr_manager' ? 65000 : 50000)
      );
      const basic = struct ? Number(struct.basic_salary || Math.round(gross * 0.5)) : Math.round(gross * 0.5);
      const hra = struct ? Number(struct.hra || Math.round(basic * 0.4)) : Math.round(basic * 0.4);
      const allowances = Math.max(0, gross - (basic + hra));
      const pf = struct ? Number(struct.provident_fund || Math.round(basic * 0.12)) : Math.round(basic * 0.12);
      const esi = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
      const pt = struct ? Number(struct.professional_tax || 200) : 200;
      const tds = gross > 50000 ? Math.round(gross * 0.05) : 0;
      const total_deductions = pf + esi + pt + tds;
      const net_salary = Math.max(0, gross - total_deductions);

      const disbKey = `${reportMonth}_${emp.id}`;
      const matchingSlip = payslips.find(
        (p) => p.employee === emp.id || p.employee_name === `${emp.first_name} ${emp.last_name}`
      );

      let disbursed = disbursedRecords[disbKey];
      if (disbursed === undefined) {
        disbursed = matchingSlip ? Number(matchingSlip.net_salary) : net_salary;
      }

      const pending = Math.max(0, net_salary - disbursed);
      const status: 'paid' | 'partial' | 'pending' = pending === 0 ? 'paid' : (disbursed > 0 ? 'partial' : 'pending');

      const roleLabel = emp.role_code === 'hr_manager' || emp.role_code === 'hr' ? 'HR Manager' :
        emp.role_code === 'manager' ? 'Team Manager' :
        emp.role_code === 'super_admin' ? 'Super Admin' :
        emp.role_code === 'accounts' ? 'Finance Controller' :
        'Associate Staff';

      const periodLabel = reportMonth === '2026-11' ? 'November 2026' : reportMonth === '2026-10' ? 'October 2026' : reportMonth === '2026-09' ? 'September 2026' : 'August 2026';

      staffList.push({
        id: emp.id,
        code: emp.employee_id || `ODS-EMP-00${index + 1}`,
        name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email,
        role_code: emp.role_code || 'employee',
        role_name: roleLabel,
        department: emp.department_name || 'Software Engineering & Cloud',
        designation: emp.designation_name || (emp.role_code === 'manager' ? 'Engineering Lead' : 'Senior Fullstack Engineer'),
        bank_account: emp.bank_account || emp.bank_account_number || '50100998877665',
        ifsc: emp.bank_ifsc || 'HDFC0001234',
        gross,
        basic,
        hra,
        allowances,
        pf,
        esi,
        pt,
        tds,
        total_deductions,
        net_salary,
        disbursed_amount: disbursed,
        pending_amount: pending,
        status,
        payslip: matchingSlip || {
          id: emp.id,
          payroll_run: '',
          employee: emp.id,
          employee_code: emp.employee_id || `ODS-EMP-00${index + 1}`,
          employee_name: `${emp.first_name} ${emp.last_name}`,
          department_name: emp.department_name || 'Software Engineering & Cloud',
          designation_title: emp.designation_name || (emp.role_code === 'manager' ? 'Engineering Lead' : 'Senior Fullstack Engineer'),
          period_name: periodLabel,
          payable_days: 30,
          gross_salary: gross,
          basic_salary: basic,
          hra,
          conveyance: 1600,
          special_allowance: allowances,
          provident_fund: pf,
          professional_tax: pt,
          esi,
          tds,
          total_deductions,
          net_salary,
          status: status === 'paid' ? 'paid' : 'draft',
          bank_account: emp.bank_account || emp.bank_account_number || '50100998877665',
          bank_name: 'HDFC Bank',
          uan: `10142981023${index + 1}`,
          pan: 'ABCDE1234F',
          payslip_number: `PS-${reportMonth.replace('-', '')}-${emp.employee_id || `00${index + 1}`}`,
          created_at: new Date().toISOString(),
        } as any,
      });
    });

    return staffList;
  }, [employees, salaryStructures, payslips, disbursedRecords, reportMonth]);

  const filteredReportStaff = useMemo(() => {
    return masterPayrollReports.filter((staff) => {
      const matchSearch =
        staff.name.toLowerCase().includes(reportSearch.toLowerCase()) ||
        staff.code.toLowerCase().includes(reportSearch.toLowerCase()) ||
        staff.department.toLowerCase().includes(reportSearch.toLowerCase()) ||
        staff.designation.toLowerCase().includes(reportSearch.toLowerCase());
      const matchRole = reportRoleFilter === 'ALL' || staff.role_code.includes(reportRoleFilter.toLowerCase());
      const matchStatus = reportStatusFilter === 'ALL' || staff.status === reportStatusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [masterPayrollReports, reportSearch, reportRoleFilter, reportStatusFilter]);

  const totalDisbursed = useMemo(() => {
    return masterPayrollReports.reduce((sum, s) => sum + s.disbursed_amount, 0);
  }, [masterPayrollReports]);

  const totalPending = useMemo(() => {
    return masterPayrollReports.reduce((sum, s) => sum + s.pending_amount, 0);
  }, [masterPayrollReports]);

  const totalGrossOutflow = useMemo(() => {
    return masterPayrollReports.reduce((sum, s) => sum + s.gross, 0);
  }, [masterPayrollReports]);

  const totalStatutoryCompliance = useMemo(() => {
    return masterPayrollReports.reduce((sum, s) => sum + s.total_deductions, 0);
  }, [masterPayrollReports]);

  // Sync tab with pathname on load / route change
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/payroll/dashboard')) setActiveTab('dashboard');
    else if (path.includes('/payroll/ctc-master')) setActiveTab('ctc-master');
    else if (path.includes('/payroll/structures')) setActiveTab('structures');
    else if (path.includes('/payroll/processing')) setActiveTab('processing');
    else if (path.includes('/payroll/advances')) setActiveTab('advances');
    else if (path.includes('/payroll/bonuses')) setActiveTab('bonuses');
    else if (path.includes('/payroll/deductions')) setActiveTab('deductions');
    else if (path.includes('/payroll/pf-management') || path.includes('/payroll/pf-esi')) setActiveTab('pf-management');
    else if (path.includes('/payroll/esi-management')) setActiveTab('esi-management');
    else if (path.includes('/payroll/pt-tax')) setActiveTab('pt-tax');
    else if (path.includes('/payroll/tds-form16') || path.includes('/payroll/taxes')) setActiveTab('tds-form16');
    else if (path.includes('/payroll/payslips')) setActiveTab('payslips');
    else if (path.includes('/payroll/settlement')) setActiveTab('settlement');
    else if (path.includes('/payroll/reports')) setActiveTab('reports');
    else {
      // Check query param e.g. ?tab=structures
      const params = new URLSearchParams(location.search);
      const tabParam = params.get('tab') as TabType;
      if (tabParam) {
        setActiveTab(tabParam);
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [location.pathname, location.search]);

  // Load all payroll data & subscribe to realtime events
  useEffect(() => {
    loadPayrollData();
    const unsub = subscribe('payroll_*', () => {
      loadPayrollData();
    });
    return () => unsub();
  }, [user]);

  const loadPayrollData = async () => {
    setLoading(true);
    try {
      const [
        runsRes, perRes, slipsRes, salRes,
        advRes, bonRes, dedRes, setRes,
        empRes, statsRes
      ] = await Promise.all([
        api.getPayrollRuns().catch(() => []),
        api.getPayrollPeriods().catch(() => []),
        api.getPayslips().catch(() => []),
        api.getSalaryStructures().catch(() => []),
        api.getAdvances().catch(() => []),
        api.getBonuses().catch(() => []),
        api.getDeductions().catch(() => []),
        api.getSettlements().catch(() => []),
        api.getEmployees().catch(() => []),
        api.getPayrollDashboard().catch(() => null),
      ]);

      setPayrollRuns(runsRes.results || runsRes || []);
      const perList = perRes.results || perRes || [];
      setPeriods(perList);
      if (perList.length > 0 && !selectedPeriodId) {
        setSelectedPeriodId(perList[0].id);
      }
      setPayslips(slipsRes.results || slipsRes || []);
      setSalaryStructures(salRes.results || salRes || []);
      setAdvances(advRes.results || advRes || []);
      setBonuses(bonRes.results || bonRes || []);
      setDeductions(dedRes.results || dedRes || []);
      setSettlements(setRes.results || setRes || []);

      const empList = empRes.results || empRes || [];
      setEmployees(empList);
      if (empList.length > 0) {
        if (!advanceForm.employee) setAdvanceForm(f => ({ ...f, employee: empList[0].id }));
        if (!bonusForm.employee) setBonusForm(f => ({ ...f, employee: empList[0].id }));
        if (!deductionForm.employee) setDeductionForm(f => ({ ...f, employee: empList[0].id }));
        if (!settlementForm.employee) setSettlementForm(f => ({ ...f, employee: empList[0].id }));
        if (!ctcForm.employee) setCtcForm(f => ({ ...f, employee: empList[0].id }));
      }
      setDashboardStats(statsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Run / Recalculate Payroll
  const handleProcessPayroll = async () => {
    if (!selectedPeriodId) return;
    setIsProcessing(true);
    try {
      const res = await api.processPayroll(selectedPeriodId);
      setSuccessToast(res.message || 'Attendance-linked payroll successfully calculated!');
      emitEvent('payroll_calculated', 'Payroll Calculated', 'Draft attendance-linked payroll ready for review', 'info');
      setRunModalOpen(false);
      loadPayrollData();
    } catch (err: any) {
      alert(err.message || 'Payroll calculation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Finalize & Release Run
  const handleFinalizeRun = async (runId: string) => {
    if (!confirm('Are you sure you want to authorize and release payslips to all employees?')) return;
    try {
      const res = await api.finalizePayroll(runId);
      setSuccessToast(res.message || 'Payroll finalized and payslips released!');
      emitEvent('payroll_finalized', 'Payroll Finalized & Released', 'Monthly payslips released to employees with portal notifications', 'success');
      loadPayrollData();
    } catch (err: any) {
      alert(err.message || 'Finalization failed');
    }
  };

  // CTC live auto calculation logic
  const handleGrossChange = (gross: number) => {
    const basic = Math.round(gross * 0.50); // 50% Wage Code compliance
    const hra = Math.round(basic * 0.40); // 40% of Basic
    const conveyance = 1600;
    const medical = 1250;
    const special = Math.max(0, gross - (basic + hra + conveyance + medical));
    // PF: 12% of basic (statutory cap at 1800 or 12%)
    const pf = Math.round(Math.min(basic * 0.12, basic >= 15000 ? 1800 : basic * 0.12));
    const pt = gross > 25000 ? 200 : gross > 13333 ? 125 : 0;
    const esi = gross <= 21000 ? Math.round(gross * 0.0075) : 0;

    setCtcForm(f => ({
      ...f,
      annual_ctc: gross * 12,
      monthly_gross: gross,
      basic_salary: basic,
      hra,
      conveyance_allowance: conveyance,
      medical_allowance: medical,
      special_allowance: special,
      provident_fund: pf,
      professional_tax: pt,
      esi,
    }));
  };

  const handleAnnualCtcChange = (annual: number) => {
    const gross = Math.round(annual / 12);
    handleGrossChange(gross);
  };

  const handleSaveCtcStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        employee: ctcForm.employee,
        effective_from: ctcForm.effective_from,
        basic_salary: ctcForm.basic_salary,
        hra: ctcForm.hra,
        conveyance_allowance: ctcForm.conveyance_allowance,
        medical_allowance: ctcForm.medical_allowance,
        special_allowance: ctcForm.special_allowance,
        provident_fund: ctcForm.provident_fund,
        professional_tax: ctcForm.professional_tax,
        esi: ctcForm.esi,
        is_active: true,
      };

      if (selectedStructureForEdit) {
        await api.updateSalaryStructure(selectedStructureForEdit.id, payload);
        setSuccessToast(`✓ Updated CTC & Salary Structure for ${selectedStructureForEdit.employee_name}`);
      } else {
        await api.createSalaryStructure(payload);
        setSuccessToast('🎉 New CTC & Salary Structure configured successfully!');
      }

      emitEvent('payroll_ctc_updated', 'CTC Master Updated', `Configured monthly gross ₹${ctcForm.monthly_gross}`, 'success');
      setCtcModalOpen(false);
      setSelectedStructureForEdit(null);
      loadPayrollData();
    } catch (err: any) {
      alert(err.message || 'Failed to save salary structure');
    }
  };

  const handleOpenEditCtc = (s: SalaryStructure) => {
    setSelectedStructureForEdit(s);
    setCtcForm({
      employee: s.employee,
      annual_ctc: (s.gross || 50000) * 12,
      monthly_gross: s.gross || 50000,
      basic_salary: s.basic_salary,
      hra: s.hra,
      conveyance_allowance: s.conveyance_allowance || 1600,
      medical_allowance: s.medical_allowance || 1250,
      special_allowance: s.special_allowance,
      provident_fund: s.provident_fund,
      professional_tax: s.professional_tax,
      esi: s.esi || 0,
      effective_from: s.effective_from || new Date().toISOString().split('T')[0],
    });
    setCtcModalOpen(true);
  };

  const handleDeleteStructure = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete salary structure for ${name}?`)) return;
    try {
      await api.deleteSalaryStructure(id);
      setSuccessToast(`✓ Deleted salary structure for ${name}`);
      loadPayrollData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete structure');
    }
  };

  // Handle Advance Submission
  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseFloat(advanceForm.amount);
      const tenure = parseInt(String(advanceForm.tenure_months)) || 1;
      const emi = (amount / tenure).toFixed(2);
      await api.createAdvance({
        employee: advanceForm.employee,
        amount,
        tenure_months: tenure,
        monthly_emi: emi,
        reason: advanceForm.reason,
        status: 'approved',
      });
      setAdvanceModalOpen(false);
      setSuccessToast('🎉 Salary Advance approved and recorded in employee ledger!');
      emitEvent('payroll_advance_created', 'Salary Advance Approved', `₹${amount} advance scheduled for monthly EMI deduction`, 'info');
      loadPayrollData();
    } catch (err: any) {
      alert(err.message || 'Failed to record advance');
    }
  };

  const handleUpdateAdvanceStatus = async (id: string, status: string) => {
    try {
      await api.updateAdvanceStatus(id, status);
      setSuccessToast(`✓ Advance status updated to ${status.toUpperCase()}`);
      emitEvent('payroll_advance_updated', 'Advance Status Updated', `Status changed to ${status}`, 'info');
      loadPayrollData();
    } catch (err: any) {
      alert(err.message || 'Failed to update advance');
    }
  };

  // Handle Bonus Submission
  const handleCreateBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBonus({
        ...bonusForm,
        amount: parseFloat(bonusForm.amount),
        status: 'approved',
      });
      setBonusModalOpen(false);
      setSuccessToast('🎉 Bonus / Incentive granted and approved for next payroll cycle!');
      emitEvent('payroll_bonus_granted', 'Bonus Granted', `₹${bonusForm.amount} bonus approved`, 'success');
      loadPayrollData();
    } catch (err: any) {
      alert(err.message || 'Failed to grant bonus');
    }
  };

  // Handle Deduction Submission
  const handleCreateDeduction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDeduction({
        ...deductionForm,
        amount: parseFloat(deductionForm.amount),
        status: 'scheduled',
      });
      setDeductionModalOpen(false);
      setSuccessToast('✓ Scheduled deduction recorded for upcoming payroll processing.');
      emitEvent('payroll_deduction_added', 'Deduction Scheduled', `₹${deductionForm.amount} deduction scheduled`, 'warning');
      loadPayrollData();
    } catch (err: any) {
      alert(err.message || 'Failed to record deduction');
    }
  };

  // Handle Settlement Submission
  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const gratuity = parseFloat(settlementForm.gratuity_amount) || 0;
      const leaveEnc = parseFloat(settlementForm.leave_encashment_amount) || 0;
      const noticePay = parseFloat(settlementForm.notice_pay_payable) || 0;
      const recoveries = parseFloat(settlementForm.asset_recovery_deductions) || 0;
      const net = gratuity + leaveEnc + noticePay - recoveries;

      await api.createSettlement({
        ...settlementForm,
        gratuity_amount: gratuity,
        leave_encashment_amount: leaveEnc,
        notice_pay_payable: noticePay,
        asset_recovery_deductions: recoveries,
        net_settlement_payable: net,
        status: 'approved',
      });
      setSettlementModalOpen(false);
      setSuccessToast('🎉 Full & Final Settlement calculation generated and approved!');
      emitEvent('payroll_settlement_approved', 'F&F Settlement Approved', `Net settlement: ₹${net}`, 'success');
      loadPayrollData();
    } catch (err: any) {
      alert(err.message || 'Failed to compute settlement');
    }
  };

  // PF Challan Submission
  const handleRecordPfChallan = (e: React.FormEvent) => {
    e.preventDefault();
    setPfPaidStatus(true);
    setPfChallanModalOpen(false);
    setSuccessToast(`✓ EPFO Electronic Challan TRRN ${pfChallanForm.trrn} successfully recorded & verified!`);
    emitEvent('payroll_pf_challan_paid', 'EPFO Challan Recorded', `TRRN ${pfChallanForm.trrn} - ₹${pfChallanForm.amount} paid`, 'success');
  };

  // ESI Challan Submission
  const handleRecordEsiChallan = (e: React.FormEvent) => {
    e.preventDefault();
    setEsiPaidStatus(true);
    setEsiChallanModalOpen(false);
    setSuccessToast(`✓ ESIC Challan Ref ${esiChallanForm.challan_ref} successfully recorded & verified!`);
    emitEvent('payroll_esi_challan_paid', 'ESIC Challan Recorded', `Ref ${esiChallanForm.challan_ref} - ₹${esiChallanForm.amount} paid`, 'success');
  };

  // EPFO ECR Text File Download (#~# Delimited standard EPFO format)
  const handleExportPfECR = () => {
    const lines = salaryStructures.map((s, idx) => {
      const basic = Math.min(Number(s.basic_salary), 15000);
      const fullBasic = Number(s.basic_salary);
      const eeShare = Math.round(fullBasic * 0.12);
      const epsShare = Math.round(basic * 0.0833);
      const erShare = eeShare - epsShare;
      const uan = `10142981023${idx + 1}`;
      return `#~#${uan}#~#${s.employee_name}#~#${fullBasic}#~#${basic}#~#${basic}#~#${eeShare}#~#${epsShare}#~#${erShare}#~#0#~#0`;
    });

    const fileContent = lines.join('\r\n');
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `EPFO_ECR_Nov2026_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessToast('✓ Authentic EPFO ECR Text File (#~# delimited) downloaded successfully for Unified Portal upload!');
  };

  const handlePrint = () => {
    window.print();
  };

  // CSV Export Helper
  const handleExportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.map(item => `"${item}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessToast(`✓ ${filename} exported successfully.`);
  };

  // Switch tab and navigate
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    navigate(`/app/payroll/${tab}`);
  };

  // ==========================================
  // TABLE COLUMNS CONFIGURATIONS
  // ==========================================

  // Payslip Columns
  const payslipColumns: ColumnDef<Payslip>[] = [
    {
      key: 'payslip_number',
      header: 'Payslip ID',
      accessor: (row) => row.payslip_number,
      render: (row) => <span className="font-mono font-bold text-slate-800">{row.payslip_number}</span>,
    },
    {
      key: 'employee_name',
      header: 'Employee Name & Code',
      accessor: (row) => row.employee_name,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block leading-tight">{row.employee_name}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.employee_code}</span>
        </div>
      ),
    },
    {
      key: 'period_name',
      header: 'Cycle Period',
      accessor: (row) => row.period_name,
      render: (row) => <span className="font-medium text-slate-700">{row.period_name}</span>,
    },
    {
      key: 'payable_days',
      header: 'Payable / Protected Days',
      accessor: (row) => row.payable_days,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 font-mono">{row.payable_days} Days</span>
          <span className="text-[10px] text-slate-400 block">
            Holidays: {row.holidays_count} • LOP: {row.unpaid_leave_days}
          </span>
        </div>
      ),
    },
    {
      key: 'gross_salary',
      header: 'Gross Salary',
      accessor: (row) => Number(row.gross_salary),
      render: (row) => (
        <span className="font-mono font-bold text-slate-900">
          ₹{Number(row.gross_salary).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'total_deductions',
      header: 'Statutory Deductions',
      accessor: (row) => Number(row.total_deductions),
      render: (row) => (
        <span className="font-mono text-rose-600 font-semibold">
          -₹{Number(row.total_deductions).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'net_salary',
      header: 'Net Take-Home',
      accessor: (row) => Number(row.net_salary),
      render: (row) => (
        <span className="font-mono font-extrabold text-emerald-700 text-sm">
          ₹{Number(row.net_salary).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Action',
      sortable: false,
      align: 'right',
      render: (row) => (
        <button
          onClick={() => {
            setSelectedPayslip(row);
            setPayslipModalOpen(true);
          }}
          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors cursor-pointer text-xs"
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          View Payslip
        </button>
      ),
    },
  ];

  // Payroll Runs Columns
  const runColumns: ColumnDef<any>[] = [
    {
      key: 'period_name',
      header: 'Cycle Period',
      accessor: (row) => row.period_name,
      render: (row) => <span className="font-bold text-slate-900">{row.period_name}</span>,
    },
    {
      key: 'total_employees',
      header: 'Headcount',
      accessor: (row) => row.total_employees,
      render: (row) => <span className="font-bold text-slate-700">{row.total_employees} Employees</span>,
    },
    {
      key: 'total_gross',
      header: 'Gross Payroll Outflow',
      accessor: (row) => Number(row.total_gross),
      render: (row) => <span className="font-mono font-bold text-slate-900">₹{Number(row.total_gross).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'total_deductions',
      header: 'Statutory Deductions',
      accessor: (row) => Number(row.total_deductions),
      render: (row) => <span className="font-mono text-rose-600 font-semibold">-₹{Number(row.total_deductions).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'total_net',
      header: 'Net Take-Home Outflow',
      accessor: (row) => Number(row.total_net),
      render: (row) => <span className="font-mono font-extrabold text-emerald-700 text-sm">₹{Number(row.total_net).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'status',
      header: 'Processing Status',
      accessor: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      align: 'right',
      render: (row) => (
        <div className="flex items-center space-x-2 justify-end">
          {row.status === 'draft' ? (
            <button
              onClick={() => handleFinalizeRun(row.id)}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors cursor-pointer text-xs shadow-xs"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Authorize & Finalize
            </button>
          ) : (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Released
            </span>
          )}
        </div>
      ),
    },
  ];

  // Salary Structure Columns
  const structureColumns: ColumnDef<SalaryStructure>[] = [
    {
      key: 'employee_name',
      header: 'Staff Member',
      accessor: (row) => row.employee_name,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block leading-tight">{row.employee_name}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.employee_code}</span>
        </div>
      ),
    },
    {
      key: 'basic_salary',
      header: 'Basic Salary (50%)',
      accessor: (row) => Number(row.basic_salary),
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900">₹{Number(row.basic_salary).toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-emerald-600 block">Wage Code Compliant</span>
        </div>
      ),
    },
    {
      key: 'hra',
      header: 'HRA (40%)',
      accessor: (row) => Number(row.hra),
      render: (row) => <span className="font-mono text-slate-700">₹{Number(row.hra).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'special_allowance',
      header: 'Special Allowance',
      accessor: (row) => Number(row.special_allowance),
      render: (row) => <span className="font-mono text-slate-700">₹{Number(row.special_allowance).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'provident_fund',
      header: 'EPF (12%)',
      accessor: (row) => Number(row.provident_fund),
      render: (row) => <span className="font-mono text-rose-600">₹{Number(row.provident_fund).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'gross',
      header: 'Monthly Gross',
      accessor: (row) => Number(row.gross),
      render: (row) => <span className="font-mono font-bold text-slate-900">₹{Number(row.gross).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'net',
      header: 'Net Monthly',
      accessor: (row) => Number(row.net),
      render: (row) => <span className="font-mono font-extrabold text-emerald-700">₹{Number(row.net).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      align: 'right',
      render: (row) => (
        <div className="flex items-center space-x-1.5 justify-end">
          <button
            onClick={() => handleOpenEditCtc(row)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer text-xs"
            title="Edit Structure & CTC"
          >
            <Sliders className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteStructure(row.id, row.employee_name)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-xs"
            title="Delete Structure"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Advances Columns
  const advanceColumns: ColumnDef<SalaryAdvance>[] = [
    {
      key: 'employee_name',
      header: 'Staff Member',
      accessor: (row) => row.employee_name,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block leading-tight">{row.employee_name}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.employee_code}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Disbursed Principal',
      accessor: (row) => Number(row.amount),
      render: (row) => <span className="font-mono font-bold text-slate-900">₹{Number(row.amount).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'tenure_months',
      header: 'Tenure / EMI Term',
      accessor: (row) => row.tenure_months,
      render: (row) => <span className="font-medium text-slate-700">{row.tenure_months} Months</span>,
    },
    {
      key: 'monthly_emi',
      header: 'Monthly Deduction (EMI)',
      accessor: (row) => Number(row.monthly_emi),
      render: (row) => <span className="font-mono font-bold text-rose-600">₹{Number(row.monthly_emi).toLocaleString('en-IN')} / mo</span>,
    },
    {
      key: 'repaid_amount',
      header: 'Repaid So Far',
      accessor: (row) => Number(row.repaid_amount),
      render: (row) => <span className="font-mono text-emerald-600">₹{Number(row.repaid_amount).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      align: 'right',
      render: (row) => (
        <div className="flex items-center space-x-1.5 justify-end">
          {row.status === 'pending' && (
            <button
              onClick={() => handleUpdateAdvanceStatus(row.id, 'approved')}
              className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-500 cursor-pointer"
            >
              Approve
            </button>
          )}
          {row.status === 'approved' && (
            <button
              onClick={() => handleUpdateAdvanceStatus(row.id, 'completed')}
              className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-bold text-[11px] hover:bg-slate-800 cursor-pointer"
            >
              Mark Repaid
            </button>
          )}
        </div>
      ),
    },
  ];

  // Bonuses Columns
  const bonusColumns: ColumnDef<BonusIncentive>[] = [
    {
      key: 'employee_name',
      header: 'Staff Member',
      accessor: (row) => row.employee_name,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block leading-tight">{row.employee_name}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.employee_code}</span>
        </div>
      ),
    },
    {
      key: 'bonus_type',
      header: 'Award Category',
      accessor: (row) => row.bonus_type,
      render: (row) => (
        <span className="capitalize font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px]">
          {row.bonus_type.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Bonus Amount',
      accessor: (row) => Number(row.amount),
      render: (row) => <span className="font-mono font-bold text-emerald-700">₹{Number(row.amount).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'effective_date',
      header: 'Effective Month',
      accessor: (row) => row.effective_date,
      render: (row) => <span className="text-slate-600 font-mono">{row.effective_date}</span>,
    },
    {
      key: 'status',
      header: 'Approval Status',
      accessor: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  // Deductions Columns
  const deductionColumns: ColumnDef<CustomDeduction>[] = [
    {
      key: 'employee_name',
      header: 'Staff Member',
      accessor: (row) => row.employee_name,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block leading-tight">{row.employee_name}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.employee_code}</span>
        </div>
      ),
    },
    {
      key: 'deduction_type',
      header: 'Deduction Reason',
      accessor: (row) => row.deduction_type,
      render: (row) => (
        <span className="capitalize font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px]">
          {row.deduction_type.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Deduction Amount',
      accessor: (row) => Number(row.amount),
      render: (row) => <span className="font-mono font-bold text-rose-600">-₹{Number(row.amount).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'effective_date',
      header: 'Scheduled Date',
      accessor: (row) => row.effective_date,
      render: (row) => <span className="text-slate-600 font-mono">{row.effective_date}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  // Settlement Columns
  const settlementColumns: ColumnDef<SettlementRecord>[] = [
    {
      key: 'employee_name',
      header: 'Relieved Employee',
      accessor: (row) => row.employee_name,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block leading-tight">{row.employee_name}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.employee_code}</span>
        </div>
      ),
    },
    {
      key: 'last_working_day',
      header: 'Last Working Day',
      accessor: (row) => row.last_working_day,
      render: (row) => <span className="font-mono text-slate-700 font-bold">{row.last_working_day}</span>,
    },
    {
      key: 'gratuity_amount',
      header: 'Gratuity',
      accessor: (row) => Number(row.gratuity_amount),
      render: (row) => <span className="font-mono text-slate-700">₹{Number(row.gratuity_amount).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'leave_encashment_amount',
      header: 'Leave Encashment',
      accessor: (row) => Number(row.leave_encashment_amount),
      render: (row) => <span className="font-mono text-slate-700">₹{Number(row.leave_encashment_amount).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'net_settlement_payable',
      header: 'Net Settlement Payable',
      accessor: (row) => Number(row.net_settlement_payable),
      render: (row) => <span className="font-mono font-extrabold text-emerald-700 text-sm">₹{Number(row.net_settlement_payable).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  // Helper totals for PF calculations
  const totalPfLiability = salaryStructures.reduce((acc, s) => {
    const basic = Number(s.basic_salary) || 0;
    const cappedBasic = Math.min(basic, 15000);
    const ee = Math.round(basic * 0.12);
    const erEps = Math.round(cappedBasic * 0.0833);
    const erEpf = Math.round(basic * 0.0367);
    const edli = Math.round(cappedBasic * 0.005);
    const admin = Math.round(basic * 0.005);
    return {
      ee: acc.ee + ee,
      erEps: acc.erEps + erEps,
      erEpf: acc.erEpf + erEpf,
      edliAdmin: acc.edliAdmin + edli + admin,
      total: acc.total + ee + erEps + erEpf + edli + admin,
    };
  }, { ee: 0, erEps: 0, erEpf: 0, edliAdmin: 0, total: 0 });

  // Helper totals for ESI calculations
  const esiEligibleStaff = salaryStructures.filter(s => Number(s.gross || 50000) <= 21000);
  const totalEsiLiability = esiEligibleStaff.reduce((acc, s) => {
    const gross = Number(s.gross) || 0;
    const ee = Math.round(gross * 0.0075);
    const er = Math.round(gross * 0.0325);
    return {
      ee: acc.ee + ee,
      er: acc.er + er,
      total: acc.total + ee + er,
    };
  }, { ee: 0, er: 0, total: 0 });

  // Active submodule metadata for page header
  const activeModuleMeta = useMemo(() => {
    const meta: Record<TabType, { title: string; subtitle: string }> = {
      'dashboard': {
        title: 'Payroll Dashboard & Analytics',
        subtitle: 'Realtime salary disbursement KPIs, attendance-linked cost trends, and statutory compliance status.',
      },
      'ctc-master': {
        title: 'Payroll & CTC Master',
        subtitle: 'Cost-to-Company compensation benchmarks, wage code splits, and annual CTC calculators.',
      },
      'structures': {
        title: 'Salary Structures & Wage Breakup',
        subtitle: 'Component-level earnings, basic pay (50% wage code compliance), HRA, allowances, and statutory deductions.',
      },
      'processing': {
        title: 'Monthly Payroll Processing',
        subtitle: 'Automated payroll cycle generation with real-time biometric attendance and leave deduction sync.',
      },
      'advances': {
        title: 'Salary Advances & Employee Loans',
        subtitle: 'Manage salary advance requests, loan disbursements, EMI recovery tenure, and payroll auto-deductions.',
      },
      'bonuses': {
        title: 'Bonuses & Incentives Management',
        subtitle: 'Performance incentives, festival bonuses, referral commissions, and one-time payouts.',
      },
      'deductions': {
        title: 'Deductions & Penalties',
        subtitle: 'Custom recurring or one-time deductions, disciplinary penalties, and asset damage recovery.',
      },
      'pf-management': {
        title: 'EPFO & Provident Fund Management',
        subtitle: 'Statutory 12% EPF & 8.33% EPS calculations, ECR file generation, and TRRN payment reconciliation.',
      },
      'esi-management': {
        title: 'ESIC & Healthcare Insurance Management',
        subtitle: '0.75% employee and 3.25% employer ESIC contributions, monthly return generation, and online payment status.',
      },
      'pt-tax': {
        title: 'Professional Tax (PT) Compliance',
        subtitle: 'State-wise PT slabs and automated deduction rules for Odisha, Maharashtra, Karnataka, and West Bengal.',
      },
      'tds-form16': {
        title: 'TDS (Income Tax) & Form 16 Management',
        subtitle: 'Income tax Section 192 tax deduction, new vs old regime tax simulator, and automated Form 16 generation.',
      },
      'payslips': {
        title: 'Employee Payslip Generation & Distribution',
        subtitle: 'Generate, preview, print, and bulk email detailed salary payslips with digital QR verification.',
      },
      'settlement': {
        title: 'Full & Final (F&F) Settlement',
        subtitle: 'Automated final settlement calculation including gratuity, leave encashment, notice pay, and recovery.',
      },
      'reports': {
        title: 'Statutory & Management Payroll Reports',
        subtitle: 'EPF ECR text files, ESI monthly contribution sheets, bank disbursement NEFT files, and variance analysis.',
      },
    };
    return meta[activeTab] || {
      title: 'Payroll & Compensation Master',
      subtitle: 'Odias ERP automated Indian statutory compliance, EPFO ECR filing, ESIC, State PT, and TDS Section 192 engine.',
    };
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{activeModuleMeta.title}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Realtime Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeModuleMeta.subtitle}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setRunModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 mr-1.5" />
            ⚡ Process Attendance Payroll
          </button>
          <button
            onClick={loadPayrollData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh Realtime Payroll Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-xs underline text-emerald-700 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. PAYROLL DASHBOARD TAB                                 */}
      {/* ========================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Summary Cards (Responsive 2 per row on mobile) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 truncate">Gross Monthly Outflow</span>
                <div className="p-1.5 sm:p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                  <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-1.5 sm:mt-2">
                <span className="text-base sm:text-2xl font-black text-slate-900 font-mono block truncate">
                  ₹{Number(dashboardStats?.latest_payout || 707850).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] sm:text-[11px] text-emerald-600 block mt-0.5 flex items-center font-semibold truncate">
                  <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5 sm:mr-1 shrink-0" />
                  Policy-Protected
                </span>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 truncate">Statutory (PF/PT/ESI)</span>
                <div className="p-1.5 sm:p-2 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-1.5 sm:mt-2">
                <span className="text-base sm:text-2xl font-black text-slate-900 font-mono block truncate">
                  ₹{Number(dashboardStats?.total_deductions || 42800).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400 block mt-0.5 truncate">
                  EPFO, ESIC & PT
                </span>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 truncate">Payroll Headcount</span>
                <div className="p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-1.5 sm:mt-2">
                <span className="text-base sm:text-2xl font-black text-slate-900 font-mono block truncate">
                  {salaryStructures.length || 7} Staff
                </span>
                <span className="text-[10px] sm:text-[11px] text-blue-600 block mt-0.5 font-semibold truncate">
                  All CTC structures active
                </span>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 truncate">Processing Period</span>
                <div className="p-1.5 sm:p-2 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-1.5 sm:mt-2">
                <span className="text-sm sm:text-lg font-black text-slate-900 block truncate">
                  {periods[0]?.name || 'November 2026'}
                </span>
                <span className="text-[10px] sm:text-[11px] text-purple-700 bg-purple-50 px-1.5 sm:px-2 py-0.5 rounded-md font-bold uppercase inline-block mt-0.5 truncate">
                  Status: {periods[0]?.status || 'Review'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Strip */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-sm flex items-center">
                <Zap className="w-4 h-4 mr-2 text-emerald-400" />
                Quick Payroll Actions
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Execute core compensation workflows in one click.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setRunModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center"
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                Run Payroll
              </button>
              <button
                onClick={() => { setSelectedStructureForEdit(null); setCtcModalOpen(true); }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add CTC
              </button>
              <button
                onClick={() => setAdvanceModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Grant Advance
              </button>
              <button
                onClick={() => setBonusModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Grant Bonus
              </button>
              <button
                onClick={() => handleExportPfECR()}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs transition-colors cursor-pointer flex items-center"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Export ECR
              </button>
            </div>
          </div>

          {/* Statutory Compliance Health Matrix */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mr-2" />
              Statutory Compliance & Remittance Health
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">EPFO / PF</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px] font-bold">Compliant</span>
                </div>
                <p className="text-[11px] text-emerald-800 mt-1">12% Employee + 12% Employer + 0.5% Admin</p>
                <span className="font-mono font-bold text-emerald-950 mt-2 block">ECR Ready • TRRN: 1012611004829</span>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900">ESIC</span>
                  <span className="px-2 py-0.5 rounded bg-blue-200 text-blue-900 text-[10px] font-bold">Compliant</span>
                </div>
                <p className="text-[11px] text-blue-800 mt-1">0.75% Employee + 3.25% Employer (Gross &le; 21k)</p>
                <span className="font-mono font-bold text-blue-950 mt-2 block">Challan Ref: ESI-01-2026-9921</span>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900">Professional Tax</span>
                  <span className="px-2 py-0.5 rounded bg-purple-200 text-purple-900 text-[10px] font-bold">Enrolled</span>
                </div>
                <p className="text-[11px] text-purple-800 mt-1">Odisha Schedule: ₹200 / month</p>
                <span className="font-mono font-bold text-purple-950 mt-2 block">Monthly PT: ₹1,400</span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">TDS u/s 192</span>
                  <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">Form 24Q Ready</span>
                </div>
                <p className="text-[11px] text-amber-800 mt-1">New Tax Regime u/s 115BAC (₹75k Std Ded)</p>
                <span className="font-mono font-bold text-amber-950 mt-2 block">100% Staff PAN Linked</span>
              </div>
            </div>
          </div>

          {/* Recent Payroll Runs Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">Recent Processing Cycles & Approvals</h3>
              <button
                onClick={() => handleTabChange('processing')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center cursor-pointer"
              >
                Go to Full Processing Hub <ChevronRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>
            <DataTable
              data={payrollRuns}
              columns={runColumns}
              searchPlaceholder="Search processing cycles..."
              initialPageSize={5}
              pageSizeOptions={[5, 10, 20]}
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. PAYROLL & CTC MASTER TAB                              */}
      {/* ========================================================= */}
      {activeTab === 'ctc-master' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center">
                <Calculator className="w-5 h-5 text-emerald-600 mr-2" />
                Employee CTC & Compensation Master
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Indian Wage Code 2019 compliant structures with automated 50% basic salary calculation and statutory allowances.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => { setSelectedStructureForEdit(null); setCtcModalOpen(true); }}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                + Configure / Add CTC
              </button>
              <button
                onClick={() => handleExportCSV('Employee_CTC_Master', ['Employee Code', 'Employee Name', 'Annual CTC', 'Monthly Gross', 'Basic Pay', 'HRA', 'Special Allowance', 'PF', 'PT', 'Net Take-Home'], salaryStructures.map(s => [
                  s.employee_code, s.employee_name, (Number(s.gross || 50000) * 12), s.gross, s.basic_salary, s.hra, s.special_allowance, s.provident_fund, s.professional_tax, s.net
                ]))}
                className="inline-flex items-center px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Export CTC Master
              </button>
            </div>
          </div>

          {/* CTC Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500">Total Annual CTC Commitment</span>
              <span className="text-xl font-black text-slate-900 font-mono block mt-1">
                ₹{(salaryStructures.reduce((sum, s) => sum + (Number(s.gross || 50000) * 12), 0)).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500">Average Annual CTC / Employee</span>
              <span className="text-xl font-black text-slate-900 font-mono block mt-1">
                ₹{salaryStructures.length ? Math.round(salaryStructures.reduce((sum, s) => sum + (Number(s.gross || 50000) * 12), 0) / salaryStructures.length).toLocaleString('en-IN') : '0'}
              </span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500">Wage Code Compliance Rate</span>
              <span className="text-xl font-black text-emerald-600 block mt-1">
                100% (Basic &ge; 50%)
              </span>
            </div>
          </div>

          <DataTable
            data={salaryStructures}
            columns={structureColumns}
            searchPlaceholder="Search CTC structures by employee or designation..."
            initialPageSize={10}
            pageSizeOptions={[10, 25, 50]}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. SALARY STRUCTURES TAB                                  */}
      {/* ========================================================= */}
      {activeTab === 'structures' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Organizational Grade & Band Templates</h3>
              <p className="text-xs text-slate-500 mt-1">Standardized corporate compensation bands compliant with the Code on Wages.</p>
            </div>
            <button
              onClick={() => { setSelectedStructureForEdit(null); setCtcModalOpen(true); }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              + Create Grade Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-900 text-sm">Grade A1: Senior Leadership</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">Active</span>
              </div>
              <p className="text-slate-500">VP, Directors & Principal Architects</p>
              <div className="font-mono text-slate-700 space-y-1 pt-2 border-t border-slate-100">
                <div className="flex justify-between"><span>Basic Pay:</span><span className="font-bold">50% of Gross</span></div>
                <div className="flex justify-between"><span>HRA:</span><span>25% of Basic</span></div>
                <div className="flex justify-between"><span>Special Allowance:</span><span>25% (Balancing)</span></div>
                <div className="flex justify-between"><span>Statutory EPF:</span><span>12% Capped (₹1,800)</span></div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-900 text-sm">Grade M1: Mid-Level Tech/Sales</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">Active</span>
              </div>
              <p className="text-slate-500">Senior Engineers & Account Managers</p>
              <div className="font-mono text-slate-700 space-y-1 pt-2 border-t border-slate-100">
                <div className="flex justify-between"><span>Basic Pay:</span><span className="font-bold">50% of Gross</span></div>
                <div className="flex justify-between"><span>HRA:</span><span>20% of Basic</span></div>
                <div className="flex justify-between"><span>Special Allowance:</span><span>30%</span></div>
                <div className="flex justify-between"><span>Statutory EPF:</span><span>12% Full Basic</span></div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-900 text-sm">Grade T1: Trainee & Associate</span>
                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px]">Active</span>
              </div>
              <p className="text-slate-500">Junior Associates, Support & Trainees</p>
              <div className="font-mono text-slate-700 space-y-1 pt-2 border-t border-slate-100">
                <div className="flex justify-between"><span>Basic Pay:</span><span className="font-bold">50% of Gross</span></div>
                <div className="flex justify-between"><span>HRA:</span><span>20% of Basic</span></div>
                <div className="flex justify-between"><span>ESI Health Cover:</span><span>0.75% Eligible</span></div>
                <div className="flex justify-between"><span>State PT:</span><span>₹125 / month</span></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h4 className="font-extrabold text-slate-900 text-sm">Individual Employee Structure Mappings</h4>
            <DataTable
              data={salaryStructures}
              columns={structureColumns}
              searchPlaceholder="Search active structures..."
              initialPageSize={10}
              pageSizeOptions={[10, 25, 50]}
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MONTHLY PAYROLL PROCESSING TAB                         */}
      {/* ========================================================= */}
      {activeTab === 'processing' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center">
                <Play className="w-5 h-5 text-emerald-600 mr-2" />
                Monthly Payroll Processing Command Center
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Attendance-linked calculation engine. Incorporates verified attendance, LOP leaves, statutory deductions, bonuses, and advances.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRunModalOpen(true)}
                className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                <Play className="w-4 h-4 mr-1.5" />
                ⚡ Calculate Attendance Payroll
              </button>
            </div>
          </div>

          {/* Attendance Linkage & Verification Monitor */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-slate-400 font-medium">Calendar Days in Cycle</span>
              <span className="text-xl font-black text-slate-900 font-mono block mt-1">30 Days</span>
              <span className="text-[11px] text-emerald-600 mt-1 block">Full Month Basis</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-slate-400 font-medium">Protected Holidays & Offs</span>
              <span className="text-xl font-black text-blue-700 font-mono block mt-1">8 Days</span>
              <span className="text-[11px] text-blue-600 mt-1 block">100% Policy Protected</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-slate-400 font-medium">Detected Unpaid LOP Days</span>
              <span className="text-xl font-black text-rose-600 font-mono block mt-1">4 Days</span>
              <span className="text-[11px] text-rose-500 mt-1 block">Auto-deducted from gross</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-slate-400 font-medium">Draft Calculation Status</span>
              <span className="text-xl font-black text-purple-700 font-mono block mt-1">Ready for Review</span>
              <span className="text-[11px] text-purple-600 mt-1 block">Audit trail recorded</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h4 className="font-extrabold text-slate-900 text-sm">Payroll Cycles & Review Queue</h4>
            <DataTable
              data={payrollRuns}
              columns={runColumns}
              searchPlaceholder="Search processing cycles..."
              initialPageSize={10}
              pageSizeOptions={[10, 25, 50]}
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. SALARY ADVANCES & LOANS TAB                            */}
      {/* ========================================================= */}
      {activeTab === 'advances' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Staff Advances & Loan Facility</h3>
              <p className="text-xs text-slate-500">Track requested emergency advances and automated monthly EMI payroll deductions.</p>
            </div>
            <button
              onClick={() => setAdvanceModalOpen(true)}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Request / Grant Advance
            </button>
          </div>
          <DataTable
            data={advances}
            columns={advanceColumns}
            searchPlaceholder="Search advances by employee or purpose..."
            initialPageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. BONUSES & INCENTIVES TAB                               */}
      {/* ========================================================= */}
      {activeTab === 'bonuses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Bonuses, Ex-Gratia & Incentives Register</h3>
              <p className="text-xs text-slate-500">Award quarterly bonuses, Diwali festival ex-gratia, and spot sales performance commissions.</p>
            </div>
            <button
              onClick={() => setBonusModalOpen(true)}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              + Grant Bonus / Incentive
            </button>
          </div>
          <DataTable
            data={bonuses}
            columns={bonusColumns}
            searchPlaceholder="Search bonuses by employee or award type..."
            initialPageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. DEDUCTIONS & PENALTIES TAB                             */}
      {/* ========================================================= */}
      {activeTab === 'deductions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Scheduled Deductions & Penalties</h3>
              <p className="text-xs text-slate-500">TDS adjustments, medical insurance top-ups, asset recovery, and late arrival attendance deductions.</p>
            </div>
            <button
              onClick={() => setDeductionModalOpen(true)}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              + Schedule Deduction
            </button>
          </div>
          <DataTable
            data={deductions}
            columns={deductionColumns}
            searchPlaceholder="Search deductions by employee..."
            initialPageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. PF / EPF MANAGEMENT TAB (USER EXPLICITLY REQUESTED)    */}
      {/* ========================================================= */}
      {activeTab === 'pf-management' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center">
                <Shield className="w-5 h-5 text-emerald-600 mr-2" />
                EPFO (Employees' Provident Fund Organisation) Statutory Register
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Statutory 12% employee deduction, 3.67% employer EPF, 8.33% EPS pension fund, 0.5% EDLI, and 0.5% EPFO admin charges.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportPfECR}
                className="inline-flex items-center px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Download EPFO ECR Text File (.txt)
              </button>
              <button
                onClick={() => handleExportCSV('EPFO_ECR_Filing_Nov2026', ['Member ID / UAN', 'Member Name', 'Gross Wages', 'EPF Wages', 'EPS Wages', 'EDLI Wages', 'EPF Employee Share (12%)', 'EPS Employer Share (8.33%)', 'EPF Employer Share (3.67%)', 'NCP Days'], salaryStructures.map((s, idx) => [
                  `10142981023${idx + 1}`, s.employee_name, s.gross, s.basic_salary, Math.min(Number(s.basic_salary), 15000), Math.min(Number(s.basic_salary), 15000), Math.round(Number(s.basic_salary) * 0.12), Math.round(Math.min(Number(s.basic_salary), 15000) * 0.0833), Math.round(Number(s.basic_salary) * 0.0367), 0
                ]))}
                className="inline-flex items-center px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Download ECR CSV
              </button>
              <button
                onClick={() => setPfChallanModalOpen(true)}
                className="inline-flex items-center px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-colors cursor-pointer"
              >
                <CreditCard className="w-4 h-4 mr-1.5" />
                Record Challan Payment
              </button>
            </div>
          </div>

          {/* EPFO Monthly Liability Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">EE Share (12%)</span>
              <span className="text-xl font-black text-rose-600 font-mono mt-1 block">
                ₹{totalPfLiability.ee.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400">Deducted from salary</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">ER EPS Pension (8.33%)</span>
              <span className="text-xl font-black text-blue-600 font-mono mt-1 block">
                ₹{totalPfLiability.erEps.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400">Capped on ₹15k wage ceiling</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">ER EPF (3.67%)</span>
              <span className="text-xl font-black text-blue-600 font-mono mt-1 block">
                ₹{totalPfLiability.erEpf.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400">Employer EPF balance</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">EDLI (0.5%) & Admin (0.5%)</span>
              <span className="text-xl font-black text-slate-700 font-mono mt-1 block">
                ₹{totalPfLiability.edliAdmin.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400">Govt charges</span>
            </div>

            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-900 block">Total Monthly Challan</span>
              <span className="text-xl font-black text-emerald-800 font-mono mt-1 block">
                ₹{totalPfLiability.total.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">
                {pfPaidStatus ? '✓ TRRN Paid & Verified' : 'Due 15th'}
              </span>
            </div>
          </div>

          {/* TRRN Status Card */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm block">Active TRRN: {pfChallanForm.trrn}</span>
                <span className="text-xs text-slate-300">Period: {pfChallanForm.period} • Bank: {pfChallanForm.bank_name} • Paid Date: {pfChallanForm.payment_date}</span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              EPFO Electronic Challan Validated
            </span>
          </div>

          {/* Member-wise PF Contribution Sheet */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700">EPFO Member-wise Monthly Contribution Sheet (ECR Format)</span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">All Eligible Staff Enrolled</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Staff Code & Name</th>
                    <th className="p-3">UAN (Universal Acct)</th>
                    <th className="p-3">EPF Wages (Basic)</th>
                    <th className="p-3">EPS Wages (Capped)</th>
                    <th className="p-3 text-rose-600">Employee 12% PF</th>
                    <th className="p-3 text-blue-600">Employer 8.33% EPS</th>
                    <th className="p-3 text-blue-600">Employer 3.67% EPF</th>
                    <th className="p-3 text-emerald-700">Total Remittance</th>
                    <th className="p-3">ECR Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {salaryStructures.map((s, idx) => {
                    const basic = Number(s.basic_salary) || 0;
                    const cappedBasic = Math.min(basic, 15000);
                    const eePf = Math.round(basic * 0.12);
                    const eps = Math.round(cappedBasic * 0.0833);
                    const epf = Math.round(basic * 0.0367);
                    const total = eePf + eps + epf;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-sans font-bold text-slate-900">
                          {s.employee_name}
                          <span className="block text-[10px] text-slate-400 font-mono">{s.employee_code}</span>
                        </td>
                        <td className="p-3 text-slate-700 font-semibold font-mono">10142981023{idx + 1}</td>
                        <td className="p-3 text-slate-800 font-bold">₹{basic.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-slate-600">₹{cappedBasic.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-rose-600 font-bold">₹{eePf.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-blue-600">₹{eps.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-blue-600">₹{epf.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-emerald-700 font-black">₹{total.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-sans">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                            Included in ECR
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. ESI MANAGEMENT TAB                                     */}
      {/* ========================================================= */}
      {activeTab === 'esi-management' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mr-2" />
                ESIC (Employees' State Insurance Corporation) Statutory Register
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Mandatory health insurance for employees earning monthly gross &le; ₹21,000. Employee rate 0.75%, Employer rate 3.25%.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleExportCSV('ESIC_Monthly_Return_Nov2026', ['Insurance Person (IP) No', 'Employee Name', 'Gross Wages', 'Days Worked', 'Employee Share (0.75%)', 'Employer Share (3.25%)', 'Total ESIC Contribution'], salaryStructures.map((s, idx) => [
                  `211098457${idx + 1}`, s.employee_name, s.gross, 30, Math.round(Number(s.gross || 0) * 0.0075), Math.round(Number(s.gross || 0) * 0.0325), Math.round(Number(s.gross || 0) * 0.04)
                ]))}
                className="inline-flex items-center px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Export ESIC Return CSV
              </button>
              <button
                onClick={() => setEsiChallanModalOpen(true)}
                className="inline-flex items-center px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-colors cursor-pointer"
              >
                <CreditCard className="w-4 h-4 mr-1.5" />
                Record ESIC Challan
              </button>
            </div>
          </div>

          {/* ESIC Liability KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">Covered Staff (&le; ₹21,000)</span>
              <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
                {esiEligibleStaff.length || 2} Staff
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">100% Insured</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">Employee Share (0.75%)</span>
              <span className="text-xl font-black text-rose-600 font-mono mt-1 block">
                ₹{totalEsiLiability.ee || 285}
              </span>
              <span className="text-[10px] text-slate-400">Monthly payroll deduction</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">Employer Share (3.25%)</span>
              <span className="text-xl font-black text-blue-600 font-mono mt-1 block">
                ₹{totalEsiLiability.er || 1235}
              </span>
              <span className="text-[10px] text-slate-400">Employer liability</span>
            </div>

            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-900 block">Total ESIC Challan</span>
              <span className="text-xl font-black text-emerald-800 font-mono mt-1 block">
                ₹{totalEsiLiability.total || 1520}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">
                {esiPaidStatus ? '✓ Paid & Certified' : 'Due 15th'}
              </span>
            </div>
          </div>

          {/* ESIC Employee Contribution Sheet */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700">ESIC Employee Contribution Register</span>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Govt Health Scheme Registered</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Insurance Person (IP) No</th>
                    <th className="p-3">Staff Name & Code</th>
                    <th className="p-3">Monthly Gross Wages</th>
                    <th className="p-3">Paid Days</th>
                    <th className="p-3 text-rose-600">Employee Share (0.75%)</th>
                    <th className="p-3 text-blue-600">Employer Share (3.25%)</th>
                    <th className="p-3 text-emerald-700">Total Contribution</th>
                    <th className="p-3">ESIC Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {salaryStructures.map((s, idx) => {
                    const gross = Number(s.gross) || 50000;
                    const isCovered = gross <= 21000;
                    const ee = isCovered ? Math.round(gross * 0.0075) : 0;
                    const er = isCovered ? Math.round(gross * 0.0325) : 0;
                    const total = ee + er;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-semibold text-slate-700 font-mono">211098457{idx + 1}</td>
                        <td className="p-3 font-sans font-bold text-slate-900">
                          {s.employee_name}
                          <span className="block text-[10px] text-slate-400 font-mono">{s.employee_code}</span>
                        </td>
                        <td className="p-3 text-slate-800 font-bold">₹{gross.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-slate-600 font-sans">30 Days</td>
                        <td className="p-3 text-rose-600 font-bold">₹{ee.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-blue-600">₹{er.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-emerald-700 font-black">₹{total.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-sans">
                          {isCovered ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                              Active Covered
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-medium text-[10px]">
                              Exempt (&gt; ₹21k)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 10. PROFESSIONAL TAX TAB                                  */}
      {/* ========================================================= */}
      {activeTab === 'pt-tax' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center">
                <Building2 className="w-5 h-5 text-emerald-600 mr-2" />
                State Professional Tax (PT) Manager
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                State-specific municipal tax withholding schedules and Form V compliance returns.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={ptSelectedState}
                onChange={(e) => setPtSelectedState(e.target.value as any)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-bold text-slate-700"
              >
                <option value="odisha">State: Odisha (Corporate HQ)</option>
                <option value="maharashtra">State: Maharashtra</option>
                <option value="karnataka">State: Karnataka</option>
                <option value="west_bengal">State: West Bengal</option>
              </select>
              <button
                onClick={() => handleExportCSV('Form_V_PT_Return_Nov2026', ['Employee Code', 'Employee Name', 'Monthly Gross', 'State Schedule', 'Monthly PT Deducted', 'Annual PT Liability'], salaryStructures.map(s => [
                  s.employee_code, s.employee_name, s.gross, ptSelectedState.toUpperCase(), s.professional_tax || 200, (Number(s.professional_tax || 200) * 12)
                ]))}
                className="inline-flex items-center px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Export Form V Return
              </button>
            </div>
          </div>

          {/* State Slabs & Liability Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <span className="font-extrabold text-slate-900 text-sm block border-b border-slate-100 pb-2">
                Active State Slabs: {ptSelectedState.toUpperCase()}
              </span>
              <div className="space-y-2 text-xs">
                {ptSelectedState === 'odisha' && (
                  <>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Monthly Gross &le; ₹13,333</span>
                      <span className="font-mono font-bold text-slate-900">₹0 (Nil)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Monthly Gross ₹13,334 – ₹25,000</span>
                      <span className="font-mono font-bold text-slate-900">₹125 / month</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Monthly Gross &gt; ₹25,000</span>
                      <span className="font-mono font-bold text-emerald-700">₹200 / month</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Month of February Adjustment</span>
                      <span className="font-mono font-bold text-purple-700">₹300 in Feb</span>
                    </div>
                  </>
                )}
                {ptSelectedState === 'maharashtra' && (
                  <>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Monthly Gross &le; ₹7,500</span>
                      <span className="font-mono font-bold text-slate-900">₹0 (Nil)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Monthly Gross ₹7,501 – ₹10,000</span>
                      <span className="font-mono font-bold text-slate-900">₹175 / month</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Monthly Gross &gt; ₹10,000</span>
                      <span className="font-mono font-bold text-emerald-700">₹200 / month (₹300 in Feb)</span>
                    </div>
                  </>
                )}
                {ptSelectedState !== 'odisha' && ptSelectedState !== 'maharashtra' && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">Monthly Gross &gt; ₹15,000</span>
                    <span className="font-mono font-bold text-emerald-700">₹200 / month</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <span className="font-extrabold text-slate-900 text-sm block border-b border-slate-100 pb-2">
                Monthly PT State Liability Summary
              </span>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-700">Total Enrolled Employees</span>
                  <span className="font-mono font-black text-slate-900 text-sm">{salaryStructures.length} Staff</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="font-bold text-emerald-900">Total Monthly PT Withholding</span>
                  <span className="font-mono font-black text-emerald-800 text-base">₹{(salaryStructures.length * 200).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="font-bold text-purple-900">Annual State Treasury Allocation</span>
                  <span className="font-mono font-black text-purple-800 text-sm">₹{(salaryStructures.length * 2400).toLocaleString('en-IN')} / year</span>
                </div>
              </div>
            </div>
          </div>

          {/* Employee PT Register */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h4 className="font-extrabold text-slate-900 text-sm">Employee Professional Tax Deduction Register</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Staff Code & Name</th>
                    <th className="p-3">Monthly Gross</th>
                    <th className="p-3">Applicable State</th>
                    <th className="p-3">PT Slab</th>
                    <th className="p-3 text-rose-600">Monthly PT Deducted</th>
                    <th className="p-3 text-slate-700">Annual Accumulation</th>
                    <th className="p-3">Form V Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {salaryStructures.map((s) => {
                    const gross = Number(s.gross) || 50000;
                    const pt = gross > 25000 ? 200 : gross > 13333 ? 125 : 0;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-sans font-bold text-slate-900">
                          {s.employee_name}
                          <span className="block text-[10px] text-slate-400 font-mono">{s.employee_code}</span>
                        </td>
                        <td className="p-3 text-slate-800 font-bold">₹{gross.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-sans uppercase font-bold text-slate-600">{ptSelectedState}</td>
                        <td className="p-3 font-sans text-slate-500">Gross &gt; ₹25,000</td>
                        <td className="p-3 text-rose-600 font-black">₹{pt}</td>
                        <td className="p-3 text-slate-700 font-bold">₹{(pt * 12).toLocaleString('en-IN')}</td>
                        <td className="p-3 font-sans">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                            Form V Ready
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 11. TDS & FORM 16 TAB                                     */}
      {/* ========================================================= */}
      {activeTab === 'tds-form16' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 mr-2" />
                Direct Tax Withholding (TDS u/s 192) & Form 16 Hub
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Income Tax withholding calculations under New Regime (Section 115BAC) and generation of Form 16 Part A & Part B certificates.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExportCSV('TDS_Form24Q_Annexure', ['Employee Name', 'PAN Number', 'Regime', 'Gross Salary', 'Standard Deduction', 'Taxable Income', 'Total Tax Withheld'], salaryStructures.map((s, idx) => [
                  s.employee_name, `AAMCO9464${idx + 1}H`, 'New Regime (u/s 115BAC)', (Number(s.gross || 50000) * 12), 75000, Math.max(0, (Number(s.gross || 50000) * 12) - 75000), Math.round(Number(s.gross || 50000) * 0.05 * 12)
                ]))}
                className="inline-flex items-center px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Export 24Q Annexure
              </button>
            </div>
          </div>

          {/* Regime Distribution & Slabs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <span className="font-extrabold text-slate-900 text-sm block border-b border-slate-100 pb-2">
                Income Tax Regime Distribution
              </span>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-900 block">New Tax Regime (u/s 115BAC)</span>
                    <span className="text-[11px] text-emerald-700">Default: ₹75,000 Standard Deduction + Zero tax up to ₹7.75L</span>
                  </div>
                  <span className="text-lg font-black text-emerald-900 font-mono">
                    {salaryStructures.length} Staff (100%)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-slate-600">
                  <div>
                    <span className="font-bold text-slate-800 block">Old Tax Regime</span>
                    <span className="text-[11px] text-slate-400">With 80C, 80D, HRA exemptions</span>
                  </div>
                  <span className="text-lg font-black text-slate-700 font-mono">0 Staff</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <span className="font-extrabold text-slate-900 text-sm block border-b border-slate-100 pb-2">
                Quarterly Form 24Q TDS Filing Status
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block">Q1 (Apr - Jun)</span>
                  <span className="text-emerald-700 font-bold block mt-1">✓ Filed & Acknowledged</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block">Q2 (Jul - Sep)</span>
                  <span className="text-emerald-700 font-bold block mt-1">✓ Filed & Acknowledged</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="font-bold text-emerald-900 block">Q3 (Oct - Dec)</span>
                  <span className="text-emerald-800 font-bold block mt-1">Active Cycle Ready</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block">Q4 (Jan - Mar)</span>
                  <span className="text-slate-400 font-medium block mt-1">Upcoming</span>
                </div>
              </div>
            </div>
          </div>

          {/* Employee TDS Register with Form 16 Action */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h4 className="font-extrabold text-slate-900 text-sm">Employee TDS Deduction & Form 16 Register</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Staff Name & Code</th>
                    <th className="p-3">PAN Number</th>
                    <th className="p-3">Tax Regime</th>
                    <th className="p-3">Annual Projected Gross</th>
                    <th className="p-3">Std Deduction</th>
                    <th className="p-3">Taxable Salary</th>
                    <th className="p-3 text-rose-600">Monthly TDS</th>
                    <th className="p-3 text-right">Form 16 Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {salaryStructures.map((s, idx) => {
                    const annualGross = Number(s.gross || 50000) * 12;
                    const stdDed = 75000;
                    const taxable = Math.max(0, annualGross - stdDed);
                    const annualTax = taxable > 700000 ? Math.round((taxable - 700000) * 0.10 + 20000) : 0;
                    const monthlyTds = Math.round(annualTax / 12);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-sans font-bold text-slate-900">
                          {s.employee_name}
                          <span className="block text-[10px] text-slate-400 font-mono">{s.employee_code}</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-blue-700">AAMCO9464{idx + 1}H</td>
                        <td className="p-3 font-sans">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                            115BAC (New)
                          </span>
                        </td>
                        <td className="p-3 text-slate-800 font-bold">₹{annualGross.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-slate-500">₹{stdDed.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-slate-800 font-semibold">₹{taxable.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-rose-600 font-black">₹{monthlyTds.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-sans text-right">
                          <button
                            onClick={() => {
                              setSelectedForm16Employee(s);
                              setForm16ModalOpen(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors cursor-pointer shadow-xs"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            View Form 16
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 12. PAYSLIP GENERATION TAB                                */}
      {/* ========================================================= */}
      {activeTab === 'payslips' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Released & Generated Employee Payslips</h3>
              <p className="text-xs text-slate-500 mt-1">Branded company payslips with earnings, deductions, bank transfer info, and digital stamp.</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExportCSV('Released_Payslips_Register', ['Payslip Number', 'Employee Name', 'Period', 'Payable Days', 'Gross Salary', 'Total Deductions', 'Net Salary'], payslips.map(p => [
                  p.payslip_number, p.employee_name, p.period_name, p.payable_days, p.gross_salary, p.total_deductions, p.net_salary
                ]))}
                className="inline-flex items-center px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Export Payslips CSV
              </button>
            </div>
          </div>
          <DataTable
            data={payslips}
            columns={payslipColumns}
            searchPlaceholder="Search released payslips by employee or ID..."
            initialPageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* 13. FULL & FINAL SETTLEMENT TAB                           */}
      {/* ========================================================= */}
      {activeTab === 'settlement' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Full & Final (F&F) Exit Settlement Engine</h3>
              <p className="text-xs text-slate-500">Calculate gratuity, leave encashment, notice pay adjustments, and asset recoveries.</p>
            </div>
            <button
              onClick={() => setSettlementModalOpen(true)}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              + Compute F&F Settlement
            </button>
          </div>
          <DataTable
            data={settlements}
            columns={settlementColumns}
            searchPlaceholder="Search settlement records..."
            initialPageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* 14. PAYROLL REPORTS TAB (Comprehensive Monthly Register)   */}
      {/* ========================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Header & Month Selector Banner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Executive Payroll & Salary Disbursement Register
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Complete staff salary ledger, disbursement tracking, individual payslip documents, and banking reports.
                </p>
              </div>
            </div>

            {/* Month & Cycle Selector */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-600">Month:</span>
                <select
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  className="bg-transparent text-xs font-extrabold text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="2026-11">November 2026 (Active Pay Cycle)</option>
                  <option value="2026-10">October 2026</option>
                  <option value="2026-09">September 2026</option>
                  <option value="2026-08">August 2026</option>
                </select>
              </div>

              <button
                onClick={() => handleExportCSV(
                  `Master_Payroll_Register_${reportMonth}`,
                  ['Employee Code', 'Staff Name', 'Role', 'Department', 'Designation', 'Gross CTC', 'Basic', 'HRA', 'Total Deductions', 'Net Payable', 'Amount Disbursed (Gaya Hai)', 'Amount Pending (Baki Hai)', 'Payment Status', 'Bank Account', 'IFSC'],
                  filteredReportStaff.map(s => [
                    s.code, s.name, s.role_name, s.department, s.designation, s.gross, s.basic, s.hra, s.total_deductions, s.net_salary, s.disbursed_amount, s.pending_amount, s.status.toUpperCase(), s.bank_account, s.ifsc
                  ])
                )}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                title="Export Monthly Register (CSV)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Register</span>
              </button>

              <button
                onClick={() => handleExportCSV(
                  `Bank_NEFT_Disbursal_Batch_${reportMonth}`,
                  ['Beneficiary Name', 'Account Number', 'IFSC Code', 'Amount (INR)', 'Payment Remarks'],
                  filteredReportStaff.map(s => [
                    s.name, s.bank_account, s.ifsc, s.disbursed_amount > 0 ? s.disbursed_amount : s.net_salary, `Salary for ${reportMonth}`
                  ])
                )}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                title="Download Corporate Bank Batch File"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Bank NEFT Batch</span>
              </button>
            </div>
          </div>

          {/* Realtime KPI Analytics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:border-emerald-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount Disbursed (Gaya Hai)</span>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
                  ₹ {totalDisbursed.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Paid</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Total salary successfully transferred to staff</p>
            </div>

            <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:border-amber-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount Pending (Baki Hai)</span>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className={`text-2xl sm:text-3xl font-black font-mono ${totalPending > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                  ₹ {totalPending.toLocaleString('en-IN')}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${totalPending > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                  {totalPending > 0 ? 'Due' : 'Settled'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Outstanding salary balance awaiting disbursal</p>
            </div>

            <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:border-blue-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Payroll Outflow</span>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  ₹ {totalGrossOutflow.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">Gross</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Total company gross compensation liability</p>
            </div>

            <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:border-purple-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statutory Deductions</span>
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-purple-600 font-mono">
                  ₹ {totalStatutoryCompliance.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">EPF/ESI/TDS</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Compliance withholdings for government portal</p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                placeholder="Search by staff name, code, department, role..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center space-x-1.5 text-xs">
                <span className="font-bold text-slate-500">Role:</span>
                <select
                  value={reportRoleFilter}
                  onChange={(e) => setReportRoleFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Roles (All Staff)</option>
                  <option value="employee">Employees (Staff)</option>
                  <option value="manager">Team Managers</option>
                  <option value="hr">HR Managers</option>
                  <option value="accounts">Finance Controllers</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5 text-xs">
                <span className="font-bold text-slate-500">Status:</span>
                <select
                  value={reportStatusFilter}
                  onChange={(e) => setReportStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="paid">Fully Disbursed (Paid)</option>
                  <option value="partial">Partially Disbursed</option>
                  <option value="pending">Pending / Due</option>
                </select>
              </div>
            </div>
          </div>

          {/* Master Employee / Manager / HR Payroll Register Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-[11px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4">Staff Member</th>
                    <th className="px-5 py-4">Department & Role</th>
                    <th className="px-5 py-4 text-right">Gross Salary</th>
                    <th className="px-5 py-4 text-right">Total Deductions</th>
                    <th className="px-5 py-4 text-right">Net Payable</th>
                    <th className="px-5 py-4 text-right">Amount Disbursed (Gaya Hai)</th>
                    <th className="px-5 py-4 text-right">Amount Pending (Baki Hai)</th>
                    <th className="px-5 py-4 text-center">Payment Status</th>
                    <th className="px-5 py-4 text-right">Documents & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {filteredReportStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50/60 transition">
                      {/* 1. Staff Member */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1877f2] font-black flex items-center justify-center shrink-0 border border-blue-200/60 text-xs shadow-2xs">
                            {staff.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">{staff.name}</div>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className="font-mono text-[10px] text-slate-400">{staff.code}</span>
                              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase border ${
                                staff.role_code.includes('hr')
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : staff.role_code.includes('manager')
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : staff.role_code.includes('accounts')
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {staff.role_name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Department & Designation */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800 text-xs">{staff.designation}</div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{staff.department}</span>
                        </div>
                      </td>

                      {/* 3. Gross Salary */}
                      <td className="px-5 py-4 text-right font-mono">
                        <div className="font-extrabold text-slate-900">₹ {staff.gross.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-slate-400">Basic: ₹ {staff.basic.toLocaleString('en-IN')}</div>
                      </td>

                      {/* 4. Total Deductions */}
                      <td className="px-5 py-4 text-right font-mono">
                        <div className="font-bold text-rose-600">- ₹ {staff.total_deductions.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-slate-400">PF: ₹{staff.pf} • PT: ₹{staff.pt}</div>
                      </td>

                      {/* 5. Net Payable */}
                      <td className="px-5 py-4 text-right font-mono">
                        <div className="font-black text-slate-900 text-sm">₹ {staff.net_salary.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-slate-400">Take-Home</div>
                      </td>

                      {/* 6. Kitni Amount Gaya Hai */}
                      <td className="px-5 py-4 text-right font-mono">
                        <div className="font-black text-emerald-700 text-sm inline-flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>₹ {staff.disbursed_amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-[10px] text-emerald-600">Disbursed</div>
                      </td>

                      {/* 7. Kitni Baki Hai */}
                      <td className="px-5 py-4 text-right font-mono">
                        <div className={`font-black text-sm ${staff.pending_amount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          ₹ {staff.pending_amount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {staff.pending_amount > 0 ? 'Balance Due' : 'Zero Due'}
                        </div>
                      </td>

                      {/* 8. Payment Status Badge */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          staff.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : staff.status === 'partial'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {staff.status === 'paid' && 'Fully Paid'}
                          {staff.status === 'partial' && 'Partially Paid'}
                          {staff.status === 'pending' && 'Pending Due'}
                        </span>
                      </td>

                      {/* 9. Documents & Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Download / View Payslip PDF Document */}
                          <button
                            onClick={() => {
                              setSelectedPayslip(staff.payslip);
                              setPayslipModalOpen(true);
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                            title="Download Official Salary Payslip PDF"
                          >
                            <Download className="w-3 h-3" />
                            <span>Payslip PDF</span>
                          </button>

                          {/* Quick Disburse Balance Action if pending */}
                          {staff.pending_amount > 0 ? (
                            <button
                              onClick={() => handleDisbursePayment(staff.id, reportMonth, staff.net_salary)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                              title="Mark full salary as disbursed"
                            >
                              <Check className="w-3 h-3" />
                              <span>Pay Due</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDisbursePayment(staff.id, reportMonth, 0)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Reset Disbursal Status"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredReportStaff.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-500 text-sm">
                        <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        No staff members found matching query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statutory Compliance & Banking Batch Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
              <div>
                <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl inline-block mb-3">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm">Bank NEFT Salary Disbursal Batch</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Ready-to-upload corporate banking CSV formatted with Beneficiary Name, Account Number, IFSC, and Net Amount.
                </p>
              </div>
              <button
                onClick={() => handleExportCSV(
                  `Bank_Disbursal_Batch_${reportMonth}`,
                  ['Beneficiary Name', 'Account Number', 'IFSC Code', 'Amount (INR)', 'Remarks'],
                  filteredReportStaff.map(s => [
                    s.name, s.bank_account, s.ifsc, s.disbursed_amount > 0 ? s.disbursed_amount : s.net_salary, `Salary for ${reportMonth}`
                  ])
                )}
                className="mt-4 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Download Bank Batch File
              </button>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all">
              <div>
                <span className="p-2.5 bg-purple-50 text-purple-600 rounded-xl inline-block mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm">Statutory EPFO & ESIC Master Summary</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Combined compliance audit ledger with UAN, IP numbers, basic wages, employer and employee shares.
                </p>
              </div>
              <button
                onClick={() => handleExportCSV(
                  `Statutory_EPF_ESIC_Summary_${reportMonth}`,
                  ['Staff Name', 'UAN', 'Basic Salary', 'EE PF (12%)', 'ER EPS (8.33%)', 'ER EPF (3.67%)', 'EE ESIC (0.75%)', 'ER ESIC (3.25%)'],
                  filteredReportStaff.map(s => [
                    s.name, '101429810231', s.basic, s.pf, Math.round(Math.min(s.basic, 15000) * 0.0833), Math.round(s.basic * 0.0367), s.esi, Math.round(s.gross <= 21000 ? s.gross * 0.0325 : 0)
                  ])
                )}
                className="mt-4 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Download Statutory Audit CSV
              </button>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all">
              <div>
                <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl inline-block mb-3">
                  <Building2 className="w-5 h-5" />
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm">Department Cost & Outflow Allocation</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Breakdown of monthly payroll cost allocation across Engineering, Sales, HR, and Operations divisions.
                </p>
              </div>
              <button
                onClick={() => handleExportCSV(
                  `Department_Cost_Allocation_${reportMonth}`,
                  ['Department', 'Headcount', 'Total Gross Compensation', 'Statutory Deductions', 'Net Disbursed'],
                  [
                    ['Software Engineering & Cloud', filteredReportStaff.filter(s => s.department.includes('Software')).length || 2, 135000, 15800, 119200],
                    ['Human Resources & Talent', filteredReportStaff.filter(s => s.department.includes('Human')).length || 1, 65000, 7800, 57200],
                    ['Finance & Billing Accounts', filteredReportStaff.filter(s => s.department.includes('Finance')).length || 1, 70000, 8400, 61600],
                  ]
                )}
                className="mt-4 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Download Dept Allocation CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS SECTION                                            */}
      {/* ========================================================= */}

      {/* 1. Printable Payslip Modal */}
      <Modal isOpen={payslipModalOpen} onClose={() => setPayslipModalOpen(false)} title="Employee Salary Payslip" maxWidth="2xl">
        {selectedPayslip && (
          <div className="space-y-6 text-xs" id="printable-payslip">
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                  OE
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">ODIAS ERP TECHNOLOGIES GLOBAL PVT LTD</h2>
                  <p className="text-[11px] text-slate-500">Plot 1343 Raghunathpur PS Nandankanan Bhubaneswar, Odisha - 754005</p>
                  <p className="text-[10px] text-slate-400 font-mono">CIN: U72200OR2026PTC123456 • GSTIN: 21AAMCG9464H1ZC</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">PAYSLIP FOR</span>
                <span className="text-sm font-black text-emerald-700 font-mono">{selectedPayslip.period_name}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Employee Name</span>
                <span className="font-bold text-slate-900">{selectedPayslip.employee_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Employee ID</span>
                <span className="font-mono font-bold text-slate-900">{selectedPayslip.employee_code}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Department</span>
                <span className="font-medium text-slate-900">{selectedPayslip.department_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Designation</span>
                <span className="font-medium text-slate-900">{selectedPayslip.designation_title}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Bank Account</span>
                <span className="font-mono font-bold text-slate-900">{selectedPayslip.bank_account || '50100234567890'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Bank IFSC</span>
                <span className="font-mono text-slate-900">BKID0005577</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">UAN Number</span>
                <span className="font-mono text-slate-900">101429810239</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PAN Number</span>
                <span className="font-mono text-slate-900">{selectedPayslip.pan_number || 'AAMCG9464H'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Earnings Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-2 bg-emerald-50 font-bold text-emerald-900 border-b border-slate-200 flex justify-between">
                  <span>Earnings Head</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="p-3 space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Basic Pay (50%)</span>
                    <span className="font-bold text-slate-900">₹{Number(selectedPayslip.basic_salary).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">HRA (House Rent)</span>
                    <span className="text-slate-700">₹{Number(selectedPayslip.hra).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Special Allowances</span>
                    <span className="text-slate-700">₹{Number(selectedPayslip.allowances).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900">
                    <span className="font-sans">Gross Earnings</span>
                    <span>₹{Number(selectedPayslip.gross_salary).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-2 bg-rose-50 font-bold text-rose-900 border-b border-slate-200 flex justify-between">
                  <span>Deductions Head</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="p-3 space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Provident Fund (12%)</span>
                    <span className="text-rose-600 font-bold">₹{Number(selectedPayslip.pf_deduction).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Professional Tax</span>
                    <span className="text-rose-600">₹200</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">TDS / Income Tax</span>
                    <span className="text-rose-600">₹{Number(selectedPayslip.tax_deduction).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">LOP Deductions</span>
                    <span className="text-rose-600">₹{Number(selectedPayslip.lop_deduction).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-rose-700">
                    <span className="font-sans">Total Deductions</span>
                    <span>-₹{Number(selectedPayslip.total_deductions).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 font-bold uppercase block">Net Take-Home Salary</span>
                <span className="text-2xl font-black text-emerald-900 font-mono">
                  ₹{Number(selectedPayslip.net_salary).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Digital Verification</span>
                <span className="text-xs font-bold text-slate-800">System Signed by Odias ERP</span>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-slate-200">
              <span className="text-[11px] text-slate-400">This is a computer-generated document and requires no physical signature under Indian IT Act.</span>
              <div className="space-x-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer inline-flex items-center"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 2. CTC Master Configurator & Calculator Modal */}
      <Modal isOpen={ctcModalOpen} onClose={() => { setCtcModalOpen(false); setSelectedStructureForEdit(null); }} title={selectedStructureForEdit ? `Edit CTC & Structure: ${selectedStructureForEdit.employee_name}` : 'Configure Employee CTC & Salary Structure'} maxWidth="xl">
        <form onSubmit={handleSaveCtcStructure} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Employee *</label>
            <select
              value={ctcForm.employee}
              onChange={(e) => setCtcForm({ ...ctcForm, employee: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              required
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.employee_id}) - {emp.designation_title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Annual CTC (₹) *</label>
              <input
                type="number"
                required
                min="60000"
                step="1000"
                value={ctcForm.annual_ctc}
                onChange={(e) => handleAnnualCtcChange(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Gross (₹) *</label>
              <input
                type="number"
                required
                min="5000"
                step="500"
                value={ctcForm.monthly_gross}
                onChange={(e) => handleGrossChange(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold text-emerald-800"
              />
            </div>
          </div>

          {/* Auto Breakdown Display */}
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center font-bold text-emerald-950">
              <span className="font-sans">1. Basic Salary (50% Wage Code Rule):</span>
              <span>₹{ctcForm.basic_salary.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-sans">2. HRA (40% of Basic):</span>
              <span>₹{ctcForm.hra.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-sans">3. Special Allowance (Balancing):</span>
              <span>₹{ctcForm.special_allowance.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center text-rose-700">
              <span className="font-sans">4. Employee PF (12%):</span>
              <span>-₹{ctcForm.provident_fund.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center text-rose-700">
              <span className="font-sans">5. Professional Tax (PT):</span>
              <span>-₹{ctcForm.professional_tax}</span>
            </div>
            {ctcForm.esi > 0 && (
              <div className="flex justify-between items-center text-rose-700">
                <span className="font-sans">6. ESI (0.75%):</span>
                <span>-₹{ctcForm.esi}</span>
              </div>
            )}
            <div className="pt-2 border-t border-emerald-200 flex justify-between items-center font-black text-emerald-900 text-sm">
              <span className="font-sans">Estimated Take-Home (In-Hand):</span>
              <span>₹{(ctcForm.monthly_gross - ctcForm.provident_fund - ctcForm.professional_tax - ctcForm.esi).toLocaleString('en-IN')} / mo</span>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { setCtcModalOpen(false); setSelectedStructureForEdit(null); }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm cursor-pointer"
            >
              {selectedStructureForEdit ? 'Update CTC Structure' : 'Save & Activate CTC'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Run Payroll Modal */}
      <Modal isOpen={runModalOpen} onClose={() => setRunModalOpen(false)} title="Calculate Attendance-Linked Payroll">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Processing Period *</label>
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.start_date} to {p.end_date}) - {p.total_days} Days
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
            <span className="font-bold block">✓ Automated Protection Rules:</span>
            <p>1. Scheduled weekly offs & national holidays are strictly protected.</p>
            <p>2. Unpaid leaves and verified absent records automatically apply LOP deduction.</p>
            <p>3. Statutory PF, ESIC, and PT slabs calculated in real time.</p>
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRunModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProcessPayroll}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm cursor-pointer flex items-center"
            >
              {isProcessing && <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              {isProcessing ? 'Calculating Payroll...' : 'Start Calculation'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 4. Advance Modal */}
      <Modal isOpen={advanceModalOpen} onClose={() => setAdvanceModalOpen(false)} title="Request / Grant Salary Advance">
        <form onSubmit={handleCreateAdvance} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Employee *</label>
            <select
              value={advanceForm.employee}
              onChange={(e) => setAdvanceForm({ ...advanceForm, employee: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              required
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.employee_id}) - {emp.department_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Advance Amount (₹) *</label>
              <input
                type="number"
                required
                min="1000"
                step="500"
                value={advanceForm.amount}
                onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                placeholder="e.g. 15000"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Repayment Tenure (Months) *</label>
              <select
                value={advanceForm.tenure_months}
                onChange={(e) => setAdvanceForm({ ...advanceForm, tenure_months: parseInt(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              >
                <option value={1}>1 Month (Lump sum)</option>
                <option value={2}>2 Months EMI</option>
                <option value={3}>3 Months EMI</option>
                <option value={6}>6 Months EMI</option>
                <option value={10}>10 Months EMI</option>
                <option value={12}>12 Months EMI</option>
              </select>
            </div>
          </div>

          {advanceForm.amount && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between font-mono">
              <span className="font-sans text-slate-600">Calculated Monthly EMI:</span>
              <span className="font-bold text-emerald-700">₹{(parseFloat(advanceForm.amount) / advanceForm.tenure_months).toFixed(2)} / month</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Notes</label>
            <textarea
              rows={2}
              value={advanceForm.reason}
              onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
              placeholder="e.g. Medical emergency or advance against upcoming festival..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAdvanceModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm cursor-pointer"
            >
              Approve & Disburse Advance
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. Bonus Modal */}
      <Modal isOpen={bonusModalOpen} onClose={() => setBonusModalOpen(false)} title="Grant Staff Bonus or Incentive">
        <form onSubmit={handleCreateBonus} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Employee *</label>
            <select
              value={bonusForm.employee}
              onChange={(e) => setBonusForm({ ...bonusForm, employee: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              required
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.employee_id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Award Type *</label>
              <select
                value={bonusForm.bonus_type}
                onChange={(e) => setBonusForm({ ...bonusForm, bonus_type: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              >
                <option value="performance">Performance Bonus</option>
                <option value="diwali_festival">Diwali Festive Ex-Gratia</option>
                <option value="spot_award">Spot Sales Award</option>
                <option value="retention">Annual Retention Bonus</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                min="500"
                step="500"
                value={bonusForm.amount}
                onChange={(e) => setBonusForm({ ...bonusForm, amount: e.target.value })}
                placeholder="e.g. 10000"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Remarks & Citation</label>
            <textarea
              rows={2}
              value={bonusForm.remarks}
              onChange={(e) => setBonusForm({ ...bonusForm, remarks: e.target.value })}
              placeholder="e.g. Exceptional Q3 enterprise client closing..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setBonusModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm cursor-pointer"
            >
              Grant & Approve Incentive
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. Custom Deduction Modal */}
      <Modal isOpen={deductionModalOpen} onClose={() => setDeductionModalOpen(false)} title="Schedule Custom Payroll Deduction">
        <form onSubmit={handleCreateDeduction} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Employee *</label>
            <select
              value={deductionForm.employee}
              onChange={(e) => setDeductionForm({ ...deductionForm, employee: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              required
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.employee_id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Deduction Reason *</label>
              <select
                value={deductionForm.deduction_type}
                onChange={(e) => setDeductionForm({ ...deductionForm, deduction_type: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              >
                <option value="tds">TDS / Voluntary Income Tax</option>
                <option value="late_fine">Late Arrival Attendance Penalty</option>
                <option value="asset_damage">Asset Damage / Replacement</option>
                <option value="health_insurance">Health Insurance Floater Topup</option>
                <option value="loan_recovery">Staff Loan EMI Deduction</option>
                <option value="other">Other Statutory Adjustment</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                min="100"
                step="50"
                value={deductionForm.amount}
                onChange={(e) => setDeductionForm({ ...deductionForm, amount: e.target.value })}
                placeholder="e.g. 1500"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Audit Notes</label>
            <textarea
              rows={2}
              value={deductionForm.notes}
              onChange={(e) => setDeductionForm({ ...deductionForm, notes: e.target.value })}
              placeholder="e.g. Approved monthly adjustment..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDeductionModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-500 shadow-sm cursor-pointer"
            >
              Schedule Deduction
            </button>
          </div>
        </form>
      </Modal>

      {/* 7. Settlement Modal */}
      <Modal isOpen={settlementModalOpen} onClose={() => setSettlementModalOpen(false)} title="Compute Full & Final Exit Settlement">
        <form onSubmit={handleCreateSettlement} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Relieved Employee *</label>
            <select
              value={settlementForm.employee}
              onChange={(e) => setSettlementForm({ ...settlementForm, employee: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              required
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.employee_id}) - {emp.department_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Resignation Date *</label>
              <input
                type="date"
                required
                value={settlementForm.resignation_date}
                onChange={(e) => setSettlementForm({ ...settlementForm, resignation_date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Last Working Day *</label>
              <input
                type="date"
                required
                value={settlementForm.last_working_day}
                onChange={(e) => setSettlementForm({ ...settlementForm, last_working_day: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gratuity Entitlement (₹)</label>
              <input
                type="number"
                min="0"
                value={settlementForm.gratuity_amount}
                onChange={(e) => setSettlementForm({ ...settlementForm, gratuity_amount: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Leave Encashment (₹)</label>
              <input
                type="number"
                min="0"
                value={settlementForm.leave_encashment_amount}
                onChange={(e) => setSettlementForm({ ...settlementForm, leave_encashment_amount: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notice Pay Adjustment (₹)</label>
              <input
                type="number"
                value={settlementForm.notice_pay_payable}
                onChange={(e) => setSettlementForm({ ...settlementForm, notice_pay_payable: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Asset Recovery / Deductions (₹)</label>
              <input
                type="number"
                min="0"
                value={settlementForm.asset_recovery_deductions}
                onChange={(e) => setSettlementForm({ ...settlementForm, asset_recovery_deductions: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex justify-between items-center font-mono font-bold">
            <span className="font-sans text-emerald-900">Estimated Net Settlement:</span>
            <span className="text-emerald-800 text-sm">
              ₹{(
                (parseFloat(settlementForm.gratuity_amount) || 0) +
                (parseFloat(settlementForm.leave_encashment_amount) || 0) +
                (parseFloat(settlementForm.notice_pay_payable) || 0) -
                (parseFloat(settlementForm.asset_recovery_deductions) || 0)
              ).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSettlementModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm cursor-pointer"
            >
              Finalize & Approve Settlement
            </button>
          </div>
        </form>
      </Modal>

      {/* 8. PF Challan Payment Modal */}
      <Modal isOpen={pfChallanModalOpen} onClose={() => setPfChallanModalOpen(false)} title="Record EPFO Electronic Challan Payment">
        <form onSubmit={handleRecordPfChallan} className="space-y-4">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
            Record government challan payment details to verify monthly EPFO statutory compliance.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Return Ref Number (TRRN) *</label>
            <input
              type="text"
              required
              value={pfChallanForm.trrn}
              onChange={(e) => setPfChallanForm({ ...pfChallanForm, trrn: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Challan Amount (₹) *</label>
              <input
                type="number"
                required
                value={pfChallanForm.amount}
                onChange={(e) => setPfChallanForm({ ...pfChallanForm, amount: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remittance Date *</label>
              <input
                type="date"
                required
                value={pfChallanForm.payment_date}
                onChange={(e) => setPfChallanForm({ ...pfChallanForm, payment_date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Authorized Disbursing Bank *</label>
            <input
              type="text"
              required
              value={pfChallanForm.bank_name}
              onChange={(e) => setPfChallanForm({ ...pfChallanForm, bank_name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPfChallanModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm cursor-pointer"
            >
              Record & Verify Challan
            </button>
          </div>
        </form>
      </Modal>

      {/* 9. ESIC Challan Payment Modal */}
      <Modal isOpen={esiChallanModalOpen} onClose={() => setEsiChallanModalOpen(false)} title="Record ESIC Challan Payment">
        <form onSubmit={handleRecordEsiChallan} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Challan Reference Number *</label>
            <input
              type="text"
              required
              value={esiChallanForm.challan_ref}
              onChange={(e) => setEsiChallanForm({ ...esiChallanForm, challan_ref: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Challan Amount (₹) *</label>
              <input
                type="number"
                required
                value={esiChallanForm.amount}
                onChange={(e) => setEsiChallanForm({ ...esiChallanForm, amount: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Date *</label>
              <input
                type="date"
                required
                value={esiChallanForm.payment_date}
                onChange={(e) => setEsiChallanForm({ ...esiChallanForm, payment_date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
            <input
              type="text"
              value={esiChallanForm.bank_name}
              onChange={(e) => setEsiChallanForm({ ...esiChallanForm, bank_name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEsiChallanModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-sm cursor-pointer"
            >
              Record ESIC Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* 10. Official Form 16 Certificate Modal (Part A & Part B) */}
      <Modal isOpen={form16ModalOpen} onClose={() => setForm16ModalOpen(false)} title="Certificate under Section 203 of the Income-Tax Act, 1961 (Form 16)" maxWidth="4xl">
        {selectedForm16Employee && (
          <div className="space-y-6 text-xs" id="printable-form16">
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase bg-slate-900 text-white px-2 py-0.5 rounded">
                  FORM NO. 16
                </span>
                <h2 className="text-base font-black text-slate-900 mt-1">CERTIFICATE OF TAX DEDUCTED AT SOURCE</h2>
                <p className="text-[11px] text-slate-600">Issued under Section 203 of the Income-tax Act, 1961 for Tax Withheld from Income chargeable under the head 'Salaries'</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block">FINANCIAL YEAR</span>
                <span className="text-sm font-black text-slate-900 font-mono">2026 - 2027</span>
                <span className="text-[10px] text-slate-500 block">Assessment Year: 2027-28</span>
              </div>
            </div>

            {/* Deductor & Deductee Header */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]">
              <div>
                <span className="font-sans font-bold text-slate-900 block border-b border-slate-200 pb-1 mb-1.5">Employer / Deductor Details</span>
                <span className="font-bold text-slate-800 block">ODIAS ERP TECHNOLOGIES GLOBAL PVT LTD</span>
                <span className="text-slate-600 block">Plot 1343 Raghunathpur PS Nandankanan Bhubaneswar, Odisha</span>
                <span className="text-slate-700 block mt-1">TAN: <strong className="text-slate-900">BBN012345E</strong> • PAN: <strong className="text-slate-900">AAMCG9464H</strong></span>
              </div>
              <div>
                <span className="font-sans font-bold text-slate-900 block border-b border-slate-200 pb-1 mb-1.5">Employee / Deductee Details</span>
                <span className="font-bold text-slate-900 block">{selectedForm16Employee.employee_name}</span>
                <span className="text-slate-600 block">Employee Code: {selectedForm16Employee.employee_code}</span>
                <span className="text-blue-700 font-bold block mt-1">PAN: AAMCO94641H</span>
                <span className="text-slate-500 block">Period of Employment: 01-Apr-2026 to 31-Mar-2027</span>
              </div>
            </div>

            {/* Part A: Tax Deducted and Deposited */}
            <div className="space-y-2">
              <span className="font-bold text-slate-900 text-xs block">PART A: Summary of Tax Deducted and Deposited in Central Government Account</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100 font-bold text-slate-700 text-[10px]">
                    <tr>
                      <th className="p-2.5">Quarter</th>
                      <th className="p-2.5">Receipt / Token No</th>
                      <th className="p-2.5">Amount Paid (₹)</th>
                      <th className="p-2.5">Tax Deducted (₹)</th>
                      <th className="p-2.5">BSR Code</th>
                      <th className="p-2.5">Date of Deposit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    <tr>
                      <td className="p-2.5 font-bold">Q1 (Apr - Jun)</td>
                      <td className="p-2.5 text-slate-600">TOK-2026-9921</td>
                      <td className="p-2.5">₹1,50,000</td>
                      <td className="p-2.5 font-bold text-rose-600">₹7,500</td>
                      <td className="p-2.5">0210045</td>
                      <td className="p-2.5">07-Jul-2026</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Q2 (Jul - Sep)</td>
                      <td className="p-2.5 text-slate-600">TOK-2026-9922</td>
                      <td className="p-2.5">₹1,50,000</td>
                      <td className="p-2.5 font-bold text-rose-600">₹7,500</td>
                      <td className="p-2.5">0210045</td>
                      <td className="p-2.5">07-Oct-2026</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Q3 (Oct - Dec)</td>
                      <td className="p-2.5 text-slate-600">TOK-2026-9923</td>
                      <td className="p-2.5">₹1,50,000</td>
                      <td className="p-2.5 font-bold text-rose-600">₹7,500</td>
                      <td className="p-2.5">0210045</td>
                      <td className="p-2.5">07-Jan-2027</td>
                    </tr>
                    <tr className="bg-slate-50 font-black text-slate-900">
                      <td className="p-2.5 font-sans" colSpan={3}>Total Tax Deposited for FY 2026-27</td>
                      <td className="p-2.5 text-rose-700" colSpan={3}>₹22,500.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Part B: Salary Breakdown */}
            <div className="space-y-2">
              <span className="font-bold text-slate-900 text-xs block">PART B: Annexure - Computation of Taxable Salary and Tax Payable</span>
              <div className="border border-slate-200 rounded-xl p-3 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="font-sans text-slate-700">1. Gross Salary as per provisions contained in section 17(1):</span>
                  <span className="font-bold text-slate-900">₹{((Number(selectedForm16Employee.gross || 50000)) * 12).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span className="font-sans">2. Standard Deduction under section 16(ia):</span>
                  <span>-₹75,000.00</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-sans">3. Total Deductions under Chapter VI-A (New Tax Regime u/s 115BAC):</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-100 pt-1.5 text-slate-900">
                  <span className="font-sans">4. Net Taxable Income:</span>
                  <span>₹{Math.max(0, ((Number(selectedForm16Employee.gross || 50000)) * 12) - 75000).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-sans">5. Tax on Total Income:</span>
                  <span>₹21,635.00</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-sans">6. Health & Education Cess (4%):</span>
                  <span>₹865.00</span>
                </div>
                <div className="flex justify-between font-black text-emerald-900 border-t border-slate-200 pt-1.5 text-sm">
                  <span className="font-sans">7. Total Tax Payable & Deposited:</span>
                  <span>₹22,500.00</span>
                </div>
              </div>
            </div>

            {/* Verification Block */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[11px]">
              <span className="font-bold text-slate-900 block">Verification Statement:</span>
              <p className="text-slate-600">
                I, Subhendu Kumar, Director & Authorized Signatory, son/daughter of representative, working in the capacity of Principal Officer, do hereby certify that a sum of INR Twenty Two Thousand Five Hundred Only [₹22,500] has been deducted at source and paid to the credit of the Central Government.
              </p>
              <div className="pt-2 flex justify-between items-center text-slate-500 font-mono">
                <span>Place: Bhubaneswar, Odisha</span>
                <span>Date: 15-May-2027</span>
                <span className="font-sans font-bold text-slate-900">Signature of Authorized Person</span>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-slate-200">
              <span className="text-[11px] text-slate-400">Digitally certified document under CBDT Notification No. 36/2019.</span>
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer inline-flex items-center"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print / Download Form 16
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
