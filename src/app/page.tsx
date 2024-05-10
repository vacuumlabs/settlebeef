'use client'

import { SmartAccountClientContext } from "@/components/providers/SmartAccountClientContext";
import { Box, Typography } from "@mui/material";
import { useContext } from "react";

export default function Home() {
        const { client } = useContext(SmartAccountClientContext);
        return (
                <Box mt={8}>
                        <Typography variant="h1">Home</Typography>
                        <Typography variant="body1">
                                {client ? "Connected" : "Not connected"}
                                {client && JSON.stringify(client.account)}
                        </Typography>

                </Box>
        );
}
