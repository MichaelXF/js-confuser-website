import { Box } from "@mui/material";

export default function TextBadge({ children, color, icon, ...props }) {
  let Icon = icon;
  return (
    <Box
      bgcolor={`custom_${color}_alpha`}
      color={`custom_${color}`}
      px="6px"
      pt="2px"
      borderRadius="4px"
      {...props}
      display="flex"
      alignItems="center"
    >
      {Icon ? <Icon sx={{ fontSize: "0.9rem", mr: "4px" }} /> : null}
      {children}
    </Box>
  );
}
