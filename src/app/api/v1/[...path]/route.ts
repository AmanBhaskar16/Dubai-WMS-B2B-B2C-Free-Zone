import { handleInvoiceBackend } from '@/lib/invoiceBackend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ path: string[] }> };

async function dispatch(request: Request, context: Context) {
  const { path } = await context.params;
  return handleInvoiceBackend(request, path);
}

export const GET = dispatch;
export const POST = dispatch;
export const PUT = dispatch;
export const PATCH = dispatch;
export const DELETE = dispatch;
