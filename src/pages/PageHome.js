import {
  Box,
  Button,
  CircularProgress,
  Container,
  Fade,
  Stack,
  Typography,
} from "@mui/material";
import {
  AdminPanelSettings,
  Bolt,
  Check,
  Copyright,
  KeyboardArrowRight,
  PriceCheck,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { CodeViewer } from "../components/codeViewer/CodeViewer";
import { landingPageCode } from "../constants";
import useJSConfuser from "../hooks/useJSConfuser";
import Nav from "../components/Nav";
import QuickActions from "../components/QuickActions";
import * as monaco from "monaco-editor";
import useSEO from "../hooks/useSEO";
import websiteImage1 from "../static/websiteImage1.png";
import websiteImage2 from "../static/websiteImage2.png";
import websiteImage3 from "../static/websiteImage3.png";
import websiteImage4 from "../static/websiteImage4.png";
import websiteImageDocs from "../static/websiteImageDocs.png";

const imageContainerProps = {
  boxShadow:
    "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  border: "2px solid",
  borderColor: "divider_opaque",
  borderRadius: "8px",
  overflow: "hidden",
};

function WebsiteAnimation() {
  const images = [websiteImage1, websiteImage2, websiteImage3, websiteImage4];
  const [index, setIndex] = useState(0);
  const [lastIndex, setLastIndex] = useState(0);

  /**
   * @type {React.MutableRefObject<HTMLImageElement>}
   */
  const lastImageElementRef = useRef();

  // Preload images
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  function changeImage(newIndex) {
    const newLastIndex = index;
    setLastIndex(newLastIndex);
    setIndex(newIndex);

    if (lastImageElementRef.current) {
      lastImageElementRef.current.src = images[newLastIndex];
      lastImageElementRef.current.style.transition = "none";
      lastImageElementRef.current.style.opacity = "1";

      setTimeout(() => {
        lastImageElementRef.current.style.transition = "opacity 0.3s";
        lastImageElementRef.current.style.opacity = 0;
      }, 50);
    }
  }

  function nextImage() {
    changeImage((index + 1) % images.length);
  }

  return (
    <Box>
      <Box
        {...imageContainerProps}
        position="relative"
        onClick={() => {
          nextImage();
        }}
        sx={{
          cursor: "pointer",
        }}
      >
        <Box
          ref={lastImageElementRef}
          component="img"
          src={images[lastIndex]}
          width="100%"
          sx={{
            aspectRatio: "2880/1624",
            verticalAlign: "middle",
            position: "absolute",
            zIndex: 2,
          }}
        />
        <Box
          component="img"
          src={images[index]}
          width="100%"
          sx={{
            aspectRatio: "2880/1624",
            verticalAlign: "middle",
          }}
        />
      </Box>

      <Box mt={3}>
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={2}
        >
          {images.map((_image, i) => {
            const hoverBg = "rgba(109, 127, 145, 0.9)";
            return (
              <Box
                onClick={() => changeImage(i)}
                key={i}
                alt={`${i + 1}`}
                sx={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  padding: 0,
                  margin: 0,
                  border: "none",
                  cursor: "pointer",

                  transition: "background-color 0.25s",
                  backgroundColor:
                    i === index ? hoverBg : "rgba(61, 71, 81, 0.5)",
                  "&:hover": {
                    backgroundColor:
                      i === index ? hoverBg : "rgba(61, 71, 81, 0.8)",
                  },
                }}
                component="button"
              />
            );
          })}
        </Stack>
      </Box>

      <Typography
        textAlign="center"
        color="text.secondary"
        typography="body2"
        mt={2}
      >
        Animation of JS-Confuser.com Playground in Action
      </Typography>
    </Box>
  );
}

function FeatureRow({ item }) {
  const [Icon, title, description] = item;

  return (
    <Box flex="1 1 50%" py={3} pr={6}>
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
              fontSize: "1.25rem",
            }}
          >
            <Icon
              sx={{
                color: "primary.main",
                fontSize: "1.5rem",
              }}
            />
          </Box>
          <Typography fontSize="1.125rem" color="white" fontWeight="bold">
            {title}
          </Typography>
        </Stack>
      </Box>

      <Typography color="text.secondary" mt={2} fontSize="1.125rem">
        {description}
      </Typography>
    </Box>
  );
}

function FeatureRows({ items }) {
  return (
    <Stack
      spacing={6}
      mb={2}
      alignItems="stretch"
      direction={{
        xs: "column", // Collapse into multiple lines on extra-small screens (phones)
        sm: "row", // Show in a row on small screens and up
      }}
    >
      {items.map((item, i) => {
        return <FeatureRow key={i} item={item} />;
      })}
    </Stack>
  );
}

export default function PageHome() {
  useSEO(
    "JS-Confuser",
    "This tool transforms your original JavaScript source code into a new representation that's harder to understand, copy, re-use and modify without authorization."
  );

  var JSConfuser = useJSConfuser();
  var [loading, setLoading] = useState(false);
  var [fileName, setFileName] = useState("App.js");
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

      editor.setValue(exampleCode);
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

            setFileName("App.obfuscated.js");

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

  const ctaButton = (
    <Link to="/editor">
      <Button variant="contained" size="large" endIcon={<KeyboardArrowRight />}>
        Get Started
      </Button>
    </Link>
  );

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
        position="relative"
      >
        <Container maxWidth="lg">
          <Stack direction="row" spacing={10} alignItems="center" width="100%">
            <Box textAlign="left" flex="1 1 42%" pt={6}>
              <Typography
                variant="h1"
                className="GradientText"
                fontWeight="bold"
              >
                Protect your app
              </Typography>
              <Typography variant="h1" fontWeight="bold">
                with next-level
              </Typography>
              <Typography variant="h1" fontWeight="bold">
                obfuscation
              </Typography>

              <Typography
                fontSize="1.125rem"
                mt={4}
                mb={4}
                color="text.secondary"
              >
                JS-Confuser is a powerful JavaScript obfuscation tool that makes
                your programs impossible to understand, copy, re-use or modify
                without authorization.
              </Typography>

              {ctaButton}

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
              maxWidth="800px"
              maxHeight="calc(100vh - 56px)"
              overflow="hidden"
              flex={"1 1 58%"}
              borderRadius={2}
              display={{
                xs: "none", // Hide on extra-small screens (phones)
                sm: "block", // Show on small screens and up
              }}
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
          <Typography variant="h3" className="GradientText" fontWeight="bold">
            What Is This?
          </Typography>

          <Typography mt={4} mb={10} fontSize="1.125rem" color="text.secondary">
            JavaScript Obfuscation helps protect your code from being stolen and
            being reverse engineered. This tool transforms your original
            JavaScript source code into a new representation that's harder to
            understand, copy, re-use and modify without authorization. The
            obfuscated result will have the exact functionality of the original
            code.
          </Typography>

          <Typography
            variant="h3"
            className="GradientText"
            fontWeight="bold"
            mb={2}
          >
            Why JS-Confuser?
          </Typography>

          {[
            [
              [
                Bolt,
                "Highly Effective",
                "JS-Confuser uses state-of-the-art obfuscation techniques to protect your code.",
              ],
              [
                Copyright,
                "Defend your Intellectual Property",
                "Stop malicious actors from stealing your source code or your intellectual property.",
              ],
            ],
            [
              [
                PriceCheck,
                "Enforce Licensing and Paywalls",
                "Prevent reverse engineers from gaining unauthorized access to your app.",
              ],
              [
                AdminPanelSettings,
                "Detect and Prevent Tampering",
                "JS-Confuser can detect and prevent real-time tampering with your code.",
              ],
            ],
          ].map((items, i) => {
            return <FeatureRows key={i} items={items} />;
          })}
        </Container>
      </Box>

      <Box
        minHeight="100vh"
        height="100%"
        borderTop="1px solid"
        borderColor="divider"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Container maxWidth="lg" sx={{ py: 10 }}>
          <Typography
            variant="h3"
            className="GradientText"
            fontWeight="bold"
            mb={6}
          >
            Obfuscation Done Right
          </Typography>

          <Stack spacing={8}>
            <Box>
              <WebsiteAnimation />
            </Box>

            <Stack spacing={4} direction="row" width="100%">
              {[
                {
                  header: "Highly Configurable",
                  description:
                    "Choose from Low, Medium, or High presets levels, or create custom configurations for tailored obfuscation.",
                },
                {
                  header: "Fast & Privacy-Focused",
                  description:
                    "Runs entirely in your browser, ensuring lightning-fast performance and complete code privacy.",
                },
                {
                  header: "Advanced Tooling",
                  description:
                    "Evaluate and debug obfuscated code, customize the options using a JavaScript file, use the built-in Prettier, and more.",
                },
              ].map((entry, i) => {
                return (
                  <Box key={i} flex="1">
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color="primary.main"
                    >
                      {entry.header}
                    </Typography>
                    <Typography mt={2}>{entry.description}</Typography>
                  </Box>
                );
              })}
            </Stack>

            <Box textAlign="center">{ctaButton}</Box>
          </Stack>
        </Container>
      </Box>

      <Box
        minHeight="100vh"
        height="100%"
        borderTop="1px solid"
        borderColor="divider"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Container maxWidth="lg" sx={{ py: 10, textAlign: "center" }}>
          <Typography
            variant="h3"
            className="GradientText"
            fontWeight="bold"
            mb={6}
          >
            Ready to Protect Your Code?
          </Typography>

          <Typography mb={6} fontSize="1.125rem" lineHeight="2">
            <strong>Start Using JS-Confuser Today</strong>
            <br />
            <br />
            Secure your JavaScript with the most advanced and comprehensive
            obfuscation tool available. <br />
            Protect sensitive business logic, your intellectual property, or
            personal projects with ease using JS-Confuser. <br />
            Experience powerful obfuscation, seamless configuration, and
            complete documentation—all for free.
          </Typography>

          <Box>{ctaButton}</Box>
        </Container>
      </Box>

      <Box
        minHeight="100vh"
        height="100%"
        borderTop="1px solid"
        borderColor="divider"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Container maxWidth="lg" sx={{ py: 10 }}>
          <Typography
            variant="h3"
            className="GradientText"
            fontWeight="bold"
            mb={6}
          >
            More Options
          </Typography>

          <QuickActions />
        </Container>
      </Box>
    </Box>
  );
}
