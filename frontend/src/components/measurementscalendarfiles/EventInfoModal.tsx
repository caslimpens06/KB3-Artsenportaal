import { SetStateAction, MouseEvent, Dispatch } from "react"
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Box, Typography, Divider } from "@mui/material"
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

    const renderRow = (label: string, value: string) => (
        <Box display="flex" justifyContent="space-between" mt={2} mb={1}>
            <Typography sx={{ fontWeight: 500, fontSize: 16, color: "text.primary" }}>{label}</Typography>
            <Typography sx={{ fontSize: 16, color: "text.secondary" }}>{value}</Typography>
        </Box>
    )

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontSize: 20, fontWeight: 600 }}>Afspraak Informatie</DialogTitle>
            <DialogContent>
                {currentEvent ? (
                    <>
                        {renderRow("Naam", currentEvent.description || "-")}
                        {renderRow("Begindatum & tijd", currentEvent.start ? currentEvent.start.toLocaleString() : "-")}
                        {renderRow("Einddatum & tijd", currentEvent.end ? currentEvent.end.toLocaleString() : "-")}
                        {renderRow(
                            "Duur",
                            currentEvent.start && currentEvent.end
                                ? Math.round((currentEvent.end.getTime() - currentEvent.start.getTime()) / 60000) + " minuten"
                                : "-"
                        )}
                        <Divider sx={{ mt: 2, mb: 2 }} />
                        <Box display="flex" justifyContent="center" mt={1}>
                            <Button color="info" variant="contained" onClick={handleViewDetails} sx={{ mr: 1 }}>
                                Meer details
                            </Button>
                            <Button color="error" variant="contained" onClick={onDeleteEvent}>
                                Verwijder afspraak
                            </Button>
                        </Box>
                    </>
                ) : (
                    <Typography sx={{ mt: 2, fontSize: 16 }} color="text.secondary">
                        Geen afspraak geselecteerd
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Sluiten
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default EventInfoModal
