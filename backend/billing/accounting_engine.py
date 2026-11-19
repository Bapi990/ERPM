"""
Double-Entry Accounting Automation Engine for Odias ERP Billing.
Automatically creates balanced Journal Entries for Invoices, Receipts,
Purchase Bills, Supplier Payments, and Credit Notes without duplication.
"""

from decimal import Decimal
from django.db import transaction

# Standard Chart of Accounts Code Map
DEFAULT_ACCOUNTS = [
    # Assets (1000s)
    ('1001', 'Cash in Hand', 'asset', 'Liquid cash reserves'),
    ('1010', 'Primary Bank Account (HDFC/SBI)', 'asset', 'Operating bank account'),
    ('1020', 'Accounts Receivable (Trade Debtors)', 'asset', 'Customer balances due'),
    ('1030', 'Inventory / Stock on Hand', 'asset', 'Valuation of physical stock'),
    ('1041', 'Input CGST (ITC Receivable)', 'asset', 'CGST paid on business purchases'),
    ('1042', 'Input SGST (ITC Receivable)', 'asset', 'SGST paid on business purchases'),
    ('1043', 'Input IGST (ITC Receivable)', 'asset', 'IGST paid on inter-state purchases'),
    ('1044', 'Input Compensation Cess', 'asset', 'Cess paid on eligible purchases'),
    
    # Liabilities (2000s)
    ('2010', 'Accounts Payable (Trade Creditors)', 'liability', 'Supplier balances payable'),
    ('2021', 'Output CGST Payable', 'liability', 'Central GST collected on sales'),
    ('2022', 'Output SGST Payable', 'liability', 'State GST collected on sales'),
    ('2023', 'Output IGST Payable', 'liability', 'Integrated GST collected on sales'),
    ('2024', 'Output Compensation Cess Payable', 'liability', 'Cess collected on sales'),
    ('2030', 'RCM Tax Liability', 'liability', 'Reverse charge mechanism tax liability'),
    
    # Equity (3000s)
    ('3001', 'Owners Capital & Equity', 'equity', 'Share capital and promoters equity'),
    ('3010', 'Retained Earnings', 'equity', 'Accumulated reserves & surplus'),
    
    # Income (4000s)
    ('4001', 'Sales Revenue (Goods)', 'income', 'Revenue from sale of products'),
    ('4010', 'Service Revenue (Consulting & SaaS)', 'income', 'Revenue from services rendered'),
    ('4020', 'Other Operating Income', 'income', 'Incidental income & interest'),
    
    # Expenses (5000s)
    ('5001', 'Cost of Goods Sold (Purchases)', 'expense', 'Direct purchase cost of inventory'),
    ('5010', 'Discounts Allowed', 'expense', 'Trade and promotional discounts given'),
    ('5020', 'Office Rent & Facilities', 'expense', 'Operating rent expenses'),
    ('5030', 'Electricity & Utilities', 'expense', 'Utility and power expenses'),
    ('5040', 'Cloud Infrastructure & SaaS', 'expense', 'Hosting and software subscriptions'),
    ('5050', 'Round Off Expense / Adjustment', 'expense', 'Rounding adjustments on invoices'),
]


def ensure_chart_of_accounts(Account):
    """Seed or verify default Chart of Accounts."""
    for code, name, acct_type, desc in DEFAULT_ACCOUNTS:
        Account.objects.get_or_create(
            code=code,
            defaults={
                'name': name,
                'account_type': acct_type,
                'description': desc,
                'is_system': True,
                'balance': Decimal('0.00'),
            }
        )


def get_account_by_code(Account, code: str):
    return Account.objects.filter(code=code).first()


@transaction.atomic
def record_sales_invoice_journal(invoice, Account, JournalEntry, JournalEntryLine, user=None):
    """
    Generate balanced double-entry accounting entry for a posted Tax Invoice.
    Debit: Accounts Receivable (1020) = Grand Total
    Credit: Sales Revenue (4001/4010) = Subtotal Taxable
    Credit: Output CGST (2021) = CGST
    Credit: Output SGST (2022) = SGST
    Credit: Output IGST (2023) = IGST
    Credit: Output Cess (2024) = Cess
    Debit/Credit: Round Off (5050) = Round Off Diff
    """
    ensure_chart_of_accounts(Account)

    # Check idempotency to prevent duplicate entries
    existing = JournalEntry.objects.filter(
        reference_type='invoice',
        reference_id=str(invoice.id)
    ).first()
    if existing:
        return existing

    entry_count = JournalEntry.objects.count() + 1
    entry = JournalEntry.objects.create(
        entry_number=f"JV-INV-{entry_count:05d}",
        entry_date=invoice.invoice_date,
        reference_type='invoice',
        reference_id=str(invoice.id),
        narration=f"Sales Tax Invoice {invoice.invoice_number} to {invoice.customer.company_name}",
        is_posted=True,
        created_by=user
    )

    ar_acct = get_account_by_code(Account, '1020')
    sales_acct = get_account_by_code(Account, '4001')
    cgst_acct = get_account_by_code(Account, '2021')
    sgst_acct = get_account_by_code(Account, '2022')
    igst_acct = get_account_by_code(Account, '2023')
    cess_acct = get_account_by_code(Account, '2024')
    round_off_acct = get_account_by_code(Account, '5050')

    # Debit Trade Debtors
    JournalEntryLine.objects.create(
        journal_entry=entry,
        account=ar_acct,
        debit=invoice.total_amount,
        credit=Decimal('0.00'),
        description=f"Debtor: {invoice.customer.company_name}"
    )

    # Credit Sales Revenue
    JournalEntryLine.objects.create(
        journal_entry=entry,
        account=sales_acct,
        debit=Decimal('0.00'),
        credit=invoice.subtotal,
        description=f"Revenue: Invoice {invoice.invoice_number}"
    )

    # Credit Tax liabilities
    if invoice.cgst > Decimal('0.00'):
        JournalEntryLine.objects.create(
            journal_entry=entry,
            account=cgst_acct,
            debit=Decimal('0.00'),
            credit=invoice.cgst,
            description="Central GST Output Tax"
        )
    if invoice.sgst > Decimal('0.00'):
        JournalEntryLine.objects.create(
            journal_entry=entry,
            account=sgst_acct,
            debit=Decimal('0.00'),
            credit=invoice.sgst,
            description="State GST Output Tax"
        )
    if invoice.igst > Decimal('0.00'):
        JournalEntryLine.objects.create(
            journal_entry=entry,
            account=igst_acct,
            debit=Decimal('0.00'),
            credit=invoice.igst,
            description="Integrated GST Output Tax"
        )
    if getattr(invoice, 'cess_amount', Decimal('0.00')) > Decimal('0.00'):
        JournalEntryLine.objects.create(
            journal_entry=entry,
            account=cess_acct,
            debit=Decimal('0.00'),
            credit=invoice.cess_amount,
            description="Compensation Cess Output Tax"
        )

    # Round Off
    if invoice.round_off != Decimal('0.00'):
        if invoice.round_off > Decimal('0.00'):
            # Positive round-off is income / credit
            JournalEntryLine.objects.create(
                journal_entry=entry,
                account=round_off_acct,
                debit=Decimal('0.00'),
                credit=invoice.round_off,
                description="Round-off addition"
            )
        else:
            # Negative round-off is discount / debit
            JournalEntryLine.objects.create(
                journal_entry=entry,
                account=round_off_acct,
                debit=abs(invoice.round_off),
                credit=Decimal('0.00'),
                description="Round-off reduction"
            )

    return entry


@transaction.atomic
def record_customer_payment_journal(payment, Account, JournalEntry, JournalEntryLine, user=None):
    """
    Generate balanced entry for customer payment receipt.
    Debit: Bank (1010) or Cash (1001) = Payment Amount
    Credit: Accounts Receivable (1020) = Payment Amount
    """
    ensure_chart_of_accounts(Account)

    existing = JournalEntry.objects.filter(
        reference_type='payment',
        reference_id=str(payment.id)
    ).first()
    if existing:
        return existing

    bank_code = '1001' if payment.payment_mode == 'cash' else '1010'
    bank_acct = get_account_by_code(Account, bank_code)
    ar_acct = get_account_by_code(Account, '1020')

    entry_count = JournalEntry.objects.count() + 1
    entry = JournalEntry.objects.create(
        entry_number=f"JV-RCP-{entry_count:05d}",
        entry_date=payment.payment_date,
        reference_type='payment',
        reference_id=str(payment.id),
        narration=f"Receipt {payment.payment_number} from {payment.customer.company_name} via {payment.payment_mode}",
        is_posted=True,
        created_by=user
    )

    # Debit Bank/Cash
    JournalEntryLine.objects.create(
        journal_entry=entry,
        account=bank_acct,
        debit=payment.amount,
        credit=Decimal('0.00'),
        description=f"Collection ({payment.payment_mode}) Ref: {payment.transaction_reference or 'N/A'}"
    )

    # Credit AR
    JournalEntryLine.objects.create(
        journal_entry=entry,
        account=ar_acct,
        debit=Decimal('0.00'),
        credit=payment.amount,
        description=f"Payment for {payment.invoice.invoice_number}"
    )

    return entry


@transaction.atomic
def record_purchase_bill_journal(bill, Account, JournalEntry, JournalEntryLine, user=None):
    """
    Generate balanced entry for a posted Purchase Bill.
    Debit: Cost of Goods / Purchases (5001) = Taxable Amount
    Debit: Input CGST (1041) = CGST (if eligible ITC)
    Debit: Input SGST (1042) = SGST (if eligible ITC)
    Debit: Input IGST (1043) = IGST (if eligible ITC)
    Credit: Accounts Payable (2010) = Total Bill Amount
    """
    ensure_chart_of_accounts(Account)

    existing = JournalEntry.objects.filter(
        reference_type='purchase',
        reference_id=str(bill.id)
    ).first()
    if existing:
        return existing

    purch_acct = get_account_by_code(Account, '5001')
    ap_acct = get_account_by_code(Account, '2010')
    cgst_in = get_account_by_code(Account, '1041')
    sgst_in = get_account_by_code(Account, '1042')
    igst_in = get_account_by_code(Account, '1043')

    entry_count = JournalEntry.objects.count() + 1
    entry = JournalEntry.objects.create(
        entry_number=f"JV-PUR-{entry_count:05d}",
        entry_date=bill.bill_date,
        reference_type='purchase',
        reference_id=str(bill.id),
        narration=f"Purchase Bill {bill.bill_number} from {bill.supplier.company_name}",
        is_posted=True,
        created_by=user
    )

    # Debit Purchase
    JournalEntryLine.objects.create(
        journal_entry=entry,
        account=purch_acct,
        debit=bill.subtotal,
        credit=Decimal('0.00'),
        description="Purchases / Raw Material / Services"
    )

    # Debit ITC Tax Assets (if eligible)
    if bill.itc_eligibility != 'ineligible':
        if bill.cgst > Decimal('0.00'):
            JournalEntryLine.objects.create(
                journal_entry=entry,
                account=cgst_in,
                debit=bill.cgst,
                credit=Decimal('0.00'),
                description="Eligible Input CGST"
            )
        if bill.sgst > Decimal('0.00'):
            JournalEntryLine.objects.create(
                journal_entry=entry,
                account=sgst_in,
                debit=bill.sgst,
                credit=Decimal('0.00'),
                description="Eligible Input SGST"
            )
        if bill.igst > Decimal('0.00'):
            JournalEntryLine.objects.create(
                journal_entry=entry,
                account=igst_in,
                debit=bill.igst,
                credit=Decimal('0.00'),
                description="Eligible Input IGST"
            )
    else:
        # If ineligible, total tax is capitalized into purchase expense
        ineligible_tax = bill.cgst + bill.sgst + bill.igst + getattr(bill, 'cess', Decimal('0.00'))
        if ineligible_tax > Decimal('0.00'):
            JournalEntryLine.objects.create(
                journal_entry=entry,
                account=purch_acct,
                debit=ineligible_tax,
                credit=Decimal('0.00'),
                description="Ineligible ITC capitalized to expense"
            )

    # Credit Trade Creditors
    JournalEntryLine.objects.create(
        journal_entry=entry,
        account=ap_acct,
        debit=Decimal('0.00'),
        credit=bill.total_amount,
        description=f"Creditor: {bill.supplier.company_name}"
    )

    return entry
