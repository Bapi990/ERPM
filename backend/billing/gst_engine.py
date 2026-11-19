"""
Advanced Indian GST Calculation & Pricing Engine for Odias ERP.
Compliant with GST Valuation Rules, Intra/Inter-state determinations,
Sequential and Line Discounts, RCM, Cess, and Decimal financial precision.
"""

from decimal import Decimal, ROUND_HALF_UP

# Official 2-digit GST State Codes
GST_STATE_CODES = {
    '01': 'Jammu & Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '26': 'Dadra & Nagar Haveli and Daman & Diu',
    '27': 'Maharashtra',
    '29': 'Karnataka',
    '30': 'Goa',
    '31': 'Lakshadweep',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '34': 'Puducherry',
    '35': 'Andaman & Nicobar Islands',
    '36': 'Telangana',
    '37': 'Andhra Pradesh',
    '38': 'Ladakh',
    '97': 'Other Territory',
    '99': 'Centre Jurisdiction',
}

STATE_NAME_TO_CODE = {v.lower(): k for k, v in GST_STATE_CODES.items()}
STATE_NAME_TO_CODE['odisha'] = '21'
STATE_NAME_TO_CODE['orissa'] = '21'
STATE_NAME_TO_CODE['maharashtra'] = '27'
STATE_NAME_TO_CODE['delhi'] = '07'

UNION_TERRITORIES_NO_LEGISLATURE = {'04', '26', '31', '35', '38', '97'}


def get_state_code(state_input: str) -> str:
    """Resolve 2-digit state code from state name or code string."""
    if not state_input:
        return '21'  # Default to Odisha
    clean = str(state_input).strip()
    if len(clean) >= 2 and clean[:2].isdigit() and clean[:2] in GST_STATE_CODES:
        return clean[:2]
    lowered = clean.lower()
    for name, code in STATE_NAME_TO_CODE.items():
        if name in lowered or lowered in name:
            return code
    return '21'


def is_intra_state_supply(supplier_state: str, place_of_supply: str) -> bool:
    """Determine whether a supply is Intra-State (CGST + SGST/UTGST) or Inter-State (IGST)."""
    s_code = get_state_code(supplier_state)
    pos_code = get_state_code(place_of_supply)
    return s_code == pos_code


def round_decimal(val: Decimal, places: int = 2) -> Decimal:
    """Safe rounding to specified decimal places."""
    q = Decimal('10') ** -places
    return val.quantize(q, rounding=ROUND_HALF_UP)


def calculate_line_item(
    quantity: Decimal,
    unit_price: Decimal,
    discount_type: str = 'percentage',
    discount_value: Decimal = Decimal('0.00'),
    sequential_discount_pct: Decimal = Decimal('0.00'),
    gst_rate: Decimal = Decimal('18.00'),
    cess_rate: Decimal = Decimal('0.00'),
    is_tax_inclusive: bool = False,
    is_intra_state: bool = True,
    is_ut: bool = False,
    is_rcm: bool = False
) -> dict:
    """
    Calculate GST, discounts, and taxable value for a line item with high precision.
    Supports sequential discounts and tax-inclusive pricing.
    """
    quantity = Decimal(str(quantity))
    unit_price = Decimal(str(unit_price))
    discount_value = Decimal(str(discount_value))
    sequential_discount_pct = Decimal(str(sequential_discount_pct))
    gst_rate = Decimal(str(gst_rate))
    cess_rate = Decimal(str(cess_rate))

    gross_value = quantity * unit_price

    if is_tax_inclusive:
        # Extract base price from gross value: Base = Gross / (1 + (GST+Cess)/100)
        combined_tax_factor = Decimal('1.00') + ((gst_rate + cess_rate) / Decimal('100.00'))
        taxable_gross = gross_value / combined_tax_factor
    else:
        taxable_gross = gross_value

    # First Discount
    if discount_type == 'percentage':
        first_disc_amount = (taxable_gross * discount_value) / Decimal('100.00')
    else:
        first_disc_amount = discount_value

    after_first_disc = max(Decimal('0.00'), taxable_gross - first_disc_amount)

    # Sequential Discount (if any, e.g. 10% then additional 5%)
    if sequential_discount_pct > Decimal('0.00'):
        sec_disc_amount = (after_first_disc * sequential_discount_pct) / Decimal('100.00')
    else:
        sec_disc_amount = Decimal('0.00')

    total_discount = first_disc_amount + sec_disc_amount
    taxable_value = round_decimal(max(Decimal('0.00'), taxable_gross - total_discount))

    # Calculate GST Components
    total_tax_rate = gst_rate
    cess_amount = round_decimal((taxable_value * cess_rate) / Decimal('100.00')) if cess_rate > 0 else Decimal('0.00')

    if is_rcm:
        # In Reverse Charge, recipient pays tax; supplier invoice tax is 0 in receivable total
        cgst_rate = gst_rate / Decimal('2.00') if is_intra_state else Decimal('0.00')
        sgst_rate = gst_rate / Decimal('2.00') if is_intra_state and not is_ut else Decimal('0.00')
        utgst_rate = gst_rate / Decimal('2.00') if is_intra_state and is_ut else Decimal('0.00')
        igst_rate = gst_rate if not is_intra_state else Decimal('0.00')

        cgst_amount = round_decimal((taxable_value * cgst_rate) / Decimal('100.00'))
        sgst_amount = round_decimal((taxable_value * sgst_rate) / Decimal('100.00'))
        utgst_amount = round_decimal((taxable_value * utgst_rate) / Decimal('100.00'))
        igst_amount = round_decimal((taxable_value * igst_rate) / Decimal('100.00'))
        total_gst = cgst_amount + sgst_amount + utgst_amount + igst_amount

        total_line_amount = taxable_value  # Not added to supplier invoice total if RCM
    else:
        if is_intra_state:
            half_rate = gst_rate / Decimal('2.00')
            cgst_rate = half_rate
            cgst_amount = round_decimal((taxable_value * half_rate) / Decimal('100.00'))

            if is_ut:
                sgst_rate = Decimal('0.00')
                sgst_amount = Decimal('0.00')
                utgst_rate = half_rate
                utgst_amount = round_decimal((taxable_value * half_rate) / Decimal('100.00'))
            else:
                sgst_rate = half_rate
                sgst_amount = round_decimal((taxable_value * half_rate) / Decimal('100.00'))
                utgst_rate = Decimal('0.00')
                utgst_amount = Decimal('0.00')

            igst_rate = Decimal('0.00')
            igst_amount = Decimal('0.00')
        else:
            cgst_rate = Decimal('0.00')
            cgst_amount = Decimal('0.00')
            sgst_rate = Decimal('0.00')
            sgst_amount = Decimal('0.00')
            utgst_rate = Decimal('0.00')
            utgst_amount = Decimal('0.00')
            igst_rate = gst_rate
            igst_amount = round_decimal((taxable_value * gst_rate) / Decimal('100.00'))

        total_gst = cgst_amount + sgst_amount + utgst_amount + igst_amount
        total_line_amount = taxable_value + total_gst + cess_amount

    return {
        'gross_value': round_decimal(gross_value),
        'discount_amount': round_decimal(total_discount),
        'taxable_value': taxable_value,
        'gst_rate': gst_rate,
        'cgst_rate': cgst_rate,
        'cgst_amount': cgst_amount,
        'sgst_rate': sgst_rate,
        'sgst_amount': sgst_amount,
        'utgst_rate': utgst_rate,
        'utgst_amount': utgst_amount,
        'igst_rate': igst_rate,
        'igst_amount': igst_amount,
        'cess_rate': cess_rate,
        'cess_amount': cess_amount,
        'total_tax': total_gst + cess_amount,
        'total_amount': round_decimal(total_line_amount),
    }


def calculate_invoice_totals(
    items: list,
    supplier_state: str = 'Odisha',
    place_of_supply: str = 'Odisha',
    overall_discount: Decimal = Decimal('0.00'),
    shipping_charges: Decimal = Decimal('0.00'),
    packaging_charges: Decimal = Decimal('0.00'),
    other_charges: Decimal = Decimal('0.00'),
    is_rcm: bool = False
) -> dict:
    """Calculate complete invoice totals, taxes, round-off, and HSN summary."""
    is_intra = is_intra_state_supply(supplier_state, place_of_supply)
    pos_code = get_state_code(place_of_supply)
    is_ut = pos_code in UNION_TERRITORIES_NO_LEGISLATURE

    subtotal_taxable = Decimal('0.00')
    total_cgst = Decimal('0.00')
    total_sgst = Decimal('0.00')
    total_utgst = Decimal('0.00')
    total_igst = Decimal('0.00')
    total_cess = Decimal('0.00')
    total_line_discounts = Decimal('0.00')

    calculated_items = []
    hsn_summary_map = {}

    for it in items:
        hsn = str(it.get('hsn_sac', '998314')).strip()
        calc = calculate_line_item(
            quantity=Decimal(str(it.get('quantity', 1))),
            unit_price=Decimal(str(it.get('unit_price', 0))),
            discount_type=it.get('discount_type', 'percentage'),
            discount_value=Decimal(str(it.get('discount_value', 0))),
            sequential_discount_pct=Decimal(str(it.get('sequential_discount_pct', 0))),
            gst_rate=Decimal(str(it.get('gst_rate', 18))),
            cess_rate=Decimal(str(it.get('cess_rate', 0))),
            is_tax_inclusive=bool(it.get('is_tax_inclusive', False)),
            is_intra_state=is_intra,
            is_ut=is_ut,
            is_rcm=is_rcm
        )
        calculated_items.append({**it, **calc})

        subtotal_taxable += calc['taxable_value']
        total_cgst += calc['cgst_amount']
        total_sgst += calc['sgst_amount']
        total_utgst += calc['utgst_amount']
        total_igst += calc['igst_amount']
        total_cess += calc['cess_amount']
        total_line_discounts += calc['discount_amount']

        # Aggregate HSN/SAC summary
        if hsn not in hsn_summary_map:
            hsn_summary_map[hsn] = {
                'hsn_sac': hsn,
                'description': it.get('description', ''),
                'quantity': Decimal('0.00'),
                'taxable_value': Decimal('0.00'),
                'gst_rate': calc['gst_rate'],
                'cgst': Decimal('0.00'),
                'sgst': Decimal('0.00'),
                'igst': Decimal('0.00'),
                'cess': Decimal('0.00'),
                'total': Decimal('0.00'),
            }
        hsn_summary_map[hsn]['quantity'] += Decimal(str(it.get('quantity', 1)))
        hsn_summary_map[hsn]['taxable_value'] += calc['taxable_value']
        hsn_summary_map[hsn]['cgst'] += calc['cgst_amount']
        hsn_summary_map[hsn]['sgst'] += calc['sgst_amount']
        hsn_summary_map[hsn]['igst'] += calc['igst_amount']
        hsn_summary_map[hsn]['cess'] += calc['cess_amount']
        hsn_summary_map[hsn]['total'] += calc['total_amount']

    overall_discount = Decimal(str(overall_discount))
    shipping_charges = Decimal(str(shipping_charges))
    packaging_charges = Decimal(str(packaging_charges))
    other_charges = Decimal(str(other_charges))

    additional_total = shipping_charges + packaging_charges + other_charges
    total_tax = total_cgst + total_sgst + total_utgst + total_igst + total_cess

    unrounded_total = (subtotal_taxable - overall_discount) + total_tax + additional_total
    unrounded_total = max(Decimal('0.00'), unrounded_total)

    # Standard Indian GST Round-Off to nearest whole rupee
    rounded_grand_total = unrounded_total.quantize(Decimal('1'), rounding=ROUND_HALF_UP)
    round_off_diff = rounded_grand_total - unrounded_total

    return {
        'items': calculated_items,
        'hsn_summary': list(hsn_summary_map.values()),
        'is_intra_state': is_intra,
        'is_ut': is_ut,
        'is_rcm': is_rcm,
        'subtotal_taxable': round_decimal(subtotal_taxable),
        'line_discounts': round_decimal(total_line_discounts),
        'overall_discount': round_decimal(overall_discount),
        'total_discount': round_decimal(total_line_discounts + overall_discount),
        'cgst': round_decimal(total_cgst),
        'sgst': round_decimal(total_sgst),
        'utgst': round_decimal(total_utgst),
        'igst': round_decimal(total_igst),
        'cess': round_decimal(total_cess),
        'total_tax': round_decimal(total_tax),
        'shipping_charges': round_decimal(shipping_charges),
        'packaging_charges': round_decimal(packaging_charges),
        'other_charges': round_decimal(other_charges),
        'additional_charges': round_decimal(additional_total),
        'round_off': round_decimal(round_off_diff),
        'grand_total': round_decimal(rounded_grand_total),
        'amount_in_words': number_to_indian_currency_words(rounded_grand_total),
    }


def number_to_indian_currency_words(amount: Decimal) -> str:
    """Convert a Decimal number into Indian English currency words (Lakhs & Crores)."""
    amount = Decimal(str(amount))
    int_part = int(amount)
    paise = int(round((amount - int_part) * 100))

    if int_part == 0 and paise == 0:
        return "Rupees Zero Only"

    units = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"
    ]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    def convert_upto_thousand(n):
        res = ""
        if n >= 100:
            res += units[n // 100] + " Hundred "
            n %= 100
        if n >= 20:
            res += tens[n // 10] + " "
            n %= 10
        if n > 0:
            res += units[n] + " "
        return res.strip()

    crore = int_part // 10000000
    rem = int_part % 10000000
    lakh = rem // 100000
    rem = rem % 100000
    thousand = rem // 1000
    rem = rem % 1000

    parts = []
    if crore > 0:
        parts.append(convert_upto_thousand(crore) + " Crore")
    if lakh > 0:
        parts.append(convert_upto_thousand(lakh) + " Lakh")
    if thousand > 0:
        parts.append(convert_upto_thousand(thousand) + " Thousand")
    if rem > 0:
        parts.append(convert_upto_thousand(rem))

    words = "Rupees " + " ".join(parts).strip()
    if paise > 0:
        words += f" and {convert_upto_thousand(paise)} Paise"
    words += " Only"
    return words.replace("  ", " ").strip()
