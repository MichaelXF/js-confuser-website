import { KeyboardArrowRight, Search } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  Fade,
  InputBase,
  LinearProgress,
  Typography,
} from "@mui/material";
import { ensureAllDocsLoaded, getDocs } from "../../utils/doc-utils";
import { useEffect, useState } from "react";
import { similarity } from "../../utils/string-utils";
import { Link } from "react-router-dom";
import { getRandomString } from "../../utils/random-utils";
import { toUrlCase } from "../../utils/format-utils";
import useSnackbar from "../../hooks/useSnackbar";
import { parseLine } from "../Markdown";
import {
  splitMarkdownIntoHeadingSections,
  trimRemovePrefix,
} from "../../utils/md-utils";

export default function DocSearchDialog({ open, onClose }) {
  var [results, setResults] = useState([]);

  var { docsByPath } = getDocs();
  var [activeEl, setActiveEl] = useState();
  var [loading, setLoading] = useState(false);
  var snackbar = useSnackbar();

  useEffect(() => {
    if (open) {
      setResults([]);
      setActiveEl(null);

      ensureAllDocsLoaded(() => setLoading(true))
        .then(() => {
          setLoading(false);
        })
        .catch((err) => {
          setLoading(false);

          snackbar.showError(err);
        });
    }
  }, [!!open]);

  var [_searchQuery, setSearchQuery] = useState("");

  const search = (query) => {
    query = query.trim();
    var queryLowerCase = query.toLowerCase();
    var results = [];

    setSearchQuery(query);

    if (query) {
      for (let path in docsByPath) {
        const doc = docsByPath[path];
        if (doc.content) {
          const sections = splitMarkdownIntoHeadingSections(doc);

          for (const section of sections) {
            const heading = trimRemovePrefix(section.heading);
            let headingLowerCase = heading.toLowerCase();

            function hit(previewText, scale = 1) {
              previewText = trimRemovePrefix(previewText);

              results.push({
                title: heading,
                subtitle: doc.group + " / " + doc.title,
                description: previewText,
                sortSort:
                  (similarity(queryLowerCase, headingLowerCase) +
                    similarity(queryLowerCase, doc.title.toLowerCase()) +
                    similarity(queryLowerCase, previewText.toLowerCase())) *
                  scale,

                to: "/docs/" + path + "#" + toUrlCase(section.heading),

                key: getRandomString(10),
              });
            }

            if (
              (headingLowerCase.includes(queryLowerCase) ||
                similarity(headingLowerCase, queryLowerCase) > 0.5) &&
              !section.lines[0]?.trim()?.startsWith("| ")
            ) {
              const previewText = section.lines[0];
              hit(previewText);
            } else {
              for (var line of section.lines) {
                if (line.toLowerCase().includes(queryLowerCase)) {
                  hit(line, 0.2);
                  break;
                }
              }
            }
          }
        }
      }
    }

    results = results.sort((a, b) => b.sortSort - a.sortSort);

    if (results.length > 5) {
      results.length = 5;
    }

    setResults(results);
    setActiveEl(null);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDialog-paper": {
          position: "absolute",
          top: "5%",
          left: "50%",
          transform: "translate(-50%, 0)",
          borderRadius: "6px",
        },
      }}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={false}
      disableRestoreFocus={true}
    >
      <Fade in={loading}>
        <LinearProgress
          variant="indeterminate"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
          }}
        />
      </Fade>

      <InputBase
        placeholder="Search the docs..."
        inputProps={{ "aria-label": "search" }}
        sx={{
          width: "100%",
          minWidth: "420px",
          px: 4,
          py: 2,
          fontSize: "1.125rem",
          color: "primary.main",
        }}
        autoFocus={true}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();

            if (!activeEl) {
              setActiveEl(e.target.parentElement.nextSibling);
            } else {
              const newEl = activeEl.nextSibling;
              if (newEl) {
                setActiveEl(newEl);
              }
            }
          }

          if (e.key === "ArrowUp") {
            if (activeEl) {
              e.preventDefault();

              const newEl = activeEl.previousSibling;
              if (newEl) {
                setActiveEl(newEl);
              }
            }
          }

          if (e.key === "Enter") {
            if (activeEl) {
              activeEl.click();
            }
          }
        }}
        onInput={(e) => {
          search(e.target.value);
        }}
        startAdornment={<Search sx={{ mr: 2 }} />}
      />

      {results && results.length
        ? results.map((result, index) => (
            <Button
              sx={{
                textTransform: "none",
                justifyContent: "flex-start",
                p: 2,
                textAlign: "left",
                bgcolor:
                  activeEl?.id === result.key.toString()
                    ? "primary.alpha"
                    : "transparent",

                "&:hover": {
                  bgcolor:
                    activeEl && activeEl.id !== result.key.toString()
                      ? "transparent"
                      : "primary.alpha",
                },
              }}
              component={Link}
              to={result.to}
              onClick={() => {
                onClose();
              }}
              id={result.key}
              onMouseEnter={(e) => {
                setActiveEl(e.currentTarget);
              }}
              onMouseOver={(e) => {
                setActiveEl(e.currentTarget);
              }}
            >
              <Box mr="auto" pr={1}>
                <Typography fontWeight="bold" fontSize="1.125rem">
                  {result.title}
                </Typography>
                <Typography color="text.secondary" lineHeight="30px">
                  {parseLine(result.description, false, 110)}
                </Typography>
                <Typography color="text.secondary" fontSize="0.8rem" mt={2}>
                  {result.subtitle}
                </Typography>
              </Box>

              <Box pr={1}>
                <KeyboardArrowRight sx={{ fontSize: "1.25rem" }} />
              </Box>
            </Button>
          ))
        : null}
    </Dialog>
  );
}
