import { Box, Button, Collapse, Stack } from "@mui/material";
import {
  ChevronRight,
  Home,
  KeyboardArrowDown,
  Search,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function DocNavigation({
  openSearchDialog,
  navigationItems,
  pathname,
}) {
  var [open, setOpen] = useState({});

  useEffect(() => {
    for (let section of navigationItems) {
      for (let item of section.children) {
        if (item.to && item.to.toLowerCase() === pathname) {
          if (!open[section.label]) {
            setOpen((open) => ({
              ...open,
              [section.label]: true,
            }));
          }
        }
      }
    }
  }, [pathname]);

  /**
   * @type {import("@mui/material").ButtonProps}
   */
  const btnProps = {
    sx: {
      color: "primary.main",
      cursor: "pointer",
      px: 2,
      py: "12px",
      borderRadius: "6px",
      transition: "0.3s ease background-color",
      "&:hover": {
        bgcolor: "primary.alpha",
      },
      fontWeight: "normal",
    },
    display: "flex",
    alignItems: "center",
    fullWidth: true,
  };

  return (
    <Box
      borderRight="1px solid"
      borderColor="divider"
      maxWidth="260px"
      width="100%"
      maxHeight="calc(100vh - 65px)"
      height="100%"
      overflow="auto"
      flexShrink={0}
      p={2}
      sx={{
        scrollbarWidth: "thin",
      }}
    >
      <Box mb={2}>
        <Button {...btnProps} component={Link} to="/docs/">
          <Home sx={{ mr: 1, fontSize: "1.125rem", color: "primary.main" }} />
          Welcome Page
        </Button>

        <Button
          {...btnProps}
          onClick={() => {
            openSearchDialog();
          }}
        >
          <Search sx={{ mr: 1, fontSize: "1.125rem", color: "primary.main" }} />
          Search the docs...
        </Button>
      </Box>

      {navigationItems.map((section, index) => {
        var isOpen = open[section.label];

        return (
          <Box key={index}>
            <Button
              sx={{
                textTransform: "none",
                width: "100%",
                textAlign: "left",
                justifyContent: "flex-start",
              }}
              color="inherit"
              onClick={() => {
                setOpen((open) => ({
                  ...open,
                  [section.label]: !open[section.label],
                }));
              }}
            >
              <Stack direction="row" alignItems="center">
                <ChevronRight
                  fontSize="small"
                  sx={{ mr: "4px", color: "primary.main" }}
                  component={isOpen ? KeyboardArrowDown : ChevronRight}
                />
                {section.label}
              </Stack>
            </Button>

            <Collapse in={isOpen}>
              <Stack direction="column">
                {section.children.map((item, index) => {
                  var isActive = pathname === item.to?.toLowerCase();

                  return (
                    <Button
                      key={index}
                      sx={{
                        textTransform: "none",
                        width: "100%",
                        textAlign: "left",
                        justifyContent: "flex-start",
                        alignItems: "stretch",
                        p: 0,
                        fontWeight: isActive ? "bold" : "normal",
                        color: isActive ? "primary.main" : "inherit",
                      }}
                      color="inherit"
                      component={Link}
                      to={item.to}
                    >
                      <Box
                        borderRight="2px solid"
                        borderColor="divider"
                        width="16px"
                        mr={2}
                      />

                      <Box p={1}>{item.label}</Box>
                    </Button>
                  );
                })}
              </Stack>
            </Collapse>
          </Box>
        );
      })}

      <Box pb={20}></Box>
    </Box>
  );
}
