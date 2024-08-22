import { Box, CircularProgress, Typography } from "@mui/material";
import { useLocation, useParams } from "react-router-dom";
import Markdown from "../components/Markdown";
import { getDocs, loadDocContent } from "../utils/doc-utils";
import { useEffect, useState } from "react";
import useSnackbar from "../hooks/useSnackbar";
import useSEO from "../hooks/useSEO";

export default function PageDocGeneric({ onMetadataUpdate }) {
  var { setSEO } = useSEO("JS-Confuser Docs", "Documentation for JS-Confuser");
  var { group, subpath } = useParams();
  var { hash } = useLocation();
  var pathname = (group + "/" + subpath).toLowerCase();

  var { docsByPath } = getDocs();

  console.log(docsByPath);

  var doc = docsByPath[pathname];

  var [value, setValue] = useState("Loading...");
  var [loading, setLoading] = useState();
  var [error, setError] = useState();
  var snackbar = useSnackbar();

  useEffect(() => {
    if (doc) {
      async function loadWebFile() {
        try {
          await loadDocContent(doc);

          setValue(doc.content);
        } catch (e) {
          setError(true);
          snackbar.showError(e);
        } finally {
          setLoading(false);
        }
      }

      if (typeof doc.content === "string") {
        // Delay purely for UX
        setValue(doc.content);
        setLoading(false);
      } else {
        if (typeof doc.contentPath === "string") {
          loadWebFile();
          setLoading(true);
        } else {
          setError(true);
          snackbar.showError("The content could not be loaded.");
        }
      }
    }
  }, [pathname]);

  // This scrolls to the Heading element on page load
  // The content is sometimes loaded from a static URL (must be waited for)
  // The hash changes are not accounted as most browsers implement our scrolling to logic for us
  useEffect(() => {
    if (value && hash) {
      var element = document.getElementById(hash.substring(1));
      console.log(hash, element);
      if (element) {
        element.scrollIntoView();
      }
    }

    if (doc && value) {
      setSEO(doc.title + " | " + doc.group, doc.description);
    }
  }, [value, pathname]);

  return (
    <Box pb={10}>
      {!doc ? (
        <Box>
          <Typography variant="h4" gutterBottom>
            Page not found!
          </Typography>

          <Typography color="text.secondary">
            The page you are looking for does not exist. Please check the URL
            and try again.
          </Typography>
        </Box>
      ) : error ? (
        <Box>
          <Typography variant="h4" gutterBottom>
            An error occurred.
          </Typography>

          <Typography color="text.secondary">
            The content could not be loaded. Please try again.
          </Typography>
        </Box>
      ) : loading ? (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          minHeight="calc(100vh - 180px)"
        >
          <CircularProgress />
        </Box>
      ) : (
        <Markdown
          value={value}
          onMetadataUpdate={onMetadataUpdate}
          key={value}
        />
      )}
    </Box>
  );
}
