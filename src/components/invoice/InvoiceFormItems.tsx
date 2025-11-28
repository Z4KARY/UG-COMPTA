import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { InvoiceItem } from "@/types/invoice";

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
        {items.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-12 gap-2 items-end border-b pb-4"
          >
            <div className="col-span-4 space-y-1">
              <Label className="text-xs">Description</Label>
              <div className="flex gap-2">
                <Select
                  onValueChange={(val) => handleProductSelect(index, val)}
                >
                  <SelectTrigger className="w-[40px] px-2">
                    <span className="sr-only">Select Product</span>
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
                />
              </div>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Type</Label>
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
            <div className="col-span-1 space-y-1">
              <Label className="text-xs">Qty</Label>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(index, "quantity", e.target.value)
                }
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Price</Label>
              <Input
                type="number"
                value={item.unitPrice}
                onChange={(e) =>
                  handleItemChange(index, "unitPrice", e.target.value)
                }
              />
            </div>
            {business?.type !== "auto_entrepreneur" && (
            <div className="col-span-1 space-y-1">
              <Label className="text-xs">TVA %</Label>
              <Input
                type="number"
                value={item.tvaRate}
                onChange={(e) =>
                  handleItemChange(index, "tvaRate", e.target.value)
                }
                disabled={business?.fiscalRegime === "IFU"}
                className={business?.fiscalRegime === "IFU" ? "bg-gray-100 text-gray-500" : ""}
              />
            </div>
            )}
            <div className="col-span-1 space-y-1">
              <Label className="text-xs">Total {business?.type === "auto_entrepreneur" ? "" : "HT"}</Label>
              <div className="text-sm font-medium py-2">
                {item.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="col-span-1 flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
                type="button"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={addItem} className="w-full" type="button">
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </CardContent>
    </Card>
  );
}
