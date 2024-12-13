import { Box, IconButton, Stack } from "@mui/material";
import Chat from "./Chat";
import {
  BrandingWatermarkOutlined,
  CloseOutlined,
  OpenInNew,
} from "@mui/icons-material";
import { useEffect, useState } from "react";

export default function ChatPopover({ immediateMessage, onClose }) {
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
        px: 10,
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

  useEffect(() => {
    if (fullScreen) {
      document.body.style.overflow = "hidden";
    }

    const cb = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", cb);

    return () => {
      window.removeEventListener("keydown", cb);
      document.body.style.overflow = "auto";
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
      zIndex="999"
      px={4}
      bgcolor={"rgba(15, 18, 20, 0.95)"}
      sx={{
        backdropFilter: "blur(8px)",
      }}
      {...fullScreenStyles}
    >
      <Box {...fullScreenContainerStyles}>
        <Box position="absolute" top="16px" right="16px">
          <Stack direction="row" spacing={1}>
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
            <IconButton onClick={onClose} {...iconButtonProps}>
              <CloseOutlined />
            </IconButton>
          </Stack>
        </Box>

        <Chat
          immediateMessage={immediateMessage}
          maxHeight={fullScreen ? "100vh" : "500px"}
        />
      </Box>
    </Box>
  );
}
