import {
  Box,
  Button,
  CircularProgress,
  Fade,
  Stack,
  Typography,
} from "@mui/material";
import { Error, KeyboardArrowRight, Lock } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { CodeViewer } from "../components/codeViewer/CodeViewer";
import { landingPageCode } from "../constants";
import useJSConfuser from "../hooks/useJSConfuser";
import * as monaco from "monaco-editor";
import TextBadge from "../components/TextBadge";
import { animateIconSx } from "../pages/PageHome";

export default function HomeAnimation() {
  var JSConfuser = useJSConfuser();
  var [loading, setLoading] = useState(false);
  const [isObfuscated, setIsObfuscated] = useState(false);
  var [editor, setEditor] = useState();
  let [animation, setAnimation] = useState(true);
  let [showTryIOut, setShowTryIOut] = useState(false);

  useEffect(() => {
    if (!editor) return;
    let mounted = true;
    let exampleCode = landingPageCode;

    // Initial animation state
    setAnimation(true);
    setShowTryIOut(false);

    let index = Math.max(landingPageCode.length - 101, 0);
    editor.setValue(landingPageCode.substring(0, index));
    editor.setPosition(editor.getModel().getFullModelRange().getEndPosition());

    const typeCharacter = () => {
      if (index <= exampleCode.length) {
        if (!mounted) return;

        const model = editor.getModel();
        if (!model) return;

        const position = editor.getPosition();
        const char = exampleCode.charAt(index);

        if (char === "\n") {
          // If the character is a newline, move to the start of the next line
          editor.setPosition({
            lineNumber: position.lineNumber + 1,
            column: 1,
          });
          model.applyEdits([
            {
              range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
              ),
              text: "\n",
              forceMoveMarkers: true,
            },
          ]);
        } else {
          model.applyEdits([
            {
              range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
              ),
              text: char,
              forceMoveMarkers: true,
            },
          ]);

          // Move cursor to the next column position
          editor.setPosition({
            lineNumber: position.lineNumber,
            column: position.column + 1,
          });
        }

        index++;

        // Randomized typing speed for human-like effect
        var delay = Math.random() * 20 + 30;

        setTimeout(typeCharacter, delay);
      } else {
        // done
        onDone();
      }
    };

    async function onDone() {
      if (!mounted) return;

      const currentPosition = editor.getPosition();

      editor.setValue(exampleCode);
      // Restore the cursor position
      if (currentPosition) {
        editor.setPosition(currentPosition);
      }

      function timeout(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
      await timeout(2500);
      setLoading(true);
      await timeout(2500);

      if (!mounted) return;

      JSConfuser.obfuscate(
        landingPageCode,
        {
          target: "node",
          preset: "high",
        },
        {
          onComplete: async ({ code }) => {
            setLoading(false);

            // Allow user to scroll the editor
            setAnimation(false);

            editor.setValue(code);
            setIsObfuscated(true);

            await timeout(2000);

            // After some time, show another CTA "Try It Out"
            setShowTryIOut(true);
          },
        }
      );
    }

    setTimeout(() => {
      typeCharacter(); // Start typing effect
    }, 50);

    return () => {
      mounted = false;
    };
  }, [editor]);

  return (
    <Box
      border="2px solid"
      borderColor="rgb(26, 31, 38)"
      height="100%"
      maxWidth="850px"
      maxHeight="calc(100vh - 56px)"
      overflow="hidden"
      flex={"1 1 58%"}
      borderRadius={2}
      bgcolor="code_viewer_background"
      boxShadow="0 25px 50px -12px rgb(0 0 0 / 0.25)"
      position="relative"
    >
      <Stack
        height="34px"
        p={1}
        px={2}
        sx={{ bgcolor: "rgb(26, 31, 38)" }}
        textAlign="center"
        display="flex"
        justifyContent="center"
        alignItems="center"
        direction="row"
        spacing={1}
      >
        {isObfuscated ? (
          <>
            <Typography color="text.secondary">App.obfuscated.js </Typography>
            <TextBadge color="success" typography="caption" icon={Lock}>
              PROTECTED{" "}
            </TextBadge>
          </>
        ) : (
          <>
            <Typography color="text.secondary">App.js</Typography>
            <TextBadge color="error" typography="caption" icon={Error}>
              UNPROTECTED{" "}
            </TextBadge>
          </>
        )}
      </Stack>
      <Box position="relative">
        {loading && (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 99,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
            }}
          >
            <Box textAlign="center">
              <CircularProgress />

              <Typography fontWeight="bold" color="primary" sx={{ mt: 2 }}>
                Obfuscating...
              </Typography>
            </Box>
          </Box>
        )}

        <Fade in={showTryIOut} timeout={1000}>
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              width: "100%",
              p: 1,
              backgroundColor: "background.default",
              zIndex: 99,
              textAlign: "center",
            }}
          >
            <Button
              LinkComponent={Link}
              to="/editor"
              endIcon={<KeyboardArrowRight />}
              sx={animateIconSx}
            >
              Try It Out
            </Button>
          </Box>
        </Fade>

        <CodeViewer
          height="initial"
          heightLines={landingPageCode.split("\n").length}
          onMount={(editor) => {
            setEditor(editor);
          }}
          style={{
            pointerEvents: animation ? "none" : "auto",
          }}
          themeBackgroundColor={"code_viewer_background"}
        />
      </Box>
    </Box>
  );
}
