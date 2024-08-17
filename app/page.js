'use client';
import { useState, useEffect, useRef } from 'react';
import { Box, Stack, Typography, Button, Modal, TextField } from '@mui/material';
import { firestore } from '@/firebase';
import { collection, doc, getDocs, query, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; 


const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: 'none',
  boxShadow: 24,
  p: 4,
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // State to hold the search query
  const inputRef = useRef(null);  // Ref for the text input

  const normalizeItemName = (name) => name.trim().toLowerCase();

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      const data = doc.data();
      inventoryList.push({
        name: doc.id,
        originalName: data.originalName || doc.id,
        quantity: data.quantity,
      });
    });
    setInventory(inventoryList);
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const addItem = async (item) => {
    const normalizedItem = normalizeItemName(item);
    const docRef = doc(collection(firestore, 'inventory'), normalizedItem);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity, originalName } = docSnap.data();
      await setDoc(docRef, { originalName: originalName || item, quantity: (quantity || 0) + 1 });
    } else {
      await setDoc(docRef, { originalName: item, quantity: 1 });
    }
    await updateInventory();
  };

  const removeItem = async (item) => {
    const normalizedItem = normalizeItemName(item);
    const docRef = doc(collection(firestore, 'inventory'), normalizedItem);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity, originalName } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { originalName, quantity: quantity - 1 });
      }
    }
    await updateInventory();
  };

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => {
      inputRef.current.focus(); // Auto-focus the text input when the modal opens
    }, 100);
  };

  const handleClose = () => setOpen(false);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addItem(itemName);
      setItemName('');
      handleClose();
    }
  };

  // Function to convert inventory data to PDF format
  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Inventory List', 14, 22);
    doc.setFontSize(12);

    const headers = [['Item Name', 'Quantity']];
    const rows = inventory.map(({ originalName, quantity }) => [originalName, quantity]);

    doc.autoTable({
      startY: 30,
      head: headers,
      body: rows,
    });

    doc.save('inventory.pdf');
  };

  // Filtered inventory based on the search query
  const filteredInventory = inventory.filter((item) =>
    item.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box 
      width="100vw" 
      height="100vh" 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      bgcolor="#f7f9fc"
    >
      {/* Outer Box with Black Background */}
      <Box
        width="720px"
        padding="10px"
        bgcolor="black" // Black background behind the border
        borderRadius="18px" // Slightly larger radius to include the black background
      >
        {/* Inner Box with White Background and Border */}
        <Box 
          width="700px" 
          padding="20px" 
          bgcolor="white" 
          borderRadius="16px" // Round the corners
          boxShadow="0px 8px 16px rgba(0, 0, 0, 0.1)" // Add a subtle shadow
          border="2px solid #3f51b5" // Add a border that matches your button color
        >
          <Box width="100%" display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={4}>
            <Modal open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
              <Box sx={style}>
                <Typography id="modal-modal-title" variant="h5" component="h2" fontWeight="bold">
                  Add Item
                </Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    id="outlined-basic"
                    label="Item"
                    variant="outlined"
                    fullWidth
                    value={itemName}
                    inputRef={inputRef} // Attach the ref to the TextField
                    onChange={(e) => setItemName(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      addItem(itemName);
                      setItemName('');
                      handleClose();
                    }}
                    sx={{ borderRadius: '8px' }}
                  >
                    Add
                  </Button>
                </Stack>
              </Box>
            </Modal>
            <Box border="none" width="600px">
              <Box
                height="100px"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                borderRadius="8px"
                boxShadow="0px 4px 12px rgba(0, 0, 0, 0.1)"
                bgcolor="#3f51b5"
                padding="0 20px"
              >
                <Button
                  variant="contained"
                  onClick={exportToPDF} // Use exportToPDF instead of exportToCSV
                  sx={{ borderRadius: '8px', fontWeight: 'bold', bgcolor: '#4caf50', color: 'white' }}
                >
                  Download List
                </Button>
                <Typography variant="h3" color="white" textAlign="center" fontWeight="bold" flex="1">
                  Inventory Items
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleOpen}
                  sx={{ borderRadius: '8px', fontWeight: 'bold', bgcolor: '#4caf50', color: 'white' }}
                >
                  Add New Item
                </Button>
              </Box>

              {/* Search Input */}
              <Box display="flex" justifyContent="flex-end" marginTop="20px">
                <TextField
                  label="Search"
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    bgcolor: 'transparent',
                    borderRadius: '10px',
                    width: '200px', top: '-15px',// 
                    borderRadius: '8px',
                    input: { color: 'black' }, // White text color
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#4caf50',
                         //
                      },
                    },
                  }}
                />
              </Box>

              {/* Container for the inventory items with scrolling */}
              <Stack spacing={3} padding={3} sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                {filteredInventory.map(({ name, originalName, quantity }) => (
                  <Box
                    key={name}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    padding="15px 25px"
                    borderRadius="8px"
                    boxShadow="0px 4px 12px rgba(0, 0, 0, 0.1)"
                    sx={{
                      bgcolor: '#3f51b5', // Background color similar to buttons
                      border: 'none', // No border
                      color: 'white', // White text
                    }}
                  >
                    <Typography variant="h6" fontWeight="500">
                      {originalName}
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <Typography
                                      variant="h6" sx={{ mr: 2 }}>
                                      Quantity: {quantity}
                                    </Typography>
                                    <Button
                                      variant="contained"
                                      onClick={() => removeItem(name)}
                                      sx={{ 
                                        borderRadius: '8px', 
                                        bgcolor: '#4caf50', 
                                        color: 'white' 
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  </Box>
                                </Box>
                              ))}
                            </Stack>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                );
              }
              