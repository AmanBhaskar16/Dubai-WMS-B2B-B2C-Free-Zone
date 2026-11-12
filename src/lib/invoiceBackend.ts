import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

type AnyRow = Record<string, any> & { id: string };
type InvoiceDb = {
  customers: AnyRow[];
  products: AnyRow[];
  invoices: AnyRow[];
  payments: AnyRow[];
  creditNotes: AnyRow[];
  deliveryNotes: AnyRow[];
  paymentEntries: AnyRow[];
  taxTemplates: AnyRow[];
  printFormats: AnyRow[];
  ledger: AnyRow[];
  subscriptions: AnyRow[];
  auditLogs: AnyRow[];
  salesOrders: AnyRow[];
  warehouses: AnyRow[];
  counters: Record<string, number>;
};

const dataDirectory = path.join(process.cwd(), 'data');
const dataFile = path.join(dataDirectory, 'invoice-demo.json');
let transactionQueue: Promise<unknown> = Promise.resolve();

const emptyDb = (): InvoiceDb => ({
  customers: [], products: [], invoices: [], payments: [], creditNotes: [], deliveryNotes: [],
  paymentEntries: [], taxTemplates: [], printFormats: [], ledger: [], subscriptions: [],
  auditLogs: [], salesOrders: [], warehouses: [], counters: {},
});

async function readDb(): Promise<InvoiceDb> {
  await mkdir(dataDirectory, { recursive: true });
  try {
    const parsed = JSON.parse(await readFile(dataFile, 'utf8')) as Partial<InvoiceDb>;
    return { ...emptyDb(), ...parsed, counters: { ...(parsed.counters || {}) } };
  } catch (error: any) {
    if (error?.code !== 'ENOENT') throw error;
    const initial = emptyDb();
    const sampleCustomerId = randomUUID();
    initial.customers.push({
      id: sampleCustomerId, customerNo: 'CUS-DEMO-001', name: 'Sample US Importer',
      email: 'ap@example.com', address: 'Demo address - replace with buyer address', city: 'New York',
      country: 'United States', currency: 'USD', creditLimit: 10000, paymentTerms: 30,
      notes: 'Demo customer; update these details before a client presentation.', isActive: true, createdAt: new Date().toISOString(),
    });
    initial.products.push(
      { id: randomUUID(), sku: 'EXP-DEMO-001', name: 'Sample Export Goods A', description: 'Demo export line item', salePrice: 125, taxRate: 0, type: 'PRODUCT', isActive: true, createdAt: new Date().toISOString() },
      { id: randomUUID(), sku: 'EXP-DEMO-002', name: 'Sample Export Goods B', description: 'Demo export line item', salePrice: 80, taxRate: 0, type: 'PRODUCT', isActive: true, createdAt: new Date().toISOString() },
    );
    initial.taxTemplates.push({
      id: randomUUID(), name: 'UAE Export (Zero Rated)', code: 'UAE-EXPORT-0', scope: 'SALES',
      description: 'Zero rated export sample tax template', isActive: true, isDefault: true,
      lines: [{ label: 'VAT', rate: 0, chargeType: 'ON_NET_TOTAL', isRecoverable: false }], createdAt: new Date().toISOString(),
    });
    initial.printFormats.push({
      id: randomUUID(), name: 'Commercial Export Invoice', docType: 'SALES_INVOICE', title: 'COMMERCIAL INVOICE',
      footer: 'Thank you for your business.', isActive: true, isDefault: true,
      template: { title: 'COMMERCIAL INVOICE', sections: ['letterhead', 'customer', 'items', 'taxes', 'totals', 'terms', 'footer'], showLogo: true, showHsnSummary: true, showAmountInWords: true, showPaymentTerms: true },
      createdAt: new Date().toISOString(),
    });
    await writeDb(initial);
    return initial;
  }
}

async function writeDb(db: InvoiceDb) {
  await mkdir(dataDirectory, { recursive: true });
  const tempFile = `${dataFile}.${process.pid}.tmp`;
  await writeFile(tempFile, JSON.stringify(db, null, 2), 'utf8');
  await rename(tempFile, dataFile);
}

function transact<T>(operation: () => Promise<T>): Promise<T> {
  const next = transactionQueue.then(operation, operation);
  transactionQueue = next.then(() => undefined, () => undefined);
  return next;
}

function id() { return randomUUID(); }
function now() { return new Date().toISOString(); }
function envelope(data: unknown) { return { success: true, data }; }
function apiError(message: string, status = 400) { return Object.assign(new Error(message), { status }); }
function asDate(value?: string) { return value ? new Date(value) : new Date(); }
function due(invoice: AnyRow) { return Math.max(0, Number(invoice.grandTotal ?? invoice.total ?? 0) - Number(invoice.amountPaid || 0) - Number(invoice.creditAmount || 0)); }
function audit(db: InvoiceDb, entityType: string, action: string, entityId: string, voucher: string, message: string, statusBefore?: string, statusAfter?: string) {
  db.auditLogs.unshift({ id: id(), entityType, action, entityId, voucher, message, statusBefore, statusAfter, actorEmail: 'admin@example.com', actorRole: 'ADMIN', createdAt: now() });
}

function attachInvoice(db: InvoiceDb, invoice: AnyRow) {
  return {
    ...invoice,
    customer: db.customers.find(customer => customer.id === invoice.customerId) || null,
    items: (invoice.items || []).map((item: AnyRow) => ({
      ...item,
      product: db.products.find(product => product.id === item.productId) || item.product || null,
    })),
    payments: db.payments.filter(payment => payment.invoiceId === invoice.id),
  };
}

function nextNumber(db: InvoiceDb, prefix: string) {
  db.counters[prefix] = (db.counters[prefix] || 0) + 1;
  return `${prefix}-${String(new Date().getFullYear()).slice(-2)}-${String(db.counters[prefix]).padStart(5, '0')}`;
}

function calculate(items: AnyRow[], db: InvoiceDb) {
  const normalized = items.map(item => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unitPrice ?? item.rate ?? 0);
    const discount = Number(item.discount || 0);
    let taxRate = Number(item.taxRate || 0);
    const template = db.taxTemplates.find(row => row.id === item.taxTemplateId);
    if (template?.lines?.length) taxRate = template.lines.reduce((sum: number, line: AnyRow) => sum + Number(line.rate || 0), 0);
    const gross = quantity * unitPrice;
    const discountAmount = gross * discount / 100;
    const net = gross - discountAmount;
    const tax = net * taxRate / 100;
    return { ...item, quantity, unitPrice, rate: unitPrice, discount, taxRate, total: Number((net + tax).toFixed(2)) };
  });
  const subtotal = normalized.reduce((sum, item) => sum + item.quantity * item.unitPrice * (1 - item.discount / 100), 0);
  const discount = normalized.reduce((sum, item) => sum + item.quantity * item.unitPrice * item.discount / 100, 0);
  const taxAmount = normalized.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (1 - item.discount / 100) * item.taxRate / 100), 0);
  const total = Number((subtotal + taxAmount).toFixed(2));
  return { items: normalized, subtotal: Number(subtotal.toFixed(2)), discount: Number(discount.toFixed(2)), taxAmount: Number(taxAmount.toFixed(2)), total, grandTotal: total };
}

function paginate(rows: AnyRow[], url: URL) {
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get('limit') || 20)));
  const start = (page - 1) * limit;
  return { items: rows.slice(start, start + limit), total: rows.length, page, limit, totalPages: Math.max(1, Math.ceil(rows.length / limit)) };
}

function invoicePdf(invoice: AnyRow, db: InvoiceDb, printFormatId?: string) {
  const customer: AnyRow = db.customers.find(row => row.id === invoice.customerId) || ({} as AnyRow);
  const format = db.printFormats.find(row => row.id === printFormatId && row.isActive !== false)
    || db.printFormats.find(row => row.docType === 'SALES_INVOICE' && row.isDefault && row.isActive !== false);
  const rows: string[] = [];
  const seller = process.env.INVOICE_SELLER_NAME || 'Your Company Name';
  rows.push(seller, process.env.INVOICE_SELLER_ADDRESS || 'Seller address and contact details', '', format?.template?.title || format?.title || 'COMMERCIAL INVOICE');
  rows.push(`Invoice No: ${invoice.invoiceNo}    Date: ${String(invoice.date || '').slice(0, 10)}    Due: ${String(invoice.dueDate || '-').slice(0, 10)}`);
  rows.push(`Bill To: ${customer.name || '-'}    Customer No: ${customer.customerNo || '-'}`);
  rows.push(`Address: ${[customer.address, customer.city, customer.country].filter(Boolean).join(', ') || '-'}`);
  rows.push(`Shipment Ref: ${invoice.shipmentReference || invoice.reference || '-'}    PO: ${invoice.customerPoNo || '-'}`);
  rows.push(`Origin: ${invoice.countryOfOrigin || '-'}    Destination: ${invoice.countryOfDestination || '-'}`);
  rows.push(`Port of Loading: ${invoice.portOfLoading || '-'}    Port of Discharge: ${invoice.portOfDischarge || '-'}`);
  rows.push(`Incoterms: ${invoice.incoterms || '-'}    Packages: ${invoice.packageCount ?? '-'}`);
  rows.push(`Gross Weight: ${invoice.grossWeight ?? '-'} kg    Net Weight: ${invoice.netWeight ?? '-'} kg`, '');
  rows.push('Item / Description                     Qty      Unit Price      Tax      Amount');
  rows.push('--------------------------------------------------------------------------------');
  for (const item of invoice.items || []) {
    const product = db.products.find(row => row.id === item.productId);
    const description = String(item.description || product?.name || item.itemCode || 'Item').slice(0, 36);
    rows.push(`${description.padEnd(38)} ${String(item.quantity).padStart(5)} ${String(item.unitPrice.toFixed(2)).padStart(14)} ${String(item.taxRate).padStart(7)}% ${String(item.total.toFixed(2)).padStart(12)}`);
  }
  rows.push('', `Subtotal: ${invoice.currency || 'USD'} ${Number(invoice.subtotal || 0).toFixed(2)}`);
  rows.push(`Discount: ${invoice.currency || 'USD'} ${Number(invoice.discount || 0).toFixed(2)}`);
  rows.push(`Tax:      ${invoice.currency || 'USD'} ${Number(invoice.taxAmount || 0).toFixed(2)}`);
  rows.push(`TOTAL:    ${invoice.currency || 'USD'} ${Number(invoice.grandTotal ?? invoice.total ?? 0).toFixed(2)}`);
  rows.push(`Paid:     ${invoice.currency || 'USD'} ${Number(invoice.amountPaid || 0).toFixed(2)}`);
  rows.push(`Balance:  ${invoice.currency || 'USD'} ${due(invoice).toFixed(2)}`, '');
  if (invoice.terms) rows.push(`Terms: ${invoice.terms}`);
  if (invoice.notes) rows.push(`Notes: ${invoice.notes}`);
  if (format?.footer) rows.push('', format.footer);
  const text = rows.slice(0, 52).map((line, index) => `BT /F1 ${index === 3 ? 16 : 9} Tf 42 ${790 - index * 14} Td (${pdfEscape(line)}) Tj ET`).join('\n');
  const stream = `${text}\n`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}endstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'ascii'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, 'ascii');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'ascii');
}

function pdfEscape(value: string) {
  return String(value).normalize('NFKD').replace(/[^\x20-\x7E]/g, '?').replace(/[\\()]/g, '\\$&');
}

function report(db: InvoiceDb, route: string, url: URL) {
  let invoices = db.invoices.filter(row => !['DRAFT', 'CANCELLED'].includes(row.status));
  const fromDate = url.searchParams.get('fromDate');
  const toDate = url.searchParams.get('toDate');
  const customerId = url.searchParams.get('customerId');
  const search = url.searchParams.get('search')?.toLowerCase();
  if (fromDate) invoices = invoices.filter(row => String(row.date) >= fromDate);
  if (toDate) invoices = invoices.filter(row => String(row.date) <= toDate);
  if (customerId) invoices = invoices.filter(row => row.customerId === customerId);
  if (search) invoices = invoices.filter(row => `${row.invoiceNo} ${db.customers.find(customer => customer.id === row.customerId)?.name || ''} ${(row.items || []).map((item: AnyRow) => item.description).join(' ')}`.toLowerCase().includes(search));
  if (route === 'aging-report') {
    const asOf = asDate(url.searchParams.get('asOfDate') || undefined);
    const grouped = new Map<string, AnyRow>();
    for (const invoice of invoices.filter(row => due(row) > 0)) {
      const customer = db.customers.find(row => row.id === invoice.customerId);
      const row = grouped.get(invoice.customerId) || { id: invoice.customerId, customerId: invoice.customerId, customerName: customer?.name || '-', currency: invoice.currency, invoiceCount: 0, current: 0, days0To30: 0, days31To60: 0, days61To90: 0, days90Plus: 0, totalOutstanding: 0, oldestDueDate: invoice.dueDate };
      const daysLate = Math.max(0, Math.floor((asOf.getTime() - asDate(invoice.dueDate).getTime()) / 86400000));
      const amount = due(invoice);
      const bucket = daysLate === 0 ? 'current' : daysLate <= 30 ? 'days0To30' : daysLate <= 60 ? 'days31To60' : daysLate <= 90 ? 'days61To90' : 'days90Plus';
      row[bucket] += amount;
      row.invoiceCount += 1;
      row.totalOutstanding += amount;
      row.oldestDueDate = !row.oldestDueDate || asDate(invoice.dueDate) < asDate(row.oldestDueDate) ? invoice.dueDate : row.oldestDueDate;
      grouped.set(invoice.customerId, row);
    }
    const rows = [...grouped.values()];
    const totals = rows.reduce((sum, row) => ({ invoiceCount: sum.invoiceCount + row.invoiceCount, totalOutstanding: sum.totalOutstanding + row.totalOutstanding, days61To90: sum.days61To90 + row.days61To90, days90Plus: sum.days90Plus + row.days90Plus }), { invoiceCount: 0, totalOutstanding: 0, days61To90: 0, days90Plus: 0 });
    return { success: true, data: rows, totals };
  }
  if (route === 'outstanding') {
    let rows: AnyRow[] = invoices.filter(row => due(row) > 0).map(row => {
      const daysOverdue = Math.max(0, Math.floor((Date.now() - asDate(row.dueDate).getTime()) / 86400000));
      return { ...attachInvoice(db, row), outstandingAmount: due(row), daysOverdue, paymentStatus: due(row) === 0 ? 'PAID' : Number(row.amountPaid || 0) > 0 ? 'PARTIAL' : 'SENT' };
    });
    if (url.searchParams.get('overdue') === 'true') rows = rows.filter(row => row.daysOverdue > 0);
    const totals = { invoiceCount: rows.length, outstandingAmount: rows.reduce((sum, row) => sum + row.outstandingAmount, 0), overdueOutstanding: rows.filter(row => row.daysOverdue > 0).reduce((sum, row) => sum + row.outstandingAmount, 0), amountPaid: rows.reduce((sum, row) => sum + Number(row.amountPaid || 0), 0) };
    return { success: true, data: { rows }, totals };
  }
  if (route === 'revenue-by-item') {
    const groupedItems = new Map<string, AnyRow>();
    for (const invoice of invoices) for (const item of invoice.items || []) {
      const product = db.products.find(row => row.id === item.productId);
      const key = item.productId || item.itemCode || item.description || 'unmatched';
      const current = groupedItems.get(key) || { id: key, productId: item.productId, sku: item.itemCode || product?.sku || '-', name: item.description || product?.name || 'Item', quantity: 0, netAmount: 0, taxAmount: 0, revenue: 0, invoiceIds: new Set<string>(), customerIds: new Set<string>(), rates: 0 };
      const gross = Number(item.quantity || 0) * Number(item.unitPrice ?? item.rate ?? 0);
      const net = gross * (1 - Number(item.discount || 0) / 100);
      const tax = net * Number(item.taxRate || 0) / 100;
      current.quantity += Number(item.quantity || 0);
      current.netAmount += net;
      current.taxAmount += tax;
      current.revenue += net + tax;
      current.rates += Number(item.unitPrice ?? item.rate ?? 0);
      current.invoiceIds.add(invoice.id);
      current.customerIds.add(invoice.customerId);
      groupedItems.set(key, current);
    }
    const rows: AnyRow[] = [...groupedItems.values()].map(row => ({ ...row, averageRate: row.quantity ? row.netAmount / row.quantity : 0, invoiceCount: row.invoiceIds.size, customerCount: row.customerIds.size, invoiceIds: undefined, customerIds: undefined, rates: undefined }));
    return { success: true, data: { rows }, totals: { itemCount: rows.length, quantity: rows.reduce((sum, row) => sum + row.quantity, 0), revenue: rows.reduce((sum, row) => sum + row.revenue, 0), taxAmount: rows.reduce((sum, row) => sum + row.taxAmount, 0) } };
  }
  const groupBy = url.searchParams.get('groupBy') || (route === 'revenue-by-customer' ? 'customer' : route === 'revenue-by-item' ? 'item' : 'month');
  const grouped = new Map<string, AnyRow>();
  for (const invoice of invoices) {
    const date = asDate(invoice.date);
    const customer = db.customers.find(row => row.id === invoice.customerId);
    const key = route === 'revenue-by-customer' ? invoice.customerId : groupBy === 'year' ? String(date.getFullYear()) : groupBy === 'quarter' ? `${date.getFullYear()} Q${Math.floor(date.getMonth() / 3) + 1}` : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const row = grouped.get(key) || { id: key, customerId: route === 'revenue-by-customer' ? invoice.customerId : undefined, period: route === 'revenue-by-customer' ? undefined : key, customerName: customer?.name || '-', invoiceCount: 0, subtotal: 0, taxAmount: 0, revenue: 0, amountPaid: 0, outstandingAmount: 0, lastInvoiceDate: invoice.date };
    row.invoiceCount += 1;
    row.subtotal += Number(invoice.subtotal || 0);
    row.taxAmount += Number(invoice.taxAmount || 0);
    row.revenue += Number(invoice.grandTotal ?? invoice.total ?? 0);
    row.amountPaid += Number(invoice.amountPaid || 0);
    row.outstandingAmount += due(invoice);
    if (String(invoice.date) > String(row.lastInvoiceDate)) row.lastInvoiceDate = invoice.date;
    grouped.set(key, row);
  }
  const rows = [...grouped.values()];
  rows.forEach(row => { row.averageInvoiceValue = row.invoiceCount ? row.revenue / row.invoiceCount : 0; });
  return { success: true, data: { rows }, totals: { periodCount: rows.length, customerCount: rows.length, invoiceCount: rows.reduce((sum, row) => sum + row.invoiceCount, 0), revenue: rows.reduce((sum, row) => sum + row.revenue, 0), outstandingAmount: rows.reduce((sum, row) => sum + row.outstandingAmount, 0) } };
}

export async function handleInvoiceBackend(request: Request, path: string[]) {
  return transact(async () => {
    const db = await readDb();
    const method = request.method.toUpperCase();
    const url = new URL(request.url);
    const route = path.join('/');
    const body = (['POST', 'PUT', 'PATCH'].includes(method) ? await request.json().catch(() => ({})) : {}) as AnyRow;
    const save = async (result: Response) => { await writeDb(db); return result; };
    const json = (payload: unknown, status = 200) => Response.json(payload, { status });
    const notFound = () => json({ success: false, message: 'Record not found' }, 404);

    try {
      if (route === 'health' && method === 'GET') return json({ success: true, service: 'invoice-demo-api', storage: 'data/invoice-demo.json' });
      if (route === 'auth/login' && method === 'POST') {
        const user = { id: 'demo-user-id', email: body.email || 'admin@example.com', firstName: 'Demo', lastName: 'Admin', role: 'ADMIN', isActive: true, access: { isSuperAdmin: true, permissions: [], deniedPermissions: [], roles: [] } };
        return json(envelope({ user, accessToken: 'invoice-demo-token', token: 'invoice-demo-token', expiresIn: 86400 }));
      }
      if (route === 'auth/logout' && method === 'POST') return json(envelope({ success: true }));
      if (route === 'invoices/filter-options' && method === 'GET') return json(envelope({ users: [], tags: [...new Set(db.invoices.flatMap(invoice => invoice.tags || []))] }));
      if (route.startsWith('invoicing/reports/')) return json(report(db, route.split('/').at(-1) || '', url));
      if (route === 'invoices/aging-report' && method === 'GET') return json(report(db, 'aging-report', url));
      if (route === 'invoicing/subscriptions/run-due' && method === 'POST') {
        const today = now().slice(0, 10);
        const generated: AnyRow[] = [];
        for (const subscription of db.subscriptions.filter(row => row.isActive !== false && String(row.nextRunDate || '') <= today)) {
          const totals = calculate(subscription.items || [], db);
          const invoice = {
            ...subscription, ...totals, id: id(), invoiceNo: nextNumber(db, 'INV'),
            status: subscription.autoSubmit ? 'SUBMITTED' : 'DRAFT', date: today,
            dueDate: new Date(Date.now() + Number(subscription.paymentTerms || 30) * 86400000).toISOString().slice(0, 10),
            amountPaid: 0, outstandingAmount: totals.total, createdAt: now(),
          };
          db.invoices.unshift(invoice);
          generated.push(attachInvoice(db, invoice));
          const next = new Date(subscription.nextRunDate || today);
          if (subscription.frequency === 'WEEKLY') next.setDate(next.getDate() + 7);
          else if (subscription.frequency === 'QUARTERLY') next.setMonth(next.getMonth() + 3);
          else if (subscription.frequency === 'YEARLY') next.setFullYear(next.getFullYear() + 1);
          else next.setMonth(next.getMonth() + 1);
          subscription.nextRunDate = next.toISOString().slice(0, 10);
          subscription.updatedAt = now();
        }
        return save(json(envelope({ generated: generated.length, invoices: generated }), 201));
      }

      if ((route === 'customers' || route === 'inventory/products' || route === 'products/search' || route === 'products' || route === 'invoices' || route === 'invoicing/sales-invoices' || route === 'invoicing/payments' || route === 'payments' || route === 'payments/entries' || route === 'invoicing/credit-notes' || route === 'invoicing/delivery-notes' || route === 'delivery-notes' || route === 'invoicing/tax-templates' || route === 'invoicing/print-formats' || route === 'invoicing/ledger' || route === 'invoicing/subscriptions' || route === 'invoicing/audit-logs' || route === 'sales/orders' || route === 'inventory/warehouses') && method === 'GET') {
        if (route === 'invoices' || route === 'invoicing/sales-invoices') {
          let rows = db.invoices;
          const status = url.searchParams.get('status');
          const search = url.searchParams.get('search')?.toLowerCase();
          if (status) rows = rows.filter(invoice => invoice.status === status);
          if (url.searchParams.get('savedFilter') === 'not_cancelled') rows = rows.filter(invoice => invoice.status !== 'CANCELLED');
          if (search) rows = rows.filter(invoice => `${invoice.invoiceNo} ${db.customers.find(customer => customer.id === invoice.customerId)?.name || ''}`.toLowerCase().includes(search));
          if (url.searchParams.get('createdOn')) rows = rows.filter(invoice => String(invoice.date).slice(0, 10) === url.searchParams.get('createdOn'));
          if (url.searchParams.get('tag')) rows = rows.filter(invoice => (invoice.tags || []).includes(url.searchParams.get('tag')));
          if (url.searchParams.get('hasTags') === 'true') rows = rows.filter(invoice => invoice.tags?.length);
          if (url.searchParams.get('savedFilter') === 'outstanding') rows = rows.filter(due);
          return json(envelope({ ...paginate(rows.map(invoice => attachInvoice(db, invoice)), url) }));
        }
        if (route === 'customers') {
          const query = (url.searchParams.get('search') || '').toLowerCase();
          const rows = db.customers.filter(row => row.isActive !== false && (!query || `${row.name} ${row.customerNo} ${row.email || ''}`.toLowerCase().includes(query)));
          return json(envelope(paginate(rows, url)));
        }
        if (route === 'products/search') {
          const query = (url.searchParams.get('q') || '').toLowerCase();
          return json(envelope(db.products.filter(row => row.isActive !== false && `${row.name} ${row.sku}`.toLowerCase().includes(query))));
        }
        if (route === 'products' || route === 'inventory/products') return json(envelope(paginate(db.products.filter(row => row.isActive !== false), url)));
        if (route === 'payments' || route === 'invoicing/payments') return json(envelope(paginate(db.payments.map(payment => ({ ...payment, invoice: db.invoices.find(invoice => invoice.id === payment.invoiceId) || null })), url)));
        if (route === 'payments/entries') return json(envelope(paginate(db.paymentEntries, url)));
        if (route === 'invoicing/credit-notes') return json(envelope(paginate(db.creditNotes.map(note => ({ ...note, originalInvoice: db.invoices.find(invoice => invoice.id === note.originalInvoiceId) })), url)));
        if (route === 'delivery-notes' || route === 'invoicing/delivery-notes') return json(envelope(paginate(db.deliveryNotes, url)));
        if (route === 'invoicing/tax-templates') return json(envelope(db.taxTemplates));
        if (route === 'invoicing/print-formats') return json(envelope(db.printFormats));
        if (route === 'invoicing/ledger') return json(envelope(db.ledger));
        if (route === 'invoicing/subscriptions') return json(envelope(paginate(db.subscriptions, url)));
        if (route === 'invoicing/audit-logs') {
          let logs = db.auditLogs;
          if (url.searchParams.get('entityType')) logs = logs.filter(row => row.entityType === url.searchParams.get('entityType'));
          if (url.searchParams.get('action')) logs = logs.filter(row => row.action === url.searchParams.get('action'));
          if (url.searchParams.get('search')) logs = logs.filter(row => `${row.actorEmail} ${row.message} ${row.voucher}`.toLowerCase().includes(String(url.searchParams.get('search')).toLowerCase()));
          const fromDate = url.searchParams.get('fromDate');
          const toDate = url.searchParams.get('toDate');
          if (fromDate) logs = logs.filter(row => String(row.createdAt).slice(0, 10) >= fromDate);
          if (toDate) logs = logs.filter(row => String(row.createdAt).slice(0, 10) <= toDate);
          return json(envelope(paginate(logs, url)));
        }
        if (route === 'sales/orders') return json(envelope(paginate(db.salesOrders, url)));
        if (route === 'inventory/warehouses') return json(envelope(db.warehouses));
      }

      const invoicePdfMatch = route.match(/^invoices\/([^/]+)\/pdf$/);
      if (invoicePdfMatch && method === 'GET') {
        const invoice = db.invoices.find(row => row.id === invoicePdfMatch[1]);
        if (!invoice) return notFound();
        const bytes = invoicePdf(attachInvoice(db, invoice), db, url.searchParams.get('printFormatId') || undefined);
        return new Response(bytes, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${invoice.invoiceNo}.pdf"`, 'Cache-Control': 'no-store' } });
      }

      if (route === 'invoices' && method === 'POST') {
        if (!db.customers.some(row => row.id === body.customerId)) throw apiError('Select a valid customer before creating an invoice.');
        const totals = calculate(body.items || [], db);
        if (!totals.items.length || totals.items.some(item => item.quantity <= 0)) throw apiError('Add at least one valid invoice line item.');
          const invoice = {
            ...body, ...totals, id: id(), invoiceNo: nextNumber(db, 'INV'), status: 'DRAFT', amountPaid: 0,
            grossWeight: body.grossWeight == null || body.grossWeight === '' ? undefined : Number(body.grossWeight),
            netWeight: body.netWeight == null || body.netWeight === '' ? undefined : Number(body.netWeight),
            packageCount: body.packageCount == null || body.packageCount === '' ? undefined : Number(body.packageCount),
            outstandingAmount: totals.total, date: body.date || now().slice(0, 10), createdAt: now(), updatedAt: now(),
          };
        db.invoices.unshift(invoice);
        audit(db, 'SALES_INVOICE', 'CREATE', invoice.id, invoice.invoiceNo, `Created ${invoice.invoiceNo}`, undefined, 'DRAFT');
        return save(json(envelope(attachInvoice(db, invoice)), 201));
      }

      const fromDelivery = route.match(/^invoices\/from-delivery-note\/([^/]+)$/);
      if (fromDelivery && method === 'POST') {
        const note = db.deliveryNotes.find(row => row.id === fromDelivery[1]);
        if (!note) return notFound();
        const items = (note.items || []).map((item: AnyRow) => {
          const product = db.products.find(row => row.id === item.productId);
          return { ...item, itemCode: item.itemCode || product?.sku, description: item.description || product?.name, unitPrice: item.unitPrice ?? product?.salePrice ?? 0, taxRate: item.taxRate ?? product?.taxRate ?? 0 };
        });
        const totals = calculate(items, db);
        const invoice = { ...note, ...totals, id: id(), invoiceNo: nextNumber(db, 'INV'), status: 'DRAFT', date: now().slice(0, 10), amountPaid: 0, outstandingAmount: totals.total, createdAt: now() };
        db.invoices.unshift(invoice);
        note.invoicedAt = now();
        audit(db, 'SALES_INVOICE', 'CREATE_FROM_DELIVERY_NOTE', invoice.id, invoice.invoiceNo, `Created from delivery note ${note.deliveryNo || note.id}`, undefined, 'DRAFT');
        return save(json(envelope(attachInvoice(db, invoice)), 201));
      }

      const invoiceAction = route.match(/^invoices\/([^/]+)(?:\/(status|amend))?$/);
      if (invoiceAction) {
        const [, invoiceId, action] = invoiceAction;
        const index = db.invoices.findIndex(row => row.id === invoiceId);
        if (index < 0) return notFound();
        const invoice = db.invoices[index];
        if (action === 'amend' && method === 'POST') {
          const amended = { ...invoice, id: id(), invoiceNo: nextNumber(db, 'INV'), status: 'DRAFT', amountPaid: 0, createdAt: now(), updatedAt: now() };
          db.invoices.unshift(amended);
          audit(db, 'SALES_INVOICE', 'AMEND', amended.id, amended.invoiceNo, `Amended from ${invoice.invoiceNo}`, invoice.status, 'DRAFT');
          return save(json(envelope(attachInvoice(db, amended)), 201));
        }
        if (action === 'status' && method === 'PATCH') {
          if (body.status === 'SUBMITTED' && !invoice.items?.length) throw apiError('Add line items before submitting this invoice.');
          if (body.status === 'CANCELLED' && Number(invoice.amountPaid || 0) > 0) throw apiError('This invoice has recorded payments. Create and submit a credit note to reverse its balance.');
          const previousStatus = invoice.status;
          invoice.status = body.status;
          invoice.submittedAt = body.status === 'SUBMITTED' ? now() : invoice.submittedAt;
          invoice.outstandingAmount = due(invoice);
          db.invoices[index] = invoice;
          audit(db, 'SALES_INVOICE', body.status === 'CANCELLED' ? 'CANCEL' : 'SUBMIT', invoice.id, invoice.invoiceNo, `${invoice.invoiceNo} ${String(body.status).toLowerCase()}`, previousStatus, body.status);
          if (body.status === 'SUBMITTED') {
            db.ledger.unshift({ id: id(), postingDate: now().slice(0, 10), accountId: '1100 - Accounts Receivable', account: { code: '1100', name: 'Accounts Receivable' }, voucherType: 'SALES_INVOICE', voucherNo: invoice.invoiceNo, entityId: invoice.id, debit: invoice.total, credit: 0, currency: invoice.currency, remarks: `Invoice ${invoice.invoiceNo}`, createdAt: now() });
            db.ledger.unshift({ id: id(), postingDate: now().slice(0, 10), accountId: '4000 - Sales Revenue', account: { code: '4000', name: 'Sales Revenue' }, voucherType: 'SALES_INVOICE', voucherNo: invoice.invoiceNo, entityId: invoice.id, debit: 0, credit: invoice.subtotal, currency: invoice.currency, remarks: `Invoice ${invoice.invoiceNo}`, createdAt: now() });
            if (invoice.taxAmount) db.ledger.unshift({ id: id(), postingDate: now().slice(0, 10), accountId: '2100 - Tax Payable', account: { code: '2100', name: 'Tax Payable' }, voucherType: 'SALES_INVOICE', voucherNo: invoice.invoiceNo, entityId: invoice.id, debit: 0, credit: invoice.taxAmount, currency: invoice.currency, remarks: `Tax on ${invoice.invoiceNo}`, createdAt: now() });
          } else if (body.status === 'CANCELLED' && previousStatus !== 'DRAFT') {
            db.ledger.unshift({ id: id(), postingDate: now().slice(0, 10), accountId: '1100 - Accounts Receivable', account: { code: '1100', name: 'Accounts Receivable' }, voucherType: 'INVOICE_REVERSAL', voucherNo: invoice.invoiceNo, entityId: invoice.id, debit: 0, credit: invoice.total, currency: invoice.currency, remarks: `Reversal of ${invoice.invoiceNo}`, createdAt: now() });
            db.ledger.unshift({ id: id(), postingDate: now().slice(0, 10), accountId: '4000 - Sales Revenue', account: { code: '4000', name: 'Sales Revenue' }, voucherType: 'INVOICE_REVERSAL', voucherNo: invoice.invoiceNo, entityId: invoice.id, debit: invoice.subtotal, credit: 0, currency: invoice.currency, remarks: `Reversal of ${invoice.invoiceNo}`, createdAt: now() });
            if (invoice.taxAmount) db.ledger.unshift({ id: id(), postingDate: now().slice(0, 10), accountId: '2100 - Tax Payable', account: { code: '2100', name: 'Tax Payable' }, voucherType: 'INVOICE_REVERSAL', voucherNo: invoice.invoiceNo, entityId: invoice.id, debit: invoice.taxAmount, credit: 0, currency: invoice.currency, remarks: `Tax reversal of ${invoice.invoiceNo}`, createdAt: now() });
          }
          return save(json(envelope(attachInvoice(db, invoice))));
        }
        if (method === 'GET') return json(envelope(attachInvoice(db, invoice)));
        if (method === 'PATCH') {
          if (invoice.status !== 'DRAFT') throw apiError('Only draft invoices can be edited.');
          const totals = calculate(body.items || invoice.items || [], db);
          Object.assign(invoice, body, totals, {
            grossWeight: body.grossWeight == null || body.grossWeight === '' ? undefined : Number(body.grossWeight),
            netWeight: body.netWeight == null || body.netWeight === '' ? undefined : Number(body.netWeight),
            packageCount: body.packageCount == null || body.packageCount === '' ? undefined : Number(body.packageCount),
            updatedAt: now(), outstandingAmount: totals.total - Number(invoice.amountPaid || 0) - Number(invoice.creditAmount || 0),
          });
          db.invoices[index] = invoice;
          return save(json(envelope(attachInvoice(db, invoice))));
        }
      }

      if (route === 'payments' || route === 'invoicing/payments') {
        if (method === 'POST') {
          const amount = Number(body.amount || body.paidAmount || 0);
          if (amount <= 0) throw apiError('Payment amount must be greater than zero.');
          const invoice = db.invoices.find(row => row.id === body.invoiceId);
          if (!invoice) throw apiError('Select an invoice for this payment.');
          if (amount > due(invoice)) throw apiError('Payment cannot exceed the invoice outstanding amount.');
          const payment = { ...body, id: id(), paymentNo: nextNumber(db, 'PAY'), amount, paidAmount: amount, currency: body.currency || invoice.currency, customerId: invoice.customerId, status: 'POSTED', date: body.date || now().slice(0, 10), createdAt: now(), invoice: { invoiceNo: invoice.invoiceNo } };
          db.payments.unshift(payment);
          audit(db, 'SALES_INVOICE', 'PAYMENT', invoice.id, invoice.invoiceNo, `Payment ${payment.paymentNo} recorded`, invoice.status, invoice.status);
          invoice.amountPaid = Number(invoice.amountPaid || 0) + amount;
          invoice.outstandingAmount = due(invoice);
          invoice.status = invoice.outstandingAmount === 0 ? 'PAID' : 'PARTIAL';
          db.ledger.unshift({ id: id(), postingDate: payment.date, accountId: '1000 - Bank', account: { code: '1000', name: 'Bank' }, voucherType: 'PAYMENT', voucherNo: payment.paymentNo, entityId: payment.id, debit: amount, credit: 0, currency: payment.currency, remarks: `Receipt for ${invoice.invoiceNo}`, createdAt: now() });
          db.ledger.unshift({ id: id(), postingDate: payment.date, accountId: '1100 - Accounts Receivable', account: { code: '1100', name: 'Accounts Receivable' }, voucherType: 'PAYMENT', voucherNo: payment.paymentNo, entityId: payment.id, debit: 0, credit: amount, currency: payment.currency, remarks: `Receipt for ${invoice.invoiceNo}`, createdAt: now() });
          return save(json(envelope(payment), 201));
        }
      }

      const paymentId = route.match(/^(?:invoicing\/)?payments\/([^/]+)$/);
      if (paymentId && method === 'GET') {
        const payment = db.payments.find(row => row.id === paymentId[1]);
        return payment ? json(envelope({ ...payment, invoice: db.invoices.find(row => row.id === payment.invoiceId) || null })) : notFound();
      }

      if (route === 'customers' && method === 'POST') {
        const name = String(body.name || '').trim();
        if (!name) throw apiError('Customer name is required.');
        const customer = { ...body, name, id: id(), customerNo: nextNumber(db, 'CUS'), currency: body.currency || 'USD', paymentTerms: Number(body.paymentTerms ?? 30), creditLimit: Number(body.creditLimit || 0), isActive: true, createdAt: now(), updatedAt: now() };
        db.customers.unshift(customer);
        return save(json(envelope(customer), 201));
      }

      const customerMatch = route.match(/^customers\/([^/]+)$/);
      const customerInvoices = route.match(/^customers\/([^/]+)\/invoices$/);
      if (customerInvoices && method === 'GET') {
        const rows = db.invoices.filter(invoice => invoice.customerId === customerInvoices[1]).map(invoice => attachInvoice(db, invoice));
        return json(envelope(paginate(rows, url)));
      }
      const customerOutstanding = route.match(/^customers\/([^/]+)\/outstanding$/);
      if (customerOutstanding && method === 'GET') {
        const rows = db.invoices.filter(invoice => invoice.customerId === customerOutstanding[1] && due(invoice) > 0);
        return json(envelope({ outstandingAmount: rows.reduce((sum, invoice) => sum + due(invoice), 0), invoices: rows.map(invoice => attachInvoice(db, invoice)) }));
      }
      if (customerMatch) {
        const index = db.customers.findIndex(row => row.id === customerMatch[1]);
        if (index < 0) return notFound();
        if (method === 'GET') return json(envelope(db.customers[index]));
        if (method === 'PUT' || method === 'PATCH') { Object.assign(db.customers[index], body, { updatedAt: now() }); return save(json(envelope(db.customers[index]))); }
        if (method === 'DELETE') { db.customers[index].isActive = false; return save(json(envelope({ id: customerMatch[1] }))); }
      }

      if ((route === 'inventory/products' || route === 'products') && method === 'POST') {
        if (!body.name) throw apiError('Product name is required.');
        const product = { ...body, id: id(), sku: body.sku || nextNumber(db, 'SKU'), salePrice: Number(body.salePrice || 0), taxRate: Number(body.taxRate || 0), type: body.type || 'PRODUCT', isActive: true, createdAt: now() };
        db.products.unshift(product);
        return save(json(envelope(product), 201));
      }
      const productMatch = route.match(/^(?:inventory\/)?products\/([^/]+)$/);
      if (productMatch) {
        const index = db.products.findIndex(row => row.id === productMatch[1]);
        if (index < 0) return notFound();
        if (method === 'GET') return json(envelope(db.products[index]));
        if (method === 'PATCH' || method === 'PUT') { Object.assign(db.products[index], body, { updatedAt: now() }); return save(json(envelope(db.products[index]))); }
        if (method === 'DELETE') { db.products[index].isActive = false; return save(json(envelope({ id: productMatch[1] }))); }
      }

      if (route === 'invoicing/tax-templates' && method === 'POST') {
        const template = { ...body, id: id(), isActive: body.isActive !== false, createdAt: now() };
        db.taxTemplates.unshift(template);
        return save(json(envelope(template), 201));
      }

      if (route === 'invoicing/print-formats' && method === 'POST') {
        const format = { ...body, id: id(), isActive: body.isActive !== false, createdAt: now() };
        db.printFormats.unshift(format);
        return save(json(envelope(format), 201));
      }

      const basicCollections: Record<string, keyof InvoiceDb> = {
        'invoicing/tax-templates': 'taxTemplates', 'invoicing/print-formats': 'printFormats',
        'invoicing/credit-notes': 'creditNotes', 'invoicing/delivery-notes': 'deliveryNotes', 'delivery-notes': 'deliveryNotes',
        'payments/entries': 'paymentEntries', 'invoicing/subscriptions': 'subscriptions',
      };
      const collection = basicCollections[route];
      if (collection && method === 'POST') {
        const row: AnyRow = { ...body, id: id(), createdAt: now(), status: body.status || 'DRAFT' };
        if (collection === 'deliveryNotes') {
          row.deliveryNo = nextNumber(db, 'DN');
          row.customer = db.customers.find(customer => customer.id === body.customerId) || null;
          audit(db, 'DELIVERY_NOTE', 'CREATE', row.id, row.deliveryNo, `Created delivery note ${row.deliveryNo}`, undefined, 'DRAFT');
        }
        if (collection === 'paymentEntries') {
          row.paymentNo = nextNumber(db, 'PE');
          row.allocatedAmount = (body.allocations || []).reduce((sum: number, allocation: AnyRow) => sum + Number(allocation.allocatedAmount || 0), 0);
          row.unallocatedAmount = Math.max(0, Number(body.paidAmount || 0) - row.allocatedAmount);
          row.customer = db.customers.find(customer => customer.id === body.customerId) || null;
        }
        (db[collection] as AnyRow[]).unshift(row);
        return save(json(envelope(row), 201));
      }

      const genericAction = route.match(/^(?:(invoicing)\/)?(tax-templates|print-formats|credit-notes|delivery-notes|subscriptions|payments\/entries)\/([^/]+)(?:\/(status))?$/);
      if (genericAction) {
        const [, invoicingPrefix, name, recordId, action] = genericAction;
        const key = name === 'tax-templates' ? 'taxTemplates' : name === 'print-formats' ? 'printFormats' : name === 'credit-notes' ? 'creditNotes' : name === 'delivery-notes' ? 'deliveryNotes' : name === 'subscriptions' ? 'subscriptions' : 'paymentEntries';
        const list = db[key] as AnyRow[];
        const index = list.findIndex(row => row.id === recordId);
        if (index < 0) return notFound();
        if (method === 'GET') return json(envelope(list[index]));
        if (method === 'PATCH' || method === 'PUT') {
          const previousStatus = list[index].status;
          if (action === 'status') list[index].status = body.status;
          else Object.assign(list[index], body, { updatedAt: now() });
          if (key === 'deliveryNotes' && action === 'status') audit(db, 'DELIVERY_NOTE', body.status === 'CANCELLED' ? 'CANCEL' : 'SUBMIT', list[index].id, list[index].deliveryNo, `Delivery note ${list[index].deliveryNo} ${String(body.status).toLowerCase()}`, previousStatus, body.status);
          if (key === 'creditNotes' && action === 'status' && body.status === 'SUBMITTED') {
            if (list[index].status !== 'DRAFT') throw apiError('Only draft credit notes can be submitted.');
            const original = db.invoices.find(invoice => invoice.id === list[index].originalInvoiceId);
            const amount = calculate(list[index].items || [], db).total;
            if (!original) throw apiError('The original invoice for this credit note no longer exists.');
            if (amount > Number(original.grandTotal ?? original.total ?? 0) - Number(original.creditAmount || 0)) throw apiError('Credit note total exceeds the remaining invoice value.');
            original.creditAmount = Number(original.creditAmount || 0) + amount;
            original.outstandingAmount = due(original);
            audit(db, 'CREDIT_NOTE', 'SUBMIT', list[index].id, list[index].creditNoteNo, `Submitted against ${original.invoiceNo}`, 'DRAFT', 'SUBMITTED');
            db.ledger.unshift({ id: id(), postingDate: now().slice(0, 10), accountId: '1100 - Accounts Receivable', account: { code: '1100', name: 'Accounts Receivable' }, voucherType: 'CREDIT_NOTE', voucherNo: list[index].creditNoteNo, entityId: list[index].id, debit: 0, credit: amount, currency: original.currency, remarks: `Credit against ${original.invoiceNo}`, createdAt: now() });
            db.ledger.unshift({ id: id(), postingDate: now().slice(0, 10), accountId: '4100 - Sales Returns', account: { code: '4100', name: 'Sales Returns' }, voucherType: 'CREDIT_NOTE', voucherNo: list[index].creditNoteNo, entityId: list[index].id, debit: Math.max(0, amount - Number(list[index].taxAmount || 0)), credit: 0, currency: original.currency, remarks: `Credit against ${original.invoiceNo}`, createdAt: now() });
            if (Number(list[index].taxAmount || 0)) db.ledger.unshift({ id: id(), postingDate: now().slice(0, 10), accountId: '2100 - Tax Payable', account: { code: '2100', name: 'Tax Payable' }, voucherType: 'CREDIT_NOTE', voucherNo: list[index].creditNoteNo, entityId: list[index].id, debit: list[index].taxAmount, credit: 0, currency: original.currency, remarks: `Tax reversal for ${original.invoiceNo}`, createdAt: now() });
          }
          if (key === 'paymentEntries' && action === 'status' && body.status === 'SUBMITTED') {
            if (list[index].status !== 'DRAFT') throw apiError('Only draft payment entries can be submitted.');
            let allocatedTotal = 0;
            for (const allocation of list[index].allocations || []) {
              const invoice = db.invoices.find(row => row.id === allocation.invoiceId);
              const amount = Number(allocation.allocatedAmount || 0);
              if (!invoice || amount <= 0 || amount > due(invoice)) throw apiError('A payment allocation exceeds its invoice balance.');
              allocatedTotal += amount;
              invoice.amountPaid = Number(invoice.amountPaid || 0) + amount;
              invoice.outstandingAmount = due(invoice);
              invoice.status = invoice.outstandingAmount === 0 ? 'PAID' : 'PARTIAL';
              db.ledger.unshift({ id: id(), postingDate: now().slice(0, 10), accountId: '1100 - Accounts Receivable', account: { code: '1100', name: 'Accounts Receivable' }, voucherType: 'PAYMENT_ENTRY', voucherNo: list[index].paymentNo, entityId: list[index].id, debit: 0, credit: amount, currency: list[index].currency, remarks: `Receipt for ${invoice.invoiceNo}`, createdAt: now() });
            }
            const paidAmount = Number(list[index].paidAmount || 0);
            if (allocatedTotal > paidAmount) throw apiError('Allocated amount cannot exceed the receipt amount.');
            list[index].allocatedAmount = allocatedTotal;
            list[index].unallocatedAmount = paidAmount - allocatedTotal;
            list[index].status = 'SUBMITTED';
            list[index].submittedAt = now();
            db.ledger.unshift({ id: id(), postingDate: now().slice(0, 10), accountId: '1000 - Bank', account: { code: '1000', name: 'Bank' }, voucherType: 'PAYMENT_ENTRY', voucherNo: list[index].paymentNo, entityId: list[index].id, debit: paidAmount, credit: 0, currency: list[index].currency, remarks: `Receipt ${list[index].paymentNo}`, createdAt: now() });
            if (paidAmount > allocatedTotal) db.ledger.unshift({ id: id(), postingDate: now().slice(0, 10), accountId: '2200 - Customer Advances', account: { code: '2200', name: 'Customer Advances' }, voucherType: 'PAYMENT_ENTRY', voucherNo: list[index].paymentNo, entityId: list[index].id, debit: 0, credit: paidAmount - allocatedTotal, currency: list[index].currency, remarks: `Unallocated receipt ${list[index].paymentNo}`, createdAt: now() });
            audit(db, 'PAYMENT_ENTRY', 'SUBMIT', list[index].id, list[index].paymentNo, `Submitted receipt ${list[index].paymentNo}`, 'DRAFT', 'SUBMITTED');
          }
          return save(json(envelope(list[index])));
        }
      }

      const creditFromInvoice = route.match(/^invoicing\/credit-notes\/from-invoice\/([^/]+)$/);
      if (creditFromInvoice && method === 'POST') {
        const invoice = db.invoices.find(row => row.id === creditFromInvoice[1]);
        if (!invoice) return notFound();
        const totals = calculate(body.items || [], db);
        const note = { ...body, ...totals, id: id(), creditNoteNo: nextNumber(db, 'CN'), originalInvoiceId: invoice.id, customerId: invoice.customerId, currency: invoice.currency, status: 'DRAFT', createdAt: now() };
        db.creditNotes.unshift(note);
        audit(db, 'CREDIT_NOTE', 'CREATE', note.id, note.creditNoteNo, `Created against ${invoice.invoiceNo}`, undefined, 'DRAFT');
        return save(json(envelope(note), 201));
      }

      const deliveryFromOrder = route.match(/^delivery-notes\/from-sales-order\/([^/]+)$/);
      if (deliveryFromOrder && method === 'POST') {
        const order = db.salesOrders.find(row => row.id === deliveryFromOrder[1]);
        if (!order) throw apiError('Sales order not found.');
        const note = { ...order, id: id(), deliveryNo: nextNumber(db, 'DN'), status: 'DRAFT', date: now().slice(0, 10), createdAt: now() };
        db.deliveryNotes.unshift(note);
        return save(json(envelope(note), 201));
      }

      return json({ success: false, message: `Invoice demo API route is not implemented: ${method} /api/v1/${route}` }, 501);
    } catch (error: any) {
      return json({ success: false, message: error?.message || 'Invoice API request failed' }, error?.status || 500);
    }
  });
}
