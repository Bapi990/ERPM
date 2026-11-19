import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Laptop, Plus, CheckCircle2, Shield, Wrench, Box,
  DollarSign, ArrowRightLeft, Cpu, HardDrive, Smartphone,
  Layers, FileText, Building2, FileCheck, Sliders, History,
  Search, Filter, RotateCcw, Download, Eye, Edit3, Trash2,
  Check, X, AlertTriangle, Clock, Calendar, Users, ArrowRight,
  TrendingUp, Activity, Tag, CheckSquare, Sparkles, RefreshCw
} from 'lucide-react';
import { DataTable, type ColumnDef } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useRealtime } from '../../context/RealtimeContext';
import { useAuth } from '../../context/AuthContext';
import { canPerformAction } from '../../utils/rbacMatrix';

// ----------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------
export interface CompanyAsset {
  id: string;
  asset_tag: string;
  name: string;
  category: 'laptop' | 'desktop' | 'server' | 'mobile' | 'furniture' | 'network' | 'printer';
  serial_number: string;
  assigned_to?: string;
  assigned_to_role?: string;
  department: string;
  purchase_date: string;
  warranty_expiry: string;
  cost: number;
  condition: 'Brand New' | 'Good' | 'Fair' | 'Damaged';
  location: string;
  status: 'allocated' | 'available' | 'maintenance' | 'scrapped';
  notes?: string;
}

export interface AssetHistoryLog {
  id: string;
  asset_id: string;
  asset_tag: string;
  asset_name: string;
  event_type: 'allocated' | 'reallocated' | 'returned' | 'maintenance' | 'scrapped';
  previous_custodian?: string;
  new_custodian?: string;
  action_date: string;
  performed_by: string;
  condition_upon_action: string;
  remarks: string;
  digital_sign_verified: boolean;
}

export interface MaintenanceTicket {
  id: string;
  ticket_number: string;
  asset_tag: string;
  asset_name: string;
  issue_description: string;
  service_vendor: string;
  cost_estimate: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'in_service' | 'repaired' | 'closed';
  reported_date: string;
  expected_completion: string;
  technician_notes?: string;
}

export interface StockItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  bin_location: string;
  quantity_on_hand: number;
  min_reorder_level: number;
  unit_cost: number;
  uom: string;
  last_restocked: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface ProductMasterItem {
  id: string;
  sku_code: string;
  item_name: string;
  hsn_code: string;
  category: string;
  uom: string;
  standard_cost: number;
  selling_price: number;
  reorder_qty: number;
  barcode: string;
  supplier_ref: string;
}

export interface PurchaseRequest {
  id: string;
  pr_number: string;
  requested_by: string;
  department: string;
  item_name: string;
  quantity: number;
  estimated_cost: number;
  urgency: 'normal' | 'urgent' | 'critical';
  justification: string;
  status: 'pending_approval' | 'approved' | 'rejected' | 'po_created';
  created_at: string;
}

export interface Vendor {
  id: string;
  vendor_code: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  city: string;
  gstin: string;
  payment_terms: string;
  rating: number;
  active_orders: number;
}

export interface GoodsReceivedNote {
  id: string;
  grn_number: string;
  po_reference: string;
  vendor_name: string;
  inward_date: string;
  received_qty: number;
  accepted_qty: number;
  rejected_qty: number;
  inspector: string;
  status: 'passed' | 'partial_rejection' | 'pending_qc';
  notes?: string;
}

export interface StockTransfer {
  id: string;
  transfer_number: string;
  from_warehouse: string;
  to_warehouse: string;
  item_name: string;
  quantity: number;
  dispatch_date: string;
  carrier: string;
  tracking_number: string;
  status: 'dispatched' | 'in_transit' | 'received';
  received_by?: string;
}

// ----------------------------------------------------
// INITIAL PRE-LOADED ENTERPRISE DATASET
// ----------------------------------------------------
const INITIAL_ASSETS: CompanyAsset[] = [
  {
    id: 'ast-01',
    asset_tag: 'GB-LAP-042',
    name: 'Apple MacBook Pro M3 Max (36GB / 1TB SSD)',
    category: 'laptop',
    serial_number: 'C02G89A2Q05D',
    assigned_to: 'Rohan Mehta',
    assigned_to_role: 'Associate Staff (Engineering)',
    department: 'Engineering & Technology',
    purchase_date: '2026-01-15',
    warranty_expiry: '2029-01-15',
    cost: 245000,
    condition: 'Brand New',
    location: 'Bhubaneswar Infocity HQ',
    status: 'allocated',
    notes: 'Configured with corporate VPN profile and biometric authentication.',
  },
  {
    id: 'ast-02',
    asset_tag: 'GB-LAP-043',
    name: 'Dell XPS 15 Intel i9 14th Gen (32GB / 1TB)',
    category: 'laptop',
    serial_number: 'DXPS-9530-9122',
    assigned_to: 'Ananya Sharma',
    assigned_to_role: 'HR Director',
    department: 'Human Resources',
    purchase_date: '2026-02-10',
    warranty_expiry: '2028-02-10',
    cost: 185000,
    condition: 'Good',
    location: 'Bhubaneswar Infocity HQ',
    status: 'allocated',
  },
  {
    id: 'ast-03',
    asset_tag: 'GB-DESK-011',
    name: 'Dell UltraSharp 32" 4K IPS USB-C Monitor',
    category: 'desktop',
    serial_number: 'U3223QE-8831',
    assigned_to: 'Rahul Verma',
    assigned_to_role: 'Team Manager',
    department: 'Operations & Engineering',
    purchase_date: '2026-03-01',
    warranty_expiry: '2029-03-01',
    cost: 72000,
    condition: 'Good',
    location: 'Tech Floor Workstation 4B',
    status: 'allocated',
  },
  {
    id: 'ast-04',
    asset_tag: 'GB-LAP-044',
    name: 'Lenovo ThinkPad X1 Carbon Gen 12 (16GB / 512GB)',
    category: 'laptop',
    serial_number: 'TP-X1-2026-44',
    department: 'IT Hardware Pool',
    purchase_date: '2026-04-12',
    warranty_expiry: '2028-04-12',
    cost: 165000,
    condition: 'Brand New',
    location: 'Secure IT Vault Shelf 2',
    status: 'available',
  },
  {
    id: 'ast-05',
    asset_tag: 'GB-SRV-002',
    name: 'Cisco Meraki MX95 Enterprise Firewall Rack',
    category: 'network',
    serial_number: 'Q2DN-8921-1234',
    department: 'IT Infrastructure',
    purchase_date: '2025-11-20',
    warranty_expiry: '2030-11-20',
    cost: 320000,
    condition: 'Good',
    location: 'Server Room Rack A1',
    status: 'allocated',
  },
  {
    id: 'ast-06',
    asset_tag: 'GB-SRV-001',
    name: 'Dell PowerEdge R750xs Dual Xeon Server (128GB)',
    category: 'server',
    serial_number: 'PE-R750-7712',
    department: 'Core Infrastructure',
    purchase_date: '2025-10-05',
    warranty_expiry: '2030-10-05',
    cost: 580000,
    condition: 'Good',
    location: 'Server Room Rack B2',
    status: 'allocated',
  },
  {
    id: 'ast-07',
    asset_tag: 'GB-PRN-003',
    name: 'HP LaserJet Enterprise MFP M528 Enterprise Duplex',
    category: 'printer',
    serial_number: 'HPLJ-528-9901',
    department: 'Administration & Finance',
    purchase_date: '2026-01-20',
    warranty_expiry: '2028-01-20',
    cost: 95000,
    condition: 'Good',
    location: '3rd Floor Central Corridor',
    status: 'allocated',
  },
  {
    id: 'ast-08',
    asset_tag: 'GB-LAP-045',
    name: 'Apple MacBook Air 15" M3 (16GB / 512GB)',
    category: 'laptop',
    serial_number: 'C02H11B9K08A',
    department: 'IT Hardware Pool',
    purchase_date: '2026-05-01',
    warranty_expiry: '2028-05-01',
    cost: 135000,
    condition: 'Brand New',
    location: 'Secure IT Vault Shelf 1',
    status: 'available',
  },
  {
    id: 'ast-09',
    asset_tag: 'GB-TAB-004',
    name: 'Apple iPad Pro 12.9" M2 Cellular + Magic Keyboard',
    category: 'mobile',
    serial_number: 'DMP-IPD-3341',
    assigned_to: 'Vikram Malhotra',
    assigned_to_role: 'Sales Director',
    department: 'Commercial Sales',
    purchase_date: '2026-02-15',
    warranty_expiry: '2027-02-15',
    cost: 142000,
    condition: 'Good',
    location: 'Executive Sales Fleet',
    status: 'allocated',
  },
  {
    id: 'ast-10',
    asset_tag: 'GB-LAP-040',
    name: 'Dell Precision 7680 Mobile Workstation (64GB RAM)',
    category: 'laptop',
    serial_number: 'DPR-7680-8812',
    department: 'IT Hardware Pool',
    purchase_date: '2025-08-10',
    warranty_expiry: '2028-08-10',
    cost: 290000,
    condition: 'Fair',
    location: 'Service Workshop Bench 3',
    status: 'maintenance',
    notes: 'Undergoing battery recalibration and thermal repasting.',
  },
];

const INITIAL_HISTORY: AssetHistoryLog[] = [
  {
    id: 'his-01',
    asset_id: 'ast-01',
    asset_tag: 'GB-LAP-042',
    asset_name: 'Apple MacBook Pro M3 Max',
    event_type: 'allocated',
    previous_custodian: 'IT Reserve Pool',
    new_custodian: 'Rohan Mehta',
    action_date: '2026-01-16 10:30 AM',
    performed_by: 'IT Admin (Binayak Prasad)',
    condition_upon_action: 'Brand New In Box',
    remarks: 'Issued complete developer setup: 140W GaN Charger, USB-C Dongle & Laptop Sleeve.',
    digital_sign_verified: true,
  },
  {
    id: 'his-02',
    asset_id: 'ast-02',
    asset_tag: 'GB-LAP-043',
    asset_name: 'Dell XPS 15 Intel i9',
    event_type: 'allocated',
    previous_custodian: 'IT Reserve Pool',
    new_custodian: 'Ananya Sharma',
    action_date: '2026-02-11 11:00 AM',
    performed_by: 'IT Admin (Binayak Prasad)',
    condition_upon_action: 'Brand New In Box',
    remarks: 'Handover complete with corporate security clearance.',
    digital_sign_verified: true,
  },
  {
    id: 'his-03',
    asset_id: 'ast-03',
    asset_tag: 'GB-DESK-011',
    asset_name: 'Dell UltraSharp 32" 4K Monitor',
    event_type: 'allocated',
    previous_custodian: 'Hardware Inventory',
    new_custodian: 'Rahul Verma',
    action_date: '2026-03-02 02:15 PM',
    performed_by: 'IT Admin',
    condition_upon_action: 'Good',
    remarks: 'Mounted to ergonomic desk arm at station 4B.',
    digital_sign_verified: true,
  },
  {
    id: 'his-04',
    asset_id: 'ast-10',
    asset_tag: 'GB-LAP-040',
    asset_name: 'Dell Precision 7680 Workstation',
    event_type: 'returned',
    previous_custodian: 'Pooja Desai',
    new_custodian: 'IT Maintenance Pool',
    action_date: '2026-11-05 04:30 PM',
    performed_by: 'Hardware Custodian',
    condition_upon_action: 'Fair (Battery Health 78%)',
    remarks: 'Returned for authorized AMC servicing and battery replacement.',
    digital_sign_verified: true,
  },
  {
    id: 'his-05',
    asset_id: 'ast-09',
    asset_tag: 'GB-TAB-004',
    asset_name: 'Apple iPad Pro 12.9" M2',
    event_type: 'allocated',
    previous_custodian: 'IT Reserve Pool',
    new_custodian: 'Vikram Malhotra',
    action_date: '2026-02-16 09:45 AM',
    performed_by: 'IT Admin',
    condition_upon_action: 'Brand New',
    remarks: 'Assigned for commercial client presentations and contract signatures.',
    digital_sign_verified: true,
  },
];

const INITIAL_MAINTENANCE: MaintenanceTicket[] = [
  {
    id: 'maint-01',
    ticket_number: 'MNT-2026-012',
    asset_tag: 'GB-LAP-040',
    asset_name: 'Dell Precision 7680 Workstation',
    issue_description: 'Battery health degraded to 78%. Thermal throttling under heavy build tasks.',
    service_vendor: 'Dell Authorised Service Centre, Bhubaneswar',
    cost_estimate: 14500,
    priority: 'high',
    status: 'in_service',
    reported_date: '2026-11-06',
    expected_completion: '2026-11-19',
    technician_notes: 'OEM battery pack dispatched from Dell Bangalore warehouse.',
  },
  {
    id: 'maint-02',
    ticket_number: 'MNT-2026-011',
    asset_tag: 'GB-PRN-003',
    asset_name: 'HP LaserJet Enterprise MFP M528',
    issue_description: 'Scheduled preventive maintenance and roller pickup replacement.',
    service_vendor: 'HP Enterprise Services India',
    cost_estimate: 6200,
    priority: 'medium',
    status: 'repaired',
    reported_date: '2026-10-28',
    expected_completion: '2026-11-02',
    technician_notes: 'Rollers replaced. Print drum aligned and 1000 page test completed.',
  },
];

const INITIAL_STOCK: StockItem[] = [
  {
    id: 'stk-01',
    sku: 'IT-SSD-1TB-NVME',
    name: 'Samsung 990 Pro 1TB PCIe 4.0 NVMe M.2 SSD',
    category: 'Storage Components',
    bin_location: 'Bin A-12 (Shelf 3)',
    quantity_on_hand: 24,
    min_reorder_level: 10,
    unit_cost: 9800,
    uom: 'Units',
    last_restocked: '2026-11-01',
    status: 'in_stock',
  },
  {
    id: 'stk-02',
    sku: 'IT-RAM-32GB-DDR5',
    name: 'Crucial 32GB DDR5 5600MHz SO-DIMM Laptop RAM',
    category: 'Memory Modules',
    bin_location: 'Bin A-14 (Shelf 3)',
    quantity_on_hand: 16,
    min_reorder_level: 8,
    unit_cost: 8400,
    uom: 'Units',
    last_restocked: '2026-10-20',
    status: 'in_stock',
  },
  {
    id: 'stk-03',
    sku: 'IT-CHG-100W-GAN',
    name: 'Anker Prime 100W GaN 3-Port Fast Charger Type-C',
    category: 'Power & Accessories',
    bin_location: 'Bin B-02 (Shelf 1)',
    quantity_on_hand: 5,
    min_reorder_level: 12,
    unit_cost: 4500,
    uom: 'Units',
    last_restocked: '2026-09-15',
    status: 'low_stock',
  },
  {
    id: 'stk-04',
    sku: 'IT-DCK-10IN1-USB',
    name: 'CalDigit TS4 Thunderbolt 4 Enterprise Docking Station',
    category: 'Peripherals',
    bin_location: 'Bin B-08 (Shelf 2)',
    quantity_on_hand: 8,
    min_reorder_level: 6,
    unit_cost: 28500,
    uom: 'Units',
    last_restocked: '2026-10-10',
    status: 'in_stock',
  },
  {
    id: 'stk-05',
    sku: 'IT-CBL-CAT6-305M',
    name: 'Schneider D-Link Cat6 UTP 305m High Speed Cable Box',
    category: 'Networking Cable',
    bin_location: 'Warehouse Floor Rack C',
    quantity_on_hand: 2,
    min_reorder_level: 5,
    unit_cost: 8200,
    uom: 'Drums',
    last_restocked: '2026-08-11',
    status: 'low_stock',
  },
  {
    id: 'stk-06',
    sku: 'IT-MOU-MX3S-LOG',
    name: 'Logitech MX Master 3S Advanced Ergonomic Wireless Mouse',
    category: 'Peripherals',
    bin_location: 'Bin B-05 (Shelf 1)',
    quantity_on_hand: 18,
    min_reorder_level: 10,
    unit_cost: 7200,
    uom: 'Units',
    last_restocked: '2026-11-02',
    status: 'in_stock',
  },
];

const INITIAL_ITEM_MASTER: ProductMasterItem[] = [
  {
    id: 'itm-01',
    sku_code: 'IT-SSD-1TB-NVME',
    item_name: 'Samsung 990 Pro 1TB PCIe 4.0 NVMe M.2 SSD',
    hsn_code: '84717020',
    category: 'Computer Storage Hardware',
    uom: 'Units (Nos)',
    standard_cost: 9800,
    selling_price: 12500,
    reorder_qty: 15,
    barcode: '8806094772189',
    supplier_ref: 'Redington India Ltd',
  },
  {
    id: 'itm-02',
    sku_code: 'IT-RAM-32GB-DDR5',
    item_name: 'Crucial 32GB DDR5 5600MHz SO-DIMM Laptop RAM',
    hsn_code: '84733030',
    category: 'Memory Modules',
    uom: 'Units (Nos)',
    standard_cost: 8400,
    selling_price: 10500,
    reorder_qty: 20,
    barcode: '0649528929945',
    supplier_ref: 'Ingram Micro India',
  },
  {
    id: 'itm-03',
    sku_code: 'IT-CHG-100W-GAN',
    item_name: 'Anker Prime 100W GaN 3-Port Fast Charger Type-C',
    hsn_code: '85044090',
    category: 'Power Adaptors',
    uom: 'Units (Nos)',
    standard_cost: 4500,
    selling_price: 6200,
    reorder_qty: 25,
    barcode: '0194644120341',
    supplier_ref: 'Anker Commercial India',
  },
  {
    id: 'itm-04',
    sku_code: 'IT-DCK-10IN1-USB',
    item_name: 'CalDigit TS4 Thunderbolt 4 Enterprise Docking Station',
    hsn_code: '84718000',
    category: 'Peripherals',
    uom: 'Units (Nos)',
    standard_cost: 28500,
    selling_price: 35000,
    reorder_qty: 10,
    barcode: '0850008424451',
    supplier_ref: 'CalDigit Direct Asia',
  },
];

const INITIAL_REQUESTS: PurchaseRequest[] = [
  {
    id: 'pr-01',
    pr_number: 'PR-2026-018',
    requested_by: 'Rahul Verma',
    department: 'Engineering & Technology',
    item_name: '5x CalDigit TS4 Thunderbolt 4 Docks for Dev Workstations',
    quantity: 5,
    estimated_cost: 142500,
    urgency: 'urgent',
    justification: 'Required for high-throughput dual 4K monitors on new engineer workstations.',
    status: 'approved',
    created_at: '2026-11-12',
  },
  {
    id: 'pr-02',
    pr_number: 'PR-2026-019',
    requested_by: 'Ananya Sharma',
    department: 'Human Resources',
    item_name: '20x Anker 100W GaN Chargers & Braided USB-C Cables',
    quantity: 20,
    estimated_cost: 90000,
    urgency: 'normal',
    justification: 'Replenish reserve hardware pool for incoming Q4 engineering onboarding.',
    status: 'pending_approval',
    created_at: '2026-11-14',
  },
  {
    id: 'pr-03',
    pr_number: 'PR-2026-020',
    requested_by: 'Vikram Malhotra',
    department: 'Commercial Sales',
    item_name: '3x Portable High-Gain Conference Room Microphones',
    quantity: 3,
    estimated_cost: 36000,
    urgency: 'normal',
    justification: 'Upgrade boardroom AV equipment for client demos and pitch calls.',
    status: 'pending_approval',
    created_at: '2026-11-16',
  },
];

const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'vnd-01',
    vendor_code: 'VND-DELL-01',
    name: 'Dell Technologies India Pvt Ltd',
    contact_person: 'Siddharth Rao',
    email: 'enterprise.support@dell.co.in',
    phone: '+91 80 2506 8000',
    city: 'Bengaluru / Bhubaneswar',
    gstin: '29AAACD2404A1ZY',
    payment_terms: 'Net 30 Days',
    rating: 5,
    active_orders: 3,
  },
  {
    id: 'vnd-02',
    vendor_code: 'VND-APPL-02',
    name: 'Apple India Commercial Enterprises',
    contact_person: 'Priyanka Menon',
    email: 'business@apple.com/in',
    phone: '+91 22 4001 5000',
    city: 'Mumbai',
    gstin: '27AABCA7211L1Z2',
    payment_terms: 'Net 15 Days',
    rating: 5,
    active_orders: 2,
  },
  {
    id: 'vnd-03',
    vendor_code: 'VND-INGR-03',
    name: 'Ingram Micro India Private Limited',
    contact_person: 'Manish Pandey',
    email: 'corporate.sales@ingrammicro.com',
    phone: '+91 22 6858 6000',
    city: 'Kolkata / Bhubaneswar',
    gstin: '19AAACI1582P1ZV',
    payment_terms: 'Net 45 Days',
    rating: 4.8,
    active_orders: 5,
  },
  {
    id: 'vnd-04',
    vendor_code: 'VND-CSCO-04',
    name: 'Cisco Systems India Private Limited',
    contact_person: 'Vikash Sen',
    email: 'sales-enterprise@cisco.com',
    phone: '+91 80 4426 1000',
    city: 'Bengaluru',
    gstin: '29AAACC3396Q1ZP',
    payment_terms: 'Net 30 Days',
    rating: 4.9,
    active_orders: 1,
  },
];

const INITIAL_GRN: GoodsReceivedNote[] = [
  {
    id: 'grn-01',
    grn_number: 'GRN-2026-042',
    po_reference: 'PO-2026-089',
    vendor_name: 'Dell Technologies India Pvt Ltd',
    inward_date: '2026-11-10',
    received_qty: 10,
    accepted_qty: 10,
    rejected_qty: 0,
    inspector: 'IT Hardware Auditor (Rahul Verma)',
    status: 'passed',
    notes: 'All 10 Dell XPS laptops arrived in pristine factory sealed cartons with warranty cards.',
  },
  {
    id: 'grn-02',
    grn_number: 'GRN-2026-043',
    po_reference: 'PO-2026-092',
    vendor_name: 'Ingram Micro India Private Limited',
    inward_date: '2026-11-12',
    received_qty: 30,
    accepted_qty: 28,
    rejected_qty: 2,
    inspector: 'Warehouse QA Incharge',
    status: 'partial_rejection',
    notes: '2 Samsung SSD blister packs were dented and failed physical integrity check. Returned for replacement.',
  },
];

const INITIAL_TRANSFERS: StockTransfer[] = [
  {
    id: 'st-01',
    transfer_number: 'ST-2026-015',
    from_warehouse: 'Bhubaneswar Central IT Vault',
    to_warehouse: 'Mumbai Tech Centre (BKC Office)',
    item_name: 'Apple MacBook Pro M3 (16GB / 512GB)',
    quantity: 4,
    dispatch_date: '2026-11-12',
    carrier: 'BlueDart Express Air Courier',
    tracking_number: 'BLD-998822101',
    status: 'in_transit',
  },
  {
    id: 'st-02',
    transfer_number: 'ST-2026-014',
    from_warehouse: 'Bhubaneswar Central IT Vault',
    to_warehouse: 'Delhi NCR Satellite Office',
    item_name: 'Samsung 990 Pro 1TB SSD & 32GB RAM Modules',
    quantity: 12,
    dispatch_date: '2026-11-05',
    carrier: 'DTDC Priority Air',
    tracking_number: 'DTDC-44229911',
    status: 'received',
    received_by: 'Office Manager (Vikas Roy)',
  },
];

export const AssetsPage: React.FC = () => {
  const { user } = useAuth();
  const { emitEvent, subscribe } = useRealtime();
  const location = useLocation();
  const navigate = useNavigate();

  // Map URL pathname to active submodule tab
  const getSubmoduleFromPath = () => {
    const p = location.pathname;
    if (p.includes('/assets/equipment')) return 'equipment';
    if (p.includes('/assets/laptops')) return 'laptops';
    if (p.includes('/assets/history')) return 'history';
    if (p.includes('/assets/maintenance')) return 'maintenance';
    if (p.includes('/inventory/stock')) return 'stock';
    if (p.includes('/inventory/items')) return 'items';
    if (p.includes('/inventory/requests')) return 'requests';
    if (p.includes('/inventory/vendors')) return 'vendors';
    if (p.includes('/inventory/grn')) return 'grn';
    if (p.includes('/inventory/transfers')) return 'transfers';
    if (p.includes('/inventory/reports')) return 'reports';
    return 'register';
  };

  const [activeTab, setActiveTab] = useState<string>(getSubmoduleFromPath());

  useEffect(() => {
    setActiveTab(getSubmoduleFromPath());
  }, [location.pathname]);

  // Navigate on tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (['register', 'equipment', 'laptops', 'history', 'maintenance'].includes(tabId)) {
      navigate(`/app/assets/${tabId}`);
    } else {
      navigate(`/app/inventory/${tabId}`);
    }
  };

  // Persistent States
  const [assets, setAssets] = useState<CompanyAsset[]>(() => {
    try {
      const saved = localStorage.getItem('odias_assets_master_v3');
      return saved ? JSON.parse(saved) : INITIAL_ASSETS;
    } catch {
      return INITIAL_ASSETS;
    }
  });

  const [history, setHistory] = useState<AssetHistoryLog[]>(() => {
    try {
      const saved = localStorage.getItem('odias_asset_history_v3');
      return saved ? JSON.parse(saved) : INITIAL_HISTORY;
    } catch {
      return INITIAL_HISTORY;
    }
  });

  const [maintenance, setMaintenance] = useState<MaintenanceTicket[]>(() => {
    try {
      const saved = localStorage.getItem('odias_asset_maintenance_v3');
      return saved ? JSON.parse(saved) : INITIAL_MAINTENANCE;
    } catch {
      return INITIAL_MAINTENANCE;
    }
  });

  const [stock, setStock] = useState<StockItem[]>(() => {
    try {
      const saved = localStorage.getItem('odias_inventory_stock_v3');
      return saved ? JSON.parse(saved) : INITIAL_STOCK;
    } catch {
      return INITIAL_STOCK;
    }
  });

  const [items, setItems] = useState<ProductMasterItem[]>(() => {
    try {
      const saved = localStorage.getItem('odias_item_master_v3');
      return saved ? JSON.parse(saved) : INITIAL_ITEM_MASTER;
    } catch {
      return INITIAL_ITEM_MASTER;
    }
  });

  const [requests, setRequests] = useState<PurchaseRequest[]>(() => {
    try {
      const saved = localStorage.getItem('odias_purchase_requests_v3');
      return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
    } catch {
      return INITIAL_REQUESTS;
    }
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    try {
      const saved = localStorage.getItem('odias_vendors_master_v3');
      return saved ? JSON.parse(saved) : INITIAL_VENDORS;
    } catch {
      return INITIAL_VENDORS;
    }
  });

  const [grnList, setGrnList] = useState<GoodsReceivedNote[]>(() => {
    try {
      const saved = localStorage.getItem('odias_grn_master_v3');
      return saved ? JSON.parse(saved) : INITIAL_GRN;
    } catch {
      return INITIAL_GRN;
    }
  });

  const [transfers, setTransfers] = useState<StockTransfer[]>(() => {
    try {
      const saved = localStorage.getItem('odias_stock_transfers_v3');
      return saved ? JSON.parse(saved) : INITIAL_TRANSFERS;
    } catch {
      return INITIAL_TRANSFERS;
    }
  });

  // LocalStorage synchronizers
  useEffect(() => {
    localStorage.setItem('odias_assets_master_v3', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('odias_asset_history_v3', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('odias_asset_maintenance_v3', JSON.stringify(maintenance));
  }, [maintenance]);

  useEffect(() => {
    localStorage.setItem('odias_inventory_stock_v3', JSON.stringify(stock));
  }, [stock]);

  useEffect(() => {
    localStorage.setItem('odias_item_master_v3', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('odias_purchase_requests_v3', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('odias_vendors_master_v3', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('odias_grn_master_v3', JSON.stringify(grnList));
  }, [grnList]);

  useEffect(() => {
    localStorage.setItem('odias_stock_transfers_v3', JSON.stringify(transfers));
  }, [transfers]);

  // Notifications Toast
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  // Realtime RBAC Action Permissions Listener
  const [, setRbacTick] = useState(0);
  useEffect(() => {
    const unsub = subscribe('rbac_permissions_updated', () => setRbacTick(t => t + 1));
    const handleLocal = () => setRbacTick(t => t + 1);
    window.addEventListener('kalinga_rbac_updated', handleLocal);
    return () => {
      unsub();
      window.removeEventListener('kalinga_rbac_updated', handleLocal);
    };
  }, [subscribe]);

  // Modals State
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [prModalOpen, setPrModalOpen] = useState(false);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [grnModalOpen, setGrnModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [viewAssetDossier, setViewAssetDossier] = useState<CompanyAsset | null>(null);

  // Form States
  const [selectedAsset, setSelectedAsset] = useState<CompanyAsset | null>(null);
  const [newAssignee, setNewAssignee] = useState('Rohan Mehta');
  const [newAssigneeRole, setNewAssigneeRole] = useState('Associate Staff');
  const [handoverAccessories, setHandoverAccessories] = useState('140W GaN Charger, USB-C Dongle, Laptop Sleeve');
  const [handoverNotes, setHandoverNotes] = useState('Equipment handed over in verified pristine condition.');
  const [returnCondition, setReturnCondition] = useState('Good (Minor Signs of Wear)');
  const [returnNotes, setReturnNotes] = useState('Returned upon project realignment. Factory reset completed.');

  // Register Asset Form
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetCategory, setNewAssetCategory] = useState<CompanyAsset['category']>('laptop');
  const [newSerial, setNewSerial] = useState('');
  const [newCost, setNewCost] = useState(150000);
  const [newDepartment, setNewDepartment] = useState('Engineering & Technology');
  const [newLocation, setNewLocation] = useState('Bhubaneswar Infocity HQ');
  const [newWarrantyExpiry, setNewWarrantyExpiry] = useState(
    new Date(Date.now() + 365 * 3 * 86400000).toISOString().split('T')[0]
  );

  // Maintenance Form
  const [maintAssetTag, setMaintAssetTag] = useState('');
  const [maintIssue, setMaintIssue] = useState('');
  const [maintVendor, setMaintVendor] = useState('Dell Authorised Service Centre');
  const [maintCost, setMaintCost] = useState(12000);
  const [maintPriority, setMaintPriority] = useState<MaintenanceTicket['priority']>('medium');

  // Stock Adjustment Form
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const [stockAdjustQty, setStockAdjustQty] = useState(5);
  const [stockAdjustType, setStockAdjustType] = useState<'add' | 'deduct'>('add');
  const [stockAdjustReason, setStockAdjustReason] = useState('Inward PO delivery received from distributor');

  // Product Master Form
  const [newSku, setNewSku] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newHsn, setNewHsn] = useState('84713010');
  const [newItemCategory, setNewItemCategory] = useState('Computing Hardware');
  const [newItemCost, setNewItemCost] = useState(10000);
  const [newItemPrice, setNewItemPrice] = useState(14000);
  const [newItemReorder, setNewItemReorder] = useState(10);
  const [newItemSupplier, setNewItemSupplier] = useState('Redington India Ltd');

  // PR Form
  const [prItemName, setPrItemName] = useState('');
  const [prQty, setPrQty] = useState(5);
  const [prCost, setPrCost] = useState(45000);
  const [prUrgency, setPrUrgency] = useState<PurchaseRequest['urgency']>('normal');
  const [prJustification, setPrJustification] = useState('');

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // ----------------------------------------------------
  // WORKFLOW HANDLERS
  // ----------------------------------------------------

  // 1. Register Hardware Asset
  const handleRegisterAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const tagPrefix = newAssetCategory.toUpperCase().slice(0, 3);
    const generatedTag = `GB-${tagPrefix}-${String(assets.length + 46).padStart(3, '0')}`;
    const newAsset: CompanyAsset = {
      id: `ast-${Date.now()}`,
      asset_tag: generatedTag,
      name: newAssetName,
      category: newAssetCategory,
      serial_number: newSerial || `SN-${Date.now().toString().slice(-6)}`,
      department: newDepartment,
      purchase_date: new Date().toISOString().split('T')[0],
      warranty_expiry: newWarrantyExpiry,
      cost: Number(newCost),
      condition: 'Brand New',
      location: newLocation,
      status: 'available',
      notes: 'Initial registration into enterprise hardware vault.',
    };

    setAssets([newAsset, ...assets]);
    setRegisterModalOpen(false);

    // Also log to history
    const logEntry: AssetHistoryLog = {
      id: `his-${Date.now()}`,
      asset_id: newAsset.id,
      asset_tag: newAsset.asset_tag,
      asset_name: newAsset.name,
      event_type: 'allocated',
      previous_custodian: 'OEM Vendor Inward',
      new_custodian: 'IT Hardware Pool',
      action_date: new Date().toLocaleString(),
      performed_by: user?.full_name || 'IT Administrator',
      condition_upon_action: 'Brand New In Box',
      remarks: `Initial registration into master hardware register. Serial: ${newAsset.serial_number}`,
      digital_sign_verified: true,
    };
    setHistory([logEntry, ...history]);

    emitEvent('asset.registered', 'Hardware Asset Tagged', `${newAsset.asset_tag} (${newAsset.name}) registered in master catalog.`, 'success');
    showToast(`Asset ${newAsset.asset_tag} (${newAsset.name}) successfully registered!`);

    // Reset Form
    setNewAssetName('');
    setNewSerial('');
  };

  // 2. Allocate Asset to Custodian (Employee / Manager)
  const handleConfirmAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    const ts = new Date().toLocaleString();
    const prevCustodian = selectedAsset.assigned_to || 'IT Hardware Pool';

    // Update asset
    setAssets((prev) =>
      prev.map((a) =>
        a.id === selectedAsset.id
          ? {
              ...a,
              status: 'allocated',
              assigned_to: newAssignee,
              assigned_to_role: newAssigneeRole,
              notes: handoverNotes,
            }
          : a
      )
    );

    // Create Audit History Log
    const logEntry: AssetHistoryLog = {
      id: `his-${Date.now()}`,
      asset_id: selectedAsset.id,
      asset_tag: selectedAsset.asset_tag,
      asset_name: selectedAsset.name,
      event_type: 'allocated',
      previous_custodian: prevCustodian,
      new_custodian: newAssignee,
      action_date: ts,
      performed_by: user?.full_name || 'IT Admin (Binayak Prasad)',
      condition_upon_action: selectedAsset.condition,
      remarks: `Allocated to ${newAssignee} (${newAssigneeRole}). Accessories: ${handoverAccessories}. Notes: ${handoverNotes}`,
      digital_sign_verified: true,
    };

    setHistory([logEntry, ...history]);
    setAllocateModalOpen(false);

    emitEvent('asset.allocated', 'Hardware Asset Allocated', `${selectedAsset.asset_tag} allocated to ${newAssignee}`, 'success');
    showToast(`Asset ${selectedAsset.asset_tag} successfully allocated to ${newAssignee}!`);
  };

  // 3. Return Asset to Pool
  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    const ts = new Date().toLocaleString();
    const prevCustodian = selectedAsset.assigned_to || 'Employee Custodian';

    setAssets((prev) =>
      prev.map((a) =>
        a.id === selectedAsset.id
          ? {
              ...a,
              status: 'available',
              assigned_to: undefined,
              assigned_to_role: undefined,
              condition: returnCondition as any,
              notes: returnNotes,
            }
          : a
      )
    );

    // Audit History Entry
    const logEntry: AssetHistoryLog = {
      id: `his-${Date.now()}`,
      asset_id: selectedAsset.id,
      asset_tag: selectedAsset.asset_tag,
      asset_name: selectedAsset.name,
      event_type: 'returned',
      previous_custodian: prevCustodian,
      new_custodian: 'IT Hardware Pool',
      action_date: ts,
      performed_by: user?.full_name || 'IT Hardware Custodian',
      condition_upon_action: returnCondition,
      remarks: `Device reclaimed from ${prevCustodian}. ${returnNotes}`,
      digital_sign_verified: true,
    };

    setHistory([logEntry, ...history]);
    setReturnModalOpen(false);

    emitEvent('asset.returned', 'Hardware Returned to Pool', `${selectedAsset.asset_tag} returned by ${prevCustodian}`, 'info');
    showToast(`Asset ${selectedAsset.asset_tag} returned to IT Reserve Pool!`);
  };

  // 4. Create Maintenance Ticket
  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAsset = assets.find((a) => a.asset_tag.toLowerCase() === maintAssetTag.toLowerCase()) || assets[0];
    const ticketNo = `MNT-2026-${String(maintenance.length + 13).padStart(3, '0')}`;

    const newTicket: MaintenanceTicket = {
      id: `mnt-${Date.now()}`,
      ticket_number: ticketNo,
      asset_tag: targetAsset ? targetAsset.asset_tag : maintAssetTag || 'GB-LAP-040',
      asset_name: targetAsset ? targetAsset.name : 'Corporate Workstation',
      issue_description: maintIssue,
      service_vendor: maintVendor,
      cost_estimate: Number(maintCost),
      priority: maintPriority,
      status: 'in_service',
      reported_date: new Date().toISOString().split('T')[0],
      expected_completion: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      technician_notes: 'Undergoing diagnostic inspection by authorized vendor technician.',
    };

    setMaintenance([newTicket, ...maintenance]);

    // Mark asset in maintenance
    if (targetAsset) {
      setAssets((prev) =>
        prev.map((a) => (a.id === targetAsset.id ? { ...a, status: 'maintenance' } : a))
      );
    }

    setMaintenanceModalOpen(false);
    emitEvent('maintenance.created', 'Asset Maintenance Ticket Opened', `Ticket ${ticketNo} opened for ${newTicket.asset_tag}`, 'info');
    showToast(`Maintenance ticket ${ticketNo} logged for ${newTicket.asset_tag}!`);

    setMaintAssetTag('');
    setMaintIssue('');
  };

  // 5. Complete Maintenance & Return to Pool
  const handleCompleteMaintenance = (ticketId: string) => {
    setMaintenance((prev) =>
      prev.map((m) => (m.id === ticketId ? { ...m, status: 'repaired' } : m))
    );
    const t = maintenance.find((m) => m.id === ticketId);
    if (t) {
      setAssets((prev) =>
        prev.map((a) =>
          a.asset_tag === t.asset_tag ? { ...a, status: 'available', condition: 'Good' } : a
        )
      );
    }
    emitEvent('maintenance.closed', 'Maintenance Complete', `Ticket ${t?.ticket_number} marked repaired. Asset ready in pool.`, 'success');
    showToast(`Maintenance complete! Asset returned to available inventory.`);
  };

  // 6. Adjust Stock Quantity
  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockItem) return;

    const delta = stockAdjustType === 'add' ? Number(stockAdjustQty) : -Number(stockAdjustQty);
    const newQty = Math.max(0, selectedStockItem.quantity_on_hand + delta);
    const newStatus =
      newQty === 0 ? 'out_of_stock' : newQty <= selectedStockItem.min_reorder_level ? 'low_stock' : 'in_stock';

    setStock((prev) =>
      prev.map((s) =>
        s.id === selectedStockItem.id
          ? {
              ...s,
              quantity_on_hand: newQty,
              status: newStatus,
              last_restocked: new Date().toISOString().split('T')[0],
            }
          : s
      )
    );

    setStockModalOpen(false);
    emitEvent('stock.adjusted', 'Stock Quantity Adjusted', `${selectedStockItem.name}: ${stockAdjustType === 'add' ? '+' : '-'}${stockAdjustQty} units`, 'info');
    showToast(`Stock updated for ${selectedStockItem.name}! New Quantity: ${newQty}`);
  };

  // 7. Approve / Reject Purchase Request
  const handleUpdateRequestStatus = (prId: string, newStatus: PurchaseRequest['status']) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === prId ? { ...r, status: newStatus } : r))
    );
    const target = requests.find((r) => r.id === prId);
    emitEvent('purchase_request.updated', 'Purchase Request Update', `${target?.pr_number} marked as ${newStatus.toUpperCase()}`, 'info');
    showToast(`Purchase Request ${target?.pr_number} marked as ${newStatus.replace('_', ' ').toUpperCase()}!`);
  };

  // 8. Create Purchase Request
  const handleCreatePR = (e: React.FormEvent) => {
    e.preventDefault();
    const nextPR = `PR-2026-${String(requests.length + 21).padStart(3, '0')}`;
    const newReq: PurchaseRequest = {
      id: `pr-${Date.now()}`,
      pr_number: nextPR,
      requested_by: user?.full_name || 'Rohan Mehta',
      department: 'Engineering & Technology',
      item_name: prItemName,
      quantity: Number(prQty),
      estimated_cost: Number(prCost),
      urgency: prUrgency,
      justification: prJustification,
      status: 'pending_approval',
      created_at: new Date().toISOString().split('T')[0],
    };

    setRequests([newReq, ...requests]);
    setPrModalOpen(false);
    emitEvent('purchase_request.created', 'New Purchase Request Submitted', `${newReq.pr_number} for ${newReq.item_name}`, 'info');
    showToast(`Purchase requisition ${newReq.pr_number} submitted for approval!`);

    setPrItemName('');
    setPrJustification('');
  };

  // 9. Acknowledge Transfer Receipt
  const handleAcknowledgeTransfer = (transferId: string) => {
    setTransfers((prev) =>
      prev.map((t) =>
        t.id === transferId
          ? { ...t, status: 'received', received_by: user?.full_name || 'Warehouse Incharge' }
          : t
      )
    );
    emitEvent('stock.transfer_received', 'Stock Transfer Acknowledged', 'Consignment received and booked into destination warehouse.', 'success');
    showToast('Consignment receipt verified and acknowledged in warehouse ledger!');
  };

  // 10. CSV Export
  const handleExportCSV = (datasetName: string) => {
    let csvData = '';
    if (datasetName === 'assets') {
      csvData = 'Asset Tag,Name,Category,Serial Number,Custodian,Department,Purchase Date,Value,Status\n' +
        assets.map(a => `"${a.asset_tag}","${a.name}","${a.category}","${a.serial_number}","${a.assigned_to || 'Pool'}","${a.department}","${a.purchase_date}",${a.cost},"${a.status}"`).join('\n');
    } else if (datasetName === 'history') {
      csvData = 'Log ID,Asset Tag,Asset Name,Event,Previous Custodian,New Custodian,Timestamp,Authorized By,Remarks\n' +
        history.map(h => `"${h.id}","${h.asset_tag}","${h.asset_name}","${h.event_type}","${h.previous_custodian}","${h.new_custodian}","${h.action_date}","${h.performed_by}","${h.remarks}"`).join('\n');
    } else {
      csvData = 'SKU,Item Name,Category,Bin Location,Qty On Hand,Min Threshold,Unit Cost,UOM,Status\n' +
        stock.map(s => `"${s.sku}","${s.name}","${s.category}","${s.bin_location}",${s.quantity_on_hand},${s.min_reorder_level},${s.unit_cost},"${s.uom}","${s.status}"`).join('\n');
    }

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ODIAS_ERP_${datasetName.toUpperCase()}_EXPORT.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${datasetName.toUpperCase()} audit register to CSV!`);
  };

  // ----------------------------------------------------
  // FILTERED DATASETS
  // ----------------------------------------------------
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const tag = (a.asset_tag || '').toLowerCase();
        const name = (a.name || '').toLowerCase();
        const sn = (a.serial_number || '').toLowerCase();
        const cust = (a.assigned_to || '').toLowerCase();
        const dept = (a.department || '').toLowerCase();
        return tag.includes(q) || name.includes(q) || sn.includes(q) || cust.includes(q) || dept.includes(q);
      }
      return true;
    });
  }, [assets, categoryFilter, statusFilter, searchQuery]);

  const equipmentAssets = useMemo(() => {
    return assets.filter((a) => ['server', 'network', 'printer', 'desktop'].includes(a.category));
  }, [assets]);

  const laptopAssets = useMemo(() => {
    return assets.filter((a) => ['laptop', 'mobile'].includes(a.category));
  }, [assets]);

  // Asset Table Columns
  const assetColumns: ColumnDef<CompanyAsset>[] = [
    {
      key: 'asset_tag',
      header: 'Asset Tag',
      render: (a) => (
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
          {a.asset_tag}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Equipment Name & Specs',
      render: (a) => (
        <div>
          <span className="font-bold text-slate-900 block leading-tight">{a.name}</span>
          <span className="text-[10px] text-slate-400 font-mono">SN: {a.serial_number} • {a.location}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (a) => (
        <span className="capitalize font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
          {a.category}
        </span>
      ),
    },
    {
      key: 'assigned_to',
      header: 'Current Custodian',
      render: (a) =>
        a.assigned_to ? (
          <div>
            <span className="font-bold text-blue-700 block leading-tight">{a.assigned_to}</span>
            <span className="text-[10px] text-slate-500">{a.department}</span>
          </div>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Unassigned (Pool)
          </span>
        ),
    },
    {
      key: 'cost',
      header: 'Valuation',
      accessor: (a) => a.cost,
      render: (a) => (
        <span className="font-mono font-bold text-slate-900">
          ₹{a.cost.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (a) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => setViewAssetDossier(a)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="View Full Hardware Dossier"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {a.status === 'available' ? (
            <button
              onClick={() => {
                setSelectedAsset(a);
                setAllocateModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors text-xs flex items-center space-x-1"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Allocate</span>
            </button>
          ) : a.status === 'allocated' ? (
            <button
              onClick={() => {
                setSelectedAsset(a);
                setReturnModalOpen(true);
              }}
              className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold hover:bg-amber-100 transition-colors text-xs"
            >
              Return
            </button>
          ) : (
            <span className="text-[10px] text-rose-600 font-bold uppercase font-mono">In Repair</span>
          )}
        </div>
      ),
    },
  ];

  // ----------------------------------------------------
  // SUBMODULE TABS LIST (Pure 12 Submodules in Exact Sequence)
  // ----------------------------------------------------
  const navigationTabs = [
    { id: 'register', label: 'Asset Register', icon: Laptop, badge: `${assets.length}` },
    { id: 'equipment', label: 'Company Equipment', icon: Box },
    { id: 'laptops', label: 'Laptop / Desktop Allocation', icon: Laptop, badge: 'Fleet' },
    { id: 'history', label: 'Asset Assignment History', icon: History, badge: 'Audit' },
    { id: 'maintenance', label: 'Asset Maintenance', icon: Wrench },
    { id: 'stock', label: 'Stock Management', icon: Layers },
    { id: 'items', label: 'Product / Item Master', icon: Box },
    { id: 'requests', label: 'Purchase Requests', icon: FileText, badge: `${requests.filter(r => r.status === 'pending_approval').length}` },
    { id: 'vendors', label: 'Vendor Management', icon: Building2 },
    { id: 'grn', label: 'Goods Received Notes (GRN)', icon: FileCheck },
    { id: 'transfers', label: 'Stock Transfers', icon: ArrowRightLeft },
    { id: 'reports', label: 'Stock Reports', icon: Sliders },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-xs text-emerald-700 underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <Laptop className="w-7 h-7 text-blue-600 mr-2.5" />
            Inventory & Asset Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise hardware custody, laptop allocations, immutable audit histories, warehouse consumables, and stock transfers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'register' && canPerformAction(user, 'assets', 'add', '/app/assets/register') && (
            <button
              onClick={() => setRegisterModalOpen(true)}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Register Asset</span>
            </button>
          )}

          {activeTab === 'maintenance' && canPerformAction(user, 'assets', 'add', '/app/assets/maintenance') && (
            <button
              onClick={() => setMaintenanceModalOpen(true)}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-500 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Log Maintenance Ticket</span>
            </button>
          )}

          {activeTab === 'requests' && canPerformAction(user, 'assets', 'add', '/app/inventory/requests') && (
            <button
              onClick={() => setPrModalOpen(true)}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>New Requisition</span>
            </button>
          )}

          {activeTab === 'history' && (
            <button
              onClick={() => handleExportCSV('history')}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              <span>Export Audit Ledger</span>
            </button>
          )}

          <button
            onClick={() => handleExportCSV(activeTab === 'stock' ? 'stock' : 'assets')}
            className="inline-flex items-center px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>CSV Export</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: ASSET REGISTER */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'register' && (
        <div className="space-y-4">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-xs font-semibold block">Total Capital Assets</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                {assets.length}
              </span>
              <span className="text-[11px] text-blue-600 font-medium">Enterprise Equipment</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-xs font-semibold block">Allocated to Staff</span>
              <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                {assets.filter((a) => a.status === 'allocated').length}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">Active Deployment</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-xs font-semibold block">In IT Reserve Pool</span>
              <span className="text-2xl font-black text-blue-600 font-mono mt-1 block">
                {assets.filter((a) => a.status === 'available').length}
              </span>
              <span className="text-[11px] text-blue-700 font-medium">Ready to Deploy</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-xs font-semibold block">Total Capital Value</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                ₹{(assets.reduce((sum, a) => sum + a.cost, 0) / 100000).toFixed(1)}L
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Gross Book Value</span>
            </div>
          </div>

          {/* Interactive Search & Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by tag, model, serial #, custodian..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">Category: All Hardware</option>
                  <option value="laptop">Laptops & Notebooks</option>
                  <option value="desktop">Monitors & Desktops</option>
                  <option value="server">Servers & Data Center</option>
                  <option value="network">Firewalls & Switches</option>
                  <option value="printer">Commercial Printers</option>
                  <option value="mobile">Corporate Tablets & Phones</option>
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">Status: All Statuses</option>
                  <option value="allocated">Allocated to Employee</option>
                  <option value="available">Available in IT Reserve Pool</option>
                  <option value="maintenance">Under Repair / Maintenance</option>
                </select>
              </div>
            </div>
          </div>

          {/* Master DataTable */}
          <DataTable<CompanyAsset>
            data={filteredAssets}
            columns={assetColumns}
            searchPlaceholder="Filter assets..."
          />
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: COMPANY EQUIPMENT */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'equipment' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold flex items-center space-x-2">
                <Box className="w-5 h-5 text-blue-400" />
                <span>Heavy Infrastructure & Shared Enterprise Equipment</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Data center servers, corporate firewalls, central copiers, and conference room AV gear.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
              Active Fleet: {equipmentAssets.length} Units
            </span>
          </div>

          <DataTable<CompanyAsset>
            data={equipmentAssets}
            columns={assetColumns}
            searchPlaceholder="Search infrastructure equipment..."
          />
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: LAPTOP / DESKTOP ALLOCATION */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'laptops' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Laptop className="w-5 h-5 text-blue-600" />
                <span>Personal Computing Deployment Station</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Allocate developer MacBooks, engineering workstations, and corporate tablets with digital handover agreements.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                Deployed: {laptopAssets.filter(l => l.status === 'allocated').length}
              </span>
              <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl">
                Pool Available: {laptopAssets.filter(l => l.status === 'available').length}
              </span>
            </div>
          </div>

          <DataTable<CompanyAsset>
            data={laptopAssets}
            columns={assetColumns}
            searchPlaceholder="Search employee workstations..."
          />
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4: ASSET ASSIGNMENT HISTORY (The highlighted item in user photo) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <History className="w-5 h-5 text-blue-600" />
                  <span>Immutable Asset Assignment Audit Trail</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Complete historical chronological ledger of allocations, transfers, returns, and digital handover sign-offs.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                Total Audit Events: {history.length}
              </span>
            </div>

            <div className="divide-y divide-slate-100 pt-3">
              {history.map((log) => (
                <div key={log.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                        log.event_type === 'allocated'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : log.event_type === 'returned'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-blue-50 text-blue-600 border border-blue-200'
                      }`}
                    >
                      {log.event_type === 'allocated' ? (
                        <Check className="w-5 h-5" />
                      ) : log.event_type === 'returned' ? (
                        <RotateCcw className="w-5 h-5" />
                      ) : (
                        <History className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2 py-0.5 rounded">
                          {log.asset_tag}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900">{log.asset_name}</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            log.event_type === 'allocated'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.event_type === 'returned'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {log.event_type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">{log.remarks}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1.5 font-mono">
                        <span>From: <strong>{log.previous_custodian}</strong></span>
                        <span>→ To: <strong className="text-blue-700">{log.new_custodian}</strong></span>
                        <span>Authorized By: <strong>{log.performed_by}</strong></span>
                        <span>Condition: <strong>{log.condition_upon_action}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-700 block">
                      {log.action_date}
                    </span>
                    <span className="inline-flex items-center text-[10px] text-emerald-600 font-bold mt-1">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Digital Sign Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 5: ASSET MAINTENANCE */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Active Service Tickets</span>
              <span className="text-2xl font-black text-amber-600 font-mono mt-1 block">
                {maintenance.filter(m => m.status === 'in_service').length}
              </span>
              <span className="text-[11px] text-slate-400">At Authorized Service Center</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Repaired & Verified</span>
              <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                {maintenance.filter(m => m.status === 'repaired').length}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">QC Passed</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Annual Maintenance (AMC)</span>
              <span className="text-2xl font-black text-blue-600 font-mono mt-1 block">100%</span>
              <span className="text-[11px] text-blue-700 font-medium">OEM Direct Contracts</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-amber-600" />
              <span>Service & Repair Tickets Ledger</span>
            </h3>

            <div className="divide-y divide-slate-100">
              {maintenance.map((t) => (
                <div key={t.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                        {t.ticket_number}
                      </span>
                      <span className="font-mono font-bold text-xs text-blue-700">{t.asset_tag}</span>
                      <span className="font-bold text-slate-900 text-xs">{t.asset_name}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          t.priority === 'high' || t.priority === 'critical'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 font-medium">{t.issue_description}</p>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">
                      Vendor: <strong>{t.service_vendor}</strong> • Est. Cost: <strong>₹{t.cost_estimate.toLocaleString('en-IN')}</strong> • Notes: {t.technician_notes}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <StatusBadge status={t.status} />
                    {t.status === 'in_service' && (
                      <button
                        onClick={() => handleCompleteMaintenance(t.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        <span>Mark Repaired</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 6: STOCK MANAGEMENT */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold">Tracked SKU Lines</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{stock.length}</span>
              <span className="text-[11px] text-blue-600 font-medium">Consumables & Parts</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold">Low Stock Warnings</span>
              <span className="text-2xl font-black text-amber-600 font-mono mt-1 block">
                {stock.filter(s => s.status === 'low_stock').length}
              </span>
              <span className="text-[11px] text-amber-600 font-medium">Below Reorder Level</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold">Total Inventory Value</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                ₹{(stock.reduce((sum, s) => sum + s.quantity_on_hand * s.unit_cost, 0) / 100000).toFixed(1)}L
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Current Stock Holding</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold">Central Warehouse</span>
              <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">Bhubaneswar</span>
              <span className="text-[11px] text-emerald-600 font-medium">Hub 01 Primary</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Consumables & Spare Parts Inventory</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-mono text-[11px]">
                    <th className="py-2.5 px-3">SKU Code</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">Bin Location</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Min Level</th>
                    <th className="py-2.5 px-3">Unit Cost</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Adjust Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stock.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{item.sku}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                        <span className="text-[10px] text-slate-400">{item.category}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{item.bin_location}</td>
                      <td className="py-3 px-3 font-mono font-bold text-sm text-slate-900">
                        {item.quantity_on_hand} {item.uom}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{item.min_reorder_level}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        ₹{item.unit_cost.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedStockItem(item);
                            setStockModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors text-xs inline-flex items-center space-x-1"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>Adjust</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 7: PRODUCT / ITEM MASTER */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Box className="w-5 h-5 text-indigo-600" />
                <span>Definitive Product & Material Master Catalog</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Standard HSN codes, UOM standards, standard procurement costs, and OEM references.
              </p>
            </div>
            <button
              onClick={() => setItemModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Master Item</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="divide-y divide-slate-100">
              {items.map((m) => (
                <div key={m.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                        {m.sku_code}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">{m.item_name}</span>
                      <span className="font-mono text-[11px] text-slate-400">HSN: {m.hsn_code}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1 font-mono">
                      <span>Category: <strong>{m.category}</strong></span>
                      <span>UOM: <strong>{m.uom}</strong></span>
                      <span>Supplier Ref: <strong>{m.supplier_ref}</strong></span>
                      <span>Barcode: <strong>{m.barcode}</strong></span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-900 block">
                      Cost: ₹{m.standard_cost.toLocaleString('en-IN')} • Sell: ₹{m.selling_price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-blue-600 font-mono">Reorder Batch: {m.reorder_qty} units</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 8: PURCHASE REQUESTS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Internal Material & Hardware Requisitions</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Department purchase requests awaiting supervisory review and financial budget sign-off.
              </p>
            </div>
            <button
              onClick={() => setPrModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Requisition</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="divide-y divide-slate-100">
              {requests.map((r) => (
                <div key={r.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2 py-0.5 rounded">
                        {r.pr_number}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">{r.item_name}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          r.urgency === 'urgent' || r.urgency === 'critical'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {r.urgency}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{r.justification}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                      <span>Requester: <strong className="text-slate-800">{r.requested_by}</strong> ({r.department})</span>
                      <span>Qty: <strong>{r.quantity}</strong></span>
                      <span>Est. Cost: <strong className="text-slate-900">₹{r.estimated_cost.toLocaleString('en-IN')}</strong></span>
                      <span>Date: <strong>{r.created_at}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <StatusBadge status={r.status} />
                    {r.status === 'pending_approval' && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleUpdateRequestStatus(r.id, 'approved')}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleUpdateRequestStatus(r.id, 'rejected')}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 9: VENDOR MANAGEMENT */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>Authorized Hardware & Equipment Suppliers</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tier-1 OEM distribution partners, verified GSTIN credentials, and credit terms.
              </p>
            </div>
            <button
              onClick={() => setVendorModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard Vendor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendors.map((v) => (
              <div key={v.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">
                      {v.vendor_code}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm mt-1">{v.name}</h3>
                    <span className="text-[11px] text-slate-400 font-mono">GSTIN: {v.gstin}</span>
                  </div>
                  <span className="text-amber-500 text-xs font-bold font-mono">
                    ★ {v.rating} / 5.0
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 font-medium pt-2 border-t border-slate-100">
                  <div>Contact: <strong>{v.contact_person}</strong></div>
                  <div>Phone: <strong>{v.phone}</strong></div>
                  <div>Email: <strong className="text-blue-600">{v.email}</strong></div>
                  <div>City: <strong>{v.city}</strong></div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-mono">
                  <span className="text-slate-500">Terms: <strong>{v.payment_terms}</strong></span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    {v.active_orders} Active POs
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 10: GOODS RECEIVED NOTES (GRN) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'grn' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <span>Goods Received Notes (Inward Consignment Inspection)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Warehouse gate pass inspection, accepted vs rejected counts, and defect quarantine.
              </p>
            </div>
            <button
              onClick={() => setGrnModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create GRN Inward</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="divide-y divide-slate-100">
              {grnList.map((g) => (
                <div key={g.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                        {g.grn_number}
                      </span>
                      <span className="font-mono text-xs text-slate-500">PO Ref: {g.po_reference}</span>
                      <span className="font-bold text-slate-900 text-xs">{g.vendor_name}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{g.notes}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                      <span>Inward Date: <strong>{g.inward_date}</strong></span>
                      <span>Received: <strong>{g.received_qty}</strong></span>
                      <span className="text-emerald-700">Accepted: <strong>{g.accepted_qty}</strong></span>
                      {g.rejected_qty > 0 && (
                        <span className="text-rose-600">Rejected: <strong>{g.rejected_qty}</strong></span>
                      )}
                      <span>Inspector: <strong>{g.inspector}</strong></span>
                    </div>
                  </div>

                  <StatusBadge status={g.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 11: STOCK TRANSFERS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'transfers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                <span>Inter-Facility & Branch Stock Transfers</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Dispatch and transit tracking between central warehouses and satellite state offices.
              </p>
            </div>
            <button
              onClick={() => setTransferModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Initiate Transfer</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="divide-y divide-slate-100">
              {transfers.map((st) => (
                <div key={st.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs bg-blue-50 text-blue-800 px-2 py-0.5 rounded">
                        {st.transfer_number}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">{st.item_name} ({st.quantity} Units)</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1 font-medium">
                      <span>From: <strong>{st.from_warehouse}</strong></span>
                      <span>→ To: <strong className="text-blue-700">{st.to_warehouse}</strong></span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                      <span>Carrier: <strong>{st.carrier}</strong></span>
                      <span>Tracking #: <strong>{st.tracking_number}</strong></span>
                      <span>Dispatched: <strong>{st.dispatch_date}</strong></span>
                      {st.received_by && <span>Received By: <strong className="text-emerald-700">{st.received_by}</strong></span>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <StatusBadge status={st.status} />
                    {st.status !== 'received' && (
                      <button
                        onClick={() => handleAcknowledgeTransfer(st.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                      >
                        Acknowledge Receipt
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 12: STOCK REPORTS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Asset Valuation</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                ₹{(assets.reduce((sum, a) => sum + a.cost, 0) / 100000).toFixed(2)} Lakhs
              </span>
              <span className="text-[11px] text-emerald-600 font-bold">100% Capitalized Fixed Assets</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold uppercase">Annual Asset Depreciation</span>
              <span className="text-2xl font-black text-blue-600 font-mono mt-1 block">
                ₹{(assets.reduce((sum, a) => sum + a.cost * 0.2, 0) / 100000).toFixed(2)} Lakhs
              </span>
              <span className="text-[11px] text-slate-500">Straight Line (SLM) @ 20% p.a.</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold uppercase">Hardware Health Index</span>
              <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">96.8%</span>
              <span className="text-[11px] text-emerald-700 font-semibold">Under Active OEM Warranty</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base">Capital Asset Breakdown by Department</h3>
                <p className="text-xs text-slate-500 mt-0.5">Asset count and total capital value allocated per operational division.</p>
              </div>
              <button
                onClick={() => handleExportCSV('assets')}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Valuation Ledger</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Engineering & Technology', 'Operations & Management', 'Human Resources', 'Commercial Sales', 'IT Hardware Pool'].map((dept) => {
                const deptAssets = assets.filter(a => a.department.includes(dept) || (dept === 'IT Hardware Pool' && !a.assigned_to));
                const totalVal = deptAssets.reduce((sum, a) => sum + a.cost, 0);
                return (
                  <div key={dept} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{dept}</span>
                      <span className="font-mono text-xs font-bold text-blue-700">₹{totalVal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${Math.min(100, (totalVal / 800000) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                      <span>Total Units: {deptAssets.length}</span>
                      <span>Avg per unit: ₹{deptAssets.length > 0 ? Math.round(totalVal / deptAssets.length).toLocaleString('en-IN') : 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: REGISTER ASSET MODAL */}
      {/* ---------------------------------------------------- */}
      <Modal isOpen={registerModalOpen} onClose={() => setRegisterModalOpen(false)} title="Register Capital Hardware Asset">
        <form onSubmit={handleRegisterAsset} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Asset Model & Specs *</label>
            <input
              type="text"
              required
              placeholder="e.g. Apple MacBook Pro M3 Max (36GB / 1TB SSD)"
              value={newAssetName}
              onChange={(e) => setNewAssetName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Asset Category</label>
              <select
                value={newAssetCategory}
                onChange={(e) => setNewAssetCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
              >
                <option value="laptop">Laptop / Notebook</option>
                <option value="desktop">Desktop / Monitor</option>
                <option value="server">Server Hardware</option>
                <option value="network">Firewall / Network</option>
                <option value="printer">Commercial Printer</option>
                <option value="mobile">Corporate Tablet / Mobile</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Serial Number (SN) *</label>
              <input
                type="text"
                required
                placeholder="e.g. C02G89A2Q05D"
                value={newSerial}
                onChange={(e) => setNewSerial(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Asset Valuation (₹)</label>
              <input
                type="number"
                value={newCost}
                onChange={(e) => setNewCost(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Warranty Expiry Date</label>
              <input
                type="date"
                value={newWarrantyExpiry}
                onChange={(e) => setNewWarrantyExpiry(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Assigned Department</label>
              <select
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
              >
                <option value="Engineering & Technology">Engineering & Technology</option>
                <option value="Operations & Management">Operations & Management</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Commercial Sales">Commercial Sales</option>
                <option value="IT Hardware Pool">IT Hardware Pool</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Physical Location</label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="e.g. Bhubaneswar Infocity HQ"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRegisterModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/30"
            >
              Confirm Registration
            </button>
          </div>
        </form>
      </Modal>

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: ALLOCATE DEVICE MODAL */}
      {/* ---------------------------------------------------- */}
      <Modal isOpen={allocateModalOpen} onClose={() => setAllocateModalOpen(false)} title="Allocate Hardware to Employee">
        {selectedAsset && (
          <form onSubmit={handleConfirmAllocation} className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-extrabold text-slate-900 block text-sm">{selectedAsset.name}</span>
              <span className="font-mono text-xs text-slate-500">
                Tag: <strong>{selectedAsset.asset_tag}</strong> • Serial: <strong>{selectedAsset.serial_number}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Employee Custodian *</label>
                <select
                  value={newAssignee}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewAssignee(val);
                    if (val === 'Rohan Mehta') setNewAssigneeRole('Associate Staff (Engineering)');
                    else if (val === 'Rahul Verma') setNewAssigneeRole('Team Manager');
                    else if (val === 'Ananya Sharma') setNewAssigneeRole('HR Director');
                    else if (val === 'Vikram Malhotra') setNewAssigneeRole('Sales Director');
                    else setNewAssigneeRole('Finance Controller');
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold"
                >
                  <option value="Rohan Mehta">Rohan Mehta (Associate Staff)</option>
                  <option value="Rahul Verma">Rahul Verma (Team Manager)</option>
                  <option value="Ananya Sharma">Ananya Sharma (HR Director)</option>
                  <option value="Vikram Malhotra">Vikram Malhotra (Sales Director)</option>
                  <option value="Pooja Desai">Pooja Desai (Finance Controller)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Designation / Role</label>
                <input
                  type="text"
                  disabled
                  value={newAssigneeRole}
                  className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Accessories Provided</label>
              <input
                type="text"
                value={handoverAccessories}
                onChange={(e) => setHandoverAccessories(e.target.value)}
                placeholder="e.g. 140W GaN Charger, USB-C Dongle, Laptop Sleeve"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Handover Notes / Inspection</label>
              <textarea
                rows={2}
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAllocateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/30"
              >
                Sign & Allocate Device
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: RETURN TO POOL MODAL */}
      {/* ---------------------------------------------------- */}
      <Modal isOpen={returnModalOpen} onClose={() => setReturnModalOpen(false)} title="Return Hardware Asset to Pool">
        {selectedAsset && (
          <form onSubmit={handleConfirmReturn} className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-extrabold text-slate-900 block text-sm">{selectedAsset.name}</span>
              <span className="font-mono text-xs text-slate-500">
                Current Custodian: <strong className="text-blue-700">{selectedAsset.assigned_to}</strong> ({selectedAsset.department})
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Physical Condition Upon Return</label>
              <select
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold"
              >
                <option value="Good (Minor Signs of Wear)">Good (Minor Signs of Wear)</option>
                <option value="Pristine / Like New">Pristine / Like New</option>
                <option value="Fair (Needs Cleaning)">Fair (Needs Cleaning)</option>
                <option value="Defective / Needs Repair">Defective / Needs Repair</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Return Notes / Reason</label>
              <textarea
                rows={2}
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="e.g. Reassigned upon sprint completion. Device sanitized and reset."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md"
              >
                Confirm Return to Pool
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ---------------------------------------------------- */}
      {/* MODAL 4: MAINTENANCE TICKET MODAL */}
      {/* ---------------------------------------------------- */}
      <Modal isOpen={maintenanceModalOpen} onClose={() => setMaintenanceModalOpen(false)} title="Log Asset Maintenance Ticket">
        <form onSubmit={handleCreateMaintenance} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Asset Tag *</label>
            <select
              value={maintAssetTag}
              onChange={(e) => setMaintAssetTag(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold"
            >
              <option value="">Select Asset to Service...</option>
              {assets.map((a) => (
                <option key={a.id} value={a.asset_tag}>
                  {a.asset_tag} — {a.name} ({a.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Issue Description *</label>
            <textarea
              required
              rows={2}
              value={maintIssue}
              onChange={(e) => setMaintIssue(e.target.value)}
              placeholder="e.g. Screen flickering when on battery power, trackpad haptic failing."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Service Vendor</label>
              <input
                type="text"
                value={maintVendor}
                onChange={(e) => setMaintVendor(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Estimated Cost (₹)</label>
              <input
                type="number"
                value={maintCost}
                onChange={(e) => setMaintCost(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Priority</label>
            <select
              value={maintPriority}
              onChange={(e) => setMaintPriority(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical (Blocking Ops)</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setMaintenanceModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
            >
              Log Ticket
            </button>
          </div>
        </form>
      </Modal>

      {/* ---------------------------------------------------- */}
      {/* MODAL 5: ADJUST STOCK MODAL */}
      {/* ---------------------------------------------------- */}
      <Modal isOpen={stockModalOpen} onClose={() => setStockModalOpen(false)} title="Adjust Stock Quantity">
        {selectedStockItem && (
          <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-extrabold text-slate-900 block text-sm">{selectedStockItem.name}</span>
              <span className="font-mono text-xs text-slate-500">
                SKU: <strong>{selectedStockItem.sku}</strong> • Current Qty: <strong className="text-blue-700">{selectedStockItem.quantity_on_hand} {selectedStockItem.uom}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Adjustment Action</label>
                <select
                  value={stockAdjustType}
                  onChange={(e) => setStockAdjustType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold"
                >
                  <option value="add">+ Add / Restock Stock</option>
                  <option value="deduct">- Deduct / Issue Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Units Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={stockAdjustQty}
                  onChange={(e) => setStockAdjustQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Reason / Reference</label>
              <input
                type="text"
                value={stockAdjustReason}
                onChange={(e) => setStockAdjustReason(e.target.value)}
                placeholder="e.g. Inward consignment from distributor PO-2026-089"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStockModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                Update Stock Ledger
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ---------------------------------------------------- */}
      {/* MODAL 6: CREATE MASTER PRODUCT/ITEM */}
      {/* ---------------------------------------------------- */}
      <Modal isOpen={itemModalOpen} onClose={() => setItemModalOpen(false)} title="Create Master Catalog Product / Item">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const newItem: ProductMasterItem = {
              id: `itm-${Date.now()}`,
              sku_code: newSku || `SKU-${Date.now().toString().slice(-6)}`,
              item_name: newItemName,
              hsn_code: newHsn,
              category: newItemCategory,
              uom: 'Units (Nos)',
              standard_cost: Number(newItemCost),
              selling_price: Number(newItemPrice),
              reorder_qty: Number(newItemReorder),
              barcode: `890${Date.now().toString().slice(-10)}`,
              supplier_ref: newItemSupplier,
            };
            setItems([newItem, ...items]);
            setItemModalOpen(false);
            emitEvent('item_master.created', 'Master Item Cataloged', `${newItem.sku_code} - ${newItem.item_name}`, 'success');
            showToast(`Product ${newItem.item_name} cataloged in master registry!`);
            setNewItemName('');
            setNewSku('');
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block text-slate-700 font-bold mb-1">Item / Product Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Logitech MX Mechanical Wireless Keyboard"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">SKU Code</label>
              <input
                type="text"
                placeholder="e.g. IT-KBD-MXMECH"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">HSN Code</label>
              <input
                type="text"
                value={newHsn}
                onChange={(e) => setNewHsn(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Standard Procurement Cost (₹)</label>
              <input
                type="number"
                value={newItemCost}
                onChange={(e) => setNewItemCost(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Reorder Threshold Qty</label>
              <input
                type="number"
                value={newItemReorder}
                onChange={(e) => setNewItemReorder(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setItemModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
            >
              Catalog Master Item
            </button>
          </div>
        </form>
      </Modal>

      {/* ---------------------------------------------------- */}
      {/* MODAL 7: CREATE PURCHASE REQUISITION */}
      {/* ---------------------------------------------------- */}
      <Modal isOpen={prModalOpen} onClose={() => setPrModalOpen(false)} title="New Department Purchase Requisition">
        <form onSubmit={handleCreatePR} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Item Requested & Specifications *</label>
            <input
              type="text"
              required
              placeholder="e.g. 5x 32-inch 4K Monitors for design team"
              value={prItemName}
              onChange={(e) => setPrItemName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Required Quantity</label>
              <input
                type="number"
                min={1}
                value={prQty}
                onChange={(e) => setPrQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Estimated Budget (₹)</label>
              <input
                type="number"
                value={prCost}
                onChange={(e) => setPrCost(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Urgency Priority</label>
            <select
              value={prUrgency}
              onChange={(e) => setPrUrgency(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold"
            >
              <option value="normal">Normal (Standard Procurement Cycle)</option>
              <option value="urgent">Urgent (Sprint Dependency)</option>
              <option value="critical">Critical (Blocking Client Delivery)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Business Justification *</label>
            <textarea
              required
              rows={2}
              value={prJustification}
              onChange={(e) => setPrJustification(e.target.value)}
              placeholder="Why this purchase is necessary for operational delivery..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPrModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
            >
              Submit for Approval
            </button>
          </div>
        </form>
      </Modal>

      {/* ---------------------------------------------------- */}
      {/* MODAL 8: ONBOARD VENDOR MODAL */}
      {/* ---------------------------------------------------- */}
      <Modal isOpen={vendorModalOpen} onClose={() => setVendorModalOpen(false)} title="Onboard Hardware Equipment Vendor">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const newVendor: Vendor = {
              id: `vnd-${Date.now()}`,
              vendor_code: `VND-SUP-${String(vendors.length + 5).padStart(2, '0')}`,
              name: (form.elements.namedItem('vName') as HTMLInputElement).value,
              contact_person: (form.elements.namedItem('vContact') as HTMLInputElement).value,
              email: (form.elements.namedItem('vEmail') as HTMLInputElement).value,
              phone: (form.elements.namedItem('vPhone') as HTMLInputElement).value,
              city: (form.elements.namedItem('vCity') as HTMLInputElement).value,
              gstin: (form.elements.namedItem('vGstin') as HTMLInputElement).value,
              payment_terms: 'Net 30 Days',
              rating: 5,
              active_orders: 1,
            };
            setVendors([newVendor, ...vendors]);
            setVendorModalOpen(false);
            emitEvent('vendor.onboarded', 'Vendor Onboarded', `${newVendor.name} added to suppliers register.`, 'success');
            showToast(`Vendor ${newVendor.name} onboarded!`);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block text-slate-700 font-bold mb-1">Vendor Enterprise Name *</label>
            <input
              name="vName"
              type="text"
              required
              placeholder="e.g. HP Commercial Direct India"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Contact Person</label>
              <input name="vContact" type="text" required placeholder="Account Director" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">GSTIN Number</label>
              <input name="vGstin" type="text" required placeholder="21AAACH1234F1Z1" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono uppercase" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Corporate Email</label>
              <input name="vEmail" type="email" required placeholder="sales@vendor.com" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
              <input name="vPhone" type="text" required placeholder="+91 80 4426 0000" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">City / Hub</label>
            <input name="vCity" type="text" required placeholder="Bhubaneswar / Bengaluru" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl" />
          </div>
          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button type="button" onClick={() => setVendorModalOpen(false)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold">Onboard Supplier</button>
          </div>
        </form>
      </Modal>

      {/* ---------------------------------------------------- */}
      {/* MODAL 9: CREATE GRN MODAL */}
      {/* ---------------------------------------------------- */}
      <Modal isOpen={grnModalOpen} onClose={() => setGrnModalOpen(false)} title="Create Goods Received Note (GRN)">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const newGrn: GoodsReceivedNote = {
              id: `grn-${Date.now()}`,
              grn_number: `GRN-2026-${String(grnList.length + 44).padStart(3, '0')}`,
              po_reference: (form.elements.namedItem('gPo') as HTMLInputElement).value,
              vendor_name: (form.elements.namedItem('gVendor') as HTMLSelectElement).value,
              inward_date: new Date().toISOString().split('T')[0],
              received_qty: Number((form.elements.namedItem('gRec') as HTMLInputElement).value),
              accepted_qty: Number((form.elements.namedItem('gAcc') as HTMLInputElement).value),
              rejected_qty: Number((form.elements.namedItem('gRej') as HTMLInputElement).value),
              inspector: user?.full_name || 'Warehouse QA Inspector',
              status: 'passed',
              notes: (form.elements.namedItem('gNotes') as HTMLInputElement).value || 'Physical consignment checked and verified.',
            };
            setGrnList([newGrn, ...grnList]);
            setGrnModalOpen(false);
            emitEvent('grn.created', 'Inward Consignment Received', `${newGrn.grn_number} booked in warehouse.`, 'success');
            showToast(`GRN ${newGrn.grn_number} logged successfully!`);
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">PO Reference *</label>
              <input name="gPo" type="text" required placeholder="PO-2026-095" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Vendor / Supplier</label>
              <select name="gVendor" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium">
                {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Received Qty</label>
              <input name="gRec" type="number" defaultValue={10} min={1} className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Accepted Qty</label>
              <input name="gAcc" type="number" defaultValue={10} min={0} className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold text-emerald-700" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Rejected Qty</label>
              <input name="gRej" type="number" defaultValue={0} min={0} className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold text-rose-600" />
            </div>
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Quality Inspection Notes</label>
            <input name="gNotes" type="text" placeholder="Package seals intact, barcode verification successful." className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl" />
          </div>
          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button type="button" onClick={() => setGrnModalOpen(false)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Confirm & Inward</button>
          </div>
        </form>
      </Modal>

      {/* ---------------------------------------------------- */}
      {/* MODAL 10: INITIATE STOCK TRANSFER MODAL */}
      {/* ---------------------------------------------------- */}
      <Modal isOpen={transferModalOpen} onClose={() => setTransferModalOpen(false)} title="Initiate Inter-Facility Stock Transfer">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const newTransfer: StockTransfer = {
              id: `st-${Date.now()}`,
              transfer_number: `ST-2026-${String(transfers.length + 16).padStart(3, '0')}`,
              from_warehouse: (form.elements.namedItem('stFrom') as HTMLSelectElement).value,
              to_warehouse: (form.elements.namedItem('stTo') as HTMLSelectElement).value,
              item_name: (form.elements.namedItem('stItem') as HTMLInputElement).value,
              quantity: Number((form.elements.namedItem('stQty') as HTMLInputElement).value),
              dispatch_date: new Date().toISOString().split('T')[0],
              carrier: (form.elements.namedItem('stCarrier') as HTMLInputElement).value,
              tracking_number: `TRK-${Date.now().toString().slice(-8)}`,
              status: 'in_transit',
            };
            setTransfers([newTransfer, ...transfers]);
            setTransferModalOpen(false);
            emitEvent('stock.transferred', 'Inter-Branch Transfer Dispatched', `${newTransfer.transfer_number} to ${newTransfer.to_warehouse}`, 'info');
            showToast(`Transfer ${newTransfer.transfer_number} dispatched!`);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block text-slate-700 font-bold mb-1">Item to Transfer *</label>
            <input name="stItem" type="text" required placeholder="e.g. Dell XPS 15 (16GB RAM) or 1TB NVMe SSDs" className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl font-bold" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Origin Facility</label>
              <select name="stFrom" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium">
                <option value="Bhubaneswar Central IT Vault">Bhubaneswar Central IT Vault</option>
                <option value="Mumbai Tech Centre">Mumbai Tech Centre</option>
                <option value="Delhi NCR Satellite Office">Delhi NCR Satellite Office</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Destination Facility</label>
              <select name="stTo" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium">
                <option value="Mumbai Tech Centre (BKC Office)">Mumbai Tech Centre (BKC Office)</option>
                <option value="Delhi NCR Satellite Office">Delhi NCR Satellite Office</option>
                <option value="Bhubaneswar Central IT Vault">Bhubaneswar Central IT Vault</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Units Quantity</label>
              <input name="stQty" type="number" defaultValue={5} min={1} className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Logistics / Courier Partner</label>
              <input name="stCarrier" type="text" defaultValue="BlueDart Air Express" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl" />
            </div>
          </div>
          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button type="button" onClick={() => setTransferModalOpen(false)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold">Dispatch Consignment</button>
          </div>
        </form>
      </Modal>

      {/* ---------------------------------------------------- */}
      {/* MODAL 11: VIEW ASSET DOSSIER */}
      {/* ---------------------------------------------------- */}
      <Modal isOpen={!!viewAssetDossier} onClose={() => setViewAssetDossier(null)} title="Capital Asset Hardware Dossier">
        {viewAssetDossier && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-blue-400 font-bold block">{viewAssetDossier.asset_tag}</span>
                <h3 className="font-extrabold text-base text-white mt-0.5">{viewAssetDossier.name}</h3>
                <span className="text-[11px] text-slate-400 font-mono">Serial: {viewAssetDossier.serial_number}</span>
              </div>
              <StatusBadge status={viewAssetDossier.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 font-mono">
              <div>Category: <strong className="capitalize text-slate-900">{viewAssetDossier.category}</strong></div>
              <div>Capital Value: <strong className="text-slate-900">₹{viewAssetDossier.cost.toLocaleString('en-IN')}</strong></div>
              <div>Condition: <strong className="text-emerald-700">{viewAssetDossier.condition}</strong></div>
              <div>Location: <strong className="text-slate-900">{viewAssetDossier.location}</strong></div>
              <div>Purchased: <strong className="text-slate-900">{viewAssetDossier.purchase_date}</strong></div>
              <div>Warranty Until: <strong className="text-blue-700">{viewAssetDossier.warranty_expiry}</strong></div>
              <div>Department: <strong className="text-slate-900">{viewAssetDossier.department}</strong></div>
              <div>Custodian: <strong className="text-blue-700">{viewAssetDossier.assigned_to || 'Unassigned (Pool)'}</strong></div>
            </div>

            {viewAssetDossier.notes && (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-slate-700">
                <span className="font-bold block text-blue-900 mb-0.5">Asset Notes:</span>
                <p className="font-medium">{viewAssetDossier.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewAssetDossier(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AssetsPage;
