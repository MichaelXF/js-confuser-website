import React, { useContext } from "react";
import { Box, Container, Grid, Typography, Link, Stack } from "@mui/material";
import { AIContext } from "../App";

const Footer = () => {
  const { setAI } = useContext(AIContext);

  const footerLinks = {
    "Quick Links": [
      { name: "Playground", href: "/editor" },
      {
        name: "JS-Confuser AI",
        onClick: () => {
          setAI(true);
        },
      },
      {
        name: "NPM Package",
        href: "https://www.npmjs.com/package/js-confuser",
      },
      { name: "GitHub", href: "https://github.com/MichaelXF/js-confuser" },
    ],
    Documentation: [
      { name: "Getting Started", href: "/docs/" },
      { name: "Installation", href: "/docs/getting-started/installation" },
      { name: "Options", href: "/docs/options" },
      { name: "Presets", href: "/docs/presets" },
    ],
    Resources: [
      {
        name: "Leave Feedback",
        href: "https://github.com/MichaelXF/js-confuser/issues",
      },
      { name: "Old JS-Confuser", href: "https://old--confuser.netlify.app" },
      { name: "AST Explorer", href: "/ast" },
      { name: "FAQ", href: "/docs/getting-started/faq" },
    ],
  };

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "background.paper",
        py: 8,
        color: "text.secondary",
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand Section */}
          <Grid item xs={12} md={4}>
            <Typography variant="h4" className="GradientText" gutterBottom>
              JS-Confuser
            </Typography>
            <Typography variant="body2" color="text.secondary">
              A powerful JavaScript obfuscation tool designed to protect your
              source code.
            </Typography>
          </Grid>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <Grid item xs={6} sm={4} md={2.5} key={category}>
              <Typography
                variant="subtitle1"
                color="text.primary"
                fontWeight="bold"
                gutterBottom
              >
                {category}
              </Typography>
              <Stack spacing={1}>
                {links.map((link) => (
                  <Box
                    key={link.name}
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <Link
                      href={link.href}
                      onClick={
                        link.onClick
                          ? (e) => {
                              e.preventDefault();
                              link.onClick();
                            }
                          : undefined
                      }
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        cursor: "pointer",
                        textDecoration: "none",
                        "&:hover": { color: "primary.main" },
                      }}
                    >
                      {link.name}
                    </Link>
                  </Box>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>

        {/* Bottom Section */}
        <Box
          sx={{
            mt: 8,
            pt: 4,
            borderTop: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Created by{" "}
            <Link
              href="https://github.com/MichaelXF"
              color="primary"
              sx={{ textDecoration: "none" }}
            >
              MichaelXF
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
