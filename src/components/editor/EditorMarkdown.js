import { Box } from "@mui/material";
import Markdown from "../Markdown";

export default function EditorMarkdown({ markdown }) {
  return (
    <Box p={4} maxWidth="1000px" mx="auto">
      <Markdown value={markdown} />
    </Box>
  );
}
