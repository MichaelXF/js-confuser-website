import { Box, Typography } from "@mui/material";
import QuickActions from "../components/QuickActions";
import useSEO from "../hooks/useSEO";
import Markdown from "../components/Markdown";

export default function PageDocHome({ onMetadataUpdate }) {
  useSEO(
    "Docs | JS-Confuser",
    `JS-Confuser is an open-source JavaScript obfuscator. This obfuscation
        tool transforms your code into an unreadable, complex representation
        that is difficult to understand. Here you can learn everything you need
        to know about JS-Confuser.`
  );

  return (
    <Box py={2}>
      <Box mb={6}>
        <Markdown
          value={`
        ### Welcome to JS-Confuser!

        JS-Confuser is an open-source JavaScript obfuscator. This obfuscation tool transforms your code into an unreadable, complex representation that is difficult to understand. Here you can learn everything you need to know about JS-Confuser.
        `}
        />
      </Box>

      <QuickActions />
    </Box>
  );
}
