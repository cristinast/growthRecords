import React, { useState, useEffect } from "react";
import {
    Typography,
    Stack,
    Button,
    Avatar,
    Box,
    Paper,
    TextField,
} from "@mui/material";

import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

function AccountSelector({ onSelect }) {
    const [accounts, setAccounts] = useState([]);
    const [form, setForm] = useState({ name: "", birthday: null });
    const [icon, setIcon] = useState(null);
    const [iconPreview, setIconPreview] = useState(null);

    useEffect(() => {
        fetch('http://localhost:3001/api/records')
            .then(res => res.json())
            .then(data => setRecords(data));
    }, []);

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    const handleDateChange = (newDate) => {
        setForm({ ...form, birthday: newDate });
    };
}
