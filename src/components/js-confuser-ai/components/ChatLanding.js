import { Box, Button, Stack, Typography } from "@mui/material";
import { RiCornerDownRightLine, RiSparklingLine } from "react-icons/ri";

export default function ChatLanding({ fullScreen, onSelectPrompt }) {
  return (
    <Box
      textAlign="center"
      maxWidth="600px"
      width="100%"
      mx="auto"
      pt={fullScreen ? 6 : 0}
      className="fade-in-landing-animation"
    >
      <Box
        sx={{
          display: "inline-flex",
          mx: "auto",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "6px",
          padding: "8px 12px",
          fontWeight: "bold",
        }}
        className="GradientShineTextPrimary"
        mb={2}
      >
        <RiSparklingLine style={{ marginRight: "4px" }} />
        JS-Confuser AI
      </Box>

      <Typography color="text.secondary">
        Welcome! JS-Confuser AI is a powerful AI chat assistant to answer
        complex questions about JS-Confuser.
      </Typography>

      <Typography
        variant="body2"
        fontStyle="italic"
        color="text.secondary_darker"
        mt={6}
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
                textTransform: "none",
              }}
              onClick={() => {
                onSelectPrompt(message);
              }}
            >
              <RiCornerDownRightLine
                style={{
                  fontSize: "1.125rem",
                  marginRight: "6px",
                  marginBottom: "1px",
                }}
              />
              {message}
            </Button>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
