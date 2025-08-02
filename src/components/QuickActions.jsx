import { KeyboardArrowRight } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { animateIconSx } from "../pages/PageHome";

export default function QuickActions() {
  return (
    <Stack
      direction={{
        xs: "column",
        sm: "row",
      }}
      flexWrap="wrap"
      spacing={0}
    >
      {[
        {
          title: "What Is Obfuscation?",
          description: "Learn more about what obfuscation is",
          to: "/docs/getting-started/what-is-obfuscation",
        },
        {
          title: "Playground",
          description: "Try out JS-Confuser in your browser",
          to: "/editor",
        },
        {
          title: "Installation",
          description: "Learn how to install JS-Confuser from NPM",
          to: "/docs/getting-started/installation",
        },

        {
          title: "FAQ",
          description: "Frequently asked questions",
          to: "/docs/getting-started/faq",
        },
      ].map((item) => {
        return (
          <Button
            key={item.to}
            sx={{
              ...animateIconSx,
              p: 4,
              mr: "16px",
              mb: "16px",
              width: {
                xs: "100%",
                sm: "calc(50% - 16px)",
              },
              fontWeight: "normal",
              textTransform: "none",
              alignItems: "center",
              justifyContent: "flex-start",
              textAlign: "left",
              bgcolor: "rgba(45, 67, 90, 0.1)",
              border: "1px solid",
              borderColor: "primary.main",
              borderRadius: "6px",
            }}
            color="primary"
            component={Link}
            to={item.to}
            endIcon={<KeyboardArrowRight sx={{ color: "primary.main" }} />}
          >
            <Box flexGrow={1} color="white" zIndex={2}>
              <Typography variant="h6" fontWeight="bold" mb={1}>
                {item.title}
              </Typography>
              <Typography color="text.secondary" mb={2}>
                {item.description}
              </Typography>
            </Box>
          </Button>
        );
      })}
    </Stack>
  );
}
