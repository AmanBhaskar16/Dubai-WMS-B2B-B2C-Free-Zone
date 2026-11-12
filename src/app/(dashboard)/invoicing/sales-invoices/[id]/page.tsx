'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Ban, CreditCard, Download, FileText, PencilLine, Save, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DataTable } from '@/components/shared/DataTable';
import { LineItemGrid, LineItemRow, calculateLineSummary } from '@/components/invoicing/LineItemGrid';
import { CurrencySelect } from '@/components/ui/currency-select';
import api from '@/lib/api';
import { InvoiceStatus, Payment, PaymentMethod, SalesInvoice } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { showApiError, showApiSuccess } from '@/lib/apiError';
import toast from 'react-hot-toast';

const paymentMethods: PaymentMethod[] = ['CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE'];

function normalizeInvoice(payload: any): SalesInvoice {
  return payload?.data?.id ? payload.data : payload?.data || payload;
}

function toRows(invoice?: SalesInvoice): LineItemRow[] {
  const items = invoice?.items || [];
  if (!items.length) return [{ productId: '', itemCode: '', description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0, total: 0 }];
  return items.map(item => ({
    id: item.id,
    productId: item.productId,
    itemCode: item.itemCode || item.product?.sku || '',
    description: item.description || item.product?.name || '',
    quantity: Number(item.quantity || 0),
    unitPrice: Number(item.unitPrice ?? item.rate ?? 0),
    discount: Number(item.discount || 0),
    taxTemplateId: (item as any).taxTemplateId || '',
    taxTemplateName: (item as any).taxTemplate?.name || '',
    taxRate: Number(item.taxRate || 0),
    total: Number(item.total || 0),
  }));
}

function invoiceTotal(invoice: SalesInvoice) {
  return Number(invoice.grandTotal ?? invoice.total ?? 0);
}

function invoiceOutstanding(invoice: SalesInvoice) {
  return Number(invoice.outstandingAmount ?? invoiceTotal(invoice) - Number(invoice.amountPaid || 0));
}

function isDraft(status?: InvoiceStatus) {
  return status === 'DRAFT';
}

function isCancelled(status?: InvoiceStatus) {
  return status === 'CANCELLED';
}

function isLocked(status?: InvoiceStatus) {
  return !!status && !isDraft(status);
}

export default function SalesInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [printFormats, setPrintFormats] = useState<any[]>([]);
  const [printFormatId, setPrintFormatId] = useState('');
  const [form, setForm] = useState({ customerId: '', date: '', dueDate: '', notes: '', terms: '', currency: 'USD', reference: '', customerPoNo: '', shipmentReference: '', countryOfOrigin: '', countryOfDestination: '', portOfLoading: '', portOfDischarge: '', incoterms: '', grossWeight: '', netWeight: '', packageCount: '' });
  const [rows, setRows] = useState<LineItemRow[]>([]);
  const [payment, setPayment] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), method: 'BANK_TRANSFER' as PaymentMethod, reference: '', notes: '' });

  const summary = useMemo(() => calculateLineSummary(rows), [rows]);
  const outstanding = invoice ? invoiceOutstanding(invoice) : 0;
  const readOnly = isLocked(invoice?.status);

  const fetchInvoice = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/invoices/${params.id}`);
      const next = normalizeInvoice(res.data);
      setInvoice(next);
      setForm({
        customerId: next.customerId || '',
        date: next.date ? next.date.slice(0, 10) : '',
        dueDate: next.dueDate ? next.dueDate.slice(0, 10) : '',
        notes: next.notes || '',
        terms: next.terms || '',
        currency: next.currency || 'INR',
        reference: (next as any).reference || '',
        customerPoNo: (next as any).customerPoNo || '',
        shipmentReference: (next as any).shipmentReference || '',
        countryOfOrigin: (next as any).countryOfOrigin || '',
        countryOfDestination: (next as any).countryOfDestination || '',
        portOfLoading: (next as any).portOfLoading || '',
        portOfDischarge: (next as any).portOfDischarge || '',
        incoterms: (next as any).incoterms || '',
        grossWeight: (next as any).grossWeight == null ? '' : String((next as any).grossWeight),
        netWeight: (next as any).netWeight == null ? '' : String((next as any).netWeight),
        packageCount: (next as any).packageCount == null ? '' : String((next as any).packageCount),
      });
      setRows(toRows(next));
      setPayment(prev => ({ ...prev, amount: String(Math.max(invoiceOutstanding(next), 0)) }));
    } catch (err: any) {
      showApiError(err, 'Failed to load invoice');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
    api.get('/invoicing/print-formats', { params: { docType: 'SALES_INVOICE', isActive: true } })
      .then(res => {
        const formats = Array.isArray(res.data?.data) ? res.data.data : [];
        setPrintFormats(formats);
        setPrintFormatId(formats.find((format: any) => format.isDefault)?.id || formats[0]?.id || '');
      })
      .catch(() => setPrintFormats([]));
  }, [params.id]);

  const saveDraft = async () => {
    if (!invoice || !isDraft(invoice.status)) return;
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        grossWeight: form.grossWeight ? Number(form.grossWeight) : undefined,
        netWeight: form.netWeight ? Number(form.netWeight) : undefined,
        packageCount: form.packageCount ? Number(form.packageCount) : undefined,
        items: rows.filter(row => row.productId || row.itemCode || row.description).map(row => ({
          productId: row.productId,
          itemCode: row.itemCode,
          description: row.description,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          taxTemplateId: row.taxTemplateId,
          taxRate: row.taxRate,
          discount: row.discount,
        })),
      };
      const res = await api.patch(`/invoices/${invoice.id}`, payload);
      const next = normalizeInvoice(res.data);
      setInvoice(next);
      setRows(toRows(next));
      showApiSuccess('Draft invoice saved');
    } catch (err: any) {
      showApiError(err, 'Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const submitInvoice = async () => {
    if (!invoice) return;
    try {
      await api.patch(`/invoices/${invoice.id}/status`, { status: 'SUBMITTED' });
      showApiSuccess('Invoice submitted');
      fetchInvoice();
    } catch (err: any) {
      showApiError(err, 'Failed to submit invoice');
    }
  };

  const cancelInvoice = async () => {
    if (!invoice) return;
    try {
      await api.patch(`/invoices/${invoice.id}/status`, { status: 'CANCELLED' });
      showApiSuccess('Invoice cancelled');
      setCancelOpen(false);
      fetchInvoice();
    } catch (err: any) {
      showApiError(err, 'Failed to cancel invoice');
    }
  };

  const amendInvoice = async () => {
    if (!invoice) return;
    try {
      const res = await api.post(`/invoices/${invoice.id}/amend`);
      const amended = normalizeInvoice(res.data);
      showApiSuccess('Invoice amended into new draft');
      router.push(`/invoicing/sales-invoices/${amended.id}`);
    } catch (err: any) {
      showApiError(err, 'Failed to amend invoice');
    }
  };

  const recordPayment = async () => {
    if (!invoice) return;
    const amount = Number(payment.amount);
    if (!amount || amount <= 0) return toast.error('Enter a valid payment amount');
    if (amount > outstanding) return toast.error('Payment cannot exceed outstanding amount');
    try {
      await api.post('/payments', {
        type: 'RECEIVED',
        customerId: invoice.customerId,
        invoiceId: invoice.id,
        amount,
        currency: invoice.currency,
        date: payment.date,
        method: payment.method,
        reference: payment.reference,
        notes: payment.notes,
      });
      showApiSuccess('Payment recorded');
      setPaymentOpen(false);
      fetchInvoice();
    } catch (err: any) {
      showApiError(err, 'Failed to record payment');
    }
  };

  const downloadPdf = async () => {
    if (!invoice) return;
    try {
      const res = await api.get(`/invoices/${invoice.id}/pdf`, { params: { printFormatId: printFormatId || undefined }, responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      window.open(url, '_blank');
    } catch {
      toast.error('Failed to open invoice PDF');
    }
  };

  if (isLoading || !invoice) {
    return <div className="space-y-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-md bg-[#ece9e4]" />)}</div>;
  }

  const payments = invoice.payments || [];
  const allocations = (invoice as any).paymentAllocations || [];

  return (
    <div className={isCancelled(invoice.status) ? 'opacity-75' : ''}>
      <div className="sticky top-[52px] z-20 -mx-4 mb-4 border-b border-[#dfe3e8] bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-1 -ml-2">
            <Link href="/invoicing/sales-invoices"><ArrowLeft className="mr-2 h-4 w-4" />Back to invoices</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className={isCancelled(invoice.status) ? 'text-xl font-semibold text-[#1f2937] line-through' : 'text-xl font-semibold text-[#1f2937]'}>{invoice.invoiceNo}</h1>
            <StatusBadge status={invoice.status} />
          </div>
          {invoice.salesOrderId && (
            <Link href={`/sales/orders/${invoice.salesOrderId}`} className="mt-1 inline-flex text-sm text-[#1674c4] hover:underline">
              Created from Sales Order
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadPdf}><Download className="mr-2 h-4 w-4" />Print</Button>
          {isDraft(invoice.status) && (
            <>
              <Button variant="outline" onClick={saveDraft} disabled={isSaving}><Save className="mr-2 h-4 w-4" />Save Draft</Button>
              <Button onClick={submitInvoice}><PencilLine className="mr-2 h-4 w-4" />Submit</Button>
            </>
          )}
          {!isDraft(invoice.status) && !isCancelled(invoice.status) && (
            <>
              <Button onClick={() => setPaymentOpen(true)}><CreditCard className="mr-2 h-4 w-4" />Record Payment</Button>
              <Button variant="destructive" onClick={() => setCancelOpen(true)}><Ban className="mr-2 h-4 w-4" />Cancel Invoice</Button>
            </>
          )}
          {isCancelled(invoice.status) && <Button onClick={amendInvoice}><FileText className="mr-2 h-4 w-4" />Amend</Button>}
        </div>
      </div>
      </div>

      <DocumentChain invoice={invoice} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <section className="rounded-md border border-[#dfe3e8] bg-white">
            <div className="flex items-center justify-between border-b border-[#edf0f2] px-4 py-3">
              <h2 className="text-sm font-semibold text-[#1f2937]">Customer and Posting</h2>
              <span className="text-xs text-[#8a929d]">Editable while Draft</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                <Field label="Customer" value={invoice.customer?.name || invoice.customerId} readOnly>
                  <Input value={invoice.customer?.name || invoice.customerId} disabled />
                </Field>
                <Field label="Currency" value={form.currency} readOnly={readOnly}>
                  <CurrencySelect
                    value={form.currency}
                    disabled={readOnly}
                    onChange={(currency) => setForm(prev => ({ ...prev, currency }))}
                  />
                </Field>
                <Field label="Date" value={formatDate(invoice.date)} readOnly={readOnly}>
                  <Input type="date" value={form.date} onChange={event => setForm(prev => ({ ...prev, date: event.target.value }))} />
                </Field>
                <Field label="Due Date" value={invoice.dueDate ? formatDate(invoice.dueDate) : '-'} readOnly={readOnly}>
                  <Input type="date" value={form.dueDate} onChange={event => setForm(prev => ({ ...prev, dueDate: event.target.value }))} />
                </Field>
                <Field label="Notes" value={form.notes || '-'} readOnly={readOnly}>
                  <Input value={form.notes} onChange={event => setForm(prev => ({ ...prev, notes: event.target.value }))} />
                </Field>
                <Field label="Terms" value={form.terms || '-'} readOnly={readOnly}>
                  <Input value={form.terms} onChange={event => setForm(prev => ({ ...prev, terms: event.target.value }))} />
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-[#dfe3e8] bg-white">
            <div className="flex items-center justify-between border-b border-[#edf0f2] px-4 py-3">
              <h2 className="text-sm font-semibold text-[#1f2937]">Shipment and Export Details</h2>
              <span className="text-xs text-[#8a929d]">{readOnly ? 'Invoice reference' : 'Editable while Draft'}</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Invoice Number" value={invoice.invoiceNo} readOnly><Input value={invoice.invoiceNo} disabled /></Field>
                <InvoiceField label="Shipment / Booking Reference" value={form.shipmentReference} readOnly={readOnly} onChange={(shipmentReference) => setForm(prev => ({ ...prev, shipmentReference }))} />
                <InvoiceField label="Customer PO No." value={form.customerPoNo} readOnly={readOnly} onChange={(customerPoNo) => setForm(prev => ({ ...prev, customerPoNo }))} />
                <InvoiceField label="Other Reference" value={form.reference} readOnly={readOnly} onChange={(reference) => setForm(prev => ({ ...prev, reference }))} />
                <InvoiceField label="Country of Origin" value={form.countryOfOrigin} readOnly={readOnly} onChange={(countryOfOrigin) => setForm(prev => ({ ...prev, countryOfOrigin }))} />
                <InvoiceField label="Country of Destination" value={form.countryOfDestination} readOnly={readOnly} onChange={(countryOfDestination) => setForm(prev => ({ ...prev, countryOfDestination }))} />
                <InvoiceField label="Port of Loading" value={form.portOfLoading} readOnly={readOnly} onChange={(portOfLoading) => setForm(prev => ({ ...prev, portOfLoading }))} />
                <InvoiceField label="Port of Discharge" value={form.portOfDischarge} readOnly={readOnly} onChange={(portOfDischarge) => setForm(prev => ({ ...prev, portOfDischarge }))} />
                <InvoiceField label="Incoterms" value={form.incoterms} readOnly={readOnly} onChange={(incoterms) => setForm(prev => ({ ...prev, incoterms }))} />
                <InvoiceField label="Packages / Cartons" value={form.packageCount} type="number" readOnly={readOnly} onChange={(packageCount) => setForm(prev => ({ ...prev, packageCount }))} />
                <InvoiceField label="Gross Weight (kg)" value={form.grossWeight} type="number" readOnly={readOnly} onChange={(grossWeight) => setForm(prev => ({ ...prev, grossWeight }))} />
                <InvoiceField label="Net Weight (kg)" value={form.netWeight} type="number" readOnly={readOnly} onChange={(netWeight) => setForm(prev => ({ ...prev, netWeight }))} />
              </div>
            </div>
          </section>

          <section className="rounded-md border border-[#dfe3e8] bg-white">
            <div className="flex items-center justify-between border-b border-[#edf0f2] px-4 py-3">
              <h2 className="text-sm font-semibold text-[#1f2937]">Items</h2>
              <span className="text-xs text-[#8a929d]">Spreadsheet grid</span>
            </div>
            <div className="p-4">
              <LineItemGrid value={rows} onChange={setRows} currency={invoice.currency} readOnly={readOnly} />
              {isDraft(invoice.status) && (
                <p className="mt-2 text-xs text-[#6b7280]">
                  Client totals are for instant feedback. Server totals replace these after save.
                </p>
              )}
            </div>
          </section>

          {payments.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
              <CardContent>
                <DataTable
                  columns={[
                    { key: 'date', header: 'Date', render: (p: Payment) => formatDate(p.date) },
                    { key: 'amount', header: 'Amount', render: (p: Payment) => formatCurrency(p.amount, p.currency || invoice.currency) },
                    { key: 'method', header: 'Method' },
                    { key: 'reference', header: 'Reference', render: (p: Payment) => p.reference || '-' },
                  ]}
                  data={payments}
                  onRowClick={payment => { window.location.href = `/invoicing/payments/${payment.id}`; }}
                />
              </CardContent>
            </Card>
          )}
          {allocations.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Payment Entry Allocations</CardTitle></CardHeader>
              <CardContent>
                <DataTable
                  columns={[
                    { key: 'paymentEntry', header: 'Payment Entry', render: (a: any) => a.paymentEntry?.paymentNo || '-' },
                    { key: 'date', header: 'Date', render: (a: any) => a.paymentEntry?.date ? formatDate(a.paymentEntry.date) : '-' },
                    { key: 'allocatedAmount', header: 'Allocated', render: (a: any) => formatCurrency(a.allocatedAmount, invoice.currency) },
                    { key: 'method', header: 'Method', render: (a: any) => a.paymentEntry?.method || '-' },
                    { key: 'reference', header: 'Reference', render: (a: any) => a.paymentEntry?.reference || '-' },
                  ]}
                  data={allocations}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Print Format</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={printFormatId || 'DEFAULT'} onValueChange={value => setPrintFormatId(value === 'DEFAULT' ? '' : value)}>
              <SelectTrigger><SelectValue placeholder="System default" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DEFAULT">System default format</SelectItem>
                {printFormats.map(format => <SelectItem key={format.id} value={format.id}>{format.name}{format.isDefault ? ' · Default' : ''}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#6b7280]">
              The selected active Sales Invoice print format controls the PDF title, footer, and layout options.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/invoicing/print-formats">Manage Print Formats</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="sticky top-[122px]">
          <CardHeader><CardTitle>Accounting Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <SummaryLine label="Subtotal" value={formatCurrency(readOnly ? Number(invoice.subtotal || 0) : summary.subtotal, invoice.currency)} />
            <SummaryLine label="Tax" value={formatCurrency(readOnly ? Number(invoice.taxAmount || 0) : summary.taxAmount, invoice.currency)} />
            <SummaryLine label="Discount" value={formatCurrency(readOnly ? Number(invoice.discount || 0) : summary.discount, invoice.currency)} />
            <SummaryLine label="Total" value={formatCurrency(readOnly ? invoiceTotal(invoice) : summary.total, invoice.currency)} strong />
            <div className="border-t border-[#f0ede8] pt-3">
              <SummaryLine label="Paid" value={formatCurrency(Number(invoice.amountPaid || 0), invoice.currency)} />
              <SummaryLine label="Outstanding" value={formatCurrency(outstanding, invoice.currency)} strong danger={outstanding > 0} />
            </div>
          </CardContent>
        </Card>
        </aside>
      </div>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="rounded-md border border-[#e5e2dc] bg-[#f8faf9] p-3 text-sm">
              Outstanding: <span className="font-semibold">{formatCurrency(outstanding, invoice.currency)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Amount</Label><Input type="number" step="0.01" value={payment.amount} onChange={event => setPayment(prev => ({ ...prev, amount: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={payment.date} onChange={event => setPayment(prev => ({ ...prev, date: event.target.value }))} /></div>
              <div className="space-y-1.5">
                <Label>Method</Label>
                <Select value={payment.method} onValueChange={value => setPayment(prev => ({ ...prev, method: value as PaymentMethod }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{paymentMethods.map(method => <SelectItem key={method} value={method}>{method.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Reference</Label><Input value={payment.reference} onChange={event => setPayment(prev => ({ ...prev, reference: event.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Notes</Label><Input value={payment.notes} onChange={event => setPayment(prev => ({ ...prev, notes: event.target.value }))} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPaymentOpen(false)}>Close</Button>
              <Button onClick={recordPayment}>Record Payment</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancel invoice?</DialogTitle></DialogHeader>
          <p className="text-sm text-[#6b7280]">This keeps the invoice for audit and asks the backend to reverse its effects.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep Invoice</Button>
            <Button variant="destructive" onClick={cancelInvoice}>Cancel Invoice</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value, readOnly, children }: { label: string; value: string; readOnly: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {readOnly ? <div className="min-h-8 rounded-md border border-[#e5e2dc] bg-[#f8faf9] px-2.5 py-1.5 text-sm text-[#4b5563]">{value}</div> : children}
    </div>
  );
}

function InvoiceField({ label, value, readOnly, onChange, type = 'text' }: { label: string; value: string; readOnly: boolean; onChange: (value: string) => void; type?: string }) {
  return (
    <Field label={label} value={value || '-'} readOnly={readOnly}>
      <Input type={type} min={type === 'number' ? '0' : undefined} step={type === 'number' ? '0.01' : undefined} value={value} onChange={event => onChange(event.target.value)} />
    </Field>
  );
}

function SummaryLine({ label, value, strong, danger }: { label: string; value: string; strong?: boolean; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#6b7280]">{label}</span>
      <span className={strong ? `font-semibold ${danger ? 'text-[#c3423f]' : 'text-[#1f2937]'}` : 'font-medium text-[#374151]'}>{value}</span>
    </div>
  );
}

function TimelineItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1f5f7] text-[#6b7280]">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="font-medium text-[#374151]">{label}</p>
        <p className="text-xs text-[#8a929d]">{value}</p>
      </div>
    </div>
  );
}

function DocumentChain({ invoice }: { invoice: SalesInvoice }) {
  const steps = [
    { label: 'Quotation', href: undefined },
    { label: 'Sales Order', href: invoice.salesOrderId ? `/sales/orders/${invoice.salesOrderId}` : undefined },
    { label: 'Invoice', href: `/invoicing/sales-invoices/${invoice.id}`, current: true },
    { label: 'Payments', href: invoice.payments?.length ? '/invoicing/payments' : undefined },
  ];

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-[#e5e2dc] bg-white px-3 py-2 text-sm">
      <ScrollText className="h-4 w-4 text-[#1674c4]" />
      {steps.map((step, index) => (
        <span key={step.label} className="flex items-center gap-2">
          {index > 0 && <span className="text-[#c8c1b8]">→</span>}
          {step.href ? (
            <Link href={step.href} className={step.current ? 'font-semibold text-[#1674c4]' : 'text-[#4b5563] hover:text-[#1674c4] hover:underline'}>{step.label}</Link>
          ) : (
            <span className="text-[#9aa3af]">{step.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
