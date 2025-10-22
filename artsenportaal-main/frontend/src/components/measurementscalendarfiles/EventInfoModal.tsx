import { SetStateAction, MouseEvent, Dispatch } from "react"
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, Box, Typography } from "@mui/material"
import { IEventInfo } from "./EventCalendar"
import { useNavigate } from "react-router-dom"

interface IProps {
  open: boolean
  handleClose: Dispatch<SetStateAction<void>>
  onDeleteEvent: (e: MouseEvent<HTMLButtonElement>) => void
  currentEvent: IEventInfo | null
  onViewDetails: () => void
}

const EventInfoModal = ({ open, handleClose, onDeleteEvent, currentEvent, onViewDetails }: IProps) => {
  const navigate = useNavigate()

  const onClose = () => {
    handleClose()
  }

  const handleViewDetails = () => {
    navigate('/measurementspage')
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Event Info</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Typography sx={{ fontSize: 14, marginTop: 3 }} color="text.secondary" gutterBottom>
            {currentEvent?.description}
          </Typography>
        </DialogContentText>
        <Box component="form"></Box>
      </DialogContent>
      <DialogActions>
        <Button color="error" onClick={onClose}>
          Cancel
        </Button>
        <Button color="info" onClick={onDeleteEvent}>
          Verwijder afspraak
        </Button>
        <Button color="info" onClick={handleViewDetails}>
          Meer informatie
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EventInfoModal