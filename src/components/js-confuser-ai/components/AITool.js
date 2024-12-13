import { CheckCircleOutline } from "@mui/icons-material";
import { Box, CircularProgress, Typography } from "@mui/material";
export default function AITool({ message, complete }) {
  return (
    <Box display="flex" alignItems="center" mb={2}>
      <Box
        sx={{
          minWidth: "24px",
          mr: "4px",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {complete ? (
          <CheckCircleOutline
            sx={{
              fontSize: "1.25rem",
              color: "text.secondary",
            }}
          />
        ) : (
          <CircularProgress size={16} color="inherit" />
        )}
      </Box>

      <Typography variant="body1" color="text.secondary">
        {message ? message : null}
      </Typography>
    </Box>
  );
}
