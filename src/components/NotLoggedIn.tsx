import React from "react";
import { Box, Container, Typography } from "@mui/material";

const NotLoggedIn = () => {
  return (
    <Container>
      <Box alignItems="center" justifyContent="center" mt="20%" gap={2}>
        <Typography variant="h1" textAlign="start" mt={6}>
          🚫🔥🐄
        </Typography>
        <Typography variant="h4" textAlign="start">
          To cook beef, you need to log in. 🐄🏃🔥
        </Typography>
      </Box>
    </Container>
  );
};

export default NotLoggedIn;
