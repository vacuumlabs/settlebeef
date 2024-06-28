import React from "react"
import { Box, Container, Typography } from "@mui/material"

const NotFound = () => {
  return (
    <Container>
      <Box alignItems="center" justifyContent="center" mt="20%" gap={2}>
        <Typography variant="h1" textAlign="start">
          🐄 4️⃣ 🐄 0️⃣ 🐄 4️⃣ 🐄
        </Typography>
        <Typography variant="h4" textAlign="start">
          Your beef is on another farm.
        </Typography>
      </Box>
    </Container>
  )
}

export default NotFound
