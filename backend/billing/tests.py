from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
import datetime

from billing.gst_engine import (
    calculate_line_item,
    calculate_invoice_totals,
    number_to_indian_currency_words,
    is_intra_state_supply,
    get_state_code
)
from billing.accounting_engine import (
    ensure_chart_of_accounts,
    record_sales_invoice_journal,
    record_customer_payment_journal,
    record_purchase_bill_journal
)
from billing.models import (
    CompanyProfile, Branch, Customer, Supplier, ProductService,
    Invoice, InvoiceItem, PurchaseBill, Account, JournalEntry, JournalEntryLine
)

User = get_user_model()


class GSTEngineTests(TestCase):
    def test_intra_state_determination(self):
        """When supplier and place of supply are in the same state, it is Intra-State."""
        is_intra = is_intra_state_supply('Odisha', 'Odisha')
        self.assertTrue(is_intra)

    def test_inter_state_determination(self):
        """When supplier and place of supply are in different states, it is Inter-State."""
        is_intra = is_intra_state_supply('Odisha', 'Maharashtra')
        self.assertFalse(is_intra)

    def test_intra_state_gst_calculation(self):
        """Intra-State ₹10,000 @ 18% splits equally into CGST 9% (₹900) and SGST 9% (₹900)."""
        calc = calculate_line_item(
            quantity=Decimal('1'),
            unit_price=Decimal('10000.00'),
            discount_type='percentage',
            discount_value=Decimal('0.00'),
            gst_rate=Decimal('18.00'),
            is_intra_state=True
        )
        self.assertEqual(calc['taxable_value'], Decimal('10000.00'))
        self.assertEqual(calc['cgst_amount'], Decimal('900.00'))
        self.assertEqual(calc['sgst_amount'], Decimal('900.00'))
        self.assertEqual(calc['igst_amount'], Decimal('0.00'))
        self.assertEqual(calc['total_amount'], Decimal('11800.00'))

    def test_inter_state_gst_calculation(self):
        """Inter-State ₹10,000 @ 18% applies IGST 18% (₹1,800)."""
        calc = calculate_line_item(
            quantity=Decimal('1'),
            unit_price=Decimal('10000.00'),
            discount_type='percentage',
            discount_value=Decimal('0.00'),
            gst_rate=Decimal('18.00'),
            is_intra_state=False
        )
        self.assertEqual(calc['taxable_value'], Decimal('10000.00'))
        self.assertEqual(calc['cgst_amount'], Decimal('0.00'))
        self.assertEqual(calc['sgst_amount'], Decimal('0.00'))
        self.assertEqual(calc['igst_amount'], Decimal('1800.00'))
        self.assertEqual(calc['total_amount'], Decimal('11800.00'))

    def test_sequential_discount_calculation(self):
        """Example 3 from prompt: ₹10,000 with 10% first disc = ₹9,000, then 5% second disc = ₹8,550."""
        calc = calculate_line_item(
            quantity=Decimal('1'),
            unit_price=Decimal('10000.00'),
            discount_type='percentage',
            discount_value=Decimal('10.00'),
            sequential_discount_pct=Decimal('5.00'),
            gst_rate=Decimal('18.00'),
            is_intra_state=True
        )
        self.assertEqual(calc['taxable_value'], Decimal('8550.00'))
        self.assertEqual(calc['cgst_amount'], Decimal('769.50'))
        self.assertEqual(calc['sgst_amount'], Decimal('769.50'))
        self.assertEqual(calc['total_amount'], Decimal('10089.00'))

    def test_indian_currency_words_conversion(self):
        words = number_to_indian_currency_words(Decimal('413000.00'))
        self.assertIn('Four Lakh Thirteen Thousand', words)


class DoubleEntryAccountingTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='accountant@odiaserp.com',
            email='accountant@odiaserp.com',
            password='testpassword'
        )
        ensure_chart_of_accounts(Account)
        self.company = CompanyProfile.objects.create(
            company_name='Odias ERP Technologies Pvt Ltd',
            pan='AAACR1234F',
            gstin='21AAACR1234F1Z5',
            state='Odisha',
            pincode='751024',
            state_code='21'
        )
        self.customer = Customer.objects.create(
            customer_code='CUST-TEST',
            company_name='Test Technologies Ltd',
            contact_person='Rohit Sharma',
            email='rohit@testcorp.in',
            phone='9876543210',
            state='Odisha',
            gstin='21AABCT9988P1Z8'
        )

    def test_sales_invoice_journal_balances(self):
        """When an invoice is issued, debit customer and credit sales + GST. Total Dr must equal Total Cr."""
        invoice = Invoice.objects.create(
            invoice_number='INV-TEST-001',
            customer=self.customer,
            invoice_date=datetime.date.today(),
            due_date=datetime.date.today() + datetime.timedelta(days=15),
            place_of_supply='Odisha (21)',
            place_of_supply_code='21',
            is_intra_state=True,
            subtotal=Decimal('100000.00'),
            cgst=Decimal('9000.00'),
            sgst=Decimal('9000.00'),
            igst=Decimal('0.00'),
            total_tax=Decimal('18000.00'),
            total_amount=Decimal('118000.00'),
            paid_amount=Decimal('0.00'),
            balance_amount=Decimal('118000.00'),
            status='issued'
        )

        entry = record_sales_invoice_journal(invoice, Account, JournalEntry, JournalEntryLine, user=self.user)
        self.assertIsNotNone(entry)
        total_dr = sum(l.debit for l in entry.lines.all())
        total_cr = sum(l.credit for l in entry.lines.all())
        self.assertEqual(total_dr, Decimal('118000.00'))
        self.assertEqual(total_cr, Decimal('118000.00'))
        self.assertEqual(total_dr, total_cr)

    def test_idempotent_journal_posting(self):
        """Calling record_sales_invoice_journal twice must not create duplicate journal entries."""
        invoice = Invoice.objects.create(
            invoice_number='INV-TEST-002',
            customer=self.customer,
            invoice_date=datetime.date.today(),
            due_date=datetime.date.today() + datetime.timedelta(days=15),
            place_of_supply='Odisha (21)',
            place_of_supply_code='21',
            is_intra_state=True,
            subtotal=Decimal('50000.00'),
            cgst=Decimal('4500.00'),
            sgst=Decimal('4500.00'),
            total_tax=Decimal('9000.00'),
            total_amount=Decimal('59000.00'),
            paid_amount=Decimal('0.00'),
            balance_amount=Decimal('59000.00'),
            status='issued'
        )

        entry1 = record_sales_invoice_journal(invoice, Account, JournalEntry, JournalEntryLine, user=self.user)
        entry2 = record_sales_invoice_journal(invoice, Account, JournalEntry, JournalEntryLine, user=self.user)
        self.assertEqual(entry1.id, entry2.id)
        self.assertEqual(JournalEntry.objects.filter(reference_type='invoice', reference_id=str(invoice.id)).count(), 1)
