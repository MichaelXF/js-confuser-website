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

  const [cfAuth, setCfAuth] = useState(false); // Does this user have Cloudflare authentication?

  useEffect(() => {
    if (!cfAuth) {
      // Dispose the CF script - Allows new session to re-auth
      function disposeScript() {
        if (!script) return;

        setTimeout(() => {
          script.remove();
        }, 1000);
      }

      // Turnstile callback
      window.onloadTurnstileCallback = function () {
        window.turnstile.render("#turnstile-container", {
          sitekey: "0x4AAAAAAA2IS1nneh9eH4R1",
          callback: function (token) {
            // Authentication is successful, user may now use WebSocket
            setCfAuth(true);
            // console.log(`Challenge Success ${token}`);

            console.log("Challenge Success");
            disposeScript();
          },
          errorCallback: function (error) {
            // Authentication failed, handle error
            console.error("Challenge Error:", error);
            setError(error);

            disposeScript();
          },
        });
      };

      // Check if the script already exists - For development
      const exists = document.getElementById("cf-auth-script");
      if (exists) return;

      // Create a new script element
      const script = document.createElement("script");

      // Set the src attribute to the desired URL
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback";

      // Set the defer attribute (optional, based on your needs)
      script.defer = true;

      script.id = "cf-auth-script";

      // Append the script to the document head
      document.head.appendChild(script);
    }
  }, [cfAuth]);

  useEffect(() => {
    if (!cfAuth) return;

    const webSocketURL = process.env.REACT_APP_WS_HOST + "v1/chat/ws";
    let websocket;

    try {
      websocket = new WebSocket(webSocketURL);
    } catch (err) {
      console.error("WebSocket connection failed:", err);
      setError("" + err);

      return;
    }
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
  }, [cfAuth]);

  const [messages, setMessages] = useState([]);

  const containerRef = useRef();
  const flexRef = useRef();

  function scrollToBottom(forceScroll = false) {
    const flex = flexRef.current;
    if (!flex) return;
    const isAtBottom =
      forceScroll ||
      flex.scrollHeight - flex.clientHeight <= flex.scrollTop + 5;

    // Scroll to bottom if the user was already at the bottom
    if (isAtBottom) {
      setTimeout(() => {
        flex.scrollTop = flex.scrollHeight;
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

    // One time force scroll
    let didForceScroll = false;

    const cb = () => {
      const clientHeight = element.clientHeight;
      const elementHeight = element.scrollHeight;

      console.log(clientHeight, elementHeight);

      if (elementHeight > clientHeight) {
        if (!didForceScroll) {
          scrollToBottom(true);
          didForceScroll = true;
        }
        setJustifyContent("flex-start");

        cleanup();
      } else {
        setJustifyContent("center");
      }
    };
    const observer = new ResizeObserver(cb);

    observer.observe(element);

    const mutationObserver = new MutationObserver(cb);

    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
    });

    cb();

    var disposed = false;

    function cleanup() {
      if (disposed) return;
      disposed = true;

      observer.disconnect();
      mutationObserver.disconnect();
    }

    // Cleanup observer on unmount
    return () => {
      cleanup();
    };
  }, [maxHeight]);

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
              overflow={justifyContent === "center" ? "hidden" : "auto"}
              display={justifyContent === "center" ? "flex" : "block"}
              minHeight="100%"
              ref={flexRef}
            >
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
