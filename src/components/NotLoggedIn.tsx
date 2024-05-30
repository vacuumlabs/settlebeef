import React from "react";
import { Container, Stack, Typography } from "@mui/material";

const NotLoggedIn = () => {
  return (
    <Container>
      <Stack alignItems="center" justifyContent="center" gap={2} mt={25}>
        <Typography fontSize={96} mt={6}>
          🚫🔥🐄
        </Typography>
        <Typography variant="h4" variantMapping={{ h4: "h1" }}>
          To cook beef, you need to log in. 🐄🏃🔥
        </Typography>
      </Stack>
    </Container>
  );
};

export default NotLoggedIn;
