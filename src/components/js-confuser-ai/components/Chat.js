import {
  Alert,
  AlertTitle,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { getRandomString } from "../../../utils/random-utils";
import { InfoOutlined, Send, StopCircle } from "@mui/icons-material";
import Message from "./Message";
import { RiSparklingLine } from "react-icons/ri";
import ChatLanding from "./ChatLanding";

export default function Chat({ maxHeight = "100vh", immediateMessage }) {
  const webSocketRef = useRef();
  const incomingMessageCallbackRef = useRef();
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const inputRef = useRef();

  const hasSentImmediateMessage = useRef(false); // Send the immediate message only once

  useEffect(() => {
    const webSocketURL = process.env.REACT_APP_WS_HOST + "v1/chat/ws";
    const websocket = new WebSocket(webSocketURL);
    let didConnect = false;
    // Handle WebSocket connection open
    websocket.onopen = () => {
      didConnect = true;
      console.log("WebSocket connection established");
      setConnected(true);
      setLoading(false);

      // Send immediate message
      if (
        !hasSentImmediateMessage.current && // Must not have sent the immediate message
        webSocketRef.current === websocket && // Must be same WebSocket instance
        typeof immediateMessage === "string" && // Must be a string
        immediateMessage.trim().length > 0
      ) {
        hasSentImmediateMessage.current = true;
        sendMessage(immediateMessage);
      }
    };

    // Handle incoming messages
    websocket.onmessage = (event) => {
      console.log("Message from server:", event.data);

      incomingMessageCallbackRef.current?.(JSON.parse(event.data));
      // Append the message to the chat box or any UI component
      // const chatBox = document.getElementById("chat-box");
      // chatBox.innerText += event.data;
    };

    // Handle WebSocket errors
    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError(error);
    };

    // Handle WebSocket close
    websocket.onclose = () => {
      setConnected(false);
    };
    webSocketRef.current = websocket;

    return () => {
      if (websocket === webSocketURL.current) {
        webSocketRef.current = null;
      }
      if (didConnect) {
        websocket.close();
      }
    };
  }, []);

  const [messages, setMessages] = useState([]);

  const containerRef = useRef();
  const flexRef = useRef();

  function scrollToBottom() {
    const container = containerRef.current;
    const isAtBottom =
      container.scrollHeight - container.scrollTop === container.clientHeight;

    // Scroll to bottom if the user was already at the bottom
    if (isAtBottom) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 16);
    }
  }

  function stopGenerating() {
    const websocket = webSocketRef.current;
    if (!websocket) return;

    // TODO: Find way to stop generating on backend
    // websocket.send(JSON.stringify({ stop: true }));

    setGenerating(false);
    incomingMessageCallbackRef.current = null;
  }

  function sendMessageFromEvent() {
    const target = inputRef.current;
    if (!target) return;

    sendMessage(target.value);

    target.value = "";
  }

  async function sendMessage(content) {
    const sentMessageId = getRandomString();
    const message = { role: "user", content: content, id: sentMessageId };
    const sentMessages = [...messages, message];

    const responseId = getRandomString();
    const responseMessages = [
      ...sentMessages,
      { role: "assistant", content: "", loading: true, id: responseId },
    ];

    scrollToBottom();
    setMessages(responseMessages);
    setGenerating(true);
    setError(null);

    /**
     * @param {object} partMessage
     */
    function onReceivePart(partMessage) {
      function unlink() {
        // Unlink the handler
        if (incomingMessageCallbackRef.current == onReceivePart) {
          incomingMessageCallbackRef.current = null;
        }
      }

      if (partMessage.done) {
        unlink();

        setGenerating(false);

        return;
      }

      if (partMessage.error) {
        unlink();

        setError(
          partMessage.error || "An error occurred. Please try again later."
        );
        setGenerating(false);
        return;
      }

      // Is this the same message?
      if (partMessage.id !== sentMessageId) return;

      // Only update the last message
      const lastMessage = responseMessages.at(-1);
      if (lastMessage.id === responseId) {
        lastMessage.content += partMessage.content;
        lastMessage.loading = false;

        scrollToBottom();
        setMessages([...responseMessages]);
      }
    }

    // Handle incoming message parts
    incomingMessageCallbackRef.current = onReceivePart;

    // Send message to backend server
    webSocketRef.current.send(JSON.stringify({ id: sentMessageId, content }));
  }

  const combinedMessages = [];
  for (var i = 0; i < messages.length; i += 2) {
    combinedMessages.push({
      user: messages[i],
      assistant: messages[i + 1],
    });
  }

  const [justifyContent, setJustifyContent] = useState("center");

  useEffect(() => {
    const element = flexRef.current;

    if (!element) return;

    const cb = () => {
      const clientHeight = element.clientHeight;
      const elementHeight = element.scrollHeight;

      if (elementHeight > clientHeight) {
        setJustifyContent("flex-start");
      } else {
        setJustifyContent("center");
      }
    };
    const observer = new ResizeObserver(cb);

    observer.observe(element);

    cb();

    // Cleanup observer on unmount
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Box>
      {/* <Box className="CustomBGContainer">
        <Box className="CustomBGGrid"></Box>
      </Box> */}

      <Box>
        <Box
          height={maxHeight}
          // pt="100px"
          display="flex"
          flexDirection="column"
        >
          <Box
            sx={{
              overflowY: "auto",
              overflowX: "hidden",
              height: `calc(${maxHeight} - 120px)`,
              maxHeight: `calc(${maxHeight} - 120px)`,
            }}
            ref={containerRef}
            display="flex"
            flexDirection="column"
          >
            <Stack
              flexShrink={1}
              flexGrow={1}
              spacing={0}
              justifyContent={justifyContent}
              minHeight="100%"
              ref={flexRef}
            >
              {loading && !error ? (
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
                  {combinedMessages.map((message, index) => (
                    <Message
                      key={index}
                      userMessage={message.user}
                      assistantMessage={message.assistant}
                      showIncompleteTools={
                        generating && index === combinedMessages.length - 1
                      }
                      scrollToBottom={scrollToBottom}
                    />
                  ))}

                  {combinedMessages.length === 0 && !error ? (
                    <ChatLanding
                      onSelectPrompt={(message) => {
                        sendMessage(message);
                      }}
                    />
                  ) : null}

                  {error ? (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: "6px" }}>
                      <AlertTitle fontWeight="bold" color="text.primary">
                        Error!
                      </AlertTitle>
                      {typeof error === "string"
                        ? error
                        : "The connection to the server has been lost. Please try again later."}
                    </Alert>
                  ) : null}
                </>
              )}
            </Stack>
          </Box>

          <Box py={5} flexShrink={0}>
            <Stack direction="row" spacing={2}>
              <TextField
                autoFocus={true}
                placeholder="Ask about JS-Confuser"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    sendMessageFromEvent();

                    event.preventDefault();
                    event.stopPropagation();
                  }
                }}
                inputRef={inputRef}
                multiline
                maxRows={10}
                sx={{
                  maxWidth: "100%",
                  width: "100%",

                  "& > .MuiOutlinedInput-root": {
                    bgcolor: "divider_opaque",
                  },

                  "& > .MuiInputBase-formControl > .MuiOutlinedInput-notchedOutline, & > .MuiInputBase-formControl:hover:not(:focus-within) > .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor: "divider",
                      transition: "border-color 0.2s ease",
                    },
                }}
                size="small"
                variant="outlined"
                InputProps={{
                  sx: {
                    bgcolor: "divider_opaque",
                  },
                  startAdornment: (
                    <InputAdornment position="start">
                      <RiSparklingLine />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (generating) {
                            stopGenerating();
                          } else {
                            sendMessageFromEvent();
                          }
                        }}
                      >
                        {generating ? <StopCircle /> : <Send />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>

            <Box mt={1} textAlign="center">
              <Typography variant="caption" color="text.secondary">
                <InfoOutlined
                  sx={{ fontSize: "0.9rem", mb: "-2.75px", mr: "2.5px" }}
                />
                AI can make mistakes. Please verify the information provided.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
