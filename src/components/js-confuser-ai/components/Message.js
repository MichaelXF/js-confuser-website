import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {
  CheckCircleOutline,
  ContentCopyOutlined,
  ThumbDownOutlined,
  ThumbUpOutlined,
} from "@mui/icons-material";
import Markdown from "./Markdown";
import { textEllipsis } from "../../../utils/format-utils";
import AITool from "./AITool";
import { useEffect, useRef, useState } from "react";
import useSnackbar from "../../../hooks/useSnackbar";

export default function Message({
  userMessage,
  assistantMessage,
  scrollToBottom,
  showIncompleteTools,
}) {
  const [displayMessage, setDisplayMessage] = useState(
    assistantMessage?.content
  );
  const refCounter = useRef(0);
  const [replay, setReplay] = useState(false);
  const snackbar = useSnackbar();

  useEffect(() => {
    if (!assistantMessage.content) return;

    var ignore = false;
    var lastTime = performance.now();
    let lastCharsToShow = 0;

    function animate() {
      if (ignore) return;

      var nowTime = performance.now();
      var deltaTime = nowTime - lastTime;
      lastTime = nowTime;

      refCounter.current += deltaTime;

      let speed = 2;

      let charsToShow = Math.floor(refCounter.current / speed);

      const currentLine = assistantMessage.content
        .slice(0, charsToShow)
        .split("\n")
        .at(-1);

      if (currentLine.trimLeft().startsWith("- ")) {
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

      let sliced = assistantMessage.content.slice(0, charsToShow);

      const jumpSequences = {
        "[": ")",
        "https://": ".",
      };

      const jumpSequencesExtra = {
        "https://": 1,
      };

      if (lastCharsToShow !== charsToShow) {
        for (var i = lastCharsToShow; i < charsToShow; i++) {
          for (var sequenceStart in jumpSequences) {
            if (assistantMessage.content.startsWith(sequenceStart, i)) {
              const sequenceEnd = jumpSequences[sequenceStart];
              let endIndex = assistantMessage.content.indexOf(
                sequenceEnd,
                i + sequenceStart.length
              );
              if (endIndex !== -1 && endIndex > charsToShow) {
                const extra = jumpSequencesExtra[sequenceStart] || 0;
                endIndex += extra;

                i = charsToShow = endIndex + 1;

                refCounter.current = charsToShow * speed;
                sliced = assistantMessage.content.slice(0, charsToShow);
                break;
              }
            }
          }
        }
      }

      lastCharsToShow = charsToShow;

      setDisplayMessage(sliced);
      scrollToBottom();

      if (charsToShow >= assistantMessage.content.length) return;

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

    return () => {
      ignore = true;
    };
  }, [assistantMessage.content, replay]);

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
          {!displayMessage ? (
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
                alert("Thanks, this button does nothing");
              },
            },
            {
              icon: ThumbDownOutlined,
              tooltip: "Bad response",
              onClick: () => {
                alert("Thanks, this button does nothing");

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
