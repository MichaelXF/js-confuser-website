import {
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { Check, KeyboardArrowRight, Lock } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { CodeViewer } from "../components/CodeViewer";
import { landingPageCode } from "../constants";
import useJSConfuser from "../hooks/useJSConfuser";
import Nav from "../components/Nav";
import QuickActions from "../components/QuickActions";
import * as monaco from "monaco-editor";

function FeatureRow({ item }) {
  return (
    <Box flex="1 1 50%" py={3} pr={10}>
      <Box fontWeight="bold">
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              bgcolor: "primary.alpha",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: "50%",
              fontSize: "1.125rem",
            }}
          >
            <Lock
              sx={{
                color: "primary.main",
              }}
            />
          </Box>
          <Typography variant="h6" fontWeight="bold">
            {item[0]}
          </Typography>
        </Stack>
      </Box>

      <Typography color="text.secondary" mt={2}>
        {item[1]}
      </Typography>
    </Box>
  );
}

function FeatureRows({ items }) {
  return (
    <Stack direction="row" spacing={6} mb={2} px={4} alignItems="stretch">
      {items.map((item, i) => {
        return <FeatureRow key={i} item={item} />;
      })}
    </Stack>
  );
}

export default function PageHome() {
  var JSConfuser = useJSConfuser();
  var [loading, setLoading] = useState(false);
  var [fileName, setFileName] = useState("App.js");
  var [editor, setEditor] = useState();

  useEffect(() => {
    if (!editor) return;
    let index = 0;
    var exampleCode = landingPageCode;

    const typeCharacter = () => {
      if (index <= exampleCode.length) {
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
        setTimeout(typeCharacter, Math.random() * 5 + 20); // Randomized typing speed for human-like effect
      } else {
        // done
        onDone();
      }
    };

    async function onDone() {
      editor.setValue(exampleCode);
      function timeout(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
      await timeout(3000);
      setLoading(true);
      await timeout(2000);

      JSConfuser.obfuscate(
        landingPageCode,
        {
          target: "node",
          preset: "high",
        },
        {
          onComplete: async ({ obfuscated }) => {
            setLoading(false);

            editor.setValue(obfuscated);

            setFileName("App.obfuscated.js");

            await timeout(2000);
          },
        }
      );
    }

    typeCharacter(); // Start typing effect
  }, [editor]);

  return (
    <Box>
      <Nav />

      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="calc(100vh - 65px)"
        width="100%"
        className="LandingBackground"
      >
        <Container maxWidth="lg">
          <Stack direction="row" spacing={10} alignItems="center" width="100%">
            <Box textAlign="left" flex="1 1 42%" pt={6}>
              <Typography
                variant="h3"
                className="GradientText"
                fontWeight="bold"
              >
                Protect your app
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                with next-level
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                obfuscation
              </Typography>

              <Typography variant="body1" mt={4} mb={4} color="text.secondary">
                JS-Confuser is a powerful JavaScript obfuscation tool that makes
                your programs impossible to understand, copy, re-use or modify
                without authorization.
              </Typography>

              <Link to="/editor">
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<KeyboardArrowRight />}
                >
                  Get Started
                </Button>
              </Link>

              <Box mt={6}>
                {["Free", "Open Source"].map((item, i) => {
                  return (
                    <Stack direction="row" alignItems="center" key={i}>
                      <Check
                        sx={{
                          mr: 1,
                          fontSize: "1rem",
                          transform: "translate(0,2px)",
                          color: "primary.main",
                        }}
                      />
                      <Typography>{item}</Typography>
                    </Stack>
                  );
                })}
              </Box>
            </Box>

            <Box
              border="1px solid"
              borderColor="divider"
              height="100%"
              maxHeight="calc(100vh - 56px)"
              overflow="hidden"
              flex={"1 1 58%"}
              borderRadius={2}
            >
              <Box
                height="32px"
                p={1}
                px={2}
                sx={{ bgcolor: "divider_opaque" }}
                textAlign="center"
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <Typography color="text.secondary">{fileName}</Typography>
              </Box>
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

                      <Typography
                        fontWeight="bold"
                        color="primary"
                        sx={{ mt: 2 }}
                      >
                        Obfuscating...
                      </Typography>
                    </Box>
                  </Box>
                )}

                <CodeViewer
                  height="440px"
                  onMount={(editor) => {
                    setEditor(editor);
                  }}
                />
              </Box>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Box
        minHeight="100vh"
        borderTop="1px solid"
        borderColor="divider"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Container maxWidth="lg" sx={{ py: 10 }}>
          <Typography variant="h4" className="GradientText" fontWeight="bold">
            What is this?
          </Typography>

          <Typography mt={2} mb={8}>
            JavaScript Obfuscation helps protect your code from being stolen and
            being reverse engineered. This tool transforms your original
            JavaScript source code into a new representation that's harder to
            understand, copy, re-use and modify without authorization. The
            obfuscated result will have the exact functionality of the original
            code.
          </Typography>

          <Typography
            variant="h4"
            className="GradientText"
            fontWeight="bold"
            mb={4}
          >
            Why JS-Confuser?
          </Typography>

          {[
            [
              [
                "Highly effective",
                "JS-Confuser uses state-of-the-art obfuscation techniques to protect your code.",
              ],
              [
                "Defend your intellectual property",
                "Defeat malicious actors from stealing your source code.",
              ],
            ],
            [
              [
                "Enforce licensing and paywalls",
                "Prevent reverse engineers from gaining unauthorized access to your app.",
              ],
              [
                "Detect and prevent tampering",
                "JS-Confuser can detect and prevent realtime tampering with your code.",
              ],
            ],
          ].map((items, i) => {
            return <FeatureRows key={i} items={items} />;
          })}
        </Container>
      </Box>

      <Box minHeight="100vh" borderTop="1px solid" borderColor="divider">
        <Container maxWidth="lg" sx={{ py: 10 }}>
          <Typography
            variant="h4"
            className="GradientText"
            fontWeight="bold"
            mb={6}
          >
            Get Started
          </Typography>

          <QuickActions />
        </Container>
      </Box>
    </Box>
  );
}
