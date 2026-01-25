const handleSaveSalesTax = async () => {
    try {
      // Save the sales tax to the Supabase database
      const { error } = await supabase
        .from('stores')
        .update({ salesTax })
        .eq('id', activeStore?.id);

      if (error) {
        console.error('Failed to save sales tax to Supabase:', error);
        alert('Failed to save global sales tax. Please try again.');
        return;
      }

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
      console.error('Unexpected error saving global sales tax:', error);
      alert('Failed to save global sales tax. Please try again.');
    }
  };