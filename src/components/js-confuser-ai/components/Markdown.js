import React, { useEffect, useRef } from "react";
import {
  Typography,
  Link,
  Box,
  Divider,
  Table,
  TableContainer,
  Paper,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
  AlertTitle,
} from "@mui/material";
import { textEllipsis, toUrlCase } from "../../../utils/format-utils";
import { OpenInNew } from "@mui/icons-material";
import { trimRemovePrefix } from "../../../utils/md-utils";
import MarkdownCodeBlock from "./MarkdownCodeBlock";
import AITool from "./AITool";

export const parseLine = (
  line,
  inheritFontSize = false,
  maxCharacters = -1
) => {
  const elements = [];
  const regex =
    /(\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`|\[([^)]+)\]\(((https?:\/\/)?[^\s\)]+)\))|(((https?:\/\/)|(www\.))[A-z-.\/]+\.[0-9A-z-?=&#.\/]+)/g;
  let match;
  let lastIndex = 0;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      var middleText = line.substring(lastIndex, match.index);
      if (maxCharacters > 0) {
        middleText = textEllipsis(middleText, maxCharacters);
      }
      elements.push(middleText);
    }

    if (!match[1]) match[1] = match[0];

    if (match[1].startsWith("**")) {
      elements.push(
        <strong key={"strong_" + match.index} className="MarkdownBold">
          {match[2]}
        </strong>
      );
    } else if (match[1].startsWith("*")) {
      elements.push(<i key={"italic_" + match.index}>{match[3]}</i>);
    } else if (match[1].startsWith("`")) {
      elements.push(
        <Typography
          key={"code_" + match.index}
          variant="code"
          p={"6px"}
          bgcolor="primary.alpha"
          color="primary.main"
          borderRadius={"6px"}
          fontSize={inheritFontSize ? "inherit" : undefined}
        >
          {match[4]}
        </Typography>
      );
    } else if (
      match[1].startsWith("[") ||
      match[1].startsWith("http") ||
      match[1].startsWith("www")
    ) {
      const href = match[6] || match[1];
      let textDisplay = match[5] || match[1];

      // For link-like text:
      // Remove prefix 'http://' or 'https://'
      if (
        !match[5] &&
        (textDisplay.startsWith("http://") ||
          textDisplay.startsWith("https://"))
      ) {
        textDisplay = textDisplay.slice(textDisplay.indexOf("://") + 3);
      }

      elements.push(
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          key={"link_" + match.index}
          sx={{
            wordBreak: "break-all",
            display: "inline",
          }}
        >
          {textDisplay}

          <OpenInNew sx={{ mx: "2px", transform: "translateY(3px)" }} />
        </Link>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    var lastText = line.substring(lastIndex);

    if (maxCharacters > 0) {
      elements.push(textEllipsis(lastText, maxCharacters));
    } else {
      elements.push(lastText);
    }
  }

  return elements;
};

export default function Markdown({
  value,
  showIncompleteTools,
  onMetadataUpdate = () => {},
  sx = { color: "#d4d4d4", lineHeight: "2rem", wordBreak: "break-word" },
}) {
  const headings = [];

  /**
   * @param {string} markdown
   * @returns
   */
  const parseMarkdown = (markdown) => {
    const lines = markdown.split("\n");

    const skipLines = new Set();
    let allowBreak = false;
    let allowActualBreak = false;

    if (!lines[0]) {
      lines.shift();
    }
    if (lines[0] === "Running:" && lines.length > 1) {
      lines.shift();
    }

    // Remove empty lines at the end
    while (lines.length && !lines.at(-1)) {
      lines.pop();
    }

    return lines.map((line, index) => {
      if (skipLines.has(index)) {
        return <React.Fragment key={index}></React.Fragment>;
      }

      /**
       * @type {string}
       */
      var trimmed = line.trim();

      if (!trimmed) {
        if (allowActualBreak) {
          allowActualBreak = false;
          return null;
        } else if (allowBreak) {
          allowActualBreak = true;
          allowBreak = false;
        }
      }

      if (trimmed === "<br>") {
        allowBreak = false;
        return (
          <React.Fragment key={index}>
            <br />
          </React.Fragment>
        );
      }

      // - search_knowledge_base(query=Rename Variables)
      if (
        trimmed.startsWith("- Running: ") ||
        trimmed.startsWith("- search_knowledge_base(")
      ) {
        // Remove the prefix "- "
        if (trimmed.startsWith("- ")) {
          trimmed = trimmed.slice(2);
        }

        // Remove the prefix "- Running: "
        if (trimmed.startsWith("Running: ")) {
          trimmed = trimmed.slice("Running: ".length);
        }

        const isLastLine = index === lines.length - 1;

        let toolMessage = "Running tool";
        let toolComplete = !showIncompleteTools || !isLastLine;

        if (trimmed.startsWith("search_knowledge_base(query=")) {
          const searchQuery = (
            trimmed.split("query=")[1]?.trim() ?? "Related Information"
          ).split(")")[0];

          toolMessage = "Searching for " + searchQuery;
        }

        return (
          <AITool key={index} message={toolMessage} complete={toolComplete} />
        );
      }

      var headingLevel = 0;
      while (trimmed.startsWith("#")) {
        headingLevel++;
        trimmed = trimmed.substring(1);
      }

      if (headingLevel >= 1) {
        var headingText = trimmed.trim();

        var headingTextNoMarkdown = trimRemovePrefix(headingText);
        var headingHash = toUrlCase(headingTextNoMarkdown);
        headings.push({
          label: headingTextNoMarkdown,
          id: headings.length,
          level: headingLevel,
          to: "#" + headingHash,
        });

        allowBreak = false;
        allowActualBreak = false;

        var isCode = headingText.trim().startsWith("`");

        return (
          <Typography
            variant={`h${headingLevel}`}
            color="text.primary"
            key={index}
            my={2}
            id={headingHash}
            className="HeadingScrollMargin"
            fontSize={
              {
                1: "2.25rem",
                2: "2rem",
                3: "1.8rem",
                4: "1.6rem",
                5: "1.5rem",
                6: "1.25rem",
              }[headingLevel]
            }
          >
            {parseLine(headingText, true)}
          </Typography>
        );
      }

      if (
        trimmed.startsWith("---{") ||
        trimmed.startsWith("---js") ||
        trimmed.startsWith("```")
      ) {
        let endLineIndex = -1;
        const endToken = trimmed.slice(0, 3);
        const valueLines = [];

        const languageString = trimmed.slice(3).trim();

        for (var i = index + 1; i < lines.length; i++) {
          let currentLine = lines[i];

          if (currentLine.trimStart().startsWith(endToken)) {
            endLineIndex = i;
            break;
          } else {
            valueLines.push(currentLine);
          }
        }

        if (endLineIndex === -1) {
          endLineIndex = i;
        }

        for (let i = index; i < endLineIndex + 1; i++) {
          skipLines.add(i);
        }

        const value = valueLines.join("\n");

        allowBreak = false;
        allowActualBreak = false;

        return (
          <Box key={index} mt={2} mb={4}>
            <MarkdownCodeBlock code={value} language={languageString} />
          </Box>
        );
      }

      if (trimmed.startsWith("---")) {
        allowBreak = false;
        allowActualBreak = false;

        return <Divider sx={{ my: 6 }} key={index} />;
      }

      function isValidBulletPoint(trimmed) {
        if (!trimmed) return false;

        return (
          trimmed.startsWith("- ") ||
          trimmed.startsWith("* ") ||
          trimmed.match(/^[0-9]+. +/)
        );
      }

      if (isValidBulletPoint(line.trimStart())) {
        const isUnordered = trimmed.startsWith("-") || trimmed.startsWith("*");
        const bulletLines = [];
        let i = index;
        let startLineIndex = index;
        let endLineIndex = index;
        outer: do {
          bulletLines.push(trimmed);
          endLineIndex = i;

          do {
            i++;
            if (i > lines.length) break outer;
            trimmed = lines[i]?.trimStart();
          } while (typeof trimmed === "string" && !trimmed.trim());
        } while (isValidBulletPoint(trimmed));

        for (let i = startLineIndex; i <= endLineIndex; i++) {
          skipLines.add(i);
        }

        allowBreak = false;
        allowActualBreak = false;

        const LIST_START_PADDING = 28;

        return (
          <Box
            key={index}
            sx={{
              marginBlock: "8px",
              paddingInlineStart: LIST_START_PADDING + "px",
              mb: 4,
            }}
            component={isUnordered ? "ul" : "ol"}
          >
            {bulletLines.map((line, i) => {
              var bulletLevel = 0;
              var bulletPoint = line.trim();

              if (!bulletPoint) return null;

              do {
                bulletPoint = bulletPoint.slice(2).trim();
                bulletLevel++;
              } while (bulletPoint.startsWith("- "));

              var marginInlineStart =
                Math.max(0, (bulletLevel - 1) * LIST_START_PADDING) + "px";

              return (
                <Typography
                  variant="inherit"
                  component="li"
                  sx={{
                    marginInlineStart,
                  }}
                  key={i}
                  mb={1}
                >
                  {parseLine(bulletPoint)}
                </Typography>
              );
            })}
          </Box>
        );
      }

      function isBlockQuote(trimmed) {
        return trimmed.startsWith("> ");
      }

      if (isBlockQuote(trimmed)) {
        const blockQuoteLines = [];
        do {
          blockQuoteLines.push(lines[index].trim().slice("> ".length).trim());
          skipLines.add(index);
        } while (index < lines.length && isBlockQuote(lines[++index]?.trim()));

        let type = "";

        if (blockQuoteLines[0].startsWith("[!")) {
          type = blockQuoteLines.shift().trim().toLowerCase();
          if (type.startsWith("[!") && type.endsWith("]")) {
            type = type.slice(2, -1);
          }
        }

        allowBreak = false;
        allowActualBreak = false;

        var title = blockQuoteLines.shift();

        return (
          <Alert
            key={index}
            severity={type}
            sx={{ borderRadius: "4px", mb: 4 }}
          >
            <AlertTitle color="white">{parseLine(title)}</AlertTitle>
            {blockQuoteLines.map((line, i) => (
              <Typography key={i} sx={sx}>
                {parseLine(line)}
              </Typography>
            ))}
          </Alert>
        );
      }

      if (trimmed.startsWith("|")) {
        var headerNames = trimmed.slice(1).split("|");
        if (!headerNames[headerNames.length - 1].trim()) {
          headerNames.pop();
        }
        var rows = [];

        for (let i = index + 1; i < lines.length; i++) {
          var trim = lines[i].trim();
          if (!trim.startsWith("|")) break;

          skipLines.add(i);

          var values = trim.slice(1).split("|");
          if (!values[values.length - 1].trim()) {
            values.pop();
          }

          rows.push(values);
        }

        allowBreak = false;
        allowActualBreak = false;

        return (
          <Box key={"table_" + index} pt={1} mt={2} mb={4}>
            <TableContainer
              component={Paper}
              key={index}
              sx={{
                border: "1px solid",
                borderColor: "divider_opaque",
                wordBreak: "normal",
              }}
            >
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead
                  sx={{
                    outline: "1px solid",
                    outlineColor: "divider_opaque",
                    bgcolor: "rgba(255,255,255,0.01)",
                  }}
                >
                  <TableRow>
                    {headerNames.map((header, i) => (
                      <TableCell
                        key={i}
                        sx={{
                          fontWeight: "bold",
                        }}
                      >
                        {parseLine(header)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, rowIndex) => {
                    // Skip divider rows "----"
                    if (row.every((x) => x.match(/^\s*-+\s*$/g))) return null;

                    return (
                      <TableRow key={rowIndex}>
                        {row.map((cell, i) => {
                          var content = parseLine(cell);
                          var sx = {};

                          var trimmed = cell.trim();
                          if (trimmed === "Yes") {
                            sx = { color: "primary.main" };
                          } else if (trimmed === "No") {
                            sx = { color: "error.main", fontWeight: "bold" };
                          }

                          if (i === 0) {
                            return (
                              <TableCell
                                key={i}
                                component="th"
                                scope="row"
                                sx={sx}
                              >
                                {content}
                              </TableCell>
                            );
                          }
                          return (
                            <TableCell key={i} sx={sx}>
                              {content}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );
      }

      if (trimmed) {
        allowBreak = true;
        allowActualBreak = false;
      }

      if (!trimmed) {
        return null;
      }

      let includeMarginBottom = true;

      // If there is only one line, don't include margin bottom
      if (lines.length === 1) {
        includeMarginBottom = false;
      }

      // Default
      return (
        <Typography key={"p_" + index} sx={sx} mb={includeMarginBottom ? 2 : 0}>
          {parseLine(trimmed)}
        </Typography>
      );
    });
  };

  const strValue = "" + value;

  let component;
  try {
    component = parseMarkdown(strValue);
  } catch (error) {
    console.error(error);

    if (process.env.NODE_ENV === "development") {
      component = <p>{error.toString()}</p>;
    } else {
      component = <p>There was an error parsing the markdown.</p>;
    }
  }

  useEffect(() => {
    onMetadataUpdate({
      headings,
      lowestHeadingLevel: Math.min(...headings.map((x) => x.level)),
      value,
    });
  }, [strValue]);

  return <Box sx={sx}>{component}</Box>;
}
