import { useMemo, useState, type FormEvent } from "react";
import { Boxes, Plus } from "lucide-react";
import { notify, recordAndToast } from "@/features/notifications/notify";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ImportExportToolbar,
  vendorsImportConfig,
} from "@/features/crm/importExport";
import {
  ACTION_ICONS,
  AppShell,
  DataTable,
  FormField,
  MetricCard,
  MetricGrid,
  PageHeader,
  RowActionsBar,
  currency,
  type DataColumn,
} from "@/features/crm/shared";
import { useAuth } from "@/features/auth/useAuth";
import {
  applyStockMovement,
  listProducts,
  listPurchaseOrders,
  listStockMovements,
  listVendors,
  upsertPurchaseOrder,
  upsertVendor,
} from "@/features/erp/demoStore";
import type {
  PurchaseOrder,
  PurchaseOrderLine,
  StockMovement,
  Vendor,
} from "@/features/erp/types";

type PoDraftLine = {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
};

function emptyPoLine(): PoDraftLine {
  return {
    id: `pol-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productId: "",
    quantity: 1,
    unitCost: 0,
  };
}

export type PurchasePageMode =
  "inventory" | "vendors" | "purchase-orders" | "goods-receiving";

export function InventoryPage({
  mode = "inventory",
}: {
  mode?: PurchasePageMode;
} = {}) {
  const { can } = useAuth();
  const canCreateVendor = can("vendors", "create");
  const canEditVendor = can("vendors", "edit");
  const canImportVendor = can("vendors", "import");
  const canExportVendor = can("vendors", "export");
  const canCreatePo = can("purchase-orders", "create");
  const canReceiveGoods = can("goods-receiving", "receive-goods");
  const [products, setProducts] = useState(() => listProducts());
  const [orders, setOrders] = useState(() => listPurchaseOrders());
  const [movements, setMovements] = useState(() => listStockMovements());
  const [vendors, setVendors] = useState(() => listVendors());
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [receiveQty, setReceiveQty] = useState<Record<string, number>>({});
  const [vendorOpen, setVendorOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [poOpen, setPoOpen] = useState(false);
  const [poVendorId, setPoVendorId] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [poLines, setPoLines] = useState<PoDraftLine[]>([emptyPoLine()]);

  const trackable = useMemo(
    () => products.filter((p) => p.kind === "product"),
    [products],
  );
  const receivableOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status === "Ordered" || order.status === "Partially Received",
      ),
    [orders],
  );
  const showVendors = mode === "vendors";
  const showPurchaseOrders =
    mode === "purchase-orders" || mode === "goods-receiving";
  const showGoodsFocus = mode === "goods-receiving";
  const showStock = mode === "inventory";
  const showVendorActions = mode === "vendors";
  const showPoActions = mode === "purchase-orders" && canCreatePo;

  const refresh = () => {
    setProducts(listProducts());
    setOrders(listPurchaseOrders());
    setMovements(listStockMovements());
    setVendors(listVendors());
  };

  const lowStock = products.filter(
    (product) =>
      product.kind === "product" && product.stockQty <= product.lowStockAt,
  );

  const openReceive = (row: PurchaseOrder) => {
    setSelectedPo(row);
    const initial: Record<string, number> = {};
    for (const line of row.lines) {
      initial[line.id] = Math.max(0, line.quantity - line.receivedQty);
    }
    setReceiveQty(initial);
    setReceiveOpen(true);
  };

  const receiveGoods = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPo) return;
    try {
      const batch = Date.now();
      let anyReceived = false;
      const nextLines: PurchaseOrderLine[] = selectedPo.lines.map((line) => {
        const remaining = line.quantity - line.receivedQty;
        const qty = Math.min(
          remaining,
          Math.max(0, Number(receiveQty[line.id] ?? 0)),
        );
        if (!(qty > 0)) return line;
        if (qty > remaining) {
          throw new Error(
            `Cannot receive more than remaining quantity for ${line.name}.`,
          );
        }
        anyReceived = true;
        applyStockMovement({
          id: `sm-${batch}-${line.productId}`,
          productId: line.productId,
          productName: line.name,
          delta: qty,
          reason: "purchase_receive",
          referenceId: selectedPo.id,
          idempotencyKey: `grn:${selectedPo.id}:${line.productId}:${line.receivedQty + qty}`,
          createdAt: new Date().toISOString(),
        });
        return { ...line, receivedQty: line.receivedQty + qty };
      });
      if (!anyReceived) {
        notify.warning("Enter a receive quantity greater than zero.");
        return;
      }
      const fullyReceived = nextLines.every(
        (line) => line.receivedQty >= line.quantity,
      );
      const partially = nextLines.some((line) => line.receivedQty > 0);
      upsertPurchaseOrder({
        ...selectedPo,
        lines: nextLines,
        status: fullyReceived
          ? "Received"
          : partially
            ? "Partially Received"
            : selectedPo.status,
      });
      refresh();
      setReceiveOpen(false);
      recordAndToast({
        module: "goods-receiving",
        eventType: fullyReceived ? "grn.completed" : "grn.partial",
        title: fullyReceived
          ? "Goods fully received"
          : "Partial goods receipt recorded",
        description: selectedPo.number,
        severity: "success",
        operationStatus: "succeeded",
        relatedRecordId: selectedPo.id,
        relatedRoute: "/goods-receiving",
        idempotencyKey: `grn-${selectedPo.id}-${Date.now()}`,
      });
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : "Unable to receive goods.",
      );
    }
  };

  const saveVendor = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const vendor: Vendor = {
      id: editingVendor?.id ?? `v-${Date.now()}`,
      name: String(form.get("name") ?? ""),
      company: String(form.get("company") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      gstin: String(form.get("gstin") ?? ""),
      address: String(form.get("address") ?? ""),
      status: String(form.get("status") ?? "Active") as Vendor["status"],
    };
    upsertVendor(vendor);
    refresh();
    setVendorOpen(false);
    setEditingVendor(null);
    recordAndToast({
      module: "vendors",
      eventType: editingVendor ? "vendor.updated" : "vendor.created",
      title: editingVendor ? "Vendor updated" : "Vendor added",
      description: vendor.company || vendor.name,
      severity: "success",
      operationStatus: "succeeded",
      relatedRecordId: vendor.id,
      relatedRoute: "/vendors",
      idempotencyKey: `vendor-${vendor.id}-${Date.now()}`,
    });
  };

  const savePo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const vendor = vendors.find((item) => item.id === poVendorId);
    if (!vendor) {
      notify.warning("Select a vendor.");
      return;
    }
    const number = poNumber.trim() || `PO-2026-${String(Date.now()).slice(-4)}`;
    if (orders.some((order) => order.number === number)) {
      notify.warning("Purchase order number already exists.");
      return;
    }
    const lines: PurchaseOrderLine[] = [];
    for (const draft of poLines) {
      if (!draft.productId || !(draft.quantity > 0)) continue;
      const product = trackable.find((item) => item.id === draft.productId);
      if (!product) continue;
      lines.push({
        id: draft.id,
        productId: product.id,
        name: product.name,
        quantity: draft.quantity,
        receivedQty: 0,
        unitCost: draft.unitCost || product.purchasePrice || 0,
      });
    }
    if (lines.length === 0) {
      notify.warning("Add at least one product line.");
      return;
    }
    const total = lines.reduce(
      (sum, line) => sum + line.quantity * line.unitCost,
      0,
    );
    const poId = `po-${Date.now()}`;
    upsertPurchaseOrder({
      id: poId,
      number,
      vendorId: vendor.id,
      vendorName: vendor.company,
      orderDate: new Date().toISOString().slice(0, 10),
      status: "Ordered",
      lines,
      total,
      createdAt: new Date().toISOString(),
    });
    refresh();
    setPoOpen(false);
    setPoVendorId("");
    setPoNumber("");
    setPoLines([emptyPoLine()]);
    recordAndToast({
      module: "purchase-orders",
      eventType: "po.created",
      title: "Purchase order created",
      description: `${number} · stock increases after receiving.`,
      severity: "success",
      operationStatus: "succeeded",
      relatedRecordId: poId,
      relatedRoute: "/purchase-orders",
      idempotencyKey: `po-create-${poId}`,
    });
  };

  const productColumns: DataColumn<(typeof products)[number]>[] = [
    { id: "name", label: "Product", render: (row) => row.name },
    { id: "sku", label: "SKU", render: (row) => row.sku },
    {
      id: "stock",
      label: "Stock",
      render: (row) => (
        <span
          className={
            row.stockQty <= row.lowStockAt ? "font-semibold text-[#DF9B60]" : ""
          }
        >
          {row.stockQty}
        </span>
      ),
    },
    { id: "low", label: "Reorder at", render: (row) => row.lowStockAt },
    {
      id: "value",
      label: "Est. value",
      className: "text-right",
      render: (row) => currency(row.stockQty * row.sellingPrice),
    },
  ];

  const vendorColumns: DataColumn<Vendor>[] = [
    {
      id: "company",
      label: "Company",
      render: (row) => (
        <span className="font-semibold text-foreground">{row.company}</span>
      ),
    },
    { id: "name", label: "Contact", render: (row) => row.name },
    { id: "phone", label: "Phone", render: (row) => row.phone },
    { id: "gstin", label: "GSTIN", render: (row) => row.gstin || "—" },
    { id: "status", label: "Status", render: (row) => row.status },
    {
      id: "actions",
      label: "",
      className: "w-[72px] text-right",
      render: (row) =>
        canEditVendor ? (
          <RowActionsBar
            primary={[
              {
                id: "edit",
                label: "Edit vendor",
                icon: ACTION_ICONS.edit,
                onClick: () => {
                  setEditingVendor(row);
                  setVendorOpen(true);
                },
              },
            ]}
          />
        ) : null,
    },
  ];

  const poColumns: DataColumn<PurchaseOrder>[] = [
    { id: "number", label: "PO #", render: (row) => row.number },
    { id: "vendor", label: "Vendor", render: (row) => row.vendorName },
    { id: "date", label: "Date", render: (row) => row.orderDate },
    { id: "total", label: "Total", render: (row) => currency(row.total) },
    { id: "status", label: "Status", render: (row) => row.status },
    {
      id: "actions",
      label: "",
      className: "w-[108px] text-right",
      render: (row) =>
        canReceiveGoods &&
        row.status !== "Received" &&
        row.status !== "Cancelled" ? (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 rounded-lg px-2.5 text-xs"
            onClick={() => openReceive(row)}
          >
            <ACTION_ICONS.receive className="h-3.5 w-3.5" />
            Receive
          </Button>
        ) : null,
    },
  ];

  const movementColumns: DataColumn<StockMovement>[] = [
    { id: "when", label: "When", render: (row) => row.createdAt.slice(0, 10) },
    { id: "product", label: "Product", render: (row) => row.productName },
    { id: "delta", label: "Delta", render: (row) => row.delta },
    { id: "reason", label: "Reason", render: (row) => row.reason },
    { id: "ref", label: "Reference", render: (row) => row.referenceId },
  ];

  const header =
    mode === "vendors"
      ? {
          title: "Vendors",
          description: "Supplier companies used on purchase orders.",
        }
      : mode === "purchase-orders"
        ? {
            title: "Purchase Orders",
            description:
              "Create purchase orders. Stock increases only after goods receiving.",
          }
        : mode === "goods-receiving"
          ? {
              title: "Goods Receiving",
              description:
                "Receive ordered quantities against open purchase orders.",
            }
          : {
              title: "Inventory",
              description: "Stock on hand, low-stock alerts, and movements.",
            };

  return (
    <AppShell>
      <PageHeader
        title={header.title}
        description={header.description}
        actions={
          <div className="flex flex-wrap gap-2">
            {showVendorActions ? (
              <ImportExportToolbar
                config={vendorsImportConfig}
                records={vendors}
                onImported={() => setVendors(listVendors())}
                addNewLabel={canCreateVendor ? "Add vendor" : undefined}
                onAddNew={
                  canCreateVendor
                    ? () => {
                        setEditingVendor(null);
                        setVendorOpen(true);
                      }
                    : undefined
                }
                includeImport={canImportVendor}
                includeExport={canExportVendor}
                includeSample={canImportVendor}
              />
            ) : null}
            {showPoActions ? (
              <Button
                size="sm"
                className="h-11 gap-2 rounded-xl bg-[#2F6BFF] px-5 text-sm font-semibold text-white hover:bg-[#2558d9]"
                onClick={() => {
                  setPoVendorId(vendors[0]?.id ?? "");
                  setPoNumber(`PO-2026-${String(Date.now()).slice(-4)}`);
                  setPoLines([emptyPoLine()]);
                  setPoOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                New purchase order
              </Button>
            ) : null}
          </div>
        }
      />
      <MetricGrid>
        {showStock ? (
          <>
            <MetricCard
              icon={<Boxes className="h-4 w-4" />}
              label="SKUs"
              value={String(trackable.length)}
              change="0%"
            />
            <MetricCard
              icon={<Boxes className="h-4 w-4" />}
              label="Low stock"
              value={String(lowStock.length)}
              change="0%"
            />
          </>
        ) : null}
        {showVendors ? (
          <MetricCard
            icon={<Boxes className="h-4 w-4" />}
            label="Vendors"
            value={String(vendors.length)}
            change="0%"
          />
        ) : null}
        {showPurchaseOrders ? (
          <MetricCard
            icon={<Boxes className="h-4 w-4" />}
            label="Open POs"
            value={String(receivableOrders.length)}
            change="0%"
          />
        ) : null}
      </MetricGrid>

      {showVendors ? (
        <>
          <h2 className="mb-3 text-base font-bold">Vendors</h2>
          <DataTable
            rows={vendors}
            columns={vendorColumns}
            searchPlaceholder="Search vendors…"
          />
        </>
      ) : null}

      {showStock ? (
        <>
          <h2 className="mb-3 text-base font-bold">Stock on hand</h2>
          <DataTable
            rows={trackable}
            columns={productColumns}
            searchPlaceholder="Search stock…"
          />
          <h2 className="mb-3 mt-6 text-base font-bold">Stock movements</h2>
          <DataTable
            rows={movements}
            columns={movementColumns}
            searchPlaceholder="Search movements…"
            compact
          />
        </>
      ) : null}

      {showPurchaseOrders ? (
        <>
          <h2 className="mb-3 text-base font-bold">
            {showGoodsFocus ? "Open purchase orders" : "Purchase orders"}
          </h2>
          <DataTable
            rows={showGoodsFocus ? receivableOrders : orders}
            columns={poColumns}
            searchPlaceholder={
              showGoodsFocus ? "Search receivable POs…" : "Search POs…"
            }
          />
        </>
      ) : null}

      <Dialog open={vendorOpen} onOpenChange={setVendorOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingVendor ? "Edit vendor" : "Add vendor"}
            </DialogTitle>
            <DialogDescription>
              Vendors are selected when creating purchase orders.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveVendor} className="space-y-3">
            <FormField label="Company" required>
              <Input
                name="company"
                defaultValue={editingVendor?.company ?? ""}
                required
              />
            </FormField>
            <FormField label="Contact name" required>
              <Input
                name="name"
                defaultValue={editingVendor?.name ?? ""}
                required
              />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Phone">
                <Input name="phone" defaultValue={editingVendor?.phone ?? ""} />
              </FormField>
              <FormField label="Email">
                <Input
                  name="email"
                  type="email"
                  defaultValue={editingVendor?.email ?? ""}
                />
              </FormField>
            </div>
            <FormField label="GSTIN">
              <Input name="gstin" defaultValue={editingVendor?.gstin ?? ""} />
            </FormField>
            <FormField label="Address">
              <Input
                name="address"
                defaultValue={editingVendor?.address ?? ""}
              />
            </FormField>
            <input type="hidden" name="status" value="Active" />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setVendorOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={poOpen} onOpenChange={setPoOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New purchase order</DialogTitle>
            <DialogDescription>
              Creating a PO does not increase stock until goods are received.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={savePo} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Vendor" required>
                <Select value={poVendorId} onValueChange={setPoVendorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="PO number" required>
                <Input
                  value={poNumber}
                  onChange={(event) => setPoNumber(event.target.value)}
                  required
                />
              </FormField>
            </div>
            <div className="space-y-2">
              <div className="hidden gap-2 px-1 text-[11px] font-semibold text-muted-foreground sm:grid sm:grid-cols-[1fr_80px_100px_auto]">
                <span>Product / Service</span>
                <span>Quantity</span>
                <span>Unit Price (₹)</span>
                <span className="text-right">Actions</span>
              </div>
              {poLines.map((line) => (
                <div
                  key={line.id}
                  className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_80px_100px_auto]"
                >
                  <div className="grid gap-1">
                    <span className="text-[11px] font-medium text-muted-foreground sm:hidden">
                      Product / Service
                    </span>
                    <Select
                      value={line.productId || ""}
                      onValueChange={(value) => {
                        const product = trackable.find(
                          (item) => item.id === value,
                        );
                        setPoLines((current) =>
                          current.map((item) =>
                            item.id === line.id
                              ? {
                                  ...item,
                                  productId: value,
                                  unitCost:
                                    product?.purchasePrice || item.unitCost,
                                }
                              : item,
                          ),
                        );
                      }}
                    >
                      <SelectTrigger aria-label="Product / Service">
                        <SelectValue placeholder="Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {trackable.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-[11px] font-medium text-muted-foreground sm:hidden">
                      Quantity
                    </span>
                    <Input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(event) =>
                        setPoLines((current) =>
                          current.map((item) =>
                            item.id === line.id
                              ? {
                                  ...item,
                                  quantity: Number(event.target.value) || 0,
                                }
                              : item,
                          ),
                        )
                      }
                      aria-label="Quantity"
                    />
                  </div>
                  <div className="grid gap-1">
                    <span className="text-[11px] font-medium text-muted-foreground sm:hidden">
                      Unit Price (₹)
                    </span>
                    <Input
                      type="number"
                      min="0"
                      value={line.unitCost}
                      onChange={(event) =>
                        setPoLines((current) =>
                          current.map((item) =>
                            item.id === line.id
                              ? {
                                  ...item,
                                  unitCost: Number(event.target.value) || 0,
                                }
                              : item,
                          ),
                        )
                      }
                      aria-label="Unit Price"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={poLines.length === 1}
                    aria-label="Remove line"
                    onClick={() =>
                      setPoLines((current) =>
                        current.filter((item) => item.id !== line.id),
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setPoLines((current) => [...current, emptyPoLine()])
                }
              >
                Add line
              </Button>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPoOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create PO</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receive goods</DialogTitle>
            <DialogDescription>
              {selectedPo?.number} — enter quantity to receive (≤ remaining).
              Over-receive and duplicate full receipt keys are blocked.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={receiveGoods}>
            <div className="mb-2 hidden gap-2 px-1 text-[11px] font-semibold text-muted-foreground sm:grid sm:grid-cols-[1fr_120px]">
              <span>Product / Service</span>
              <span>Quantity</span>
            </div>
            <ul className="space-y-3 text-sm">
              {selectedPo?.lines.map((line) => {
                const remaining = line.quantity - line.receivedQty;
                return (
                  <li
                    key={line.id}
                    className="grid gap-2 rounded-md bg-muted/50 px-3 py-2 sm:grid-cols-[1fr_120px]"
                  >
                    <div>
                      <p className="font-medium">{line.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Received {line.receivedQty}/{line.quantity} · Remaining{" "}
                        {remaining}
                      </p>
                    </div>
                    <div className="grid gap-1">
                      <span className="text-[11px] font-medium text-muted-foreground sm:hidden">
                        Quantity to receive
                      </span>
                      <Input
                        type="number"
                        min="0"
                        max={remaining}
                        value={receiveQty[line.id] ?? 0}
                        disabled={remaining <= 0}
                        aria-label={`Quantity to receive for ${line.name}`}
                        onChange={(event) =>
                          setReceiveQty((current) => ({
                            ...current,
                            [line.id]: Number(event.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReceiveOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Confirm receive</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

export function VendorsPage() {
  return <InventoryPage mode="vendors" />;
}

export function PurchaseOrdersPage() {
  return <InventoryPage mode="purchase-orders" />;
}

export function GoodsReceivingPage() {
  return <InventoryPage mode="goods-receiving" />;
}
