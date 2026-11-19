from django.db import models
from django.conf import settings
from crm.models import Customer, Opportunity
import uuid
from decimal import Decimal


# ==========================================
# 1. SETTINGS & STATUTORY MASTERS
# ==========================================

class CompanyProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company_name = models.CharField(max_length=200, default='Odias ERP Technologies Pvt. Ltd.')
    trade_name = models.CharField(max_length=200, blank=True, default='Odias ERP')
    logo_url = models.TextField(blank=True, default='')
    favicon_url = models.TextField(blank=True, default='')
    company_photo_url = models.TextField(blank=True, default='')
    signature_url = models.TextField(blank=True, default='')
    stamp_url = models.TextField(blank=True, default='')
    pan = models.CharField(max_length=15, default='AAACR1234F')
    gstin = models.CharField(max_length=20, default='21AAACR1234F1Z5')
    business_type = models.CharField(max_length=100, default='Private Limited Company')
    registration_type = models.CharField(max_length=50, default='Regular')  # Regular, Composition, SEZ
    address = models.TextField(default='LaxmiSager, Bhubaneswar, Odisha - 751024')
    state = models.CharField(max_length=100, default='Odisha')
    district = models.CharField(max_length=100, default='Khurda')
    pincode = models.CharField(max_length=10, default='751024')
    state_code = models.CharField(max_length=5, default='21')
    phone = models.CharField(max_length=20, default='+91 1234567890')
    email = models.EmailField(default='accounts@odiaserp.com')
    website = models.CharField(max_length=200, blank=True, default='https://odiaserp.com')
    
    # Banking & UPI
    bank_name = models.CharField(max_length=100, default='HDFC Bank Ltd.')
    bank_account_no = models.CharField(max_length=50, default='50200088991122')
    bank_ifsc = models.CharField(max_length=20, default='HDFC0001234')
    bank_branch = models.CharField(max_length=100, default='Bhubaneswar Main Branch')
    upi_id = models.CharField(max_length=100, default='odiaserp@hdfcbank')
    upi_qr_url = models.CharField(max_length=500, blank=True, default='')
    
    # Invoice series & defaults
    invoice_prefix = models.CharField(max_length=20, default='OERP/2026/')
    quotation_prefix = models.CharField(max_length=20, default='QT/2026/')
    purchase_prefix = models.CharField(max_length=20, default='PB/2026/')
    credit_note_prefix = models.CharField(max_length=20, default='CN/2026/')
    debit_note_prefix = models.CharField(max_length=20, default='DN/2026/')
    default_terms = models.TextField(
        default='1. Subject to Bhubaneswar jurisdiction.\n'
                '2. Interest @ 18% p.a. charged after due date.\n'
                '3. Goods once sold will not be returned without authorized credit note.'
    )
    is_rcm_applicable = models.BooleanField(default=False)
    e_invoice_enabled = models.BooleanField(default=False)
    e_invoice_username = models.CharField(max_length=100, blank=True, default='')
    e_way_bill_enabled = models.BooleanField(default=False)
    e_way_bill_username = models.CharField(max_length=100, blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.company_name} ({self.gstin})"


class Branch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=20, unique=True)
    gstin = models.CharField(max_length=20, blank=True, default='')
    address = models.TextField()
    state = models.CharField(max_length=100, default='Odisha')
    state_code = models.CharField(max_length=5, default='21')
    pincode = models.CharField(max_length=10, default='751024')
    phone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    is_head_office = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code}) - {self.state}"


class FinancialYearSetting(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    year_code = models.CharField(max_length=20, unique=True)  # e.g. '2026-2027'
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=True)
    is_locked = models.BooleanField(default=False)

    def __str__(self):
        return self.year_code


class TaxRateMaster(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rate_percentage = models.DecimalField(max_digits=5, decimal_places=2, unique=True)  # 0.00, 5.00, 12.00, 18.00, 28.00
    cess_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    description = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.rate_percentage}% GST"


class HSNMaster(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hsn_code = models.CharField(max_length=20, unique=True)
    description = models.TextField()
    goods_category = models.CharField(max_length=150, default='General Goods')
    applicable_gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.0)
    cess_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    effective_from = models.DateField(null=True, blank=True)
    effective_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.hsn_code} - {self.description[:40]}"


class SACMaster(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sac_code = models.CharField(max_length=20, unique=True)
    description = models.TextField()
    service_category = models.CharField(max_length=150, default='Information Technology & Services')
    applicable_gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.0)
    cess_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    effective_from = models.DateField(null=True, blank=True)
    effective_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.sac_code} - {self.description[:40]}"


# ==========================================
# 2. CONTACTS: SUPPLIER (CUSTOMERS ARE IN CRM)
# ==========================================

class Supplier(models.Model):
    SUPPLIER_TYPE_CHOICES = [
        ('registered_regular', 'Registered Regular'),
        ('registered_composition', 'Registered Composition'),
        ('unregistered', 'Unregistered'),
        ('overseas_import', 'Overseas / Import'),
        ('sez_supplier', 'SEZ Supplier'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    company_name = models.CharField(max_length=200)
    gstin = models.CharField(max_length=20, blank=True, default='')
    pan = models.CharField(max_length=15, blank=True, default='')
    supplier_type = models.CharField(max_length=40, choices=SUPPLIER_TYPE_CHOICES, default='registered_regular')
    billing_address = models.TextField(default='')
    state = models.CharField(max_length=100, default='Odisha')
    state_code = models.CharField(max_length=5, default='21')
    pincode = models.CharField(max_length=10, blank=True, default='')
    mobile = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    contact_person = models.CharField(max_length=100, blank=True, default='')
    
    # Banking & Terms
    bank_name = models.CharField(max_length=100, blank=True, default='')
    bank_account_no = models.CharField(max_length=50, blank=True, default='')
    bank_ifsc = models.CharField(max_length=20, blank=True, default='')
    payment_terms_days = models.IntegerField(default=30)
    opening_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    current_outstanding = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['company_name']

    def __str__(self):
        return f"{self.company_name} ({self.gstin or 'Unregistered'})"


# ==========================================
# 3. WAREHOUSES & PRODUCTS/SERVICES
# ==========================================

class Warehouse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=30, unique=True)
    address = models.TextField()
    city = models.CharField(max_length=100, default='Bhubaneswar')
    state = models.CharField(max_length=100, default='Odisha')
    manager_name = models.CharField(max_length=100, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class ProductService(models.Model):
    TYPE_CHOICES = [
        ('service', 'Service'),
        ('product', 'Physical Product'),
        ('subscription', 'Software / SaaS Subscription'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sku = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    barcode = models.CharField(max_length=50, blank=True, default='')
    category = models.CharField(max_length=100, default='General')
    subcategory = models.CharField(max_length=100, blank=True, default='')
    brand = models.CharField(max_length=100, blank=True, default='In-House')
    image_url = models.CharField(max_length=500, blank=True, default='')
    description = models.TextField(blank=True, default='')
    item_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='product')
    
    # HSN / SAC
    hsn_sac = models.CharField(max_length=20, default='847130')  # Default IT hardware or software
    hsn_ref = models.ForeignKey(HSNMaster, on_delete=models.SET_NULL, null=True, blank=True)
    sac_ref = models.ForeignKey(SACMaster, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Pricing
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)  # Selling price
    mrp = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    min_selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    default_discount = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)  # in %
    max_discount_allowed = models.DecimalField(max_digits=5, decimal_places=2, default=25.0)
    
    # GST Rates
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.0)
    cess_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    is_tax_inclusive = models.BooleanField(default=False)
    
    # Stock & Inventory (for physical products)
    unit = models.CharField(max_length=20, default='NOS')  # NOS, PCS, KGS, MTR, BOX, SET, HRS
    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True, blank=True)
    opening_stock = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    current_stock = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    min_stock_alert = models.DecimalField(max_digits=12, decimal_places=2, default=5.0)
    max_stock = models.DecimalField(max_digits=12, decimal_places=2, default=1000.0)
    reorder_level = models.DecimalField(max_digits=12, decimal_places=2, default=10.0)
    
    batch_number = models.CharField(max_length=50, blank=True, default='')
    serial_number = models.CharField(max_length=50, blank=True, default='')
    expiry_date = models.DateField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.sku}) - ₹{self.unit_price}"


# ==========================================
# 4. INVENTORY MOVEMENTS & STOCK LEDGER
# ==========================================

class StockLedger(models.Model):
    TX_TYPE_CHOICES = [
        ('purchase', 'Purchase Bill Inward'),
        ('sales', 'Sales Invoice Outward'),
        ('sales_return', 'Sales Return Credit Inward'),
        ('purchase_return', 'Purchase Return Debit Outward'),
        ('adjustment_add', 'Stock Adjustment Addition'),
        ('adjustment_sub', 'Stock Adjustment Deduction'),
        ('transfer_in', 'Warehouse Transfer In'),
        ('transfer_out', 'Warehouse Transfer Out'),
        ('opening', 'Opening Stock Entry'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(ProductService, on_delete=models.CASCADE, related_name='stock_movements')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True, blank=True)
    transaction_type = models.CharField(max_length=30, choices=TX_TYPE_CHOICES)
    reference_number = models.CharField(max_length=60)  # e.g. INV-2026-0001, PB-2026-0002
    quantity = models.DecimalField(max_digits=12, decimal_places=2)  # positive for in, negative for out
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    balance_stock_after = models.DecimalField(max_digits=12, decimal_places=2)
    remarks = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.product.name} ({self.transaction_type}: {self.quantity}) -> Bal: {self.balance_stock_after}"


class StockAdjustment(models.Model):
    ADJ_TYPE_CHOICES = [
        ('add', 'Add Inventory Stock'),
        ('subtract', 'Deduct / Write Off Stock'),
        ('damaged', 'Damaged Goods'),
        ('expired', 'Expired Goods'),
        ('theft_loss', 'Theft or Shrinkage'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(ProductService, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    adjustment_type = models.CharField(max_length=30, choices=ADJ_TYPE_CHOICES)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField()
    adjusted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class StockTransfer(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Dispatch'),
        ('in_transit', 'In Transit'),
        ('completed', 'Completed & Received'),
        ('cancelled', 'Cancelled'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transfer_number = models.CharField(max_length=50, unique=True)
    from_warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='transfers_out')
    to_warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='transfers_in')
    product = models.ForeignKey(ProductService, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


# ==========================================
# 5. SALES & INVOICING
# ==========================================

class Quotation(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent to Customer'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('converted', 'Converted to Invoice'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quotation_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='quotations')
    opportunity = models.ForeignKey(Opportunity, on_delete=models.SET_NULL, null=True, blank=True, related_name='quotations')
    quotation_date = models.DateField()
    valid_until = models.DateField()
    
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True, default='Thank you for your business.')
    terms = models.TextField(blank=True, default='1. Validity: 30 days from date of issue.\n2. Payment terms: 50% advance, 50% upon delivery.')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.quotation_number} - {self.customer.company_name} (₹{self.total_amount})"


class QuotationItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(ProductService, on_delete=models.SET_NULL, null=True, blank=True)
    item_name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    hsn_sac = models.CharField(max_length=20, default='998314')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1.0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    discount_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)


class SalesOrder(models.Model):
    STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing / In Production'),
        ('partially_delivered', 'Partially Delivered'),
        ('delivered', 'Delivered'),
        ('invoiced', 'Fully Invoiced'),
        ('cancelled', 'Cancelled'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='sales_orders')
    quotation = models.ForeignKey(Quotation, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales_orders')
    order_date = models.DateField()
    expected_delivery_date = models.DateField(null=True, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='confirmed')
    delivery_address = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-order_date']

    def __str__(self):
        return f"{self.order_number} - {self.customer.company_name} (₹{self.total_amount})"


class SalesOrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(ProductService, on_delete=models.SET_NULL, null=True, blank=True)
    item_name = models.CharField(max_length=200)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1.0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)


class Invoice(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_approval', 'Pending Approval'),
        ('issued', 'Issued'),
        ('partially_paid', 'Partially Paid'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    INVOICE_TYPE_CHOICES = [
        ('tax_invoice', 'Tax Invoice (Regular B2B/B2C)'),
        ('export_with_pay', 'Export with Payment of GST'),
        ('export_without_pay', 'Export under LUT / Bond'),
        ('sez_with_pay', 'SEZ with Payment of GST'),
        ('sez_without_pay', 'SEZ under LUT'),
        ('deemed_export', 'Deemed Export'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True)
    invoice_type = models.CharField(max_length=30, choices=INVOICE_TYPE_CHOICES, default='tax_invoice')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='invoices')
    quotation = models.ForeignKey(Quotation, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    invoice_date = models.DateField()
    due_date = models.DateField()
    
    # GST Locations
    place_of_supply = models.CharField(max_length=100, default='Odisha (21)')
    place_of_supply_code = models.CharField(max_length=5, default='21')
    is_intra_state = models.BooleanField(default=True)
    is_rcm = models.BooleanField(default=False)
    
    # Financials
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    cgst = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    sgst = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    utgst = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    igst = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    cess_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    shipping_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    packaging_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    round_off = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    balance_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    
    amount_in_words = models.CharField(max_length=300, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True, default='Payment is due within 15 days.')
    terms = models.TextField(blank=True, default='Goods/Services once sold will not be returned without authorization.')
    
    # E-Invoice & E-Way Bill fields
    irn = models.CharField(max_length=100, blank=True, default='')
    ack_no = models.CharField(max_length=50, blank=True, default='')
    ack_date = models.DateTimeField(null=True, blank=True)
    signed_qr_code = models.TextField(blank=True, default='')
    eway_bill_no = models.CharField(max_length=50, blank=True, default='')
    is_e_invoiced = models.BooleanField(default=False)
    is_eway_bill_generated = models.BooleanField(default=False)
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-invoice_date', '-created_at']

    def __str__(self):
        return f"{self.invoice_number} - {self.customer.company_name} (₹{self.total_amount})"


class InvoiceItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(ProductService, on_delete=models.SET_NULL, null=True, blank=True)
    item_name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    hsn_sac = models.CharField(max_length=20, default='998314')
    unit = models.CharField(max_length=20, default='NOS')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1.0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    discount_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    taxable_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    cgst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=9.0)
    cgst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    sgst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=9.0)
    sgst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    igst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    igst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    cess_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    cess_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)


class CreditNote(models.Model):
    REASON_CHOICES = [
        ('sales_return', 'Sales Return / Rejection'),
        ('post_sale_discount', 'Post-Sale Discount / Rebate'),
        ('deficiency_in_service', 'Deficiency in Service / Quality'),
        ('correction_in_invoice', 'Correction in Invoice / Tax error'),
        ('other', 'Other Commercial Adjustment'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_note_number = models.CharField(max_length=50, unique=True)
    original_invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='credit_notes')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='credit_notes')
    credit_note_date = models.DateField()
    reason = models.CharField(max_length=40, choices=REASON_CHOICES, default='sales_return')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    cgst = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    sgst = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    igst = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    status = models.CharField(max_length=20, default='issued')  # draft, issued, cancelled
    remarks = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.credit_note_number} (Ref: {self.original_invoice.invoice_number}) - ₹{self.total_amount}"


class DebitNote(models.Model):
    REASON_CHOICES = [
        ('supplementary_charge', 'Supplementary / Price Escalation'),
        ('interest_on_delayed_pay', 'Interest on Delayed Payment'),
        ('purchase_return', 'Goods Return to Supplier'),
        ('discount_reversal', 'Discount Withdrawn'),
        ('other', 'Other Reason'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    debit_note_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True)
    reference_invoice = models.CharField(max_length=60, blank=True, default='')
    debit_note_date = models.DateField()
    reason = models.CharField(max_length=40, choices=REASON_CHOICES, default='purchase_return')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    status = models.CharField(max_length=20, default='issued')
    remarks = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)


class RecurringInvoice(models.Model):
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=150)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='monthly')
    start_date = models.DateField()
    next_run_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)
    auto_send_email = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)


# ==========================================
# 6. PURCHASE MANAGEMENT
# ==========================================

class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft PO'),
        ('sent', 'Sent to Vendor'),
        ('confirmed', 'Vendor Confirmed'),
        ('received', 'Goods Received'),
        ('billed', 'Billed'),
        ('cancelled', 'Cancelled'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    po_number = models.CharField(max_length=50, unique=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchase_orders')
    order_date = models.DateField()
    expected_date = models.DateField(null=True, blank=True)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-order_date']

    def __str__(self):
        return f"{self.po_number} - {self.supplier.company_name} (₹{self.total_amount})"


class PurchaseOrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(ProductService, on_delete=models.SET_NULL, null=True, blank=True)
    item_name = models.CharField(max_length=200)
    hsn_sac = models.CharField(max_length=20, default='847130')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1.0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)


class PurchaseBill(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft Bill'),
        ('posted', 'Posted / Approved'),
        ('partially_paid', 'Partially Paid'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    ]
    ITC_CHOICES = [
        ('eligible_inputs', 'Eligible (Inputs)'),
        ('eligible_capital_goods', 'Eligible (Capital Goods)'),
        ('eligible_services', 'Eligible (Input Services)'),
        ('ineligible', 'Ineligible ITC / Blocked Credit (Sec 17(5))'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bill_number = models.CharField(max_length=50, unique=True)
    supplier_invoice_number = models.CharField(max_length=60)
    supplier_invoice_date = models.DateField()
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='bills')
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.SET_NULL, null=True, blank=True)
    bill_date = models.DateField()
    due_date = models.DateField()
    
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    cgst = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    sgst = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    igst = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    cess = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    balance_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    
    itc_eligibility = models.CharField(max_length=30, choices=ITC_CHOICES, default='eligible_inputs')
    itc_claimed = models.BooleanField(default=True)
    is_rcm = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='posted')
    document_url = models.CharField(max_length=500, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-bill_date']

    def __str__(self):
        return f"{self.bill_number} (Inv: {self.supplier_invoice_number}) - {self.supplier.company_name} (₹{self.total_amount})"


class PurchaseBillItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    purchase_bill = models.ForeignKey(PurchaseBill, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(ProductService, on_delete=models.SET_NULL, null=True, blank=True)
    item_name = models.CharField(max_length=200)
    hsn_sac = models.CharField(max_length=20, default='847130')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1.0)
    purchase_rate = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    taxable_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.0)
    cgst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    sgst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    igst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)


# ==========================================
# 7. PAYMENTS, RECEIPTS & EXPENSES
# ==========================================

class Payment(models.Model):
    """Customer payment receipts for existing backward-compatibility."""
    MODE_CHOICES = [
        ('bank_transfer', 'NEFT / RTGS / IMPS'),
        ('upi', 'UPI Payment'),
        ('card', 'Credit / Debit Card'),
        ('cheque', 'Cheque'),
        ('cash', 'Cash'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment_number = models.CharField(max_length=50, unique=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='payments')
    payment_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_mode = models.CharField(max_length=30, choices=MODE_CHOICES, default='bank_transfer')
    transaction_reference = models.CharField(max_length=100, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f"{self.payment_number} - ₹{self.amount} for {self.invoice.invoice_number}"


class SupplierPayment(models.Model):
    """Payments made to suppliers for purchase bills."""
    MODE_CHOICES = [
        ('bank_transfer', 'NEFT / RTGS / IMPS'),
        ('upi', 'UPI Payment'),
        ('cheque', 'Cheque'),
        ('cash', 'Cash'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment_number = models.CharField(max_length=50, unique=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='payments')
    purchase_bill = models.ForeignKey(PurchaseBill, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    payment_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_mode = models.CharField(max_length=30, choices=MODE_CHOICES, default='bank_transfer')
    bank_reference = models.CharField(max_length=100, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f"{self.payment_number} - ₹{self.amount} to {self.supplier.company_name}"


class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('office_rent', 'Office Rent & Facilities'),
        ('utilities', 'Electricity, Internet & Utilities'),
        ('cloud_software', 'Cloud Infrastructure & Software SaaS'),
        ('marketing', 'Marketing & Sales Campaigns'),
        ('travel', 'Employee Travel & Lodging'),
        ('supplies', 'Stationery & Hardware Supplies'),
        ('professional_fees', 'Legal & Professional Fees'),
        ('other', 'Miscellaneous / Other'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved & Reimbursed'),
        ('rejected', 'Rejected'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=40, choices=CATEGORY_CHOICES, default='utilities')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    expense_date = models.DateField()
    vendor = models.CharField(max_length=150, blank=True, default='')
    vendor_gstin = models.CharField(max_length=20, blank=True, default='')
    taxable_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.0)
    cgst = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    sgst = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    igst = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    itc_eligible = models.BooleanField(default=True)
    payment_mode = models.CharField(max_length=50, default='Corporate Card')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='approved')
    receipt_url = models.CharField(max_length=500, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-expense_date']

    def __str__(self):
        return f"{self.title} - ₹{self.amount} ({self.category})"


# ==========================================
# 8. DOUBLE-ENTRY ACCOUNTING
# ==========================================

class Account(models.Model):
    ACCOUNT_TYPE_CHOICES = [
        ('asset', 'Asset'),
        ('liability', 'Liability'),
        ('equity', 'Equity'),
        ('income', 'Income / Revenue'),
        ('expense', 'Expense'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=150)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='sub_accounts')
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=0.0)
    description = models.TextField(blank=True, default='')
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name} ({self.account_type})"


class JournalEntry(models.Model):
    REF_CHOICES = [
        ('invoice', 'Sales Invoice'),
        ('payment', 'Customer Receipt'),
        ('purchase', 'Purchase Bill'),
        ('supplier_payment', 'Supplier Payment'),
        ('credit_note', 'Credit Note'),
        ('debit_note', 'Debit Note'),
        ('expense', 'Expense Voucher'),
        ('manual', 'Manual Journal'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entry_number = models.CharField(max_length=50, unique=True)
    entry_date = models.DateField()
    reference_type = models.CharField(max_length=30, choices=REF_CHOICES, default='manual')
    reference_id = models.CharField(max_length=100, blank=True, default='')
    narration = models.TextField()
    is_posted = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-entry_date', '-created_at']

    def __str__(self):
        return f"{self.entry_number} ({self.entry_date}): {self.narration[:40]}"


class JournalEntryLine(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    journal_entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='journal_lines')
    debit = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    credit = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    description = models.CharField(max_length=200, blank=True, default='')

    def __str__(self):
        return f"{self.account.name}: Dr ₹{self.debit} | Cr ₹{self.credit}"


# ==========================================
# 9. GST COMPLIANCE, E-INVOICE & E-WAY BILL
# ==========================================

class GSTReturnRecord(models.Model):
    RETURN_CHOICES = [
        ('GSTR-1', 'GSTR-1 (Outward Supplies)'),
        ('GSTR-3B', 'GSTR-3B (Summary Return)'),
        ('GSTR-2B', 'GSTR-2B (Auto-drafted ITC)'),
        ('GSTR-9', 'GSTR-9 (Annual Return)'),
    ]
    STATUS_CHOICES = [
        ('draft', 'Draft Prepared'),
        ('generated', 'JSON Generated'),
        ('reconciled', 'Reconciled'),
        ('filed', 'Filed on Portal'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    return_type = models.CharField(max_length=20, choices=RETURN_CHOICES)
    period = models.CharField(max_length=15)  # e.g. '11-2026'
    financial_year = models.CharField(max_length=20, default='2026-2027')
    filing_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    total_taxable_value = models.DecimalField(max_digits=14, decimal_places=2, default=0.0)
    total_tax_liability = models.DecimalField(max_digits=14, decimal_places=2, default=0.0)
    total_itc_claimed = models.DecimalField(max_digits=14, decimal_places=2, default=0.0)
    payload_json = models.TextField(blank=True, default='{}')
    arn_number = models.CharField(max_length=50, blank=True, default='')
    filed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.return_type} ({self.period}) - {self.filing_status}"


class EInvoiceRecord(models.Model):
    STATUS_CHOICES = [
        ('generated', 'Generated & Signed'),
        ('cancelled', 'Cancelled on IRP'),
        ('failed', 'IRP Submission Failed'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.OneToOneField(Invoice, on_delete=models.CASCADE, related_name='e_invoice_record')
    irn = models.CharField(max_length=100, unique=True)
    ack_no = models.CharField(max_length=50)
    ack_date = models.DateTimeField()
    signed_qr_code = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='generated')
    cancel_reason = models.CharField(max_length=200, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)


class EWayBillRecord(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active & Valid'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    eway_bill_no = models.CharField(max_length=50, unique=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True, related_name='eway_bills')
    purchase_bill = models.ForeignKey(PurchaseBill, on_delete=models.SET_NULL, null=True, blank=True)
    eway_bill_date = models.DateTimeField()
    valid_upto = models.DateTimeField()
    vehicle_number = models.CharField(max_length=30)
    transporter_id = models.CharField(max_length=50, blank=True, default='')
    transporter_name = models.CharField(max_length=150, blank=True, default='')
    distance_km = models.IntegerField(default=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
