            business={business}
            subtotalHt={subtotalHt}
            totalTva={totalTva}
            totalTtc={totalTtc}
            stampDutyAmount={stampDutyAmount}
            paymentMethod={paymentMethod}
            stampDutyConfig={stampDutyConfig}
            notes={notes}
            setNotes={setNotes}
            onAction={handleSubmit}
            language={formData.language}
            setLanguage={(lang) => setFormData({ ...formData, language: lang })}
            items={items}
            setItems={setItems}