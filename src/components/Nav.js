import {
  AppBar,
  Box,
  Button,
  Divider,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { KeyboardArrowRight } from "@mui/icons-material";
import { Link as ReactLink } from "react-router-dom";

export default function Nav() {
  return (
    <AppBar
      position="static"
      sx={{
        color: "text.primary",
        px: 0,
      }}
    >
      <Toolbar>
        <Stack
          spacing={4}
          direction="row"
          alignItems="center"
          width="100%"
          flexGrow={1}
        >
          <ReactLink to="/">
            <Typography variant="body1" fontWeight="bold" color="primary.main">
              JS-Confuser
            </Typography>
          </ReactLink>

          <Divider orientation="vertical" flexItem />

          <Button
            endIcon={<KeyboardArrowRight />}
            variant="text"
            to="/editor"
            component={ReactLink}
            sx={{
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
          </Box>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
