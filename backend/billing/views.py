import datetime
from decimal import Decimal
import json
from django.db import transaction
from django.db.models import Sum, Count, Q, F
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import (
    CompanyProfile, Branch, FinancialYearSetting, TaxRateMaster,
    HSNMaster, SACMaster, Supplier, Warehouse, ProductService,
    StockLedger, StockAdjustment, StockTransfer,
    Quotation, QuotationItem, SalesOrder, SalesOrderItem,
    Invoice, InvoiceItem, CreditNote, DebitNote, RecurringInvoice,
    PurchaseOrder, PurchaseOrderItem, PurchaseBill, PurchaseBillItem,
    Payment, SupplierPayment, Expense,
    Account, JournalEntry, JournalEntryLine,
    GSTReturnRecord, EInvoiceRecord, EWayBillRecord
)
from .serializers import (
    CompanyProfileSerializer, BranchSerializer, FinancialYearSettingSerializer,
    TaxRateMasterSerializer, HSNMasterSerializer, SACMasterSerializer,
    SupplierSerializer, WarehouseSerializer, ProductServiceSerializer,
    StockLedgerSerializer, StockAdjustmentSerializer, StockTransferSerializer,
    QuotationSerializer, QuotationItemSerializer, SalesOrderSerializer,
    InvoiceSerializer, InvoiceItemSerializer, CreditNoteSerializer,
    DebitNoteSerializer, RecurringInvoiceSerializer, PurchaseOrderSerializer,
    PurchaseBillSerializer, SupplierPaymentSerializer, PaymentSerializer,
    ExpenseSerializer, AccountSerializer, JournalEntrySerializer,
    GSTReturnRecordSerializer, EInvoiceRecordSerializer, EWayBillRecordSerializer
)
from .gst_engine import (
    calculate_invoice_totals, calculate_line_item, is_intra_state_supply,
    get_state_code, number_to_indian_currency_words
)
from .accounting_engine import (
    record_sales_invoice_journal, record_customer_payment_journal,
    record_purchase_bill_journal, ensure_chart_of_accounts
)
from crm.models import Customer
from audit_logs.models import AuditLog


# ==========================================
# 1. SETTINGS & STATUTORY MASTERS
# ==========================================

class CompanyProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_company(self):
        company = CompanyProfile.objects.first()
        if not company:
            company = CompanyProfile.objects.create(
                company_name='Odias ERP Technologies Pvt. Ltd.',
                trade_name='Odias ERP India',
                pan='AAACR1234F',
                gstin='21AAACR1234F1Z5',
                business_type='Private Limited Enterprise',
                registration_type='Regular',
                address='Plot 42, Infocity Avenue, Chandaka Industrial Estate, Patia',
                state='Odisha',
                district='Khurda',
                pincode='751024',
                state_code='21',
                phone='+91 674 2748000',
                email='accounts@odiaserp.com',
                website='https://odiaserp.com',
                bank_name='HDFC Bank Ltd.',
                bank_account_no='50200088991122',
                bank_ifsc='HDFC0001234',
                bank_branch='Infocity Corporate Branch, Bhubaneswar',
                upi_id='odiaserp@hdfcbank',
                invoice_prefix='OERP/2026/',
                quotation_prefix='QT/2026/',
                purchase_prefix='PB/2026/',
                credit_note_prefix='CN/2026/',
                debit_note_prefix='DN/2026/',
                default_terms='1. Subject to Bhubaneswar jurisdiction.\n2. Interest @ 18% p.a. charged after due date.\n3. Goods once sold will not be returned without authorized credit note.',
                is_rcm_applicable=False,
                e_invoice_enabled=True,
                e_way_bill_enabled=True
            )
        return company

    def get(self, request):
        company = self._get_company()
        return Response(CompanyProfileSerializer(company).data)

    def put(self, request):
        company = self._get_company()
        serializer = CompanyProfileSerializer(company, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all().order_by('-is_head_office', 'name')
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]


class FinancialYearSettingViewSet(viewsets.ModelViewSet):
    queryset = FinancialYearSetting.objects.all().order_by('-start_date')
    serializer_class = FinancialYearSettingSerializer
    permission_classes = [IsAuthenticated]


class TaxRateMasterViewSet(viewsets.ModelViewSet):
    queryset = TaxRateMaster.objects.all().order_by('rate_percentage')
    serializer_class = TaxRateMasterSerializer
    permission_classes = [IsAuthenticated]


class HSNMasterViewSet(viewsets.ModelViewSet):
    queryset = HSNMaster.objects.all().order_by('hsn_code')
    serializer_class = HSNMasterSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def bulk_import(self, request):
        """Bulk import official HSN codes from JSON or CSV."""
        records = request.data.get('records', [])
        created_count = 0
        updated_count = 0
        for rec in records:
            code = str(rec.get('hsn_code', '')).strip()
            if not code:
                continue
            obj, created = HSNMaster.objects.update_or_create(
                hsn_code=code,
                defaults={
                    'description': rec.get('description', ''),
                    'goods_category': rec.get('goods_category', 'General Goods'),
                    'applicable_gst_rate': Decimal(str(rec.get('applicable_gst_rate', 18))),
                    'cess_rate': Decimal(str(rec.get('cess_rate', 0))),
                    'is_active': rec.get('is_active', True)
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1
        return Response({'success': True, 'created': created_count, 'updated': updated_count})

    @action(detail=False, methods=['post'])
    def seed_defaults(self, request):
        """Seed standard Indian GST HSN codes for goods."""
        standard_hsn = [
            {'hsn_code': '847130', 'description': 'Portable digital computers / Laptops / Tablets', 'goods_category': 'Computers & Electronics', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'hsn_code': '847150', 'description': 'Digital processing units / Desktop Computers / Servers', 'goods_category': 'IT Infrastructure', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'hsn_code': '851713', 'description': 'Smartphones / Mobile communication devices', 'goods_category': 'Telecommunication', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'hsn_code': '844332', 'description': 'Multifunction Laser Printers & Scanners', 'goods_category': 'Office Equipment', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'hsn_code': '852852', 'description': 'Computer Monitors & Interactive Flat Panels', 'goods_category': 'Display Peripherals', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'hsn_code': '847170', 'description': 'Enterprise Storage Units / NVMe SSDs / Hard Drives', 'goods_category': 'Data Storage', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'hsn_code': '850440', 'description': 'Static converters / Online UPS / Power Supply Units', 'goods_category': 'Power Equipment', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'hsn_code': '851762', 'description': 'Enterprise Network Switches, Routers & Firewalls', 'goods_category': 'Networking', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'hsn_code': '940310', 'description': 'Metal Office Furniture, Ergonomic Chairs & Workstations', 'goods_category': 'Office Furniture', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'hsn_code': '482010', 'description': 'Office Registers, Account Books, Note Books & Binders', 'goods_category': 'Stationery', 'applicable_gst_rate': 12, 'cess_rate': 0},
            {'hsn_code': '480255', 'description': 'Uncoated Printing & Writing Paper Sheets (A4/Legal)', 'goods_category': 'Paper Products', 'applicable_gst_rate': 12, 'cess_rate': 0},
            {'hsn_code': '847050', 'description': 'Point of Sale (POS) Cash Registers & Barcode Readers', 'goods_category': 'Retail Tech', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'hsn_code': '901890', 'description': 'Medical Diagnostic Equipment & Surgical Instruments', 'goods_category': 'Healthcare Equipment', 'applicable_gst_rate': 12, 'cess_rate': 0},
            {'hsn_code': '300490', 'description': 'Medicaments & Essential Pharmaceutical Products', 'goods_category': 'Pharmaceuticals', 'applicable_gst_rate': 12, 'cess_rate': 0},
            {'hsn_code': '100630', 'description': 'Semi-milled or wholly milled Rice & Essential Foodgrains', 'goods_category': 'Food & Agriculture', 'applicable_gst_rate': 5, 'cess_rate': 0},
            {'hsn_code': '040120', 'description': 'Fresh Milk, Curd & Unpackaged Organic Dairy', 'goods_category': 'Dairy Products', 'applicable_gst_rate': 0, 'cess_rate': 0},
            {'hsn_code': '220210', 'description': 'Aerated waters & beverages containing added sugar', 'goods_category': 'Beverages', 'applicable_gst_rate': 28, 'cess_rate': 12},
            {'hsn_code': '870321', 'description': 'Motor cars & other passenger vehicles (Petrol <1200cc)', 'goods_category': 'Automobiles', 'applicable_gst_rate': 28, 'cess_rate': 1},
        ]
        created = 0
        updated = 0
        for item in standard_hsn:
            _, is_new = HSNMaster.objects.update_or_create(
                hsn_code=item['hsn_code'],
                defaults={
                    'description': item['description'],
                    'goods_category': item['goods_category'],
                    'applicable_gst_rate': Decimal(str(item['applicable_gst_rate'])),
                    'cess_rate': Decimal(str(item['cess_rate'])),
                    'is_active': True
                }
            )
            if is_new:
                created += 1
            else:
                updated += 1
        return Response({'success': True, 'created': created, 'updated': updated, 'total': len(standard_hsn)})


class SACMasterViewSet(viewsets.ModelViewSet):
    queryset = SACMaster.objects.all().order_by('sac_code')
    serializer_class = SACMasterSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def bulk_import(self, request):
        """Bulk import official SAC codes from JSON or CSV."""
        records = request.data.get('records', [])
        created_count = 0
        updated_count = 0
        for rec in records:
            code = str(rec.get('sac_code', '')).strip()
            if not code:
                continue
            obj, created = SACMaster.objects.update_or_create(
                sac_code=code,
                defaults={
                    'description': rec.get('description', ''),
                    'service_category': rec.get('service_category', 'General Services'),
                    'applicable_gst_rate': Decimal(str(rec.get('applicable_gst_rate', 18))),
                    'cess_rate': Decimal(str(rec.get('cess_rate', 0))),
                    'is_active': rec.get('is_active', True)
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1
        return Response({'success': True, 'created': created_count, 'updated': updated_count})

    @action(detail=False, methods=['post'])
    def seed_defaults(self, request):
        """Seed standard Indian GST SAC codes for services."""
        standard_sac = [
            {'sac_code': '998314', 'description': 'Information technology (IT) design and development services', 'service_category': 'Information Technology', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'sac_code': '998313', 'description': 'Information technology (IT) consulting and support services', 'service_category': 'Information Technology', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'sac_code': '998315', 'description': 'Hosting and infrastructure provisioning services (Cloud SaaS)', 'service_category': 'Cloud & Hosting', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'sac_code': '998316', 'description': 'IT infrastructure and network management services', 'service_category': 'IT Infrastructure', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'sac_code': '997331', 'description': 'Licensing services for the right to use computer software', 'service_category': 'Software Licensing', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'sac_code': '998319', 'description': 'Other Information Technology services n.e.c.', 'service_category': 'Information Technology', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'sac_code': '998221', 'description': 'Financial auditing and accounting services', 'service_category': 'Financial & Accounting', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'sac_code': '998211', 'description': 'Legal advisory and representation services', 'service_category': 'Legal Services', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'sac_code': '998311', 'description': 'Management consulting and business advisory services', 'service_category': 'Management Consulting', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'sac_code': '998361', 'description': 'Advertising, branding and digital marketing services', 'service_category': 'Marketing & Media', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'sac_code': '998713', 'description': 'Maintenance and repair of computers and peripheral equipment', 'service_category': 'Hardware Maintenance', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'sac_code': '996511', 'description': 'Road transport services of goods including courier', 'service_category': 'Logistics & Transport', 'applicable_gst_rate': 5, 'cess_rate': 0},
            {'sac_code': '997212', 'description': 'Commercial real estate leasing or rental services', 'service_category': 'Real Estate', 'applicable_gst_rate': 18, 'cess_rate': 0},
            {'sac_code': '999210', 'description': 'Pre-primary, secondary and higher education services', 'service_category': 'Education', 'applicable_gst_rate': 0, 'cess_rate': 0},
            {'sac_code': '999311', 'description': 'Hospital, clinical and clinical laboratory diagnostic services', 'service_category': 'Healthcare Services', 'applicable_gst_rate': 0, 'cess_rate': 0},
        ]
        created = 0
        updated = 0
        for item in standard_sac:
            _, is_new = SACMaster.objects.update_or_create(
                sac_code=item['sac_code'],
                defaults={
                    'description': item['description'],
                    'service_category': item['service_category'],
                    'applicable_gst_rate': Decimal(str(item['applicable_gst_rate'])),
                    'cess_rate': Decimal(str(item['cess_rate'])),
                    'is_active': True
                }
            )
            if is_new:
                created += 1
            else:
                updated += 1
        return Response({'success': True, 'created': created, 'updated': updated, 'total': len(standard_sac)})


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by('company_name')
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all().order_by('name')
    serializer_class = WarehouseSerializer
    permission_classes = [IsAuthenticated]


# ==========================================
# 2. PRODUCTS & INVENTORY
# ==========================================

class ProductServiceViewSet(viewsets.ModelViewSet):
    queryset = ProductService.objects.all().select_related('warehouse').order_by('name')
    serializer_class = ProductServiceSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def adjust_stock(self, request, pk=None):
        product = self.get_object()
        qty = Decimal(str(request.data.get('quantity', 0)))
        adj_type = request.data.get('adjustment_type', 'add')
        reason = request.data.get('reason', 'Physical count adjustment')
        warehouse_id = request.data.get('warehouse') or (product.warehouse_id)

        if not warehouse_id:
            return Response({'detail': 'Warehouse required for stock adjustment'}, status=status.HTTP_400_BAD_REQUEST)

        wh = Warehouse.objects.filter(id=warehouse_id).first()
        if adj_type in ['subtract', 'damaged', 'expired', 'theft_loss']:
            if product.current_stock < qty:
                return Response({'detail': 'Insufficient stock to deduct'}, status=status.HTTP_400_BAD_REQUEST)
            new_stock = product.current_stock - qty
            tx_type = 'adjustment_sub'
        else:
            new_stock = product.current_stock + qty
            tx_type = 'adjustment_add'

        product.current_stock = new_stock
        product.save()

        StockAdjustment.objects.create(
            product=product,
            warehouse=wh,
            adjustment_type=adj_type,
            quantity=qty,
            reason=reason,
            adjusted_by=request.user
        )

        StockLedger.objects.create(
            product=product,
            warehouse=wh,
            transaction_type=tx_type,
            reference_number=f"ADJ-{product.sku}",
            quantity=qty if adj_type == 'add' else -qty,
            unit_price=product.purchase_price or product.unit_price,
            total_value=qty * (product.purchase_price or product.unit_price),
            balance_stock_after=new_stock,
            remarks=reason
        )

        return Response({'success': True, 'new_stock': new_stock})


class StockLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockLedger.objects.all().select_related('product', 'warehouse').order_by('-created_at')
    serializer_class = StockLedgerSerializer
    permission_classes = [IsAuthenticated]


class StockAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = StockAdjustment.objects.all().select_related('product', 'warehouse').order_by('-created_at')
    serializer_class = StockAdjustmentSerializer
    permission_classes = [IsAuthenticated]


class StockTransferViewSet(viewsets.ModelViewSet):
    queryset = StockTransfer.objects.all().select_related('from_warehouse', 'to_warehouse', 'product').order_by('-created_at')
    serializer_class = StockTransferSerializer
    permission_classes = [IsAuthenticated]


# ==========================================
# 3. SALES & INVOICES
# ==========================================

class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all().select_related('customer').prefetch_related('items').order_by('-created_at')
    serializer_class = QuotationSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        data = request.data
        items_data = data.get('items', [])
        company = CompanyProfile.objects.first()
        supplier_state = company.state if company else 'Odisha'

        customer = Customer.objects.filter(id=data.get('customer')).first()
        customer_state = customer.state if customer else 'Odisha'

        calc_result = calculate_invoice_totals(
            items=items_data,
            supplier_state=supplier_state,
            place_of_supply=customer_state,
            overall_discount=Decimal(str(data.get('discount_amount', 0)))
        )

        q_count = Quotation.objects.count() + 1
        prefix = company.quotation_prefix if company else 'QT/2026/'
        q_num = f"{prefix}{q_count:04d}"

        quotation = Quotation.objects.create(
            quotation_number=q_num,
            customer=customer,
            opportunity_id=data.get('opportunity'),
            quotation_date=data.get('quotation_date', datetime.date.today()),
            valid_until=data.get('valid_until', datetime.date.today() + datetime.timedelta(days=30)),
            subtotal=calc_result['subtotal_taxable'],
            tax_amount=calc_result['total_tax'],
            discount_amount=calc_result['total_discount'],
            total_amount=calc_result['grand_total'],
            status='sent',
            notes=data.get('notes', 'Thank you for your business.'),
            terms=data.get('terms', company.default_terms if company else ''),
            created_by=request.user
        )

        for it in calc_result['items']:
            QuotationItem.objects.create(
                quotation=quotation,
                product_id=it.get('product'),
                item_name=it.get('item_name', 'Item'),
                description=it.get('description', ''),
                hsn_sac=it.get('hsn_sac', '998314'),
                quantity=Decimal(str(it.get('quantity', 1))),
                unit_price=Decimal(str(it.get('unit_price', 0))),
                discount_pct=Decimal(str(it.get('discount_pct', 0))),
                discount_amount=it['discount_amount'],
                tax_rate=it['gst_rate'],
                tax_amount=it['total_tax'],
                total=it['total_amount']
            )

        return Response(QuotationSerializer(quotation).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def convert_to_invoice(self, request, pk=None):
        quotation = self.get_object()
        company = CompanyProfile.objects.first()
        inv_count = Invoice.objects.count() + 1
        prefix = company.invoice_prefix if company else 'OERP/2026/'
        inv_num = f"{prefix}{inv_count:04d}"

        customer = quotation.customer
        supplier_state = company.state if company else 'Odisha'
        customer_state = customer.state or 'Odisha'
        is_intra = is_intra_state_supply(supplier_state, customer_state)

        # Re-verify calculation with line items
        items_payload = [
            {
                'product': it.product_id,
                'item_name': it.item_name,
                'description': it.description,
                'hsn_sac': it.hsn_sac,
                'quantity': it.quantity,
                'unit_price': it.unit_price,
                'discount_value': it.discount_amount,
                'gst_rate': it.tax_rate
            }
            for it in quotation.items.all()
        ]
        calc = calculate_invoice_totals(items=items_payload, supplier_state=supplier_state, place_of_supply=customer_state)

        invoice = Invoice.objects.create(
            invoice_number=inv_num,
            customer=customer,
            quotation=quotation,
            invoice_date=datetime.date.today(),
            due_date=datetime.date.today() + datetime.timedelta(days=15),
            place_of_supply=f"{customer_state} ({get_state_code(customer_state)})",
            place_of_supply_code=get_state_code(customer_state),
            is_intra_state=is_intra,
            subtotal=calc['subtotal_taxable'],
            cgst=calc['cgst'],
            sgst=calc['sgst'],
            igst=calc['igst'],
            cess_amount=calc['cess'],
            total_tax=calc['total_tax'],
            round_off=calc['round_off'],
            total_amount=calc['grand_total'],
            paid_amount=Decimal('0.00'),
            balance_amount=calc['grand_total'],
            amount_in_words=calc['amount_in_words'],
            status='issued',
            notes=quotation.notes,
            terms=quotation.terms,
            created_by=request.user
        )

        for cit in calc['items']:
            InvoiceItem.objects.create(
                invoice=invoice,
                product_id=cit.get('product'),
                item_name=cit.get('item_name'),
                description=cit.get('description', ''),
                hsn_sac=cit.get('hsn_sac', '998314'),
                quantity=Decimal(str(cit.get('quantity', 1))),
                unit_price=Decimal(str(cit.get('unit_price', 0))),
                taxable_value=cit['taxable_value'],
                tax_rate=cit['gst_rate'],
                tax_amount=cit['total_tax'],
                cgst_rate=cit['cgst_rate'],
                cgst_amount=cit['cgst_amount'],
                sgst_rate=cit['sgst_rate'],
                sgst_amount=cit['sgst_amount'],
                igst_rate=cit['igst_rate'],
                igst_amount=cit['igst_amount'],
                cess_rate=cit['cess_rate'],
                cess_amount=cit['cess_amount'],
                total=cit['total_amount']
            )
            # Deduct stock for physical products
            if cit.get('product'):
                prod = ProductService.objects.filter(id=cit['product']).first()
                if prod and prod.item_type == 'product':
                    prod.current_stock -= Decimal(str(cit.get('quantity', 1)))
                    prod.save()
                    StockLedger.objects.create(
                        product=prod,
                        warehouse=prod.warehouse,
                        transaction_type='sales',
                        reference_number=invoice.invoice_number,
                        quantity=-Decimal(str(cit.get('quantity', 1))),
                        unit_price=cit['taxable_value'] / Decimal(str(cit.get('quantity', 1))),
                        total_value=cit['taxable_value'],
                        balance_stock_after=prod.current_stock,
                        remarks=f"Sold via Invoice {invoice.invoice_number}"
                    )

        # Trigger Double-Entry Accounting
        record_sales_invoice_journal(invoice, Account, JournalEntry, JournalEntryLine, user=request.user)

        quotation.status = 'converted'
        quotation.save()

        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)


class SalesOrderViewSet(viewsets.ModelViewSet):
    queryset = SalesOrder.objects.all().select_related('customer').prefetch_related('items').order_by('-order_date')
    serializer_class = SalesOrderSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        data = request.data
        items_data = data.get('items', [])
        customer = Customer.objects.filter(id=data.get('customer')).first()
        if not customer:
            return Response({'detail': 'Customer is required'}, status=status.HTTP_400_BAD_REQUEST)

        company = CompanyProfile.objects.first()
        supplier_state = company.state if company else 'Odisha'
        customer_state = customer.state if customer else 'Odisha'

        calc_result = calculate_invoice_totals(
            items=items_data,
            supplier_state=supplier_state,
            place_of_supply=customer_state,
            overall_discount=Decimal(str(data.get('discount_amount', 0)))
        )

        order_count = SalesOrder.objects.count() + 1
        so_num = data.get('order_number') or f"SO/2026-27/{order_count:05d}"

        order_date = data.get('order_date') or datetime.date.today()
        delivery_date = data.get('expected_delivery_date') or data.get('delivery_date') or (datetime.date.today() + datetime.timedelta(days=7))

        sales_order = SalesOrder.objects.create(
            order_number=so_num,
            customer=customer,
            order_date=order_date,
            expected_delivery_date=delivery_date,
            subtotal=calc_result['subtotal_taxable'],
            tax_amount=calc_result['total_tax'],
            discount_amount=calc_result['total_discount'],
            total_amount=calc_result['grand_total'],
            status=data.get('status', 'confirmed'),
            delivery_address=data.get('delivery_address') or customer.shipping_address or customer.billing_address or '',
            notes=data.get('notes', 'Confirmed customer sales order.'),
            created_by=request.user
        )

        for it in items_data:
            prod = ProductService.objects.filter(id=it.get('product')).first() if it.get('product') else None
            qty = Decimal(str(it.get('quantity', 1)))
            rate = Decimal(str(it.get('unit_price', 0)))
            disc_pct = Decimal(str(it.get('discount_pct', 0)))
            gross = qty * rate
            disc_amt = gross * (disc_pct / Decimal('100.00'))
            taxable = gross - disc_amt
            tax_rate = Decimal(str(it.get('tax_rate', 18)))
            line_tax = (taxable * tax_rate) / Decimal('100.00')

            SalesOrderItem.objects.create(
                sales_order=sales_order,
                product=prod,
                item_name=it.get('item_name') or (prod.name if prod else 'Service/Item'),
                quantity=qty,
                unit_price=rate,
                tax_rate=tax_rate,
                tax_amount=line_tax,
                total=taxable + line_tax
            )

        return Response(SalesOrderSerializer(sales_order).data, status=status.HTTP_201_CREATED)


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().select_related('customer', 'branch').prefetch_related('items', 'payments').order_by('-invoice_date', '-created_at')
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def calculate_preview(self, request):
        """Preview calculations for frontend real-time price & GST engine."""
        data = request.data
        items = data.get('items', [])
        company = CompanyProfile.objects.first()
        supplier_state = company.state if company else 'Odisha'

        customer_id = data.get('customer')
        customer = Customer.objects.filter(id=customer_id).first() if customer_id else None
        pos = data.get('place_of_supply') or (customer.state if customer else supplier_state)

        result = calculate_invoice_totals(
            items=items,
            supplier_state=supplier_state,
            place_of_supply=pos,
            overall_discount=Decimal(str(data.get('discount_amount', 0))),
            shipping_charges=Decimal(str(data.get('shipping_charges', 0))),
            packaging_charges=Decimal(str(data.get('packaging_charges', 0))),
            other_charges=Decimal(str(data.get('other_charges', 0))),
            is_rcm=bool(data.get('is_rcm', False))
        )
        return Response(result)

    def create(self, request, *args, **kwargs):
        data = request.data
        items_data = data.get('items', [])
        company = CompanyProfile.objects.first()
        supplier_state = company.state if company else 'Odisha'

        customer = Customer.objects.filter(id=data.get('customer')).first()
        if not customer:
            return Response({'detail': 'Valid customer is required'}, status=status.HTTP_400_BAD_REQUEST)

        pos_state = data.get('place_of_supply') or customer.state or supplier_state
        is_rcm = bool(data.get('is_rcm', False))

        calc = calculate_invoice_totals(
            items=items_data,
            supplier_state=supplier_state,
            place_of_supply=pos_state,
            overall_discount=Decimal(str(data.get('discount_amount', 0))),
            shipping_charges=Decimal(str(data.get('shipping_charges', 0))),
            packaging_charges=Decimal(str(data.get('packaging_charges', 0))),
            other_charges=Decimal(str(data.get('other_charges', 0))),
            is_rcm=is_rcm
        )

        inv_count = Invoice.objects.count() + 1
        prefix = company.invoice_prefix if company else 'OERP/2026/'
        inv_num = f"{prefix}{inv_count:04d}"

        inv_status = data.get('status', 'issued')

        invoice = Invoice.objects.create(
            invoice_number=inv_num,
            invoice_type=data.get('invoice_type', 'tax_invoice'),
            customer=customer,
            branch_id=data.get('branch'),
            quotation_id=data.get('quotation'),
            sales_order_id=data.get('sales_order'),
            invoice_date=data.get('invoice_date', datetime.date.today()),
            due_date=data.get('due_date', datetime.date.today() + datetime.timedelta(days=15)),
            place_of_supply=f"{pos_state} ({get_state_code(pos_state)})",
            place_of_supply_code=get_state_code(pos_state),
            is_intra_state=calc['is_intra_state'],
            is_rcm=is_rcm,
            subtotal=calc['subtotal_taxable'],
            cgst=calc['cgst'],
            sgst=calc['sgst'],
            utgst=calc['utgst'],
            igst=calc['igst'],
            cess_amount=calc['cess'],
            total_tax=calc['total_tax'],
            discount_amount=calc['total_discount'],
            shipping_charges=calc['shipping_charges'],
            packaging_charges=calc['packaging_charges'],
            round_off=calc['round_off'],
            total_amount=calc['grand_total'],
            paid_amount=Decimal('0.00'),
            balance_amount=calc['grand_total'],
            amount_in_words=calc['amount_in_words'],
            status=inv_status,
            notes=data.get('notes', 'Payment due within 15 days.'),
            terms=data.get('terms', company.default_terms if company else ''),
            created_by=request.user
        )

        for cit in calc['items']:
            InvoiceItem.objects.create(
                invoice=invoice,
                product_id=cit.get('product'),
                item_name=cit.get('item_name'),
                description=cit.get('description', ''),
                hsn_sac=cit.get('hsn_sac', '998314'),
                unit=cit.get('unit', 'NOS'),
                quantity=Decimal(str(cit.get('quantity', 1))),
                unit_price=Decimal(str(cit.get('unit_price', 0))),
                discount_pct=Decimal(str(cit.get('discount_pct', 0))),
                discount_amount=cit['discount_amount'],
                taxable_value=cit['taxable_value'],
                tax_rate=cit['gst_rate'],
                tax_amount=cit['total_tax'],
                cgst_rate=cit['cgst_rate'],
                cgst_amount=cit['cgst_amount'],
                sgst_rate=cit['sgst_rate'],
                sgst_amount=cit['sgst_amount'],
                igst_rate=cit['igst_rate'],
                igst_amount=cit['igst_amount'],
                cess_rate=cit['cess_rate'],
                cess_amount=cit['cess_amount'],
                total=cit['total_amount']
            )

            # Auto Stock movement if posted/issued
            if inv_status == 'issued' and cit.get('product'):
                prod = ProductService.objects.filter(id=cit['product']).first()
                if prod and prod.item_type == 'product':
                    prod.current_stock -= Decimal(str(cit.get('quantity', 1)))
                    prod.save()
                    StockLedger.objects.create(
                        product=prod,
                        warehouse=prod.warehouse,
                        transaction_type='sales',
                        reference_number=invoice.invoice_number,
                        quantity=-Decimal(str(cit.get('quantity', 1))),
                        unit_price=cit['taxable_value'] / Decimal(str(cit.get('quantity', 1))),
                        total_value=cit['taxable_value'],
                        balance_stock_after=prod.current_stock,
                        remarks=f"Direct Invoice {invoice.invoice_number}"
                    )

        # Double-entry accounting entry if issued
        if inv_status == 'issued':
            record_sales_invoice_journal(invoice, Account, JournalEntry, JournalEntryLine, user=request.user)

        AuditLog.objects.create(
            user=request.user,
            action='invoice_created',
            module='billing',
            entity_name='Invoice',
            entity_id=str(invoice.id),
            description=f"Generated Invoice {invoice.invoice_number} for customer total ₹{invoice.total_amount}."
        )

        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def generate_e_invoice(self, request, pk=None):
        """Simulate authorized IRP IRN and Signed QR code generation."""
        invoice = self.get_object()
        if invoice.is_e_invoiced and invoice.irn:
            return Response({'detail': 'Invoice already has generated IRN', 'irn': invoice.irn})

        import hashlib
        irn_hash = hashlib.sha256(f"{invoice.invoice_number}-{invoice.total_amount}-{datetime.datetime.now()}".encode()).hexdigest()
        ack_no = f"1126{Invoice.objects.filter(is_e_invoiced=True).count() + 1001}"
        ack_date = datetime.datetime.now()
        qr_data = f"ODIAS-ERP-IRP|IRN:{irn_hash[:32]}|GSTIN:{invoice.customer.gstin or '21AAACR1234F1Z5'}|VAL:{invoice.total_amount}"

        invoice.irn = irn_hash
        invoice.ack_no = ack_no
        invoice.ack_date = ack_date
        invoice.signed_qr_code = qr_data
        invoice.is_e_invoiced = True
        invoice.save()

        EInvoiceRecord.objects.create(
            invoice=invoice,
            irn=irn_hash,
            ack_no=ack_no,
            ack_date=ack_date,
            signed_qr_code=qr_data,
            status='generated'
        )

        return Response({
            'success': True,
            'irn': irn_hash,
            'ack_no': ack_no,
            'ack_date': ack_date.isoformat(),
            'signed_qr_code': qr_data
        })

    @action(detail=True, methods=['post'])
    def generate_eway_bill(self, request, pk=None):
        invoice = self.get_object()
        vehicle_no = request.data.get('vehicle_number', 'OD-02-AX-8910')
        trans_name = request.data.get('transporter_name', 'VRL Logistics')
        distance = int(request.data.get('distance_km', 120))

        ewb_no = f"2110{Invoice.objects.filter(is_eway_bill_generated=True).count() + 84920}"
        invoice.eway_bill_no = ewb_no
        invoice.is_eway_bill_generated = True
        invoice.save()

        EWayBillRecord.objects.create(
            eway_bill_no=ewb_no,
            invoice=invoice,
            eway_bill_date=datetime.datetime.now(),
            valid_upto=datetime.datetime.now() + datetime.timedelta(days=max(1, distance // 200 + 1)),
            vehicle_number=vehicle_no,
            transporter_name=trans_name,
            distance_km=distance,
            status='active'
        )

        return Response({'success': True, 'eway_bill_no': ewb_no})


class CreditNoteViewSet(viewsets.ModelViewSet):
    queryset = CreditNote.objects.all().select_related('customer', 'original_invoice').order_by('-credit_note_date')
    serializer_class = CreditNoteSerializer
    permission_classes = [IsAuthenticated]


class DebitNoteViewSet(viewsets.ModelViewSet):
    queryset = DebitNote.objects.all().select_related('customer', 'supplier').order_by('-debit_note_date')
    serializer_class = DebitNoteSerializer
    permission_classes = [IsAuthenticated]


class RecurringInvoiceViewSet(viewsets.ModelViewSet):
    queryset = RecurringInvoice.objects.all().select_related('customer').order_by('-created_at')
    serializer_class = RecurringInvoiceSerializer
    permission_classes = [IsAuthenticated]


# ==========================================
# 4. PURCHASE MANAGEMENT
# ==========================================

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all().select_related('supplier', 'warehouse').prefetch_related('items').order_by('-order_date')
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]


class PurchaseBillViewSet(viewsets.ModelViewSet):
    queryset = PurchaseBill.objects.all().select_related('supplier').prefetch_related('items').order_by('-bill_date')
    serializer_class = PurchaseBillSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        data = request.data
        items_data = data.get('items', [])
        supplier = Supplier.objects.filter(id=data.get('supplier')).first()
        if not supplier:
            return Response({'detail': 'Supplier is required'}, status=status.HTTP_400_BAD_REQUEST)

        company = CompanyProfile.objects.first()
        prefix = company.purchase_prefix if company else 'PB/2026/'
        bill_num = data.get('bill_number') or f"{prefix}{PurchaseBill.objects.count() + 1:04d}"

        subtotal = Decimal('0.00')
        cgst = Decimal('0.00')
        sgst = Decimal('0.00')
        igst = Decimal('0.00')

        is_intra = (supplier.state.lower() == (company.state.lower() if company else 'odisha'))

        for it in items_data:
            qty = Decimal(str(it.get('quantity', 1)))
            rate = Decimal(str(it.get('purchase_rate', 0)))
            disc = Decimal(str(it.get('discount_amount', 0)))
            taxable = (qty * rate) - disc
            tax_rate = Decimal(str(it.get('tax_rate', 18)))
            line_tax = (taxable * tax_rate) / Decimal('100.00')

            subtotal += taxable
            if is_intra:
                cgst += line_tax / Decimal('2.00')
                sgst += line_tax / Decimal('2.00')
            else:
                igst += line_tax

        total_amount = subtotal + cgst + sgst + igst

        bill = PurchaseBill.objects.create(
            bill_number=bill_num,
            supplier_invoice_number=data.get('supplier_invoice_number', f"V-INV-{bill_num}"),
            supplier_invoice_date=data.get('supplier_invoice_date', datetime.date.today()),
            supplier=supplier,
            purchase_order_id=data.get('purchase_order'),
            bill_date=data.get('bill_date', datetime.date.today()),
            due_date=data.get('due_date', datetime.date.today() + datetime.timedelta(days=supplier.payment_terms_days)),
            subtotal=subtotal,
            cgst=cgst,
            sgst=sgst,
            igst=igst,
            total_tax=cgst + sgst + igst,
            total_amount=total_amount,
            paid_amount=Decimal('0.00'),
            balance_amount=total_amount,
            itc_eligibility=data.get('itc_eligibility', 'eligible_inputs'),
            status='posted',
            notes=data.get('notes', ''),
            created_by=request.user
        )

        for it in items_data:
            qty = Decimal(str(it.get('quantity', 1)))
            rate = Decimal(str(it.get('purchase_rate', 0)))
            disc = Decimal(str(it.get('discount_amount', 0)))
            taxable = (qty * rate) - disc
            tax_rate = Decimal(str(it.get('tax_rate', 18)))
            line_tax = (taxable * tax_rate) / Decimal('100.00')

            PurchaseBillItem.objects.create(
                purchase_bill=bill,
                product_id=it.get('product'),
                item_name=it.get('item_name', 'Goods'),
                hsn_sac=it.get('hsn_sac', '847130'),
                quantity=qty,
                purchase_rate=rate,
                discount_amount=disc,
                taxable_amount=taxable,
                tax_rate=tax_rate,
                cgst_amount=(line_tax / Decimal('2.00')) if is_intra else Decimal('0.00'),
                sgst_amount=(line_tax / Decimal('2.00')) if is_intra else Decimal('0.00'),
                igst_amount=line_tax if not is_intra else Decimal('0.00'),
                total=taxable + line_tax
            )

            # Inward stock addition
            if it.get('product'):
                prod = ProductService.objects.filter(id=it['product']).first()
                if prod and prod.item_type == 'product':
                    prod.current_stock += qty
                    prod.purchase_price = rate
                    prod.save()
                    StockLedger.objects.create(
                        product=prod,
                        warehouse=prod.warehouse,
                        transaction_type='purchase',
                        reference_number=bill.bill_number,
                        quantity=qty,
                        unit_price=rate,
                        total_value=taxable,
                        balance_stock_after=prod.current_stock,
                        remarks=f"Purchased from {supplier.company_name}"
                    )

        # Trigger Double-Entry Accounting
        record_purchase_bill_journal(bill, Account, JournalEntry, JournalEntryLine, user=request.user)

        return Response(PurchaseBillSerializer(bill).data, status=status.HTTP_201_CREATED)


class SupplierPaymentViewSet(viewsets.ModelViewSet):
    queryset = SupplierPayment.objects.all().select_related('supplier', 'purchase_bill').order_by('-payment_date')
    serializer_class = SupplierPaymentSerializer
    permission_classes = [IsAuthenticated]


# ==========================================
# 5. PAYMENTS & RECEIPTS
# ==========================================

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().select_related('customer', 'invoice').order_by('-payment_date')
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        data = request.data
        invoice = Invoice.objects.filter(id=data.get('invoice')).first()
        if not invoice:
            return Response({'detail': 'Invoice required for payment'}, status=status.HTTP_400_BAD_REQUEST)

        amount = Decimal(str(data.get('amount', 0)))
        pay_count = Payment.objects.count() + 1
        pay_num = f"RCP-2026-{pay_count:04d}"

        payment = Payment.objects.create(
            payment_number=pay_num,
            invoice=invoice,
            customer=invoice.customer,
            payment_date=data.get('payment_date', datetime.date.today()),
            amount=amount,
            payment_mode=data.get('payment_mode', 'bank_transfer'),
            transaction_reference=data.get('transaction_reference', ''),
            notes=data.get('notes', ''),
            recorded_by=request.user
        )

        # Update invoice balance and status
        invoice.paid_amount += amount
        invoice.balance_amount = max(Decimal('0.00'), invoice.total_amount - invoice.paid_amount)
        if invoice.balance_amount == Decimal('0.00'):
            invoice.status = 'paid'
        else:
            invoice.status = 'partially_paid'
        invoice.save()

        # Update customer current outstanding
        if hasattr(invoice.customer, 'outstanding_balance'):
            invoice.customer.outstanding_balance = max(Decimal('0.00'), invoice.customer.outstanding_balance - amount)
            invoice.customer.save()

        # Trigger Double-Entry Accounting
        record_customer_payment_journal(payment, Account, JournalEntry, JournalEntryLine, user=request.user)

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-expense_date')
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]


# ==========================================
# 6. ACCOUNTING & REPORTS
# ==========================================

class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all().order_by('code')
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def chart_of_accounts(self, request):
        ensure_chart_of_accounts(Account)
        accounts = Account.objects.all().order_by('code')
        return Response(AccountSerializer(accounts, many=True).data)


class JournalEntryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = JournalEntry.objects.all().prefetch_related('lines__account').order_by('-entry_date', '-created_at')
    serializer_class = JournalEntrySerializer
    permission_classes = [IsAuthenticated]


class AccountingReportsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        report_type = request.query_params.get('type', 'trial_balance')

        # Trial Balance
        if report_type == 'trial_balance':
            ensure_chart_of_accounts(Account)
            accounts = Account.objects.all().order_by('code')
            lines = []
            tot_dr = Decimal('0.00')
            tot_cr = Decimal('0.00')

            for acct in accounts:
                dr_sum = JournalEntryLine.objects.filter(account=acct).aggregate(Sum('debit'))['debit__sum'] or Decimal('0.00')
                cr_sum = JournalEntryLine.objects.filter(account=acct).aggregate(Sum('credit'))['credit__sum'] or Decimal('0.00')

                net = dr_sum - cr_sum
                if acct.account_type in ['asset', 'expense']:
                    debit_val = max(Decimal('0.00'), net)
                    credit_val = max(Decimal('0.00'), -net)
                else:
                    debit_val = max(Decimal('0.00'), -net)
                    credit_val = max(Decimal('0.00'), net)

                if debit_val > 0 or credit_val > 0:
                    lines.append({
                        'code': acct.code,
                        'name': acct.name,
                        'type': acct.account_type,
                        'debit': debit_val,
                        'credit': credit_val
                    })
                    tot_dr += debit_val
                    tot_cr += credit_val

            return Response({
                'report': 'Trial Balance',
                'as_on': datetime.date.today(),
                'accounts': lines,
                'total_debit': tot_dr,
                'total_credit': tot_cr,
                'is_balanced': tot_dr == tot_cr
            })

        # Profit & Loss
        elif report_type == 'pnl':
            sales_rev = Invoice.objects.filter(status__in=['issued', 'paid', 'partially_paid']).aggregate(Sum('subtotal'))['subtotal__sum'] or Decimal('0.00')
            purchases = PurchaseBill.objects.filter(status__in=['posted', 'paid', 'partially_paid']).aggregate(Sum('subtotal'))['subtotal__sum'] or Decimal('0.00')
            expenses = Expense.objects.filter(status='approved').aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

            gross_profit = sales_rev - purchases
            net_profit = gross_profit - expenses

            return Response({
                'sales_revenue': sales_rev,
                'cost_of_purchases': purchases,
                'gross_profit': gross_profit,
                'operating_expenses': expenses,
                'net_profit': net_profit,
                'profit_margin_pct': round((net_profit / sales_rev * 100) if sales_rev > 0 else 0, 2)
            })

        # Balance Sheet
        elif report_type == 'balance_sheet':
            cash = Payment.objects.aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')
            ar = Invoice.objects.filter(status__in=['issued', 'partially_paid']).aggregate(Sum('balance_amount'))['balance_amount__sum'] or Decimal('0.00')
            stock_val = ProductService.objects.filter(item_type='product').aggregate(
                val=Sum(F('current_stock') * F('unit_price'))
            )['val'] or Decimal('0.00')

            ap = PurchaseBill.objects.filter(status__in=['posted', 'partially_paid']).aggregate(Sum('balance_amount'))['balance_amount__sum'] or Decimal('0.00')
            output_tax = Invoice.objects.filter(status__in=['issued', 'paid', 'partially_paid']).aggregate(Sum('total_tax'))['total_tax__sum'] or Decimal('0.00')
            input_tax = PurchaseBill.objects.filter(status__in=['posted', 'paid', 'partially_paid']).aggregate(Sum('total_tax'))['total_tax__sum'] or Decimal('0.00')
            net_gst_payable = max(Decimal('0.00'), output_tax - input_tax)

            total_assets = cash + ar + stock_val
            total_liabilities = ap + net_gst_payable
            equity = total_assets - total_liabilities

            return Response({
                'assets': {
                    'cash_and_bank': cash,
                    'accounts_receivable': ar,
                    'inventory_stock': stock_val,
                    'total_assets': total_assets
                },
                'liabilities': {
                    'accounts_payable': ap,
                    'net_gst_payable': net_gst_payable,
                    'total_liabilities': total_liabilities
                },
                'equity': {
                    'retained_earnings': equity,
                    'total_equity_and_liabilities': total_liabilities + equity
                }
            })

        return Response({'detail': 'Invalid report type'}, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# 7. GST COMPLIANCE & RETURNS (GSTR-1, GSTR-3B)
# ==========================================

class GSTComplianceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        mode = request.query_params.get('mode', 'summary')
        period = request.query_params.get('period', '11-2026')

        invoices = Invoice.objects.filter(status__in=['issued', 'paid', 'partially_paid'])
        purchases = PurchaseBill.objects.filter(status__in=['posted', 'paid', 'partially_paid'])

        total_taxable_out = invoices.aggregate(Sum('subtotal'))['subtotal__sum'] or Decimal('0.00')
        cgst_out = invoices.aggregate(Sum('cgst'))['cgst__sum'] or Decimal('0.00')
        sgst_out = invoices.aggregate(Sum('sgst'))['sgst__sum'] or Decimal('0.00')
        igst_out = invoices.aggregate(Sum('igst'))['igst__sum'] or Decimal('0.00')
        cess_out = invoices.aggregate(Sum('cess_amount'))['cess_amount__sum'] or Decimal('0.00')
        total_tax_out = cgst_out + sgst_out + igst_out + cess_out

        total_taxable_in = purchases.aggregate(Sum('subtotal'))['subtotal__sum'] or Decimal('0.00')
        cgst_in = purchases.filter(itc_eligibility__startswith='eligible').aggregate(Sum('cgst'))['cgst__sum'] or Decimal('0.00')
        sgst_in = purchases.filter(itc_eligibility__startswith='eligible').aggregate(Sum('sgst'))['sgst__sum'] or Decimal('0.00')
        igst_in = purchases.filter(itc_eligibility__startswith='eligible').aggregate(Sum('igst'))['igst__sum'] or Decimal('0.00')
        itc_total = cgst_in + sgst_in + igst_in

        net_gst_payable = max(Decimal('0.00'), total_tax_out - itc_total)

        if mode == 'gstr1':
            # GSTR-1 Sections: B2B, B2C Large, B2C Small, HSN Summary
            b2b_invoices = []
            b2cs_invoices = []
            hsn_map = {}

            for inv in invoices:
                has_gstin = bool(inv.customer.gstin and len(inv.customer.gstin) == 15)
                inv_data = {
                    'inum': inv.invoice_number,
                    'idt': inv.invoice_date.strftime('%d-%m-%Y'),
                    'val': float(inv.total_amount),
                    'pos': inv.place_of_supply_code,
                    'rchrg': 'Y' if inv.is_rcm else 'N',
                    'inv_typ': 'R',
                    'txval': float(inv.subtotal),
                    'cgst': float(inv.cgst),
                    'sgst': float(inv.sgst),
                    'igst': float(inv.igst),
                }
                if has_gstin:
                    b2b_invoices.append({
                        'ctin': inv.customer.gstin,
                        'cname': inv.customer.company_name,
                        **inv_data
                    })
                else:
                    b2cs_invoices.append(inv_data)

                for item in inv.items.all():
                    hsn = item.hsn_sac
                    if hsn not in hsn_map:
                        hsn_map[hsn] = {
                            'hsn_sc': hsn,
                            'desc': item.description or item.item_name,
                            'uqc': item.unit or 'NOS',
                            'qty': 0,
                            'val': 0.0,
                            'txval': 0.0,
                            'iamt': 0.0,
                            'camt': 0.0,
                            'samt': 0.0
                        }
                    hsn_map[hsn]['qty'] += float(item.quantity)
                    hsn_map[hsn]['val'] += float(item.total)
                    hsn_map[hsn]['txval'] += float(item.taxable_value)
                    hsn_map[hsn]['iamt'] += float(item.igst_amount)
                    hsn_map[hsn]['camt'] += float(item.cgst_amount)
                    hsn_map[hsn]['samt'] += float(item.sgst_amount)

            return Response({
                'return_type': 'GSTR-1',
                'period': period,
                'gstin': '21AAACR1234F1Z5',
                'b2b': b2b_invoices,
                'b2cs': b2cs_invoices,
                'hsn_summary': list(hsn_map.values()),
                'total_taxable_value': total_taxable_out,
                'total_tax': total_tax_out
            })

        elif mode == 'gstr3b':
            return Response({
                'return_type': 'GSTR-3B',
                'period': period,
                'table_3_1_outward_supplies': {
                    'taxable_supplies': total_taxable_out,
                    'igst': igst_out,
                    'cgst': cgst_out,
                    'sgst': sgst_out,
                    'cess': cess_out
                },
                'table_4_eligible_itc': {
                    'all_other_itc': itc_total,
                    'igst_itc': igst_in,
                    'cgst_itc': cgst_in,
                    'sgst_itc': sgst_in
                },
                'table_5_1_tax_payable': {
                    'cgst_payable': max(Decimal('0.00'), cgst_out - cgst_in),
                    'sgst_payable': max(Decimal('0.00'), sgst_out - sgst_in),
                    'igst_payable': max(Decimal('0.00'), igst_out - igst_in),
                    'total_cash_payable': net_gst_payable
                }
            })

        return Response({
            'taxable_sales': total_taxable_out,
            'gst_collected': total_tax_out,
            'itc_available': itc_total,
            'net_gst_payable': net_gst_payable,
            'cgst_balance': cgst_out,
            'sgst_balance': sgst_out,
            'igst_balance': igst_out
        })


# ==========================================
# 8. BILLING DASHBOARD STATS
# ==========================================

class BillingDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        invoices = Invoice.objects.all()
        purchases = PurchaseBill.objects.all()
        expenses = Expense.objects.all()

        total_sales = invoices.filter(status__in=['issued', 'paid', 'partially_paid']).aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00')
        taxable_sales = invoices.filter(status__in=['issued', 'paid', 'partially_paid']).aggregate(Sum('subtotal'))['subtotal__sum'] or Decimal('0.00')
        gst_collected = invoices.filter(status__in=['issued', 'paid', 'partially_paid']).aggregate(Sum('total_tax'))['total_tax__sum'] or Decimal('0.00')

        total_purchases = purchases.filter(status__in=['posted', 'paid', 'partially_paid']).aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00')
        gst_paid = purchases.filter(status__in=['posted', 'paid', 'partially_paid']).aggregate(Sum('total_tax'))['total_tax__sum'] or Decimal('0.00')
        itc_available = purchases.filter(itc_eligibility__startswith='eligible', status__in=['posted', 'paid', 'partially_paid']).aggregate(Sum('total_tax'))['total_tax__sum'] or Decimal('0.00')

        net_gst_payable = max(Decimal('0.00'), gst_collected - itc_available)
        total_receivables = invoices.filter(status__in=['issued', 'partially_paid']).aggregate(Sum('balance_amount'))['balance_amount__sum'] or Decimal('0.00')
        total_payables = purchases.filter(status__in=['posted', 'partially_paid']).aggregate(Sum('balance_amount'))['balance_amount__sum'] or Decimal('0.00')
        total_expenses = expenses.filter(status='approved').aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

        gross_profit = taxable_sales - (purchases.aggregate(Sum('subtotal'))['subtotal__sum'] or Decimal('0.00'))
        net_profit = gross_profit - total_expenses

        # Low stock count
        low_stock_products = ProductService.objects.filter(
            item_type='product',
            current_stock__lte=F('min_stock_alert')
        ).values('id', 'name', 'sku', 'current_stock', 'min_stock_alert')[:5]

        # Recent transactions
        recent_invoices = Invoice.objects.select_related('customer').order_by('-created_at')[:5]
        recent_tx = [
            {
                'id': str(inv.id),
                'invoice_number': inv.invoice_number,
                'customer': inv.customer.company_name,
                'amount': inv.total_amount,
                'date': inv.invoice_date,
                'status': inv.status
            }
            for inv in recent_invoices
        ]

        return Response({
            'total_sales': total_sales,
            'taxable_sales': taxable_sales,
            'gst_collected': gst_collected,
            'total_purchases': total_purchases,
            'gst_paid': gst_paid,
            'itc_available': itc_available,
            'net_gst_payable': net_gst_payable,
            'total_receivables': total_receivables,
            'total_payables': total_payables,
            'total_expenses': total_expenses,
            'gross_profit': gross_profit,
            'net_profit': net_profit,
            'invoices_count': invoices.count(),
            'paid_invoices_count': invoices.filter(status='paid').count(),
            'unpaid_invoices_count': invoices.filter(status__in=['issued', 'partially_paid']).count(),
            'overdue_invoices_count': invoices.filter(status='overdue').count(),
            'low_stock_items': list(low_stock_products),
            'recent_transactions': recent_tx
        })
