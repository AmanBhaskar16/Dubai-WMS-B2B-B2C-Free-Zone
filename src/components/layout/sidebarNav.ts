import {
  LayoutDashboard,
  BookOpen,
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  FileText,
  ShoppingBag,
  FolderOpen,
  Building2,
  Truck,
  Settings,
  Clock,
  ShieldCheck,
  BriefcaseBusiness,
  ClipboardList,
  Tags,
  Receipt,
  CreditCard,
  Landmark,
  FileMinus,
  Percent,
  Printer,
  Repeat,
  ClipboardCheck,
  Hourglass,
  CircleDollarSign,
  CalendarDays,
  ScrollText,
  CalendarRange,
  Network,
  WalletCards,
  BarChart3,
  Warehouse,
  Boxes,
  ArrowLeftRight,
  Layers,
  Archive,
  LockKeyhole,
  Calculator,
  ChartColumnIncreasing,
  ArchiveX,
  UserRound,
  Building,
  Target,
  Activity,
  Route,
  Upload,
  FileCheck2,
  ClipboardSignature,
  CalendarCheck,
  CalendarCog,
  CalendarX,
  ListChecks,
  HandCoins,
  BadgeDollarSign,
  Wallet,
  UserCog,
  SlidersHorizontal,
  KeyRound,
  Handshake,
  Scale,
  PackageCheck,
  History,
  ScanLine,
  Bell,
  Plug,
  Database,
  RotateCcw,
  Settings2,
  FileClock,
  Send,
  Store,
  RefreshCw,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Gauge,
  MapPin,
  Grid3X3,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  permission?: string;
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard:dashboard:read',
  },

  // {
  //   label: 'Audit Trail',
  //   href: '/audit-trail',
  //   icon: History,
  //   permission: 'access:audit:read',
  // },

  // =========================================================
  // ACCOUNTING
  // =========================================================
  // {
  //   label: 'Accounting',
  //   icon: Landmark,
  //   children: [
  //     {
  //       label: 'Chart of Accounts',
  //       href: '/accounting/accounts',
  //       icon: Network,
  //       permission: 'accounting:accounts:read',
  //     },
  //     {
  //       label: 'Journal Entries',
  //       href: '/accounting/journal-entries',
  //       icon: ScrollText,
  //       permission: 'accounting:journal-entries:read',
  //     },
  //     {
  //       label: 'Fiscal Years',
  //       href: '/accounting/fiscal-years',
  //       icon: CalendarRange,
  //       permission: 'accounting:fiscal-years:read',
  //     },
  //     {
  //       label: 'Cost Centers',
  //       href: '/accounting/cost-centers',
  //       icon: Building2,
  //       permission: 'accounting:cost-centers:read',
  //     },
  //     {
  //       label: 'Budgets',
  //       href: '/accounting/budgets',
  //       icon: WalletCards,
  //       permission: 'accounting:budgets:read',
  //     },
  //     {
  //       label: 'Bank Reconciliation',
  //       href: '/accounting/bank-reconciliation',
  //       icon: ShieldCheck,
  //       permission: 'accounting:reconciliation:read',
  //     },
  //     {
  //       label: 'Financial Reports',
  //       href: '/accounting/reports',
  //       icon: BarChart3,
  //       permission: 'accounting:reports:read',
  //     },
  //   ],
  // },



  // =========================================================
  // WAREHOUSE & LOCATIONS
  // =========================================================
  {
    label: 'Warehouse & Locations',
    icon: Warehouse,
    children: [
      { label: 'Multi-Warehouse Management', href: '/warehouse-locations/warehouses', icon: Building2 },
      { label: 'Warehouse Hierarchy', href: '/warehouse-locations/hierarchy', icon: Layers },
      { label: 'Storage Zone Configuration', href: '/warehouse-locations/zones', icon: Grid3X3 },
      { label: 'Bin-Level Inventory', href: '/warehouse-locations/bins', icon: Package },
      { label: 'Warehouse Capacity', href: '/warehouse-locations/capacity', icon: Gauge },
      { label: 'Location Attributes', href: '/warehouse-locations/attributes', icon: MapPin },
      { label: 'Putaway Rules', href: '/warehouse-locations/putaway', icon: Target },
      { label: 'Warehouse Configuration', href: '/warehouse-locations/configuration', icon: Settings2 },
    ],
  },

  // =========================================================
  // PRODUCT & INVENTORY MASTER
  // =========================================================
  {
    label: 'Product & Inventory Master',
    icon: Boxes,
    children: [
      { label: 'SKU Master', href: '/product-master/sku-master', icon: Package },
      { label: 'Product Categories', href: '/product-master/categories', icon: Layers },
      { label: 'Barcode Management', href: '/product-master/barcodes', icon: Tags },
      { label: 'UOM Management', href: '/product-master/uom', icon: Scale },
      { label: 'Pack Configuration', href: '/product-master/pack-config', icon: Boxes },
      { label: 'Batch Management', href: '/product-master/batches', icon: ClipboardList },
      { label: 'Serial Number Management', href: '/product-master/serials', icon: KeyRound },
      { label: 'Expiry Management', href: '/product-master/expiry', icon: CalendarDays },
      { label: 'Product Dimensions & Weight', href: '/product-master/dimensions', icon: SlidersHorizontal },
      { label: 'Country of Origin', href: '/product-master/origin', icon: Activity },
      { label: 'HS Code & Customs', href: '/product-master/hs-code', icon: ShieldCheck },
    ],
  },

  // =========================================================
  // INBOUND / RECEIVING
  // =========================================================
  {
    label: 'Inbound / Receiving',
    icon: Truck,
    children: [
      { label: 'Purchase Order Receiving', href: '/inbound/po-receiving', icon: ShoppingBag },
      { label: 'Advance Shipment Notice (ASN)', href: '/inbound/asn', icon: Truck },
      { label: 'Inbound Orders', href: '/inbound/inbound-orders', icon: ClipboardList },
      { label: 'Dock / Appointment Scheduling', href: '/inbound/appointments', icon: CalendarDays },
      { label: 'Goods Receipt', href: '/inbound/goods-receipt', icon: PackageCheck },
      { label: 'Barcode Receiving', href: '/inbound/barcode-receiving', icon: Tags },
      { label: 'Short/Excess Receiving', href: '/inbound/short-excess', icon: AlertTriangle },
      { label: 'Quality Inspection', href: '/inbound/quality-inspection', icon: ShieldCheck },
      { label: 'Quarantine Stock', href: '/inbound/quarantine', icon: LockKeyhole },
      { label: 'Putaway', href: '/inbound/putaway', icon: Target },
      { label: 'GRN Generation', href: '/inbound/grn', icon: FileCheck2 },
    ],
  },

  {
    label: 'Invoices',
    icon: Receipt,
    children: [
      { label: 'Sales Invoices', href: '/invoicing/sales-invoices', icon: FileText },
      { label: 'Payments', href: '/invoicing/payments', icon: CreditCard },
      { label: 'Delivery Notes', href: '/invoicing/delivery-notes', icon: Truck },
      { label: 'Credit Notes', href: '/invoicing/credit-notes', icon: FileMinus },
      { label: 'Payment Entries', href: '/invoicing/payment-entries', icon: HandCoins },
      { label: 'Invoice Ledger', href: '/invoicing/ledger', icon: ScrollText },
      { label: 'Aging Report', href: '/invoicing/reports/aging', icon: BarChart3 },
      { label: 'Outstanding Invoices', href: '/invoicing/reports/outstanding', icon: FileClock },
      { label: 'Revenue by Period', href: '/invoicing/reports/revenue-by-period', icon: ChartColumnIncreasing },
      { label: 'Revenue by Customer', href: '/invoicing/reports/revenue-by-customer', icon: Users },
      { label: 'Revenue by Item', href: '/invoicing/reports/revenue-by-item', icon: Package },
      { label: 'Tax Templates', href: '/invoicing/tax-templates', icon: Percent },
      { label: 'Print Formats', href: '/invoicing/print-formats', icon: Printer },
      { label: 'Recurring Invoices', href: '/invoicing/subscriptions', icon: Repeat },
      { label: 'Invoice Audit Log', href: '/invoicing/audit-log', icon: History },
    ],
  },

  // =========================================================
  // HR
  // =========================================================
  // {
  //   label: 'HR',
  //   icon: Users,
  //   children: [
  //     {
  //       label: 'HR Desk',
  //       href: '/hr/desk',
  //       icon: LayoutDashboard,
  //     },
  //     {
  //       label: 'My Profile',
  //       href: '/hr/my-profile',
  //       icon: UserRound,
  //     },
  //     {
  //       label: 'Employees',
  //       href: '/hr/employees',
  //       icon: Users,
  //       permission: 'hr:employees:read',
  //     },
  //     {
  //       label: 'Departments',
  //       href: '/hr/departments',
  //       icon: Building,
  //     },
  //     {
  //       label: 'Positions',
  //       href: '/hr/positions',
  //       icon: BriefcaseBusiness,
  //     },
  //     {
  //       label: 'Attendance',
  //       href: '/hr/attendance',
  //       icon: CalendarCheck,
  //     },
  //     {
  //       label: 'Shifts',
  //       href: '/hr/shifts',
  //       icon: CalendarCog,
  //     },
  //     {
  //       label: 'Leave Management',
  //       href: '/hr/leave',
  //       icon: CalendarX,
  //     },
  //     {
  //       label: 'Leave Ledger',
  //       href: '/hr/leave-ledger',
  //       icon: ListChecks,
  //     },
  //     {
  //       label: 'Lifecycle',
  //       href: '/hr/lifecycle',
  //       icon: UserCog,
  //     },
  //     {
  //       label: 'Salary Structures',
  //       href: '/hr/salary-structures',
  //       icon: BadgeDollarSign,
  //     },
  //     {
  //       label: 'Payroll Entries',
  //       href: '/hr/payroll-entries',
  //       icon: HandCoins,
  //     },
  //     {
  //       label: 'Salary Slips',
  //       href: '/hr/salary-slips',
  //       icon: Receipt,
  //     },
  //     {
  //       label: 'Payroll',
  //       href: '/hr/payroll',
  //       icon: Wallet,
  //       permission: 'hr:payroll:read',
  //     },
  //   ],
  // },

  // =========================================================
  // CRM
  // =========================================================
  // {
  //   label: 'CRM',
  //   icon: Handshake,
  //   children: [
  //     {
  //       label: 'CRM Dashboard',
  //       href: '/crm/dashboard',
  //       icon: LayoutDashboard,
  //       permission: 'crm:dashboard:read',
  //     },
  //     {
  //       label: 'Leads',
  //       href: '/crm/leads',
  //       icon: Target,
  //       permission: 'crm:leads:read',
  //     },
  //     {
  //       label: 'Customers',
  //       href: '/customers',
  //       icon: Users,
  //       permission: 'customers:customers:read',
  //     },
  //     {
  //       label: 'Lead Imports',
  //       href: '/crm/imports',
  //       icon: Upload,
  //       permission: 'crm:imports:read',
  //     },
  //     {
  //       label: 'Organizations',
  //       href: '/crm/organizations',
  //       icon: Building2,
  //       permission: 'crm:organizations:read',
  //     },
  //     {
  //       label: 'Opportunities',
  //       href: '/crm/opportunities',
  //       icon: TrendingUp,
  //     },
  //     {
  //       label: 'Activities',
  //       href: '/crm/activities',
  //       icon: Activity,
  //     },
  //     {
  //       label: 'Assignment Rules',
  //       href: '/crm/assignment-rules',
  //       icon: Route,
  //       permission: 'crm:assignment-rules:read',
  //     },
  //     {
  //       label: 'CRM Reports',
  //       href: '/crm/reports',
  //       icon: BarChart3,
  //       permission: 'crm:reports:read',
  //     },
  //     {
  //       label: 'CRM Configuration',
  //       href: '/crm/settings',
  //       icon: Settings,
  //     },
  //   ],
  // },

  // =========================================================
  // SALES
  // =========================================================
  // {
  //   label: 'Sales',
  //   icon: ShoppingCart,
  //   children: [
  //     {
  //       label: 'Sales Orders',
  //       href: '/sales/orders',
  //       icon: ShoppingCart,
  //       permission: 'sales:sales-orders:read',
  //     },
  //     {
  //       label: 'Quotations',
  //       href: '/sales/quotations',
  //       icon: FileCheck2,
  //       permission: 'sales:quotations:read',
  //     },
  //     {
  //       label: 'Sales Enquiries',
  //       href: '/sales/enquiries',
  //       icon: ClipboardSignature,
  //     },
  //     {
  //       label: 'Fulfilment',
  //       href: '/sales/fulfilment',
  //       icon: PackageCheck,
  //     },
  //     {
  //       label: 'Sales Reports',
  //       href: '/sales/reports',
  //       icon: BarChart3,
  //     },
  //     {
  //       label: 'Sales Configuration',
  //       href: '/sales/settings',
  //       icon: Settings,
  //     },
  //   ],
  // },



  // =========================================================
  // M10 - 3PL / MULTI-CLIENT WAREHOUSE
  // =========================================================
  {
    label: '3PL Warehouse',
    icon: Warehouse,
    children: [
      {
        label: '3PL Clients',
        href: '/3pl/clients',
        icon: Users,
      },
      {
        label: 'Client Inventory',
        href: '/3pl/inventory',
        icon: Boxes,
      },
      {
        label: 'Client Orders',
        href: '/3pl/orders',
        icon: ShoppingCart,
      },
      {
        label: 'Storage Billing',
        href: '/3pl/billing/storage',
        icon: Receipt,
      },
      {
        label: 'Handling Charges',
        href: '/3pl/billing/handling',
        icon: HandCoins,
      },
      {
        label: 'Client Statements',
        href: '/3pl/statements',
        icon: FileText,
      },
    ],
  },

  // =========================================================
  // M11 - RETURNS & REVERSE LOGISTICS
  // =========================================================
  {
    label: 'Returns & Logistics',
    icon: RefreshCw,
    children: [
      {
        label: 'Return Authorizations',
        href: '/returns/authorizations',
        icon: ClipboardCheck,
      },
      {
        label: 'Return Receiving',
        href: '/returns/receiving',
        icon: PackageCheck,
      },
      {
        label: 'Return Inspection',
        href: '/returns/inspection',
        icon: Archive,
      },
      {
        label: 'Restocking & RTO',
        href: '/returns/restocking',
        icon: Route,
      },
    ],
  },

  // =========================================================
  // M12 - TRANSPORT & SHIPMENT MANAGEMENT
  // =========================================================
  {
    label: 'Transport & Shipments',
    icon: Truck,
    children: [
      {
        label: 'Shipments',
        href: '/shipments',
        icon: Truck,
      },
      {
        label: 'Carriers',
        href: '/shipments/carriers',
        icon: Building2,
      },
      {
        label: 'Delivery Tracking',
        href: '/shipments/tracking',
        icon: Route,
      },
      {
        label: 'Proof of Delivery',
        href: '/shipments/pod',
        icon: FileCheck2,
      },
    ],
  },

  // =========================================================
  // M13 - UAE / COMMERCIAL CONFIGURATION
  // =========================================================
  {
    label: 'UAE Configuration',
    icon: Globe,
    children: [
      {
        label: 'Currency & VAT',
        href: '/uae-config/currency-vat',
        icon: CircleDollarSign,
      },
      {
        label: 'Tax Details',
        href: '/uae-config/tax-details',
        icon: Percent,
      },
      {
        label: 'HS Code Management',
        href: '/uae-config/hs-codes',
        icon: Tags,
      },
      {
        label: 'Commercial Documents',
        href: '/uae-config/documents',
        icon: ScrollText,
      },
    ],
  },

  // =========================================================
  // FREE ZONE
  // =========================================================
  {
    label: 'Free Zone',
    icon: ShieldCheck,
    children: [
      { label: 'FZ Dashboard', href: '/free-zone/dashboard', icon: LayoutDashboard },
      { label: 'Warehouse Configuration', href: '/free-zone/warehouse-config', icon: Warehouse },
      { label: 'Bonded / Customs Stock', href: '/free-zone/bonded-stock', icon: LockKeyhole },
      { label: 'Customs Inventory Tracking', href: '/free-zone/inventory-tracking', icon: ScanLine },
      { label: 'Customs Reference Management', href: '/free-zone/customs-references', icon: FileCheck2 },
      { label: 'Duty Status Tracking', href: '/free-zone/duty-status', icon: Percent },
      { label: 'FZ Inbound', href: '/free-zone/inbound', icon: PackageCheck },
      { label: 'FZ Outbound', href: '/free-zone/outbound', icon: Truck },
      { label: 'FZ → FZ Transfer', href: '/free-zone/fz-transfer', icon: ArrowLeftRight },
      { label: 'FZ → Mainland', href: '/free-zone/mainland-workflow', icon: Route },
      { label: 'Re-Export', href: '/free-zone/re-export', icon: Globe },
      { label: 'Document Repository', href: '/free-zone/documents', icon: FileText },
      { label: 'Customs Reconciliation', href: '/free-zone/reconciliation', icon: RefreshCw },
      { label: 'FZ Audit Trail', href: '/free-zone/audit-trail', icon: History },
      { label: 'Duty/Tax Classification', href: '/free-zone/duty-classification', icon: BadgeDollarSign },
    ],
  },


    // =========================================================
  // M05 - INVENTORY CONTROL
  // =========================================================
  {
    label: 'Inventory Control',
    icon: Boxes,
    children: [
      {
        label: 'Real-Time Inventory',
        href: '/wms-inventory-control',
        icon: Boxes,
      },
      {
        label: 'Available / Reserved Stock',
        href: '/wms-inventory-control/stock-availability',
        icon: LockKeyhole,
      },
      {
        label: 'Stock Transfer',
        href: '/wms-inventory-control/stock-transfer',
        icon: ArrowLeftRight,
      },
      {
        label: 'Warehouse Transfer',
        href: '/wms-inventory-control/warehouse-transfer',
        icon: Warehouse,
      },
      {
        label: 'Stock Adjustment',
        href: '/wms-inventory-control/stock-adjustment',
        icon: SlidersHorizontal,
      },
      {
        label: 'Cycle Counting',
        href: '/wms-inventory-control/cycle-counting',
        icon: ClipboardCheck,
      },
      {
        label: 'Physical Stock Count',
        href: '/wms-inventory-control/physical-count',
        icon: ListChecks,
      },
      {
        label: 'Stock Reconciliation',
        href: '/wms-inventory-control/reconciliation',
        icon: Scale,
      },
      {
        label: 'Inventory History',
        href: '/wms-inventory-control/history',
        icon: History,
      },
      {
        label: 'Batch / Expiry Tracking',
        href: '/wms-inventory-control/batch-expiry',
        icon: Archive,
      },
      {
        label: 'FEFO / FIFO',
        href: '/wms-inventory-control/rotation-rules',
        icon: Repeat,
      },
      {
        label: 'Damaged Stock',
        href: '/wms-inventory-control/damaged-stock',
        icon: ArchiveX,
      },
    ],
  },

  // =========================================================
  // M06 - B2B ORDER MANAGEMENT
  // =========================================================
  {
    label: 'B2B Orders',
    icon: Building2,
    children: [
      {
        label: 'Sales Order Management',
        href: '/b2b-orders',
        icon: ShoppingCart,
      },
      {
        label: 'Customer-Specific SKU',
        href: '/b2b-orders/customer-sku',
        icon: Tags,
      },
      {
        label: 'Customer Pricing',
        href: '/b2b-orders/customer-pricing',
        icon: CircleDollarSign,
      },
      {
        label: 'Order Allocation',
        href: '/b2b-orders/allocation',
        icon: PackageCheck,
      },
      {
        label: 'Partial Fulfillment',
        href: '/b2b-orders/partial-fulfillment',
        icon: ClipboardList,
      },
      {
        label: 'Backorders',
        href: '/b2b-orders/backorders',
        icon: Hourglass,
      },
      {
        label: 'ASN for Customers',
        href: '/b2b-orders/asn',
        icon: FileCheck2,
      },
      {
        label: 'B2B Picking',
        href: '/b2b-orders/picking',
        icon: ClipboardCheck,
      },
      {
        label: 'Pallet & Carton Handling',
        href: '/b2b-orders/pallet-carton',
        icon: Boxes,
      },
      {
        label: 'Delivery Scheduling',
        href: '/b2b-orders/delivery-scheduling',
        icon: CalendarCheck,
      },
      {
        label: 'Proof of Delivery',
        href: '/b2b-orders/proof-of-delivery',
        icon: ClipboardSignature,
      },
    ],
  },

  // =========================================================
  // M07 - B2C / E-COMMERCE FULFILLMENT
  // =========================================================
  {
    label: 'B2C Fulfillment',
    icon: ShoppingBag,
    children: [
      {
        label: 'B2C Order Management',
        href: '/b2c-fulfillment',
        icon: ShoppingBag,
      },
      {
        label: 'E-Commerce Order Import',
        href: '/b2c-fulfillment/order-import',
        icon: Upload,
      },
      {
        label: 'Order Sync',
        href: '/b2c-fulfillment/order-sync',
        icon: Repeat,
      },
      {
        label: 'Order Allocation',
        href: '/b2c-fulfillment/allocation',
        icon: PackageCheck,
      },
      {
        label: 'Wave Picking',
        href: '/b2c-fulfillment/wave-picking',
        icon: Layers,
      },
      {
        label: 'Batch Picking',
        href: '/b2c-fulfillment/batch-picking',
        icon: Boxes,
      },
      {
        label: 'Single-Order Picking',
        href: '/b2c-fulfillment/single-order-picking',
        icon: ClipboardCheck,
      },
      {
        label: 'Packing Workflow',
        href: '/b2c-fulfillment/packing',
        icon: PackageCheck,
      },
      {
        label: 'Shipping Labels',
        href: '/b2c-fulfillment/shipping-labels',
        icon: Printer,
      },
      {
        label: 'Tracking Management',
        href: '/b2c-fulfillment/tracking',
        icon: Route,
      },
      {
        label: 'COD Support',
        href: '/b2c-fulfillment/cod',
        icon: Wallet,
      },
      {
        label: 'RTO Management',
        href: '/b2c-fulfillment/rto',
        icon: RotateCcw,
      },
      {
        label: 'Customer Returns',
        href: '/b2c-fulfillment/returns',
        icon: Repeat,
      },
    ],
  },

  // =========================================================
  // M08 - PICKING, PACKING & DISPATCH
  // =========================================================
  {
    label: 'Picking & Dispatch',
    icon: ClipboardCheck,
    children: [
      {
        label: 'Picking Task Creation',
        href: '/warehouse-fulfillment',
        icon: ClipboardList,
      },
      {
        label: 'Wave Planning',
        href: '/warehouse-fulfillment/wave-planning',
        icon: Layers,
      },
      {
        label: 'Zone Picking',
        href: '/warehouse-fulfillment/zone-picking',
        icon: Warehouse,
      },
      {
        label: 'Batch Picking',
        href: '/warehouse-fulfillment/batch-picking',
        icon: Boxes,
      },
      {
        label: 'Pick Confirmation',
        href: '/warehouse-fulfillment/pick-confirmation',
        icon: CheckCircle2,
      },
      {
        label: 'Pick Exceptions',
        href: '/warehouse-fulfillment/pick-exceptions',
        icon: AlertTriangle,
      },
      {
        label: 'Packing Station',
        href: '/warehouse-fulfillment/packing-station',
        icon: PackageCheck,
      },
      {
        label: 'Packing Verification',
        href: '/warehouse-fulfillment/packing-verification',
        icon: ClipboardCheck,
      },
      {
        label: 'Box / Carton Selection',
        href: '/warehouse-fulfillment/box-selection',
        icon: Package,
      },
      {
        label: 'Shipment Consolidation',
        href: '/warehouse-fulfillment/shipment-consolidation',
        icon: Truck,
      },
      {
        label: 'Dispatch Verification',
        href: '/warehouse-fulfillment/dispatch-verification',
        icon: ShieldCheck,
      },
      {
        label: 'Dispatch Documentation',
        href: '/warehouse-fulfillment/dispatch-documentation',
        icon: FileText,
      },
    ],
  },
  // =========================================================
  // M14 - MOBILE WAREHOUSE OPERATIONS
  // =========================================================
  {
    label: 'Mobile Operations',
    icon: Warehouse,
    children: [
      {
        label: 'Operations Home',
        href: '/mobile-operations',
        icon: LayoutDashboard,
      },
      {
        label: 'Receiving',
        href: '/mobile-operations/receiving',
        icon: PackageCheck,
      },
      {
        label: 'Putaway',
        href: '/mobile-operations/putaway',
        icon: Archive,
      },
      {
        label: 'Picking',
        href: '/mobile-operations/picking',
        icon: ClipboardCheck,
      },
      {
        label: 'Stock Transfer',
        href: '/mobile-operations/stock-transfer',
        icon: ArrowLeftRight,
      },
      {
        label: 'Cycle Count',
        href: '/mobile-operations/cycle-count',
        icon: ListChecks,
      },
      {
        label: 'Dispatch',
        href: '/mobile-operations/dispatch',
        icon: Send,
      },
      {
        label: 'Barcode Scanner',
        href: '/mobile-operations/scanner',
        icon: ScanLine,
      },
    ],
  },

  // =========================================================
  // M15 - DASHBOARD, REPORTS & ANALYTICS
  // =========================================================
  {
    label: 'WMS Analytics',
    icon: BarChart3,
    children: [
      {
        label: 'WMS Dashboard',
        href: '/wms-analytics',
        icon: LayoutDashboard,
      },
      {
        label: 'Inventory Dashboard',
        href: '/wms-analytics/inventory',
        icon: Boxes,
      },
      {
        label: 'Inbound Dashboard',
        href: '/wms-analytics/inbound',
        icon: PackageCheck,
      },
      {
        label: 'Outbound Dashboard',
        href: '/wms-analytics/outbound',
        icon: Truck,
      },
      {
        label: 'B2B Dashboard',
        href: '/wms-analytics/b2b',
        icon: Building2,
      },
      {
        label: 'B2C Dashboard',
        href: '/wms-analytics/b2c',
        icon: ShoppingBag,
      },
      {
        label: 'Free Zone Dashboard',
        href: '/wms-analytics/free-zone',
        icon: Warehouse,
      },
      {
        label: 'Reports',
        href: '/wms-analytics/reports',
        icon: FileText,
      },
    ],
  },

  // =========================================================
  // M16 - INTEGRATIONS & API
  // =========================================================
  {
    label: 'Integrations',
    icon: Plug,
    children: [
      {
        label: 'Overview',
        href: '/integrations',
        icon: LayoutDashboard,
      },
      {
        label: 'REST API',
        href: '/integrations/rest-api',
        icon: Network,
      },
      {
        label: 'E-Commerce',
        href: '/integrations/ecommerce',
        icon: ShoppingCart,
      },
      {
        label: 'Marketplace',
        href: '/integrations/marketplace',
        icon: Store,
      },
      {
        label: 'ERP',
        href: '/integrations/erp',
        icon: Building2,
      },
      {
        label: 'Accounting',
        href: '/integrations/accounting',
        icon: Landmark,
      },
      {
        label: 'Courier',
        href: '/integrations/courier',
        icon: Truck,
      },
      {
        label: 'Webhooks',
        href: '/integrations/webhooks',
        icon: Network,
      },
      {
        label: 'Excel / CSV Import',
        href: '/integrations/imports',
        icon: Upload,
      },
      {
        label: 'API Logs',
        href: '/integrations/api-logs',
        icon: ScrollText,
      },
    ],
  },

  // =========================================================
  // M17 - NOTIFICATIONS & ALERTS
  // =========================================================
  {
    label: 'Notifications',
    icon: Bell,
    children: [
      {
        label: 'Notification Center',
        href: '/notifications',
        icon: Bell,
      },
      {
        label: 'Low Stock Alerts',
        href: '/notifications/low-stock',
        icon: ArchiveX,
      },
      {
        label: 'Order Alerts',
        href: '/notifications/orders',
        icon: ShoppingCart,
      },
      {
        label: 'Receiving Alerts',
        href: '/notifications/receiving',
        icon: PackageCheck,
      },
      {
        label: 'Picking Exceptions',
        href: '/notifications/picking-exceptions',
        icon: ClipboardCheck,
      },
      {
        label: 'Inventory Discrepancies',
        href: '/notifications/inventory-discrepancies',
        icon: Boxes,
      },
      {
        label: 'Shipment Alerts',
        href: '/notifications/shipments',
        icon: Truck,
      },
      {
        label: 'Notification Settings',
        href: '/notifications/settings',
        icon: Settings2,
      },
    ],
  },

  // =========================================================
  // M18 - AUDIT, SECURITY & SYSTEM CONFIGURATION
  // Audit Trail already exists at /audit-trail
  // =========================================================
  {
    label: 'System Configuration',
    icon: Settings2,
    children: [
      {
        label: 'Transaction History',
        href: '/system/transaction-history',
        icon: FileClock,
      },
      {
        label: 'Approval Controls',
        href: '/system/approvals',
        icon: ShieldCheck,
      },
      {
        label: 'Data Backup',
        href: '/system/backup',
        icon: Database,
      },
      {
        label: 'System Configuration',
        href: '/system/configuration',
        icon: SlidersHorizontal,
      },
      {
        label: 'Numbering Configuration',
        href: '/system/numbering',
        icon: ListChecks,
      },
      {
        label: 'Status Configuration',
        href: '/system/statuses',
        icon: ClipboardCheck,
      },
      {
        label: 'Master Data Import',
        href: '/system/master-data-import',
        icon: Upload,
      },
      {
        label: 'Activity Logs',
        href: '/system/activity-logs',
        icon: Activity,
      },
    ],
  },

  // =========================================================
  // EXISTING SETTINGS
  // =========================================================
  {
    label: 'Settings',
    icon: Settings,
    children: [
      {
        label: 'User & Access Management',
        href: '/settings/user-access',
        icon: KeyRound,
        permission: 'access:users:read',
      },
    ],
  },
];

export function inferredPermission(href?: string) {
  if (!href) return undefined;

  const parts = href.split('/').filter(Boolean);

  if (href === '/dashboard') {
    return 'dashboard:dashboard:read';
  }

  if (parts[0] === 'settings') {
    return parts[1] === 'access' || parts[1] === 'user-access'
      ? 'access:users:read'
      : 'company:company:read';
  }

  if (parts[0] === 'audit-trail') {
    return 'access:audit:read';
  }

  if (parts[0] === 'customers') {
    return 'customers:customers:read';
  }

  if (parts[0] === 'suppliers') {
    return 'suppliers:suppliers:read';
  }

  if (parts[0] === 'projects') {
    return 'projects:projects:read';
  }

  if (parts[0] === 'sales') {
    return `sales:${
      parts[1] === 'orders' ? 'sales-orders' : parts[1]
    }:read`;
  }

  if (parts[0] === 'hr') {
    const hrMap: Record<string, string> = {
      desk: 'hr:employees:read',
      'my-profile': 'hr:employees:read',
      employees: 'hr:employees:read',
      departments: 'hr:departments:read',
      positions: 'hr:positions:read',
      attendance: 'hr:attendance:read',
      shifts: 'hr:shifts:read',
      leave: 'hr:leave:read',
      'leave-ledger': 'hr:leave:read',
      lifecycle: 'hr:lifecycle:read',
      'salary-structures': 'hr:salary:read',
      'salary-slips': 'hr:salary:read',
      payroll: 'hr:payroll:read',
      'payroll-entries': 'hr:payroll:read',
    };

    return hrMap[parts[1]];
  }

  if (parts[0] === 'invoicing') {
    const resource =
      parts[1] === 'reports'
        ? 'reports'
        : parts[1];

    return `invoicing:${resource}:read`;
  }

  if (parts[0] === 'warehouse-locations') {
    return 'inventory:warehouses:read';
  }

  if (parts[0] === 'product-master') {
    return 'inventory:products:read';
  }

  if (parts[0] === 'inbound') {
    return 'inventory:stock-entries:read';
  }

  if (
    parts[0] === 'inventory' ||
    parts[0] === 'crm' ||
    parts[0] === 'accounting' ||
    parts[0] === 'procurement'
  ) {
    return `${parts[0]}:${parts[1]}:read`;
  }

  return undefined;
}
