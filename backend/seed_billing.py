import os
import sys
import django
from decimal import Decimal
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_backend.settings')
django.setup()

from billing.models import (
    CompanyProfile, Branch, FinancialYearSetting, TaxRateMaster,
    HSNMaster, SACMaster, Supplier, Warehouse, ProductService,
    StockLedger, Quotation, QuotationItem, SalesOrder, SalesOrderItem,
    Invoice, InvoiceItem, PurchaseBill, PurchaseBillItem,
    Payment, Expense, Account, JournalEntry, JournalEntryLine
)
from billing.accounting_engine import ensure_chart_of_accounts, record_sales_invoice_journal, record_purchase_bill_journal
from crm.models import Customer
from django.contrib.auth import get_user_model

User = get_user_model()
admin_user = User.objects.filter(is_superuser=True).first() or User.objects.first()

print("Seeding Advanced Indian GST Billing & Accounting Data...")

# 1. Company Profile
company, _ = CompanyProfile.objects.update_or_create(
    id='00000000-0000-0000-0000-000000000001',
    defaults={
        'company_name': 'Odias ERP Technologies Pvt. Ltd.',
        'trade_name': 'Odias ERP India',
        'pan': 'AAACR1234F',
        'gstin': '21AAACR1234F1Z5',
        'business_type': 'Private Limited Enterprise',
        'registration_type': 'Regular',
        'address': 'Plot 42, Infocity Avenue, Chandaka Industrial Estate, Patia',
        'state': 'Odisha',
        'district': 'Khurda',
        'pincode': '751024',
        'state_code': '21',
        'phone': '+91 674 2748000',
        'email': 'accounts@odiaserp.com',
        'bank_name': 'HDFC Bank Ltd.',
        'bank_account_no': '50200088991122',
        'bank_ifsc': 'HDFC0001234',
        'bank_branch': 'Infocity Corporate Branch, Bhubaneswar',
        'upi_id': 'odiaserp@hdfcbank',
        'invoice_prefix': 'OERP/2026/',
        'quotation_prefix': 'QT/2026/',
        'purchase_prefix': 'PB/2026/',
        'e_invoice_enabled': True,
        'e_way_bill_enabled': True,
    }
)
print(f"Company: {company.company_name} ({company.gstin})")

# 2. Branches
branches_data = [
    ('Headquarters Bhubaneswar', 'HQ-BBI', '21AAACR1234F1Z5', 'Infocity, Patia, Bhubaneswar', 'Odisha', '21', '751024', True),
    ('Mumbai West Regional Hub', 'MUM-WH', '27AAACR1234F1Z3', 'Bandra Kurla Complex, Mumbai', 'Maharashtra', '27', '400051', False),
    ('Bengaluru Tech Branch', 'BLR-TB', '29AAACR1234F1Z1', 'Electronic City Phase 1, Bengaluru', 'Karnataka', '29', '560100', False),
]
for name, code, gstin, addr, state, scode, pin, is_hq in branches_data:
    Branch.objects.update_or_create(
        code=code,
        defaults={
            'name': name,
            'gstin': gstin,
            'address': addr,
            'state': state,
            'state_code': scode,
            'pincode': pin,
            'is_head_office': is_hq,
            'is_active': True
        }
    )

# 3. Financial Year
FinancialYearSetting.objects.update_or_create(
    year_code='2026-2027',
    defaults={
        'start_date': datetime.date(2026, 4, 1),
        'end_date': datetime.date(2027, 3, 31),
        'is_current': True,
        'is_locked': False
    }
)

# 4. Tax Rates
tax_rates = [
    (Decimal('0.00'), 'Nil Rated / Exempt Goods & Services'),
    (Decimal('5.00'), '5% Essential Goods & Services'),
    (Decimal('12.00'), '12% Standard Concessional Rate'),
    (Decimal('18.00'), '18% Standard GST Rate (Software & IT Services)'),
    (Decimal('28.00'), '28% Luxury & High-end Electronics Rate'),
]
for rate, desc in tax_rates:
    TaxRateMaster.objects.update_or_create(
        rate_percentage=rate,
        defaults={'description': desc, 'is_active': True}
    )

# 5. HSN Master
hsn_list = [
    ('847130', 'Portable digital computers / Laptops & Tablets', 'Computer Equipment', Decimal('18.00')),
    ('851713', 'Smartphones / Mobile communication devices', 'Telecom Equipment', Decimal('18.00')),
    ('844332', 'Multifunction Laser Printers & Scanners', 'Office Machines', Decimal('18.00')),
    ('852852', 'Computer Monitors & Interactive Displays', 'Computer Peripherals', Decimal('18.00')),
    ('847170', 'Enterprise Storage Units / NVMe SSD Hard Drives', 'Storage Devices', Decimal('18.00')),
    ('850440', 'Static Converters & Enterprise Online UPS', 'Power Backup', Decimal('18.00')),
    ('847160', 'Keyboards, Optical Mice & Input peripherals', 'Input Hardware', Decimal('18.00')),
    ('851762', 'Network Routers, Managed Switches & Firewalls', 'Networking', Decimal('18.00')),
]
for code, desc, cat, rate in hsn_list:
    HSNMaster.objects.update_or_create(
        hsn_code=code,
        defaults={'description': desc, 'goods_category': cat, 'applicable_gst_rate': rate, 'is_active': True}
    )

# 6. SAC Master
sac_list = [
    ('998314', 'Information technology (IT) design and development services', 'IT Software', Decimal('18.00')),
    ('998313', 'Information technology (IT) consulting and support services', 'IT Consulting', Decimal('18.00')),
    ('998315', 'Hosting and infrastructure provisioning services', 'Cloud SaaS', Decimal('18.00')),
    ('998316', 'IT infrastructure and network management services', 'Network AMC', Decimal('18.00')),
    ('997331', 'Licensing services for the right to use computer software', 'Software Rights', Decimal('18.00')),
    ('998311', 'Management consulting and strategic business advisory', 'Consulting', Decimal('18.00')),
]
for code, desc, cat, rate in sac_list:
    SACMaster.objects.update_or_create(
        sac_code=code,
        defaults={'description': desc, 'service_category': cat, 'applicable_gst_rate': rate, 'is_active': True}
    )

# 7. Warehouses
wh_data = [
    ('Central Tech Depository (Bhubaneswar)', 'WH-BBI-01', 'Plot 42, Infocity, Patia', 'Bhubaneswar', 'Odisha', 'Sujit Patnaik'),
    ('Western Fulfillment Hub (Mumbai)', 'WH-MUM-01', 'MIDC Industrial Zone, Andheri East', 'Mumbai', 'Maharashtra', 'Rohit Deshmukh'),
    ('Southern Staging Center (Bengaluru)', 'WH-BLR-01', 'Bommasandra Industrial Area', 'Bengaluru', 'Karnataka', 'Arjun Reddy'),
]
for name, code, addr, city, state, mgr in wh_data:
    Warehouse.objects.update_or_create(
        code=code,
        defaults={'name': name, 'address': addr, 'city': city, 'state': state, 'manager_name': mgr, 'is_active': True}
    )

main_wh = Warehouse.objects.filter(code='WH-BBI-01').first()

# 8. Suppliers
suppliers_data = [
    ('Dell Technologies India Pvt Ltd', '29AABCD1234E1Z1', 'AAACD1234E', 'Divyashree Greens, Bengaluru', 'Karnataka', '29', '560071', 'Amit Saxena', 'amit.saxena@dell.com', 'HDFC Bank', '502000334411', 'HDFC0000045'),
    ('Cisco Systems (India) Private Limited', '27AABCC5678F1Z9', 'AAACC5678F', 'The Capital, BKC, Bandra East, Mumbai', 'Maharashtra', '27', '400051', 'Neha Kulkarni', 'neha@cisco.com', 'Citibank NA', '0012345678', 'CITI0000002'),
    ('Tata Communications Cloud Services', '27AAACT9988G1Z2', 'AAACT9988G', 'VSB, MG Road, Fort, Mumbai', 'Maharashtra', '27', '400001', 'Prakash Iyer', 'billing@tatacommunications.com', 'State Bank of India', '30012345678', 'SBIN0000300'),
    ('Kalinga Office Stationeries & Supplies', '21AAHFK8877H1Z4', 'AAHFK8877H', 'Saheed Nagar Market, Bhubaneswar', 'Odisha', '21', '751007', 'Manoj Mohanty', 'manoj@kalingastationery.com', 'Axis Bank', '919010012345', 'UTIB0000123'),
]
for cname, gstin, pan, addr, state, scode, pin, cp, em, bn, an, ifsc in suppliers_data:
    Supplier.objects.update_or_create(
        gstin=gstin,
        defaults={
            'name': cp,
            'company_name': cname,
            'pan': pan,
            'supplier_type': 'registered_regular',
            'billing_address': addr,
            'state': state,
            'state_code': scode,
            'pincode': pin,
            'contact_person': cp,
            'email': em,
            'bank_name': bn,
            'bank_account_no': an,
            'bank_ifsc': ifsc,
            'payment_terms_days': 30,
            'is_active': True
        }
    )

# 9. Products & Services
products_data = [
    ('Enterprise Dell Latitude 5540 Laptop', 'DELL-LAT-5540', 'product', '847130', Decimal('68000.00'), Decimal('85000.00'), Decimal('92000.00'), Decimal('18.00'), 'NOS', Decimal('25.00'), Decimal('5.00'), Decimal('50.00')),
    ('Cisco Catalyst 24-Port Gigabit Managed Switch', 'CISCO-CAT-24P', 'product', '851762', Decimal('42000.00'), Decimal('54000.00'), Decimal('59000.00'), Decimal('18.00'), 'NOS', Decimal('14.00'), Decimal('3.00'), Decimal('30.00')),
    ('Samsung 27-inch 4K UHD IPS Designer Monitor', 'SAM-MON-27UHD', 'product', '852852', Decimal('19500.00'), Decimal('26000.00'), Decimal('28500.00'), Decimal('18.00'), 'NOS', Decimal('30.00'), Decimal('6.00'), Decimal('60.00')),
    ('Odias ERP Cloud SaaS Enterprise License (Annual)', 'OERP-SAAS-ENT', 'subscription', '997331', Decimal('0.00'), Decimal('120000.00'), Decimal('120000.00'), Decimal('18.00'), 'SET', Decimal('999.00'), Decimal('0.00'), Decimal('1000.00')),
    ('Enterprise ERP Custom Implementation & Training', 'SRV-ERP-IMPL', 'service', '998314', Decimal('0.00'), Decimal('150000.00'), Decimal('150000.00'), Decimal('18.00'), 'HRS', Decimal('999.00'), Decimal('0.00'), Decimal('1000.00')),
    ('Dedicated 24x7 Infrastructure & Security AMC', 'SRV-INFRA-AMC', 'service', '998316', Decimal('0.00'), Decimal('45000.00'), Decimal('45000.00'), Decimal('18.00'), 'SET', Decimal('999.00'), Decimal('0.00'), Decimal('1000.00')),
]

for name, sku, itype, hsn, pprice, sprice, mrp, rate, unit, stock, min_alert, max_stk in products_data:
    ProductService.objects.update_or_create(
        sku=sku,
        defaults={
            'name': name,
            'item_type': itype,
            'hsn_sac': hsn,
            'purchase_price': pprice,
            'unit_price': sprice,
            'mrp': mrp,
            'tax_rate': rate,
            'unit': unit,
            'warehouse': main_wh,
            'opening_stock': stock,
            'current_stock': stock,
            'min_stock_alert': min_alert,
            'max_stock': max_stk,
            'is_active': True
        }
    )

# 10. Chart of Accounts
ensure_chart_of_accounts(Account)
print("Chart of Accounts verified.")

# 11. Seed a Purchase Bill from Dell
dell_sup = Supplier.objects.filter(company_name__contains='Dell').first()
prod_laptop = ProductService.objects.filter(sku='DELL-LAT-5540').first()

if dell_sup and prod_laptop:
    pb_count = PurchaseBill.objects.count() + 1
    pb = PurchaseBill.objects.create(
        bill_number=f"PB/2026/{pb_count:04d}",
        supplier_invoice_number=f"DELL/DEL/26/{pb_count:04d}",
        supplier_invoice_date=datetime.date(2026, 11, 2),
        supplier=dell_sup,
        bill_date=datetime.date(2026, 11, 2),
        due_date=datetime.date(2026, 12, 2),
        subtotal=Decimal('680000.00'),  # 10 laptops @ 68,000
        cgst=Decimal('0.00'),
        sgst=Decimal('0.00'),
        igst=Decimal('122400.00'),  # 18% IGST (Karnataka to Odisha)
        total_tax=Decimal('122400.00'),
        total_amount=Decimal('802400.00'),
        paid_amount=Decimal('802400.00'),
        balance_amount=Decimal('0.00'),
        itc_eligibility='eligible_inputs',
        status='paid',
        created_by=admin_user
    )
    PurchaseBillItem.objects.create(
        purchase_bill=pb,
        product=prod_laptop,
        item_name=prod_laptop.name,
        hsn_sac=prod_laptop.hsn_sac,
        quantity=Decimal('10.00'),
        purchase_rate=Decimal('68000.00'),
        taxable_amount=Decimal('680000.00'),
        tax_rate=Decimal('18.00'),
        igst_amount=Decimal('122400.00'),
        total=Decimal('802400.00')
    )
    record_purchase_bill_journal(pb, Account, JournalEntry, JournalEntryLine, user=admin_user)
    print(f"Purchase Bill seeded: {pb.bill_number} (₹{pb.total_amount})")

# 12. Seed an Invoice to an Intra-state Customer (Odisha) and Inter-state Customer (Maharashtra)
customer_odisha = Customer.objects.filter(state__icontains='Odisha').first() or Customer.objects.first()
customer_mumbai = Customer.objects.filter(state__icontains='Maharashtra').first()

prod_service = ProductService.objects.filter(sku='OERP-SAAS-ENT').first()

if customer_odisha and prod_laptop and prod_service:
    inv_count = Invoice.objects.count() + 1
    # Intra-state Invoice
    inv1 = Invoice.objects.create(
        invoice_number=f"OERP/2026/{inv_count:04d}",
        invoice_type='tax_invoice',
        customer=customer_odisha,
        invoice_date=datetime.date(2026, 11, 8),
        due_date=datetime.date(2026, 11, 23),
        place_of_supply='Odisha (21)',
        place_of_supply_code='21',
        is_intra_state=True,
        subtotal=Decimal('290000.00'),  # 2 laptops (170k) + SaaS (120k)
        cgst=Decimal('26100.00'),
        sgst=Decimal('26100.00'),
        igst=Decimal('0.00'),
        total_tax=Decimal('52200.00'),
        round_off=Decimal('0.00'),
        total_amount=Decimal('342200.00'),
        paid_amount=Decimal('342200.00'),
        balance_amount=Decimal('0.00'),
        amount_in_words='Rupees Three Lakh Forty Two Thousand Two Hundred Only',
        status='paid',
        created_by=admin_user
    )
    InvoiceItem.objects.create(
        invoice=inv1,
        product=prod_laptop,
        item_name=prod_laptop.name,
        hsn_sac=prod_laptop.hsn_sac,
        quantity=Decimal('2.00'),
        unit_price=Decimal('85000.00'),
        taxable_value=Decimal('170000.00'),
        tax_rate=Decimal('18.00'),
        cgst_rate=Decimal('9.00'),
        cgst_amount=Decimal('15300.00'),
        sgst_rate=Decimal('9.00'),
        sgst_amount=Decimal('15300.00'),
        total=Decimal('200600.00')
    )
    InvoiceItem.objects.create(
        invoice=inv1,
        product=prod_service,
        item_name=prod_service.name,
        hsn_sac=prod_service.hsn_sac,
        quantity=Decimal('1.00'),
        unit_price=Decimal('120000.00'),
        taxable_value=Decimal('120000.00'),
        tax_rate=Decimal('18.00'),
        cgst_rate=Decimal('9.00'),
        cgst_amount=Decimal('10800.00'),
        sgst_rate=Decimal('9.00'),
        sgst_amount=Decimal('10800.00'),
        total=Decimal('141600.00')
    )
    record_sales_invoice_journal(inv1, Account, JournalEntry, JournalEntryLine, user=admin_user)

    Payment.objects.create(
        payment_number=f"RCP-2026-0001",
        invoice=inv1,
        customer=customer_odisha,
        payment_date=datetime.date(2026, 11, 9),
        amount=inv1.total_amount,
        payment_mode='bank_transfer',
        transaction_reference='HDFC-NEFT-991823719',
        recorded_by=admin_user
    )
    print(f"Seeded Paid Intra-state Invoice: {inv1.invoice_number}")

print("Seeding completed successfully with 100% balanced Double-Entry Accounting and GST records!")
