import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  typography: {
    fontFamily: `"IBM Plex Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif`, // Set the default font family to Fire Sans
    code: {
      fontFamily: "Fira Code, monospace", // Set the custom font family for the code variant
      fontSize: "0.875rem", // Set the font size for the code variant
    },
    h1: {
      fontSize: "3rem", // Example size of h2 = 48px
      fontWeight: "bold", // Bold font
    },
    h2: {
      fontSize: "2.5rem", // Example size of h3
      fontWeight: "bold", // Bold font
    },
    h3: {
      fontSize: "2.25rem", // Example size of h4
      fontWeight: "bold", // Bold font
    },
    h4: {
      fontSize: "1.75rem", // Example size of h5
      fontWeight: "bold", // Bold font
    },
    h5: {
      fontSize: "1.5rem", // Example size of h6 = 24px
      fontWeight: "bold", // Bold font
    },
    h6: {
      fontSize: "1.25rem", // Slightly smaller than default h6 = 18px
      fontWeight: "bold", // Bold font
    },
  },
  palette: {
    mode: "dark",
    primary: {
      main: "hsl(210, 100%, 60%)",
      alpha: "hsla(210, 100%, 60%, 0.1)",
      main_darker: "hsl(210, 100%, 50%)",
    },
    text: {
      secondary: "rgb(182, 190, 201)",
      secondary_darker: "rgb(152, 164, 179)",
    },
    background: {
      default: "rgb(15, 18, 20)",
      paper: "rgb(15, 18, 20)",
    },
    divider: "rgba(61, 71, 81, 0.3)",
    divider_opaque: "rgb(29 34 38)",

    custom_error: "rgb(244, 67, 54)",
    custom_error_alpha: "rgba(244, 67, 54, 0.1)",
    custom_success: "rgb(61, 212, 74)",
    custom_success_alpha: "rgba(61, 212, 74, 0.1)",

    code_viewer_background: "#0c0e12",
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          // Apply dark color scheme for scrollbars and other UI elements
          colorScheme: "dark",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: "0.875rem", // Set your desired font size here
          backgroundColor: "#4c4d4f", // Darker background color
        },
      },
    },
    MuiToolbar: {
      variants: [
        {
          props: { variant: "mini" },
          style: {
            minHeight: "40px", // Set the height of the toolbar to 40px
            maxHeight: "40px",
            padding: "0",
            "@media (min-width:600px)": {
              minHeight: "40px", // Ensure it's 40px on larger screens too
              maxHeight: "40px",
              padding: "0",
            },
          },
        },
      ],
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          color: "#ffffff", // White text
          fontWeight: "bold", // Bold font
          backgroundColor: "hsl(210, 100%, 45%)", // Initial darker blue color
          "&:hover": {
            backgroundColor: "hsl(210, 100%, 55%)", // Brighter blue on hover
          },
          "&:focus": {
            backgroundColor: "hsl(210, 100%, 55%)", // Brighter blue on focus
          },
        },
      },
      variants: [
        {
          props: { variant: "icon" },
          style: {
            width: "34px",
            height: "34px",
            p: 0,
            minWidth: 0,
          },
        },
      ],
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none", // Remove the default background image
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          fontSize: "inherit",
          fontFamily: "inherit",
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          fontSize: "1.25rem", // Specific size for SvgIcon inside Checkbox
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "none", // Remove the default box-shadow
          borderBottom: "1px solid rgba(61, 71, 81, 0.3)", // Add the custom border
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(0, 0, 0, 0.8)", // Make the backdrop darker
        },
        invisible: {
          backgroundColor: "transparent", // Make the invisible backdrop darker
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          ...theme.typography.body2, // Apply the body2 typography variant
          color: theme.palette.text.secondary, // Apply the text.secondary color
          height: "38px",
        }),
      },
    },
  },
});
