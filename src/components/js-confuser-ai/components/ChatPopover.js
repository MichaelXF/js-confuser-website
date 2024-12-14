import { Box, IconButton, Stack, useMediaQuery } from "@mui/material";
import Chat from "./Chat";
import {
  BrandingWatermarkOutlined,
  CloseOutlined,
  OpenInNew,
} from "@mui/icons-material";
import { useEffect, useState } from "react";

export default function ChatPopover({ immediateMessage, onClose }) {
  const isMdOrLarger = useMediaQuery((theme) => theme.breakpoints.up("md"));

  const [fullScreen, setFullScreen] = useState(true);

  const fullScreenStyles = fullScreen
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,

        width: "100%",
        height: "100%",
        maxHeight: "100vh",
        maxWidth: "100vw",
        borderRadius: 0,
        boxShadow: "none",
        border: "none",

        p: 0,
      }
    : {};

  const fullScreenContainerStyles = fullScreen
    ? {
        maxWidth: "1000px",
        mx: "auto",
        px: isMdOrLarger ? 10 : 0,
      }
    : {
        pt: "42px",
      };

  const iconButtonProps = fullScreen
    ? {
        sx: { color: "text.secondary" },
      }
    : {
        sx: { color: "text.secondary" },
        size: "small",
      };

  // Remove scrollbars when fullscreen chat is open
  useEffect(() => {
    if (fullScreen) {
      document.documentElement.style.overflow = "hidden";
    }

    const cb = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", cb);

    return () => {
      window.removeEventListener("keydown", cb);
      document.documentElement.style.overflow = "auto";
    };
  }, [fullScreen]);

  return (
    <Box
      border="2px solid"
      borderColor="divider"
      borderRadius="8px"
      boxShadow={"0 5px 35px 0px rgb(0 0 0 / 0.7)"}
      position="fixed"
      bottom="32px"
      right="32px"
      maxWidth="550px"
      width="100%"
      p={2}
      height="542px"
      px={isMdOrLarger ? 4 : 2}
      bgcolor={"rgba(15, 18, 20, 0.95)"}
      sx={{
        backdropFilter: "blur(8px)",
        zIndex: 1200,
      }}
      {...fullScreenStyles}
    >
      <Box {...fullScreenContainerStyles}>
        <Box position="absolute" top="16px" right="16px">
          <Stack direction="row" spacing={1}>
            {isMdOrLarger ? (
              <IconButton
                onClick={() => {
                  setFullScreen(!fullScreen);
                }}
                {...iconButtonProps}
              >
                {fullScreen ? (
                  <BrandingWatermarkOutlined
                    sx={{ transform: "scaleX(0.9) scale(0.94)" }}
                  />
                ) : (
                  <OpenInNew />
                )}
              </IconButton>
            ) : null}
            <IconButton onClick={onClose} {...iconButtonProps}>
              <CloseOutlined />
            </IconButton>
          </Stack>
        </Box>

        <Chat
          immediateMessage={immediateMessage}
          maxHeight={fullScreen ? "100vh" : "500px"}
          fullScreen={fullScreen}
        />
      </Box>
    </Box>
  );
}
