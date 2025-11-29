import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { InvoiceItem } from "@/types/invoice";
import { cn } from "@/lib/utils";

interface InvoiceFormItemsProps {
  items: InvoiceItem[];
  setItems: (items: InvoiceItem[]) => void;
  products: any[];
  business: any;
}

export function InvoiceFormItems({ items, setItems, products, business }: InvoiceFormItemsProps) {
  
  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === "description" || field === "productType") {
      // @ts-ignore
      item[field] = value;
    } else {
      item[field as "quantity" | "unitPrice" | "discountRate" | "tvaRate"] =
        parseFloat(value as string) || 0;
    }

    // Recalculate line total for display (HT)
    const basePrice = item.unitPrice * item.quantity;
    const discountAmount = basePrice * ((item.discountRate || 0) / 100);
    item.lineTotal = basePrice - discountAmount; // Raw calculation for immediate feedback, rounded in totals

    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        discountRate: 0,
        tvaRate: business?.fiscalRegime === "IFU" || business?.type === "auto_entrepreneur" ? 0 : (business?.tvaDefault || 19),
        lineTotal: 0,
        productType: "service",
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products?.find((p) => p._id === productId);
    if (product) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        productId: product._id,
        description: product.name,
        unitPrice: product.unitPrice,
        tvaRate: business?.fiscalRegime === "IFU" ? 0 : product.tvaRate,
        discountRate: product.defaultDiscount || 0,
        productType: product.type || "service",
      };
      // Recalculate line total
      const priceAfterDiscount =
        product.unitPrice * (1 - (product.defaultDiscount || 0) / 100);
      newItems[index].lineTotal = priceAfterDiscount * newItems[index].quantity;
      setItems(newItems);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Desktop Header - Hidden on Mobile */}
        <div className="hidden md:grid grid-cols-12 gap-2 font-medium text-sm text-muted-foreground mb-2 px-2">
            <div className="col-span-4">Description</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-1">Qty</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-1">TVA</div>
            <div className="col-span-2 text-right">Total</div>
        </div>

        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
                "group relative",
                // Mobile styles: Card-like layout
                "flex flex-col gap-4 p-4 border rounded-lg bg-muted/5",
                // Desktop styles: Grid row, no border/bg/padding
                "md:grid md:grid-cols-12 md:gap-2 md:items-start md:p-0 md:border-0 md:bg-transparent"
            )}
          >
            {/* Description */}
            <div className="md:col-span-4 space-y-1.5 md:space-y-0">
              <Label className="md:hidden text-xs text-muted-foreground">Description</Label>
              <div className="flex gap-2">
                <Select onValueChange={(val) => handleProductSelect(index, val)}>
                  <SelectTrigger className="w-[40px] px-2 shrink-0 text-muted-foreground" title="Select Product">
                    <span className="sr-only">Select Product</span>
                    <Plus className="h-4 w-4" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(index, "description", e.target.value)
                  }
                  placeholder="Item description"
                  className="w-full"
                />
              </div>
            </div>
            
            {/* Type */}
            <div className="md:col-span-2 space-y-1.5 md:space-y-0">
                <Label className="md:hidden text-xs text-muted-foreground">Type</Label>
                <Select 
                    value={item.productType || "service"} 
                    onValueChange={(val) => handleItemChange(index, "productType", val)}
                >
                    <SelectTrigger className="h-10">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="goods">Goods</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Qty */}
            <div className="md:col-span-1 space-y-1.5 md:space-y-0">
                <Label className="md:hidden text-xs text-muted-foreground">Qty</Label>
                <Input
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={(e) =>
                    handleItemChange(index, "quantity", e.target.value)
                    }
                />
            </div>

            {/* Price */}
            <div className="md:col-span-2 space-y-1.5 md:space-y-0">
                <Label className="md:hidden text-xs text-muted-foreground">Price</Label>
                <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                    handleItemChange(index, "unitPrice", e.target.value)
                    }
                />
            </div>

            {/* TVA */}
            <div className="md:col-span-1 space-y-1.5 md:space-y-0">
                <Label className="md:hidden text-xs text-muted-foreground">TVA %</Label>
                <Input
                    type="number"
                    min="0"
                    max="100"
                    value={item.tvaRate}
                    onChange={(e) =>
                    handleItemChange(index, "tvaRate", e.target.value)
                    }
                    disabled={business?.fiscalRegime === "IFU"}
                    className={business?.fiscalRegime === "IFU" ? "bg-muted text-muted-foreground" : ""}
                />
            </div>

            {/* Total & Delete */}
            <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0">
                <div className="md:hidden">
                    <span className="text-xs text-muted-foreground mr-2">Total:</span>
                    <span className="font-medium">{item.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="hidden md:block text-sm font-medium text-right w-full pr-2">
                    {item.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    type="button"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={addItem} className="w-full border-dashed" type="button">
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </CardContent>
    </Card>
  );
}