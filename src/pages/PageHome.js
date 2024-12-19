import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  AdminPanelSettings,
  Bolt,
  Check,
  Copyright,
  InfoOutlined,
  KeyboardArrowDown,
  KeyboardArrowRight,
  PriceCheck,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { useContext } from "react";
import Nav, { NAV_HEIGHT } from "../components/Nav";
import useSEO from "../hooks/useSEO";
import HomeAnimation from "../components/HomeAnimation";
import { RiSparkling2Line } from "react-icons/ri";
import { AIContext } from "../App";
import HomeImageCarousel from "../components/HomeImageCarousel";
import Footer from "../components/Footer";

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

// Animate the arrow icons on hover
export const animateIconSx = {
  px: "20px",
  "& .MuiButton-icon": {
    pl: "10px",
    transform: "translateX(0px)",
    transition: "transform 0.2s",
  },
  "&:hover": {
    "& .MuiButton-icon": {
      transform: "translateX(4px)",
    },
  },
};

export default function PageHome() {
  useSEO(
    "JS-Confuser",
    "JS-Confuser is a powerful JavaScript obfuscation tool that makes your programs impossible to understand, copy, re-use or modify without authorization."
  );

  const isMdOrLarger = useMediaQuery((theme) => theme.breakpoints.up("md"));

  const ctaButton = (
    <Link to="/editor">
      <Button
        variant="contained"
        size="large"
        endIcon={<KeyboardArrowRight />}
        sx={animateIconSx}
      >
        Get Started
      </Button>
    </Link>
  );

  const aiValue = useContext(AIContext);

  return (
    <Box sx={isMdOrLarger ? {} : { wordBreak: "break-word" }}>
      <Box mb={isMdOrLarger ? NAV_HEIGHT : "0"}>
        <Nav position={isMdOrLarger ? "fixed" : "static"} />
      </Box>

      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight={`calc(100vh - ${NAV_HEIGHT})`}
        width="100%"
        className={isMdOrLarger ? "LandingBackground" : ""}
        position="relative"
      >
        <Container
          maxWidth="lg"
          sx={{ pt: isMdOrLarger ? 8 : 0, pb: isMdOrLarger ? 12 : 0 }}
        >
          <Stack direction="row" spacing={10} alignItems="center" width="100%">
            <Box textAlign="left" flex="1 1 42%" pt={4}>
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
                mt={2}
                mb={8}
                color="text.secondary"
              >
                JS-Confuser is a powerful JavaScript obfuscation tool that makes
                your programs impossible to understand, copy, re-use or modify
                without authorization.
                <Typography
                  component="span"
                  sx={{
                    fontSize: "0.8rem",
                    transform: "translate(0,-4px)",
                    display: "inline-block",
                  }}
                >
                  *
                </Typography>{" "}
              </Typography>

              <Stack direction={isMdOrLarger ? "row" : "column"} spacing={2}>
                {ctaButton}

                <Link to="/docs">
                  <Button
                    size="large"
                    color="inherit"
                    endIcon={<KeyboardArrowRight />}
                    sx={{
                      color: "text.secondary_darker",

                      ...animateIconSx,
                    }}
                  >
                    Read the docs
                  </Button>
                </Link>
              </Stack>

              <Box mt={4}>
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
                      <Typography color="text.secondary">{item}</Typography>
                    </Stack>
                  );
                })}

                <Box mt={1}>
                  <Typography variant="caption" color="text.secondary">
                    *May not be entirely impossible, but it will be very
                    difficult.
                  </Typography>
                </Box>
              </Box>
            </Box>

            {isMdOrLarger ? <HomeAnimation /> : null}
          </Stack>
        </Container>

        {isMdOrLarger ? (
          <Box
            textAlign="center"
            fontSize="1.75rem"
            position="absolute"
            bottom="16px"
            left="50%"
            sx={{
              transform: "translate(-50%, 0)",
            }}
          >
            <KeyboardArrowDown />
          </Box>
        ) : null}
      </Box>

      <Box
        borderTop="1px solid"
        borderColor="divider"
        minHeight="300px"
        display="flex"
        justifyContent="center"
        alignItems="center"
        position="relative"
        overflow="hidden"
        bgcolor="rgba(29,34,38,0.1)"
        textAlign="center"
        py={9}
      >
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight="bold" color="white">
            Powered by{" "}
            <Typography
              className="GradientText"
              variant="inherit"
              component={isMdOrLarger ? "span" : "h3"}
            >
              Artificial Intelligence
            </Typography>
          </Typography>

          <Typography
            fontSize="1.125rem"
            color="text.secondary"
            fontWeight="normal"
            mt={1}
            mb={6}
          >
            JS-Confuser AI is a powerful AI chat assistant to answer complex
            questions about JS-Confuser.
          </Typography>

          <Box mb={2}>
            <Button
              variant="contained"
              size="large"
              startIcon={<RiSparkling2Line />}
              onClick={() => {
                aiValue.setAI(true);
              }}
            >
              Try JS-Confuser AI
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary">
            <InfoOutlined
              sx={{ fontSize: "0.9rem", mb: "-2.75px", mr: "2.5px" }}
            />
            This feature is currently experimental and may not function as
            expected.
          </Typography>
        </Container>
      </Box>

      <Box
        minHeight="100vh"
        borderTop="1px solid"
        borderColor="divider"
        display="flex"
        alignItems="center"
        justifyContent="center"
        className={isMdOrLarger ? "LandingGradientBottom" : ""}
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
        className={isMdOrLarger ? "LandingGradient" : ""}
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
              <HomeImageCarousel />
            </Box>

            <Stack
              spacing={4}
              direction={isMdOrLarger ? "row" : "column"}
              width="100%"
            >
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
        className={
          isMdOrLarger ? "LandingBackground LandingBackgroundCenter" : ""
        }
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

      <Footer />
    </Box>
  );
}
