import { useState, type FormEvent } from "react";
import { Package } from "lucide-react";
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
  productsImportConfig,
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
  listProducts,
  saveProductWithStockLedger,
} from "@/features/erp/demoStore";
import type { Product } from "@/features/erp/types";

export function ProductsPage() {
  const { can } = useAuth();
  const canCreate = can("products", "create");
  const canEdit = can("products", "edit");
  const canImport = can("products", "import");
  const canExport = can("products", "export");
  const [products, setProducts] = useState(() => listProducts());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [kind, setKind] = useState<Product["kind"]>("product");

  const lowStock = products.filter(
    (product) =>
      product.kind === "product" && product.stockQty <= product.lowStockAt,
  );

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const stockQty = Number(form.get("stockQty") ?? 0);
    const record: Product = {
      id: editing?.id ?? `p-${Date.now()}`,
      name: String(form.get("name") ?? ""),
      sku: String(form.get("sku") ?? ""),
      hsnSac: String(form.get("hsnSac") ?? ""),
      category: String(form.get("category") ?? "General"),
      sellingPrice: Number(form.get("sellingPrice") ?? 0),
      purchasePrice: Number(form.get("purchasePrice") ?? 0),
      gstRate: Number(form.get("gstRate") ?? 18),
      unit: String(form.get("unit") ?? "pcs"),
      stockQty: kind === "service" ? 999 : stockQty,
      lowStockAt: Number(form.get("lowStockAt") ?? 0),
      kind: String(form.get("kind") ?? "product") as Product["kind"],
    };
    try {
      saveProductWithStockLedger(record, editing?.stockQty);
      setProducts(listProducts());
      setOpen(false);
      setEditing(null);
      recordAndToast({
        module: "products",
        eventType: editing ? "product.updated" : "product.created",
        title: editing ? "Product updated" : "Product added",
        description: record.name,
        severity: "success",
        operationStatus: "succeeded",
        relatedRecordId: record.id,
        relatedRoute: "/products",
        idempotencyKey: `product-${record.id}-${Date.now()}`,
      });
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : "Unable to save product.",
      );
    }
  };

  const columns: DataColumn<Product>[] = [
    {
      id: "name",
      label: "Name",
      render: (row) => (
        <span className="font-semibold text-foreground">{row.name}</span>
      ),
    },
    { id: "sku", label: "SKU", render: (row) => row.sku },
    { id: "category", label: "Category", render: (row) => row.category },
    { id: "hsn", label: "HSN/SAC", render: (row) => row.hsnSac },
    {
      id: "price",
      label: "Sell",
      className: "text-right",
      render: (row) => (
        <span className="tabular-nums">{currency(row.sellingPrice)}</span>
      ),
    },
    {
      id: "purchase",
      label: "Buy",
      className: "text-right",
      render: (row) => (
        <span className="tabular-nums">
          {row.kind === "service" ? "—" : currency(row.purchasePrice)}
        </span>
      ),
    },
    {
      id: "gst",
      label: "GST %",
      className: "text-right",
      render: (row) => row.gstRate,
    },
    { id: "unit", label: "Unit", render: (row) => row.unit },
    {
      id: "stock",
      label: "Stock",
      className: "text-right",
      render: (row) => (
        <span
          className={
            row.kind === "product" && row.stockQty <= row.lowStockAt
              ? "font-semibold text-[#DF9B60]"
              : ""
          }
        >
          {row.kind === "service" ? "—" : row.stockQty}
        </span>
      ),
    },
    { id: "kind", label: "Type", render: (row) => row.kind },
    {
      id: "actions",
      label: "",
      className: "w-[96px] text-right",
      render: (row) => (
        <RowActionsBar
          primary={[
            ...(canEdit
              ? [
                  {
                    id: "edit",
                    label: "Edit product",
                    icon: ACTION_ICONS.edit,
                    onClick: () => {
                      setEditing(row);
                      setKind(row.kind);
                      setOpen(true);
                    },
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Products & Services"
        description="Shared catalog for invoices, quotations, and stock."
        actions={
          <ImportExportToolbar
            config={productsImportConfig}
            records={products}
            onImported={() => setProducts(listProducts())}
            addNewLabel={canCreate ? "Add product" : undefined}
            onAddNew={
              canCreate
                ? () => {
                    setEditing(null);
                    setKind("product");
                    setOpen(true);
                  }
                : undefined
            }
            includeImport={canImport}
            includeExport={canExport}
            includeSample={canImport}
          />
        }
      />
      <MetricGrid>
        <MetricCard
          icon={<Package className="h-4 w-4" />}
          label="Catalog items"
          value={String(products.length)}
          change="0%"
        />
        <MetricCard
          icon={<Package className="h-4 w-4" />}
          label="Products"
          value={String(products.filter((p) => p.kind === "product").length)}
          change="0%"
        />
        <MetricCard
          icon={<Package className="h-4 w-4" />}
          label="Services"
          value={String(products.filter((p) => p.kind === "service").length)}
          change="0%"
        />
        <MetricCard
          icon={<Package className="h-4 w-4" />}
          label="Low stock"
          value={String(lowStock.length)}
          change="0%"
        />
      </MetricGrid>
      <DataTable
        rows={products}
        columns={columns}
        searchPlaceholder="Search products…"
        filterKey="kind"
        filterOptions={["product", "service"]}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit product" : "Add product"}
            </DialogTitle>
            <DialogDescription>
              Used by invoice and quotation line pickers.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <FormField label="Name" required>
              <Input name="name" defaultValue={editing?.name ?? ""} required />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="SKU" required>
                <Input name="sku" defaultValue={editing?.sku ?? ""} required />
              </FormField>
              <FormField label="Category" required>
                <Input
                  name="category"
                  defaultValue={editing?.category ?? "General"}
                  required
                />
              </FormField>
            </div>
            <FormField label="HSN/SAC" required>
              <Input
                name="hsnSac"
                defaultValue={editing?.hsnSac ?? ""}
                required
              />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label="Selling price (₹)" required>
                <Input
                  name="sellingPrice"
                  type="number"
                  min="0"
                  defaultValue={editing?.sellingPrice ?? 0}
                  required
                />
              </FormField>
              <FormField label="Purchase price (₹)">
                <Input
                  name="purchasePrice"
                  type="number"
                  min="0"
                  defaultValue={editing?.purchasePrice ?? 0}
                />
              </FormField>
              <FormField label="GST %" required>
                <Input
                  name="gstRate"
                  type="number"
                  min="0"
                  defaultValue={editing?.gstRate ?? 18}
                  required
                />
              </FormField>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label="Unit" required>
                <Input
                  name="unit"
                  defaultValue={editing?.unit ?? "pcs"}
                  required
                />
              </FormField>
              <FormField label="Stock">
                <Input
                  name="stockQty"
                  type="number"
                  min="0"
                  defaultValue={editing?.stockQty ?? 0}
                  disabled={kind === "service"}
                />
              </FormField>
              <FormField label="Low stock at">
                <Input
                  name="lowStockAt"
                  type="number"
                  min="0"
                  defaultValue={editing?.lowStockAt ?? 0}
                  disabled={kind === "service"}
                />
              </FormField>
            </div>
            <FormField label="Type">
              <input type="hidden" name="kind" value={kind} />
              <Select
                value={kind}
                onValueChange={(value) => setKind(value as Product["kind"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
