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
import RemoveIcon from "@mui/icons-material/Remove";


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
        model: "gpt-4o-mini",
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
      backgroundColor: "#ffffff", // Set background to white
    }}
  >
      <Modal open={open} onClose={handleClose}>
      <Box
  position="absolute"
  top="50%"
  left="50%"
  width={400}
  bgcolor="white" // White background
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
  <Typography variant="h6" fontWeight="bold" color="#333">
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
                addItem(itemName, itemQuantity); // Use custom quantity from modal
                setItemName("");
                setItemQuantity(1); // Reset quantity to default value
                handleClose();
              }}
              sx={{
                backgroundColor: "#007bff",
                color: "#333",
                "&:hover": {
                  backgroundColor: "#0056b3",
                },
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Modal open={recipeModalOpen} onClose={() => setRecipeModalOpen(false)}>
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
            maxWidth: "80%",
            maxHeight: "80%",
            overflow: "auto",
          }}
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            color="#007bff"
            textAlign="center"
          >
            Recipe Suggestions
          </Typography>
          <Divider />
          {isLoading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              py={4}
            >
              <CircularProgress color="success" />
            </Box>
          ) : (
            <Stack width="100%" direction="column" spacing={2}>
              {recipeSuggestions.map((suggestion, index) => {
            const [recipeName, searchLink] = suggestion.split(",");

            let cleanLink = "";
            if (searchLink) {
                // Extract the actual URL from the searchLink
                const linkMatch = searchLink.match(/\bhttps?:\/\/\S+/gi);
                cleanLink = linkMatch ? linkMatch[0] : searchLink.trim();
            }

            return (
                <Box key={index} bgcolor="#f5f5f5" p={2} borderRadius={1}>
                    <Typography
                        variant="h6"
                        color="#333"
                        gutterBottom
                        textAlign="center"
                    >
                        {recipeName.trim()}
                    </Typography>
                    {cleanLink && (
                        <Typography
                            component="a"
                            href={cleanLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                color: "#007bff",
                                textDecoration: "none",
                                "&:hover": {
                                    textDecoration: "underline",
                                },
                                display: "block",
                                textAlign: "center",
                            }}
                        >
                            View Recipe
                        </Typography>
                    )}
                </Box>
            );
        })}

            </Stack>
          )}
          <Button
            variant="contained"
            onClick={() => setRecipeModalOpen(false)}
            sx={{
              backgroundColor: "#007bff",
              color: "#fff",
              "&:hover": {
                backgroundColor: "#28c76f",
              },
              alignSelf: "center",
              mt: 2,
            }}
          >
            Close
          </Button>
        </Box>
      </Modal>

      <Stack
        direction="column"
        spacing={3}
        alignItems="center"
        marginBottom={2}
        sx={{ width: "80%", maxWidth: 800 }}
      >
        <TextField
          variant="outlined"
          fullWidth
          placeholder="Search Pantry"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              "&:hover fieldset": {
                borderColor: "#32de84",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#32de84",
              },
            },
          }}
        />
  <Button
  variant="contained"
  onClick={() => {
    handleOpen();
  }}
  sx={{
    backgroundColor: "#007bff", // Primary blue color
    color: "#fff", 
    "&:hover": {
      backgroundColor: "#0056b3", // Darker blue on hover
    },
    padding: "10px 20px",
    borderRadius: 2,
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)", // Slight shadow for depth
  }}
>
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
    backgroundColor: "#007bff", // Primary blue color
    color: "#fff",
    "&:hover": {
      backgroundColor: "#0056b3", // Darker blue on hover
    },
    "&:disabled": {
      backgroundColor: "#a0a0a0", // Gray color when disabled
    },
    padding: "10px 20px",
    borderRadius: 2,
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)", // Consistent shadow effect
  }}
>
  {isLoading ? "Loading..." : "Get Recipe Suggestion"}
</Button>

      </Stack>
      <Box
        border="1px solid #ddd" // Use a light border
        borderRadius="16px"
        overflow="hidden"
        sx={{ width: "80%", maxWidth: 800 }}
      >

        <Box
          width="100%"
          height="100px"
          bgcolor="#007bff" // Solid color for header
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="h4" color="#000000
" fontWeight="bold">
            Pantry Tracker
          </Typography>
        </Box>


        <Stack
          width="100%"
          maxHeight="400px"
          spacing={2}
          overflow="auto"
          sx={{
            "&::-webkit-scrollbar": {
              width: "0.4em",
            },
            "&::-webkit-scrollbar-track": {
              boxShadow: "inset 0 0 6px rgba(0,0,0,0.1)",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0,0,0,0.3)",
              borderRadius: 2,
            },
          }}
        >
          {filteredInventory.map(({ name, quantity }) => (
            <Box
              key={name}
              width="100%"
              minHeight="80px"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              bgcolor="#fff"
              padding={2}
              borderBottom="1px solid #ddd"
              sx={{
                "&:last-child": {
                  borderBottom: "none",
                },
              }}
            >
              <Typography variant="h6" color="#333">
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>

              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  variant="text"
                  onClick={() => {
                    addItem(name);
                  }}
                  sx={{
                    color: "#32de84",
                  }}
                >
                  <AddIcon />
                </Button>
                <Typography variant="h6" color="#333">
                  {quantity}
                </Typography>
                <Button
                  variant="text"
                  onClick={() => {
                    removeItem(name);
                  }}
                  sx={{
                    color: "#f44336",
                  }}
                >
                  <RemoveIcon />
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}