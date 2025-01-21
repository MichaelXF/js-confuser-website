import {
  AppBar,
  Box,
  Button,
  Divider,
  Icon,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { KeyboardArrowRight } from "@mui/icons-material";
import { Link as ReactLink } from "react-router-dom";
import { RiSparkling2Line } from "react-icons/ri";
import { useContext } from "react";
import { AIContext } from "../App";
import { animateIconSx } from "../pages/PageHome";

export const NAV_HEIGHT = "65px";
export const NAV_FLOAT_HEIGHT = "81px";

export default function Nav({ position = "static" }) {
  const aiValue = useContext(AIContext);

  const isMdOrLarger = useMediaQuery((theme) => theme.breakpoints.up("md"));

  return (
    <>
      <AppBar
        position={position}
        sx={{
          color: "text.primary",
          px: 0,

          ...(position === "fixed"
            ? {
                position: "fixed",
                left: "50%",
                transform: "translate(-50%,0)",
                maxWidth: "calc(min(1200px, 100vw - 32px))",
                width: "100%",
                mx: "auto",
                px: 2,
                borderRadius: "8px",
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 25px 50px 0px rgb(0 0 0 / 0.25)",
                top: "16px",

                bgcolor: "rgba(15, 18, 20, 0.8)",
                backdropFilter: "blur(10px)",
              }
            : {}),
        }}
      >
        <Toolbar>
          <Stack
            spacing={isMdOrLarger ? 4 : 2}
            direction="row"
            alignItems="center"
            width="100%"
            flexGrow={1}
          >
            <ReactLink to="/">
              <Typography
                variant="body1"
                fontWeight="bold"
                color="primary.main"
              >
                JS-Confuser
              </Typography>
            </ReactLink>

            {isMdOrLarger ? <Divider orientation="vertical" flexItem /> : null}

            <Button
              endIcon={<KeyboardArrowRight />}
              variant="text"
              to="/editor"
              component={ReactLink}
              sx={{
                ...animateIconSx,
                display: {
                  xs: "none",
                  sm: "flex",
                },
              }}
            >
              Try It Out
            </Button>

            <Box justifyContent="flex-end" display="flex" flexGrow={1}>
              <Button
                variant="text"
                href="https://www.npmjs.com/package/js-confuser"
              >
                NPM
              </Button>

              <Button
                variant="text"
                href="https://github.com/MichaelXF/JS-Confuser"
              >
                GitHub
              </Button>

              <ReactLink to="/docs">
                <Button variant="text">Docs</Button>
              </ReactLink>

              {isMdOrLarger ? (
                <Button
                  variant="text"
                  startIcon={<Icon component={RiSparkling2Line} />}
                  sx={{
                    // Idk why -4px margin left is being added
                    "& .MuiButton-startIcon": {
                      ml: "0px",
                    },
                  }}
                  onClick={() => {
                    aiValue.setAI(true);
                  }}
                >
                  JS-Confuser AI
                </Button>
              ) : null}
            </Box>
          </Stack>
        </Toolbar>
      </AppBar>
    </>
  );
}
