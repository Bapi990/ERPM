import React, { useState } from 'react';
import {
  Receipt, DollarSign, Percent, Hash, Tag,
  FileText, ShoppingBag, Layers, CreditCard, CheckCircle2,
  Download, Printer, Sparkles, Building2, ArrowRight
} from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { LoginButton } from '../components/LoginButton';
import { ScrollReveal } from '../components/ScrollReveal';
import { MODULES_DATA } from '../data/modules';

export const Billing = () => {
  const data = MODULES_DATA.billing;
  const [activeInvoiceType, setActiveInvoiceType] = useState('tax_invoice'); // 'tax_invoice' | 'quotation' | 'purchase'

  return (
    <section id="billing" className="py-20 lg:py-28 bg-slate-50/70 border-b border-slate-200/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up">
          <SectionHeading
            badge={data.badge}
            title={data.tagline}
            highlight="100% CBIC Compliant."
            subtitle={data.description}
          />
        </ScrollReveal>

        {/* 4 Key Metrics with Staggered Fade Up */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-12">
          {data.stats.map((stat, idx) => (
            <ScrollReveal key={idx} direction="up" delay={idx * 100}>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center hover:shadow-md transition-all hover:-translate-y-1">
                <span className="text-2xl sm:text-3xl font-black text-purple-600 font-mono block">
                  {stat.value}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mt-1">
                  {stat.label}
                </span>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Split Grid: Left Feature Highlights & Slabs, Right Realistic GST Invoice Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Feature Column SLIDE LEFT */}
          <div className="lg:col-span-5 space-y-6">
            <ScrollReveal direction="left" delay={250}>
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-black text-purple-600 uppercase tracking-wider block mb-1">
                    INDIAN CBIC COMPLIANCE ENGINE
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Automate CGST, SGST & IGST. Zero Calculation Errors.
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Whether you supply physical commodities requiring HSN classification or digital software requiring SAC tariff codes, Odias ERP automatically detects the Place of Supply (POS) and formats invoices with official digital seals and bank payment details.
                  </p>
                </div>

                {/* Slabs Grid */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2.5 text-xs shadow-xs">
                  <span className="font-extrabold text-slate-900 block text-xs border-b border-slate-100 pb-2">
                    Pre-Loaded Standard Indian GST Rates
                  </span>
                  <div className="grid grid-cols-5 gap-1.5 text-center font-mono font-bold">
                    <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">0%<span className="block text-[8px] font-sans text-slate-500">Exempt</span></div>
                    <div className="p-2 bg-blue-50 text-blue-800 rounded-lg">5%<span className="block text-[8px] font-sans text-slate-500">Essential</span></div>
                    <div className="p-2 bg-purple-50 text-purple-800 rounded-lg">12%<span className="block text-[8px] font-sans text-slate-500">Standard</span></div>
                    <div className="p-2 bg-indigo-50 text-indigo-800 rounded-lg">18%<span className="block text-[8px] font-sans text-slate-500">Software</span></div>
                    <div className="p-2 bg-rose-50 text-rose-800 rounded-lg">28%<span className="block text-[8px] font-sans text-slate-500">Luxury</span></div>
                  </div>
                </div>

                <div className="space-y-3 text-xs font-semibold text-slate-700">
                  <div className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Automated Intra-State (CGST + SGST) vs Inter-State (IGST) logic</span>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>HSN & SAC Code Master with automated description and rate lookup</span>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Item-level & invoice-level percentage and flat discounts</span>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Multi-warehouse inventory stock ledgers with FIFO valuation</span>
                  </div>
                </div>

                {/* MANDATORY ENTRY POINT 5: GST Billing Explore / Login */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <LoginButton
                    text="Login to GST Billing →"
                    variant="primary"
                    size="md"
                  />
                  <a
                    href="#demo"
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-purple-600 text-slate-700 hover:text-purple-600 text-xs font-bold transition-colors"
                  >
                    Test Invoice Generator
                  </a>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Realistic GST Invoice Document Mockup SLIDE RIGHT */}
          <div className="lg:col-span-7">
            <ScrollReveal direction="right" delay={300}>
              <div className="bg-white rounded-3xl border-2 border-slate-900 shadow-2xl p-5 sm:p-7 text-xs font-sans text-slate-900 relative">
                {/* Top Document Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b-2 border-slate-900 gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-blue-500/20">
                      K
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-base leading-tight">
                        Odias ERP TECHNOLOGIES PVT. LTD.
                      </h4>
                      <p className="text-[10px] text-slate-500">Plot 1343 Raghunathpur, Bhubaneswar, Odisha - 754005</p>
                      <p className="text-[9px] text-slate-400 font-mono">GSTIN: 21AAMCG9464H1ZC • PAN: AAMCG9464H • State: 21</p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      TAX INVOICE
                    </span>
                    <span className="text-xs font-mono font-bold block mt-1">INV/2026-27/00389</span>
                    <span className="text-[10px] text-slate-400 block">Date: 16-Nov-2026</span>
                  </div>
                </div>

                {/* Bill To & Supply Info */}
                <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-200 text-[11px]">
                  <div>
                    <span className="font-bold text-slate-400 text-[9px] uppercase tracking-wider block">BUYER (BILL TO)</span>
                    <span className="font-bold text-slate-900 block mt-0.5">Tata Advanced Systems Limited</span>
                    <span className="text-slate-500 block">Plot 29 Industrial Estate, Pune, Maharashtra - 411019</span>
                    <span className="font-mono text-slate-700 block mt-0.5">GSTIN: 27AABCT1234D1ZP • State Code: 27</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-400 text-[9px] uppercase tracking-wider block">SUPPLY DETAILS</span>
                    <span className="text-slate-700 block mt-0.5">Place of Supply: <strong>Maharashtra (27)</strong></span>
                    <span className="text-indigo-600 font-bold block">Tax Type: Inter-State (IGST 18%)</span>
                    <span className="text-slate-500 block">Payment Mode: Direct Bank RTGS</span>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="py-3 border-b border-slate-200 overflow-x-auto">
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[9px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-1.5 px-2 font-sans">Item Description</th>
                        <th className="py-1.5 px-2">HSN/SAC</th>
                        <th className="py-1.5 px-2">Qty</th>
                        <th className="py-1.5 px-2">Rate</th>
                        <th className="py-1.5 px-2">Taxable (₹)</th>
                        <th className="py-1.5 px-2 text-right">IGST (18%)</th>
                        <th className="py-1.5 px-2 text-right font-sans">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 px-2 font-sans font-bold text-slate-900">
                          Cloud ERP Enterprise License
                          <span className="block text-[9px] font-normal text-slate-400">Annual recurring subscription for 80 user seats</span>
                        </td>
                        <td className="py-2 px-2 text-slate-600">998314</td>
                        <td className="py-2 px-2">1 Nos</td>
                        <td className="py-2 px-2">₹2,00,000</td>
                        <td className="py-2 px-2">₹2,00,000</td>
                        <td className="py-2 px-2 text-right text-purple-600">₹36,000</td>
                        <td className="py-2 px-2 text-right font-bold text-slate-900">₹2,36,000</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 font-sans font-bold text-slate-900">
                          Biometric Device API Connector
                          <span className="block text-[9px] font-normal text-slate-400">Integration license with automated sync service</span>
                        </td>
                        <td className="py-2 px-2 text-slate-600">998315</td>
                        <td className="py-2 px-2">2 Nos</td>
                        <td className="py-2 px-2">₹15,000</td>
                        <td className="py-2 px-2">₹30,000</td>
                        <td className="py-2 px-2 text-right text-purple-600">₹5,400</td>
                        <td className="py-2 px-2 text-right font-bold text-slate-900">₹35,400</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Calculations & Total */}
                <div className="grid grid-cols-2 gap-4 py-3 border-b-2 border-slate-900 text-xs">
                  <div className="space-y-1 text-[10px] text-slate-500 font-mono">
                    <span className="font-bold text-slate-800 font-sans block">Bank Remittance Details:</span>
                    <span>Bank: State Bank of India • A/C: 55772011000228</span>
                    <span>IFSC: SBIN0005577 • Branch: Bhubaneswar Main</span>
                  </div>

                  <div className="space-y-1.5 font-mono text-right text-xs">
                    <div className="flex justify-between text-slate-600 font-sans">
                      <span>Taxable Subtotal:</span>
                      <span className="font-mono">₹2,30,000.00</span>
                    </div>
                    <div className="flex justify-between text-purple-600 font-sans">
                      <span>Integrated GST (IGST @ 18%):</span>
                      <span className="font-mono">+₹41,400.00</span>
                    </div>
                    <div className="flex justify-between text-slate-400 font-sans text-[11px]">
                      <span>Round Off:</span>
                      <span className="font-mono">₹0.00</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
                      <span className="font-sans">Grand Total:</span>
                      <span className="text-blue-700">₹2,71,400.00</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Signature & Stamp */}
                <div className="pt-3 flex items-center justify-between text-[10px] text-slate-400">
                  <span>This computer-generated tax invoice requires no physical signature under CBIC rules.</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 font-sans block">For Odias ERP TECHNOLOGIES</span>
                    <span className="text-[9px] text-emerald-600 font-bold">✓ Authorised Digital Signatory</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Billing;
