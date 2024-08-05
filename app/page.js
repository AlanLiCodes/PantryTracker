'use client'

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Modal,
  Stack,
  TextField,
  Typography,
  InputAdornment,
  CircularProgress,
  Divider,
  Link,
} from "@mui/material";import { collection, query, getDoc, getDocs, deleteDoc, setDoc, doc } from "firebase/firestore";
import { firestore } from '@/firebase'; 
import { Configuration, OpenAIApi } from "openai";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, 
});

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [recipeSuggestions, setRecipeSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getRecipeSuggestions = async () => {
    setIsLoading(true);
    try {
      const ingredients = inventory.map((item) => item.name);
      const prompt = `Generate one recipe using some of these ingredients: ${ingredients.join(
        ", "
      )}. Provide only the recipe name and a Google search link seperated by a comma.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
      });

      setRecipeSuggestions([completion.choices[0].message.content]);
    } catch (error) {
      console.error("Error getting recipe suggestions:", error);
      setRecipeSuggestions([
        "Failed to get recipe suggestions. Please try again.",
      ]);
    } finally {
      setIsLoading(false);
    }
  };


  const updateInventory = async () => {
    const snapshot = query(collection(firestore, "inventory"));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
  };

  const addItem = async (itemName, quantity = 1) => {
    const docRef = doc(collection(firestore, "inventory"), itemName);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const currentData = docSnap.data();
      const currentQuantity = currentData.quantity || 0;
      const updatedQuantity = currentQuantity + quantity;
      await setDoc(docRef, { quantity: updatedQuantity }, { merge: true });
    } else {
      await setDoc(docRef, { quantity: quantity });
    }

    await updateInventory(); 
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }
    await updateInventory();
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );


  useEffect(() => {
    updateInventory();
  }, []);

  return (
    <Box 
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap={3}
      sx={{
        backgroundColor: "#f5f5f5",
      }}
    >
      <Modal open={open} onClose={handleClose}>
        <Box 
          position="absolute"
          top="50%"
          left="50%"
          width={400}
          bgcolor="white"
          borderRadius={2}
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          sx={{
            transform: "translate(-50%, -50%)",
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Add Item
          </Typography>
          <Stack width="100%" direction="column" spacing={2}>
            <TextField 
              label="Item Name"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <TextField 
              label="Quantity"
              type="number"
              variant="outlined"
              fullWidth
              value={itemQuantity}
              onChange={(e) =>
                setItemQuantity(Math.max(1, parseInt(e.target.value) || 0))
              }
              inputProps={{ min: 1 }}
            />
            <Button
              variant="contained"
              onClick={() => {
                addItem(itemName, itemQuantity);
                setItemName("");
                setItemQuantity(1);
                handleClose();
              }}
              sx={{
                backgroundColor: "#32de84",
                color: "#333",
                "&:hover": {
                  backgroundColor: "#28c76f",
                },
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Button variant="contained" onClick={handleOpen} sx={{ bgcolor: "#32de84", color: "#333", "&:hover": { bgcolor: "#28c76f" } }}>
        Add New Item
      </Button>
      <Button
          variant="contained"
          onClick={() => {
            getRecipeSuggestions();
            setRecipeModalOpen(true);
          }}
          disabled={isLoading}
          sx={{
            backgroundColor: "#32de84",
            color: "#fff",
            "&:hover": {
              backgroundColor: "#28c76f",
            },
            "&:disabled": {
              backgroundColor: "#a0a0a0",
            },
            padding: "10px 20px",
            borderRadius: 2,
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          {isLoading ? "Loading..." : "Get Recipe Suggestion"}
        </Button>
      <Box border={'1px solid #333'} borderRadius={2} overflow="hidden" sx={{ width: '800px', backgroundColor: 'white' }}>
        <Box
          width="100%"
          height="100px"
          bgcolor={'#ADD8E6'}
          display={'flex'}
          justifyContent={'center'}
          alignItems={'center'}
        >
          <Typography variant={'h2'} color={'#333'} textAlign={'center'}>
            Inventory Items
          </Typography>
        </Box>
        <Stack width="100%" maxHeight="300px" spacing={2} overflow={'auto'} sx={{ padding: 2 }}>
          {filteredInventory.map(({name, quantity}) => (
            <Box
              key={name}
              width="100%"
              minHeight="100px"
              display={'flex'}
              justifyContent={'space-between'}
              alignItems={'center'}
              bgcolor={'#f0f0f0'}
              padding={2}
              borderRadius={2}
            >
              <Typography variant={'h6'} color={'#333'}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>
              <Typography variant={'h6'} color={'#333'}>
                Quantity: {quantity}
              </Typography>
              <Button variant="contained" onClick={() => removeItem(name)} sx={{ bgcolor: "#ff4c4c", color: "#fff", "&:hover": { bgcolor: "#e04444" } }}>
                Remove
              </Button>
            </Box>
          ))}
        </Stack>
      </Box>

      <Modal open={recipeModalOpen} onClose={() => setRecipeModalOpen(false)}>
        <Box 
          position="absolute"
          top="50%"
          left="50%"
          width={600}
          bgcolor="white"
          borderRadius={2}
          boxShadow={24}
          p={4}
          sx={{
            transform: "translate(-50%, -50%)",
          }}
        >
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Recipe Suggestions
          </Typography>
          {isLoading ? (
            <Typography>Loading...</Typography>
          ) : (
            <Stack spacing={2}>
              {recipeSuggestions.map((recipe, index) => (
                
                <Typography key={index}>{recipe}</Typography>
              ))}
            </Stack>
          )}
          <Button
            variant="contained"
            onClick={() => setRecipeModalOpen(false)}
            sx={{
              mt: 3,
              backgroundColor: "#32de84",
              color: "#333",
              "&:hover": {
                backgroundColor: "#28c76f",
              },
            }}
          >
            Close
          </Button>
        </Box>
      </Modal>
    </Box>
  )
}
