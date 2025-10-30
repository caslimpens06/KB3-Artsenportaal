import React, { Dispatch, MouseEvent, SetStateAction, ChangeEvent, useMemo } from "react";
import {
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
    Autocomplete,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePickerEventFormData } from "./EventCalendar";
import { ICategory } from "../measurementscalendar";
import { nl } from "date-fns/locale";

interface IProps {
    open: boolean;
    handleClose: Dispatch<SetStateAction<void>>;
    datePickerEventFormData: DatePickerEventFormData;
    setDatePickerEventFormData: Dispatch<SetStateAction<DatePickerEventFormData>>;
    onAddEvent: (e: MouseEvent<HTMLButtonElement>) => void;
    todos: ICategory[];
}

const AddDatePickerEventModal = ({
    open,
    handleClose,
    datePickerEventFormData,
    setDatePickerEventFormData,
    onAddEvent,
    todos: categories,
}: IProps) => {
    const { description, start, end, categoryId } = datePickerEventFormData;

    const onClose = () => handleClose();

    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
        setDatePickerEventFormData(prev => ({
            ...prev,
            [event.target.name]: event.target.value,
        }));
    };

    const handleCategoryChange = (e: React.SyntheticEvent, value: ICategory | null) => {
        setDatePickerEventFormData(prev => ({
            ...prev,
            categoryId: value?._id,
        }));
    };

    const handleStartDateChange = (newValue: Date | null) => {
        setDatePickerEventFormData(prev => {
            const newStart = newValue ? new Date(newValue) : new Date();
            let newEnd = prev.end || new Date(newStart.getTime() + 30 * 60 * 1000);
            if (newEnd <= newStart) newEnd = new Date(newStart.getTime() + 30 * 60 * 1000);
            return { ...prev, start: newStart, end: newEnd };
        });
    };

    const handleTimeChange = (type: "start" | "end", hour: number, minute: number) => {
        setDatePickerEventFormData(prev => {
            const date = type === "start" ? prev.start || new Date() : prev.end || new Date();
            const newDate = new Date(date);
            newDate.setHours(hour, minute);
            return type === "start" ? { ...prev, start: newDate } : { ...prev, end: newDate };
        });
    };

    const errors = useMemo(() => {
        const errs: string[] = [];
        const now = new Date();

        if (description.length > 50) {
            errs.push(`Beschrijving is te groot: ${description.length}/50 tekens`);
        }

        if (!description.trim()) errs.push("Beschrijving is verplicht.");
        if (!start) errs.push("Begindatum is verplicht.");
        if (!end) errs.push("Einddatum is verplicht.");
        if (!categoryId) errs.push("Categorie is verplicht.");

        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (start && start < today) errs.push("Begindatum mag niet in het verleden liggen.");
        if (end && end < today) errs.push("Einddatum mag niet in het verleden liggen.");
        if (start && end) {
            if (start.getTime() >= end.getTime()) {
                errs.push("Begindatum/tijd mag niet gelijk of na einddatum/tijd liggen.");
            }
        }

        return errs;
    }, [description, start, end, categoryId]);

    const now = new Date();
    const currentStart = start || new Date(now.getTime() + 30 * 60 * 1000);
    const currentEnd = end || new Date(now.getTime() + 60 * 60 * 1000);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Afspraak toevoegen</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Vul onderstaande velden in om een afspraak toe te voegen.
                </DialogContentText>

                <Box component="form" display="flex" flexDirection="column" gap={3}>
                    <TextField
                        name="description"
                        value={description}
                        label="Beschrijving"
                        fullWidth
                        variant="outlined"
                        onChange={onChange}
                        helperText={`${description.length}/50 tekens`}
                        error={description.length > 50}
                        required
                    />

                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={nl}>
                        <Box display="flex" flexDirection="column" gap={2.5}>
                            <DatePicker
                                label="Begindatum"
                                value={start || null}
                                onChange={handleStartDateChange}
                                minDate={new Date()}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        required
                                        InputProps={{
                                            ...params.InputProps,
                                            readOnly: true,
                                        }}
                                        onKeyDown={(e) => e.preventDefault()}
                                    />
                                )}
                            />

                            <Box display="flex" gap={2} mt={0.5}>
                                <FormControl sx={{ width: 100 }}>
                                    <InputLabel></InputLabel>
                                    <Select
                                        value={currentStart.getHours()}
                                        onChange={(e) =>
                                            handleTimeChange("start", Number(e.target.value), currentStart.getMinutes())
                                        }
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <MenuItem key={i} value={i}>{i.toString().padStart(2, "0")}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl sx={{ width: 100 }}>
                                    <InputLabel></InputLabel>
                                    <Select
                                        value={currentStart.getMinutes()}
                                        onChange={(e) =>
                                            handleTimeChange("start", currentStart.getHours(), Number(e.target.value))
                                        }
                                    >
                                        {Array.from({ length: 60 }, (_, i) => (
                                            <MenuItem key={i} value={i}>{i.toString().padStart(2, "0")}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>

                        <Box display="flex" flexDirection="column" gap={1.5} mt={3}>
                            <DatePicker
                                label="Einddatum"
                                value={end || null}
                                minDate={currentStart || undefined}
                                onChange={(newValue) =>
                                    setDatePickerEventFormData(prev => ({
                                        ...prev,
                                        end: newValue ? new Date(newValue) : undefined,
                                    }))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        required
                                        InputProps={{
                                            ...params.InputProps,
                                            readOnly: true,
                                        }}
                                        onKeyDown={(e) => e.preventDefault()}
                                    />
                                )}
                            />

                            <Box display="flex" gap={2} mt={0.5}>
                                <FormControl sx={{ width: 100 }}>
                                    <InputLabel></InputLabel>
                                    <Select
                                        value={currentEnd.getHours()}
                                        onChange={(e) =>
                                            handleTimeChange("end", Number(e.target.value), currentEnd.getMinutes())
                                        }
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <MenuItem key={i} value={i}>{i.toString().padStart(2, "0")}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl sx={{ width: 100 }}>
                                    <InputLabel></InputLabel>
                                    <Select
                                        value={currentEnd.getMinutes()}
                                        onChange={(e) =>
                                            handleTimeChange("end", currentEnd.getHours(), Number(e.target.value))
                                        }
                                    >
                                        {Array.from({ length: 60 }, (_, i) => (
                                            <MenuItem key={i} value={i}>{i.toString().padStart(2, "0")}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                    </LocalizationProvider>


                    <Autocomplete
                        onChange={handleCategoryChange}
                        disablePortal
                        id="combo-box-demo"
                        options={categories}
                        getOptionLabel={(option) => option.title}
                        value={categories.find(c => c._id === categoryId) || null}
                        renderInput={(params) => <TextField {...params} label="Categorie" required />}
                        freeSolo={false}
                        disableClearable={false}
                        onInputChange={() => { }}
                    />


                    {errors.length > 0 && (
                        <Box
                            mt={2}
                            p={2}
                            border="1px solid red"
                            borderRadius={2}
                            bgcolor="#ffe6e6"
                        >
                            <Typography variant="subtitle2" color="error" mb={1}>
                                Let op!
                            </Typography>
                            <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                {errors.map((err, i) => (
                                    <Typography
                                        key={i}
                                        component="li"
                                        color="error"
                                        variant="body2"
                                        sx={{ listStyleType: "disc" }}
                                    >
                                        {err}
                                    </Typography>
                                ))}
                            </Box>
                        </Box>
                    )}

                </Box>
            </DialogContent>

            <DialogActions>
                <Button color="error" onClick={onClose}>Annuleren</Button>
                <Button disabled={errors.length > 0} color="success" onClick={onAddEvent}>Toevoegen</Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddDatePickerEventModal;
