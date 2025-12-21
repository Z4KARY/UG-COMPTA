                    <div className="grid gap-2">
                        <Label htmlFor="duration">Duration *</Label>
                        <Select value={durationMonths} onValueChange={setDurationMonths}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Duration" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="12">1 Year</SelectItem>
                                <SelectItem value="24">2 Years</SelectItem>
                                <SelectItem value="36">3 Years</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
    
</DialogFooter>