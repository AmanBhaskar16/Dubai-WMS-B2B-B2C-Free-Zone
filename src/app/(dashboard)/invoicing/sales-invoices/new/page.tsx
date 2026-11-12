'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowUpRight, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelectEmptyState } from '@/components/shared/SelectEmptyState';
import { CurrencySelect } from '@/components/ui/currency-select';
import { LineItemGrid, LineItemRow, calculateLineSummary } from '@/components/invoicing/LineItemGrid';
import api from '@/lib/api';
import { Customer } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { showApiError, showApiSuccess } from '@/lib/apiError';
import toast from 'react-hot-toast';

const initialRows: LineItemRow[] = [
  { productId: '', itemCode: '', description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0, total: 0 },
];

export default function NewSalesInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    customerId: '',
    date: new Date().toISOString().slice(0, 10),
    dueDate: '',
    currency: 'INR',
    reference: '',
    customerPoNo: '',
    shipmentReference: '',
    countryOfOrigin: 'United Arab Emirates',
    countryOfDestination: 'United States',
    portOfLoading: 'Jebel Ali, UAE',
    portOfDischarge: '',
    incoterms: '',
    grossWeight: '',
    netWeight: '',
    packageCount: '',
    notes: '',
    terms: '',
  });
  const [rows, setRows] = useState<LineItemRow[]>(initialRows);
  const summary = useMemo(() => calculateLineSummary(rows), [rows]);

  useEffect(() => {
    setIsLoadingCustomers(true);
    api
      .get('/customers', { params: { limit: 100, isActive: true } })
      .then((res) => setCustomers(res.data?.data?.items || res.data?.data || []))
      .catch((err) => showApiError(err, 'Failed to load customers'))
      .finally(() => setIsLoadingCustomers(false));
  }, []);

  const createInvoice = async () => {
    if (isSaving) return;

    if (!form.customerId) {
      toast.error('Please select a customer for this invoice');
      return;
    }
    const items = rows
      .filter((row) => row.productId || row.itemCode || row.description)
      .map((row) => ({
        productId: row.productId,
        itemCode: row.itemCode,
        description: row.description,
        quantity: Number(row.quantity || 1),
        unitPrice: Number(row.unitPrice || 0),
        taxTemplateId: row.taxTemplateId,
        taxRate: Number(row.taxRate || 0),
        discount: Number(row.discount || 0),
      }));

    if (!items.length) {
      toast.error('Add at least one line item with a product, description, and price');
      return;
    }

    for (const item of items) {
      if (item.quantity <= 0) {
        toast.error(`Item quantity must be greater than 0`);
        return;
      }
      if (item.unitPrice < 0) {
        toast.error(`Item unit price cannot be negative`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await api.post('/invoices', {
        ...form,
        grossWeight: form.grossWeight ? Number(form.grossWeight) : undefined,
        netWeight: form.netWeight ? Number(form.netWeight) : undefined,
        packageCount: form.packageCount ? Number(form.packageCount) : undefined,
        items,
      });
      const invoice = res.data?.data;
      showApiSuccess('Draft invoice created successfully');
      router.push(`/invoicing/sales-invoices/${invoice.id}`);
    } catch (err: any) {
      showApiError(err, 'Failed to create invoice');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/invoicing/sales-invoices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to invoices
            </Link>
          </Button>
          <h1 className="text-xl font-semibold text-[#1f2937]">New Sales Invoice</h1>
          <p className="text-sm text-[#6b7280]">Create a customer invoice with shipment and export details. Totals are confirmed by the backend after save.</p>
        </div>
        <Button onClick={createInvoice} disabled={isSaving || customers.length === 0}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Creating Draft...' : 'Create Draft'}
        </Button>
      </div>

      {customers.length === 0 && !isLoadingCustomers && (
        <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>No customers found. You must create at least one customer before generating sales invoices.</span>
          </div>
          <Link
            href="/customers"
            className="inline-flex items-center gap-0.5 font-semibold text-amber-900 underline hover:text-amber-700"
          >
            Create Customer <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Customer *</Label>
              <Select
                value={form.customerId}
                onValueChange={(value) => {
                  const customer = customers.find((c) => c.id === value);
                  setForm((prev) => ({
                    ...prev,
                    customerId: value,
                    currency: customer?.currency || prev.currency,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.length === 0 ? (
                    <SelectEmptyState
                      message="No customers found"
                      linkHref="/customers"
                      linkText="Create Customer"
                    />
                  ) : (
                    customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} {customer.customerNo ? `(${customer.customerNo})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <CurrencySelect
                value={form.currency}
                onChange={(currency) => setForm((prev) => ({ ...prev, currency }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input
                value={form.notes}
                placeholder="Internal notes or customer remarks"
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Terms</Label>
              <Input
                value={form.terms}
                placeholder="Payment terms, delivery terms, bank instructions"
                onChange={(event) => setForm((prev) => ({ ...prev, terms: event.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipment & Export Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <InvoiceField label="Shipment / Booking Reference" value={form.shipmentReference} placeholder="Shipment or booking reference" onChange={(shipmentReference) => setForm((prev) => ({ ...prev, shipmentReference }))} />
            <InvoiceField label="Customer PO No." value={form.customerPoNo} placeholder="Customer purchase order" onChange={(customerPoNo) => setForm((prev) => ({ ...prev, customerPoNo }))} />
            <InvoiceField label="Other Reference" value={form.reference} placeholder="Reference number" onChange={(reference) => setForm((prev) => ({ ...prev, reference }))} />
            <InvoiceField label="Country of Origin" value={form.countryOfOrigin} placeholder="Country of origin" onChange={(countryOfOrigin) => setForm((prev) => ({ ...prev, countryOfOrigin }))} />
            <InvoiceField label="Country of Destination" value={form.countryOfDestination} placeholder="Destination country" onChange={(countryOfDestination) => setForm((prev) => ({ ...prev, countryOfDestination }))} />
            <InvoiceField label="Port of Loading" value={form.portOfLoading} placeholder="Port of loading" onChange={(portOfLoading) => setForm((prev) => ({ ...prev, portOfLoading }))} />
            <InvoiceField label="Port of Discharge" value={form.portOfDischarge} placeholder="Port of discharge" onChange={(portOfDischarge) => setForm((prev) => ({ ...prev, portOfDischarge }))} />
            <InvoiceField label="Incoterms" value={form.incoterms} placeholder="e.g. FOB, CIF, EXW" onChange={(incoterms) => setForm((prev) => ({ ...prev, incoterms }))} />
            <InvoiceField label="Packages / Cartons" value={form.packageCount} type="number" placeholder="Number of packages" onChange={(packageCount) => setForm((prev) => ({ ...prev, packageCount }))} />
            <InvoiceField label="Gross Weight (kg)" value={form.grossWeight} type="number" placeholder="Gross weight" onChange={(grossWeight) => setForm((prev) => ({ ...prev, grossWeight }))} />
            <InvoiceField label="Net Weight (kg)" value={form.netWeight} type="number" placeholder="Net weight" onChange={(netWeight) => setForm((prev) => ({ ...prev, netWeight }))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <LineItemGrid value={rows} onChange={setRows} currency={form.currency} />
          <div className="mt-3 flex justify-end text-sm">
            <div className="rounded-md border border-[#e5e2dc] bg-[#f8faf9] px-4 py-2">
              Draft total preview: <span className="font-semibold">{formatCurrency(summary.total, form.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InvoiceField({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} min={type === 'number' ? '0' : undefined} step={type === 'number' ? '0.01' : undefined} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
