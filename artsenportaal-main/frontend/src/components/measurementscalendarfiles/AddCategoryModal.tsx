import React from "react"; 
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
} from "@mui/material"

import { ICategory } from "../measurementscalendar"

interface IProps {
  open: boolean
  handleClose: () => void
  categories: ICategory[]
  setCategories: React.Dispatch<React.SetStateAction<ICategory[]>>
}

export const AddCategoryModal: React.FC<IProps> = ({ open, handleClose, categories}) => {

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Afspraak categorieën</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Beheer de verschillende soorten afspraken die mogelijk zijn voor deze patiënt.
        </DialogContentText>
        <Box>
          <List sx={{ marginTop: 3 }}>
            {categories.map((category) => (
              <ListItem
                key={category._id}
                secondaryAction={
                  <Box
                    sx={{ height: 40, width: 40, borderRadius: 1 }}
                    style={{ backgroundColor: category.color }}
                  />
                }
              >
                <ListItemText primary={category.title} />
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Sluiten</Button>
      </DialogActions>
    </Dialog>
  )
}