import { Box, Typography } from "@mui/material";
import QuickActions from "../components/QuickActions";
import useSEO from "../hooks/useSEO";

export default function PageDocHome({ onMetadataUpdate }) {
  useSEO(
    "Docs | Welcome to JS Confuser!",
    `JS-Confuser is an open-source JavaScript obfuscator. This obfuscation
        tool transforms your code into an unreadable, complex representation
        that is difficult to understand. Here you can learn everything you need
        to know about JS-Confuser.`
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome to JS Confuser!
      </Typography>

      <Typography color="text.secondary" mb={6}>
        JS-Confuser is an open-source JavaScript obfuscator. This obfuscation
        tool transforms your code into an unreadable, complex representation
        that is difficult to understand. Here you can learn everything you need
        to know about JS-Confuser.
      </Typography>

      <QuickActions />
    </Box>
  );
}
