import {
  ArrowDropDown,
  Error,
  KeyboardArrowDown,
  KeyboardArrowUp,
  OpenInNew,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Typography,
} from "@mui/material";
import { useState } from "react";

export default function ErrorDialog({ error, open, onClose }) {
  var [viewMore, setViewMore] = useState(false);

  return (
    <Dialog maxWidth="sm" fullWidth open={open} onClose={onClose}>
      <DialogTitle>Error!</DialogTitle>

      <DialogContent>
        <Typography color="text.secondary">
          An error occurred while obfuscating your code:
        </Typography>
        <Typography
          display="block"
          variant="code"
          p={2}
          bgcolor="black"
          borderRadius={"8px"}
          mt={1}
        >
          {viewMore
            ? (error?.errorStack?.toString?.() ?? "")
            : (error?.errorString?.toString?.() ?? "")}
        </Typography>

        <Box
          textAlign="right"
          mt={1}
          display={error?.errorStack ? "block" : "none"}
        >
          <Button
            size="small"
            onClick={() => {
              setViewMore(!viewMore);
            }}
            sx={{
              fontWeight: "normal",
            }}
            endIcon={viewMore ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          >
            {!viewMore ? "View" : "Hide"} More
          </Button>
        </Box>

        <Typography color="text.secondary" mt={2}>
          If you believe this an error within the obfuscator, please{" "}
          <Link
            href="https://github.com/MichaelXF/js-confuser/issues"
            target="_blank"
          >
            create an issue
            <OpenInNew sx={{ transform: "translate(0,3px)", ml: "3px" }} />
          </Link>{" "}
          on the GitHub repository.
          <br />
          <br />
          More details may be available in the DevTools Console.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
