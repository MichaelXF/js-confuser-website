import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import Message from "./Message";
import { RiErrorWarningLine } from "react-icons/ri";
import { KeyboardArrowRight } from "@mui/icons-material";
import ChatLanding from "./ChatLanding";

export default function ChatContent({
  cfAuth,
  loading,
  error,
  combinedMessages,
  retryConnection,
  generating,
  sendMessage,
  typingAnimationRef,
}) {
  return (
    <>
      {!cfAuth ? (
        <Box width="100%" textAlign="center">
          <div
            dangerouslySetInnerHTML={{
              __html: `<div id="turnstile-container"></div>`,
            }}
          ></div>
        </Box>
      ) : loading && !error ? (
        <Box
          display="flex"
          height="100%"
          justifyContent="center"
          alignItems="center"
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          {combinedMessages.map((message, index) => {
            const isLast = index === combinedMessages.length - 1;
            return (
              <Message
                key={index}
                userMessage={message.user}
                assistantMessage={message.assistant}
                showIncompleteTools={generating && isLast}
                allowAnimation={isLast}
                typingAnimationRef={typingAnimationRef}
              />
            );
          })}

          {combinedMessages.length === 0 && !error ? (
            <ChatLanding
              onSelectPrompt={(message) => {
                sendMessage(message);
              }}
            />
          ) : null}

          {error ? (
            <Stack
              direction="row"
              spacing={2}
              p={2}
              boxShadow="2"
              bgcolor="background.paper"
              border="1px solid"
              borderColor="custom_error_alpha"
              borderRadius="8px"
            >
              <Box>
                <Box
                  sx={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    fontSize: "1.25rem",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "custom_error_alpha",
                    color: "custom_error",
                  }}
                >
                  <RiErrorWarningLine />
                </Box>
              </Box>
              <Box>
                <Typography variant="h6" color="text.primary">
                  Connection Failed
                </Typography>

                <Typography variant="body1" color="text.secondary">
                  {typeof error === "string"
                    ? error
                    : "The connection to the server has been lost. Please try again later."}
                </Typography>

                <Button
                  onClick={() => {
                    retryConnection();
                  }}
                  sx={{ mt: 2 }}
                  endIcon={<KeyboardArrowRight />}
                >
                  Try Again
                </Button>
              </Box>
            </Stack>
          ) : null}
        </>
      )}
    </>
  );
}
