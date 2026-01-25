const handleSaveSalesTax = async () => {
    try {
      // Assuming there's a function to update the store in the database
      await db.stores.update(activeStore?.id, { salesTax });
      localStorage.setItem('globalSalesTax', salesTax.toString()); // Save to localStorage

      // Update the stores state
      setStores((prevStores) => {
        return prevStores.map((store) => {
          if (store.id === activeStore?.id) {
            return { ...store, salesTax };
          }
          return store;
        });
      });

      alert('Global sales tax saved successfully!');
    } catch (error) {
      console.error('Failed to save global sales tax:', error);
      alert('Failed to save global sales tax. Please try again.');
    }
  };