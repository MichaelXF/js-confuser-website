import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  CssBaseline,
  Divider,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  Check,
  Edit,
  Info,
  KeyboardArrowDown,
  KeyboardArrowRight,
  Lock,
  Warning,
} from "@mui/icons-material";
import { Link } from "react-router-dom";

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
          <Link to="/">
            <Typography variant="body1" fontWeight="bold" color="primary.main">
              JS-Confuser
            </Typography>
          </Link>

          <Divider orientation="vertical" flexItem />

          <Link to="/editor">
            <Button endIcon={<KeyboardArrowRight />} variant="text">
              Try It Out
            </Button>
          </Link>

          <Box flexGrow={1} display="flex" justifyContent="flex-end">
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

            <Link to="/docs">
              <Button variant="text">Docs</Button>
            </Link>
          </Box>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
