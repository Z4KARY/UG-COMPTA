<Input
    type="number"
    min="0"
    step="0.01"
    value={item.unitPrice}
    onChange={(e) =>
    handleItemChange(index, "unitPrice", e.target.value)
    }
    placeholder="0.00"
/>
