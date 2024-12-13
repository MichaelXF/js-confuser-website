import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { RiQuestionLine, RiSparklingLine } from "react-icons/ri";

export default function ChatLanding({ onSelectPrompt }) {
  return (
    <Box textAlign="center">
      <Box color="primary.main" fontSize="2rem"></Box>

      <Typography variant="h4" color="primary.main" className="GradientText">
        Meet JS-Confuser AI <RiSparklingLine />
      </Typography>

      <Box my={4} maxWidth="500px" mx="auto">
        <Divider />
      </Box>

      <Typography
        variant="body2"
        fontStyle="italic"
        color="text.secondary_darker"
        mb={2}
      >
        Try these examples:
      </Typography>

      <Stack
        direction="row"
        flexWrap="wrap"
        alignItems="center"
        spacing={1}
        width="100%"
        justifyContent="center"
      >
        {[
          "What does JS-Confuser do?",
          "What is Control Flow Flattening?",
          "Explain how Rename Variables works",
        ].map((message, index) => (
          <Box key={index} pb={1}>
            <Button
              color="inherit"
              sx={{
                color: "text.secondary_darker",
                fontWeight: "normal",
                display: "flex",
              }}
              startIcon={<RiQuestionLine />}
              onClick={() => {
                onSelectPrompt(message);
              }}
            >
              {message}
            </Button>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
