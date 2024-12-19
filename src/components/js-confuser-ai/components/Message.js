import { Box, IconButton, Stack } from "@mui/material";
import {
  CheckCircleOutline,
  ContentCopyOutlined,
  ThumbDownOutlined,
  ThumbUpOutlined,
} from "@mui/icons-material";
import Markdown from "./Markdown";
import { textEllipsis } from "../../../utils/format-utils";
import AITool from "./AITool";
import { useEffect, useState } from "react";
import useSnackbar from "../../../hooks/useSnackbar";

export default function Message({
  userMessage,
  assistantMessage,
  showIncompleteTools,
  allowAnimation,
  typingAnimationRef,
}) {
  const [displayMessage, setDisplayMessage] = useState(
    assistantMessage?.content
  );
  const [replay, setReplay] = useState(false);
  const snackbar = useSnackbar();

  // TYPING ANIMATION
  // Make it seem like the AI is typing, when in reality it's streaming chunks of the response
  useEffect(() => {
    if (!assistantMessage.content || !allowAnimation) return;

    var ignore = false;
    var lastTime = performance.now();
    let lastCharsToShow = 0;

    const refCounter = {
      set current(value) {
        typingAnimationRef.current[userMessage.id] = value;
      },
      get current() {
        return typingAnimationRef.current[userMessage.id] || 0;
      },
    };

    function animate() {
      if (ignore) return;

      var nowTime = performance.now();
      var deltaTime = nowTime - lastTime;
      lastTime = nowTime;

      refCounter.current += deltaTime;

      let speed = 2.4;

      let charsToShow = Math.floor(refCounter.current / speed);

      const currentLine = assistantMessage.content
        .slice(0, charsToShow)
        .split("\n")
        .at(-1);

      // For tools, we need to show the full line immediately
      // TODO: Find better way to detect tools
      if (
        currentLine
          .trimLeft()
          .startsWith("- Running: search_knowledge_base(query=") ||
        currentLine.trimLeft().startsWith("- search_knowledge_base(query=")
      ) {
        const nextLine = assistantMessage.content.indexOf("\n", charsToShow);
        const newCharsToShow = Math.max(
          charsToShow,
          nextLine === -1 ? assistantMessage.content.length - 1 : nextLine - 1
        );

        if (newCharsToShow > charsToShow) {
          charsToShow = newCharsToShow;
          refCounter.current = newCharsToShow * speed;
        }
      }

      // Jump sequences for URLs as it can cause rapid layout shifts
      const jumpSequences = {
        // Links -> jump just enough for blue text
        "[": ")",
        "https://": ".",
        // Markdown list -> jump into line item
      };

      const jumpSequencesExtra = {
        "https://": 1,
      };

      function moveToIndex(index) {
        charsToShow = index;
        refCounter.current = charsToShow * speed;
      }

      if (lastCharsToShow !== charsToShow) {
        outer: for (let i = lastCharsToShow; i <= charsToShow; i++) {
          if (assistantMessage.content.charAt(i) === "\n") {
            // Try to find new list item
            let nextLine = assistantMessage.content.slice(i + 1).split("\n")[0];
            let match = nextLine.match(/^\s*(\*|-) /);
            if (match) {
              let matchJump = i + match.index + match[0].length + 1;
              if (matchJump > charsToShow) {
                i = matchJump;

                moveToIndex(i);
              }
            }
          }

          // Defined jump sequences
          for (let sequenceStart in jumpSequences) {
            if (assistantMessage.content.startsWith(sequenceStart, i)) {
              const sequenceEnd = jumpSequences[sequenceStart];
              let endIndex = assistantMessage.content.indexOf(
                sequenceEnd,
                i + sequenceStart.length
              );
              if (endIndex !== -1 && endIndex > charsToShow) {
                const extra = jumpSequencesExtra[sequenceStart] || 0;
                endIndex += extra;

                i = endIndex + 1;

                moveToIndex(i);
                break outer;
              }
            }
          }
        }
      }

      let sliced = assistantMessage.content.slice(0, charsToShow);
      lastCharsToShow = charsToShow;

      setDisplayMessage(sliced);

      if (charsToShow >= assistantMessage.content.length) return;

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

    return () => {
      ignore = true;
    };
  }, [assistantMessage.content, replay, allowAnimation]);

  return (
    <Box p={2}>
      <Box typography="body">
        <Box color="primary.main" fontWeight="bold">
          <CheckCircleOutline
            sx={{
              fontSize: "1.25rem",
              mb: "-3px",
              minWidth: "24px",
              mr: "4px",
            }}
          />

          {textEllipsis(userMessage.content, 100)}
        </Box>

        <Box mt={2}>
          {!displayMessage && showIncompleteTools ? (
            <AITool />
          ) : (
            <Markdown
              value={displayMessage}
              showIncompleteTools={showIncompleteTools}
            />
          )}
        </Box>

        <Stack direction="row" justifyContent="flex-end" spacing={1} mt={1}>
          {[
            {
              icon: ThumbUpOutlined,
              tooltip: "Good response",
              onClick: () => {
                alert("Not implemented yet");
              },
            },
            {
              icon: ThumbDownOutlined,
              tooltip: "Bad response",
              onClick: () => {
                alert("Not implemented yet");

                // Replay typing animation for developing purposes
                // refCounter.current = 0;
                // setReplay({});
              },
            },
            {
              icon: ContentCopyOutlined,
              tooltip: "Copy to clipboard",
              onClick: () => {
                if ("navigator" in window && "clipboard" in window.navigator) {
                  navigator.clipboard.writeText(assistantMessage.content);
                  snackbar.showSuccess("Copied to clipboard");
                } else {
                  alert("Your browser does not support clipboard operations");
                }
              },
            },
          ].map((action, index) => (
            <IconButton
              key={index}
              onClick={action.onClick}
              size="small"
              color="inherit"
              title={action.tooltip}
              sx={{
                color: "text.secondary",
              }}
            >
              <action.icon sx={{ fontSize: "1rem" }} />
            </IconButton>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
