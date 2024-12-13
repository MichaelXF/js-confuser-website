import { KeyboardArrowRight } from "@mui/icons-material";
import { Box, Button, Container, Typography } from "@mui/material";
import { Link } from "react-router-dom";

export default function PageNotFound() {
  return (
    <Container maxWidth="md" sx={{ p: 4 }}>
      <Typography variant="h3" mb={2}>
        Page not found!
      </Typography>

      <Typography color="text.secondary" mb={4}>
        The page requested was not found. Please check the URL and try again.
      </Typography>

      <Button component={Link} to="/" endIcon={<KeyboardArrowRight />}>
        Go Back
      </Button>
    </Container>
  );
}
