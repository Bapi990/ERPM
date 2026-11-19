from rest_framework import serializers
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


class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyProfile
        fields = '__all__'


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = '__all__'


class FinancialYearSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialYearSetting
        fields = '__all__'


class TaxRateMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxRateMaster
        fields = '__all__'


class HSNMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = HSNMaster
        fields = '__all__'


class SACMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = SACMaster
        fields = '__all__'


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'


class ProductServiceSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = ProductService
        fields = '__all__'

    def get_is_low_stock(self, obj):
        if obj.item_type == 'product':
            return obj.current_stock <= obj.min_stock_alert
        return False


class StockLedgerSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)

    class Meta:
        model = StockLedger
        fields = '__all__'


class StockAdjustmentSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)

    class Meta:
        model = StockAdjustment
        fields = '__all__'


class StockTransferSerializer(serializers.ModelSerializer):
    from_warehouse_name = serializers.CharField(source='from_warehouse.name', read_only=True)
    to_warehouse_name = serializers.CharField(source='to_warehouse.name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = StockTransfer
        fields = '__all__'


class QuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationItem
        fields = '__all__'


class QuotationSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    customer_gstin = serializers.CharField(source='customer.gstin', read_only=True)
    items = QuotationItemSerializer(many=True, read_only=True)

    class Meta:
        model = Quotation
        fields = '__all__'


class SalesOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesOrderItem
        fields = '__all__'


class SalesOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    customer_gstin = serializers.CharField(source='customer.gstin', read_only=True)
    items = SalesOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = SalesOrder
        fields = '__all__'


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = '__all__'


class PaymentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)

    class Meta:
        model = Payment
        fields = '__all__'


class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    customer_gstin = serializers.CharField(source='customer.gstin', read_only=True)
    customer_pan = serializers.CharField(source='customer.pan', read_only=True)
    customer_address = serializers.CharField(source='customer.address', read_only=True)
    customer_state = serializers.CharField(source='customer.state', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'


class CreditNoteSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    original_invoice_number = serializers.CharField(source='original_invoice.invoice_number', read_only=True)

    class Meta:
        model = CreditNote
        fields = '__all__'


class DebitNoteSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.company_name', read_only=True)

    class Meta:
        model = DebitNote
        fields = '__all__'


class RecurringInvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)

    class Meta:
        model = RecurringInvoice
        fields = '__all__'


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderItem
        fields = '__all__'


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.company_name', read_only=True)
    supplier_gstin = serializers.CharField(source='supplier.gstin', read_only=True)
    items = PurchaseOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = '__all__'


class PurchaseBillItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseBillItem
        fields = '__all__'


class PurchaseBillSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.company_name', read_only=True)
    supplier_gstin = serializers.CharField(source='supplier.gstin', read_only=True)
    items = PurchaseBillItemSerializer(many=True, read_only=True)

    class Meta:
        model = PurchaseBill
        fields = '__all__'


class SupplierPaymentSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.company_name', read_only=True)
    bill_number = serializers.CharField(source='purchase_bill.bill_number', read_only=True)

    class Meta:
        model = SupplierPayment
        fields = '__all__'


class ExpenseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Expense
        fields = '__all__'


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = '__all__'


class JournalEntryLineSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    account_code = serializers.CharField(source='account.code', read_only=True)

    class Meta:
        model = JournalEntryLine
        fields = '__all__'


class JournalEntrySerializer(serializers.ModelSerializer):
    lines = JournalEntryLineSerializer(many=True, read_only=True)
    total_debit = serializers.SerializerMethodField()
    total_credit = serializers.SerializerMethodField()

    class Meta:
        model = JournalEntry
        fields = '__all__'

    def get_total_debit(self, obj):
        return sum(line.debit for line in obj.lines.all())

    def get_total_credit(self, obj):
        return sum(line.credit for line in obj.lines.all())


class GSTReturnRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = GSTReturnRecord
        fields = '__all__'


class EInvoiceRecordSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)

    class Meta:
        model = EInvoiceRecord
        fields = '__all__'


class EWayBillRecordSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)

    class Meta:
        model = EWayBillRecord
        fields = '__all__'
