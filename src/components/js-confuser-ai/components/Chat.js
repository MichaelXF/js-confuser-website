import {
  Box,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { getRandomString } from "../../../utils/random-utils";
import { InfoOutlined, Send, StopCircle } from "@mui/icons-material";
import { RiSparklingLine } from "react-icons/ri";
import ChatContent from "./ChatContent";

const webSocketURL = process.env.REACT_APP_WS_HOST + "v1/chat/ws";
const isLocalhost = webSocketURL.startsWith("ws://localhost:");

let globalCfAuthState = isLocalhost; // Save CloudFlare captcha completion, not needed on localhost

export default function Chat({
  maxHeight = "100vh",
  immediateMessage,
  fullScreen,
}) {
  const webSocketRef = useRef();
  const incomingMessageCallbackRef = useRef();
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const inputRef = useRef();

  const hasSentImmediateMessage = useRef(false); // Send the immediate message only once

  const [cfAuth, setCfAuth] = useState(globalCfAuthState); // Does this user have Cloudflare authentication?

  const typingAnimationRef = useRef({});

  useEffect(() => {
    if (!cfAuth) {
      let script;

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
            // token is not required for validation - CF cookie permits WebSocket passage
            setCfAuth(true);
            globalCfAuthState = true; // Save the state globally

            console.log("Challenge Success");
            disposeScript();
          },
          errorCallback: function (error) {
            // Authentication failed, handle error
            console.error("Challenge Error:", error);
            setError("Cloudflare authentication failed. Please try again.");

            disposeScript();
          },
        });
      };

      // Check if the script already exists - For development
      const exists = document.getElementById("cf-auth-script");
      if (exists) return;

      // Create a new script element
      script = document.createElement("script");

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
      // console.log("Message from server:", event.data);

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
  const shouldAutoScrollRef = useRef(true);

  // When the user manually scrolls - release auto scroll
  useEffect(() => {
    if (!flexRef.current) return;
    const cb = (e) => {
      shouldAutoScrollRef.current = false;

      // Re enable auto scroll if the user is at the bottom
      if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight) {
        shouldAutoScrollRef.current = true;
      }
    };
    flexRef.current.addEventListener("scroll", cb);

    return () => {
      if (!flexRef.current) return;
      flexRef.current.removeEventListener("scroll", cb);
    };
  }, [flexRef.current]);

  // Scroll to bottom on new message
  function scrollToBottom() {
    const flex = flexRef.current;
    if (!flex) return;

    flex.scrollTop = flex.scrollHeight;
    setTimeout(() => {
      flex.scrollTop = flex.scrollHeight;
    }, 20);
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

      // console.log(clientHeight, elementHeight);

      if (elementHeight > clientHeight) {
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

  const ContentWrapperElement =
    justifyContent === "center" ? React.Fragment : "div";

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
              sx={
                justifyContent === "center"
                  ? {
                      overflow: "hidden",
                      display: "flex",
                    }
                  : {
                      overflow: "auto",
                      display: "flex",
                      flexDirection: "column-reverse",
                    }
              }
            >
              <ContentWrapperElement key="content">
                <ChatContent
                  typingAnimationRef={typingAnimationRef}
                  cfAuth={cfAuth}
                  combinedMessages={combinedMessages}
                  error={error}
                  loading={loading}
                  generating={generating}
                  sendMessage={sendMessage}
                  retryConnection={() => {
                    setLoading(true);
                    setError(null);

                    // Reconnect
                    setTimeout(() => {
                      // Hacky way to get rerender but maintaining truthy/falsy value
                      if (cfAuth) {
                        setCfAuth({});
                      } else {
                        setCfAuth(cfAuth === 0 ? false : 0);
                      }
                    }, 300);
                  }}
                />
              </ContentWrapperElement>
            </Stack>
          </Box>

          <Box py={fullScreen ? 5 : 2} flexShrink={0}>
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
                        {generating ? (
                          <StopCircle className="blinking" />
                        ) : (
                          <Send />
                        )}
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