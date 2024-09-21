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
  Button,
} from "@mui/material";
import CodeViewerTabbed from "./CodeViewerTabbed"; // Assume this component is imported
import json5 from "json5";
import useJSConfuser from "../hooks/useJSConfuser";
import { textEllipsis, toUrlCase } from "../utils/format-utils";
import { KeyboardArrowRight, OpenInNew } from "@mui/icons-material";
import { trimRemovePrefix } from "../utils/md-utils";
import { LocalStorageKeys } from "../constants";
import { useNavigate } from "react-router-dom";

export const parseLine = (
  line,
  inheritFontSize = false,
  maxCharacters = -1
) => {
  const elements = [];
  const regex =
    /(\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`|\[(.*?)\]\(((https?:\/\/)?[^\s]+)\))/g;
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

    if (match[1].startsWith("**")) {
      elements.push(
        <strong key={match.index} className="MarkdownBold">
          {match[2]}
        </strong>
      );
    } else if (match[1].startsWith("*")) {
      elements.push(<i key={match.index}>{match[3]}</i>);
    } else if (match[1].startsWith("`")) {
      elements.push(
        <Typography
          key={match.index}
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
    } else if (match[1].startsWith("[")) {
      elements.push(
        <Link
          href={match[6]}
          target="_blank"
          rel="noopener noreferrer"
          key={match.index}
          sx={{
            wordBreak: "break-word",
            width: "max-content",
            display: "inline-block",
          }}
        >
          {match[5]}

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
  onMetadataUpdate = () => {},
  sx = { color: "#d4d4d4", lineHeight: "32px" },
}) {
  var optionsRef = useRef();
  var editorRef = useRef();

  var JSConfuser = useJSConfuser();
  const navigator = useNavigate();

  function obfuscate(value) {
    function setOutputValue(strValue) {
      if (editorRef.current) {
        editorRef.current.setValue(strValue);
      }
    }

    var options = optionsRef.current;
    if (options && typeof value === "string") {
      JSConfuser.obfuscate(value, options, {
        onComplete: ({ code }) => {
          setOutputValue(code);
        },
        onError: (error) => {
          setOutputValue("// " + error.errorString);
        },
      });
    }
  }

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
          return (
            <React.Fragment key={index}>
              <br />
            </React.Fragment>
          );
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

        return (
          <Typography
            variant={`h${headingLevel}`}
            color="text.primary"
            key={index}
            gutterBottom
            mt={headingLevel === 1 ? 0 : 3}
            mb={headingLevel === 4 ? 2 : headingLevel === 5 ? 2 : undefined}
            id={headingHash}
            className="HeadingScrollMargin"
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
        const optionsLines = [];

        const metadataString = trimmed.slice(3).trim();
        let metadata = {};

        try {
          if (metadataString === "js") {
            metadata = {
              language: "javascript",
              live: false,
              header: "Code",
            };
          } else {
            metadata = json5.parse(metadataString);
          }
        } catch (e) {
          console.error(metadataString);
          throw new Error(e);
        }

        var collectOptions = metadata.options;
        if (metadata.options && typeof metadata.options !== "boolean") {
          throw new Error(metadata.options);
        }

        for (let i = index + 1; i < lines.length; i++) {
          let currentLine = lines[i].trim();
          if (currentLine.startsWith("===END OPTIONS===")) {
            if (collectOptions) {
              collectOptions = false;
              continue;
            } else {
              throw new Error("Not allowed");
            }
          }

          if (currentLine.startsWith(endToken)) {
            endLineIndex = i;
            break;
          } else {
            if (collectOptions) {
              optionsLines.push(lines[i]);
            } else {
              valueLines.push(lines[i]);
            }
          }
        }

        function fixIndentation(lines) {
          if (lines.length === 0) return "";

          if (!lines[0].trim() && lines.length > 1) {
            lines.shift();
          }

          let firstIndention = lines[0].length - lines[0].trimStart().length;

          const correctedValue = lines
            .map((line) =>
              line.slice(0, firstIndention).trim().length === 0
                ? line.slice(firstIndention)
                : ((firstIndention = 0), line)
            )
            .join("\n")
            .trim();

          return correctedValue;
        }

        if (endLineIndex !== -1) {
          for (let i = index; i < endLineIndex + 1; i++) {
            skipLines.add(i);
          }

          const value = fixIndentation(valueLines);

          allowBreak = false;
          allowActualBreak = false;

          if (metadata.live) {
            const options = fixIndentation(optionsLines);
            optionsRef.current = options;
          }

          const isOptionsFile = ["Options.js", "JSConfuser.ts"].includes(
            metadata.header
          );

          const showTryItButton = metadata.live || isOptionsFile;

          return (
            <Box key={index} my={4}>
              <CodeViewerTabbed
                defaultValue={value}
                header={metadata.header}
                language={metadata.language || "javascript"}
                readOnly={!metadata.live}
                setValue={(value) => {
                  obfuscate(value);
                }}
                height="auto"
              />

              {metadata.live ? (
                <>
                  <CodeViewerTabbed
                    defaultValue={""}
                    header={"Output.js"}
                    language={metadata.language}
                    onMount={(editor) => {
                      editorRef.current = editor;
                      obfuscate(value);
                    }}
                    allowEvaluate={true}
                  />
                </>
              ) : null}

              {showTryItButton ? (
                <Box textAlign="center">
                  <Button
                    title="Try out the code in the Playground"
                    endIcon={<KeyboardArrowRight />}
                    onClick={() => {
                      const searchParams = new URLSearchParams();

                      // module.exports = {...}
                      const optionsString = metadata.live
                        ? optionsRef.current
                        : value;

                      searchParams.set("config", optionsString);

                      if (metadata.live) {
                        searchParams.set(
                          "code",
                          LocalStorageKeys.JsConfuserMarkdownCode
                        );
                      }

                      navigator("/editor?" + searchParams.toString());
                    }}
                  >
                    Try It Out
                  </Button>
                </Box>
              ) : null}
            </Box>
          );
        }
      }

      if (trimmed.startsWith("---")) {
        allowBreak = false;
        allowActualBreak = false;

        return <Divider sx={{ my: 6 }} key={index} />;
      }

      function isValidBulletPoint(trimmed) {
        if (!trimmed) return false;

        return trimmed.startsWith("- ") || trimmed.match(/^[0-9]+. +/);
      }

      if (isValidBulletPoint(trimmed)) {
        const isUnordered = trimmed.startsWith("- ");
        const bulletLines = [];
        var i = index;
        var startLineIndex = index;
        var endLineIndex = index;
        outer: do {
          bulletLines.push(trimmed);
          endLineIndex = i;
          console.log(trimmed);

          do {
            i++;
            if (i > lines.length) break outer;
            trimmed = lines[i]?.trim();

            console.log(isValidBulletPoint(trimmed));
          } while (typeof trimmed === "string" && !trimmed.trim());
        } while (isValidBulletPoint(trimmed));

        for (var i = startLineIndex; i <= endLineIndex; i++) {
          skipLines.add(i);
        }

        allowBreak = false;
        allowActualBreak = false;

        const LIST_START_PADDING = 28;

        return (
          <Box
            style={{
              marginBlock: "8px",
              paddingInlineStart: LIST_START_PADDING + "px",
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
                >
                  {parseLine(bulletPoint)}
                </Typography>
              );
            })}
          </Box>
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
          <Box key={index} pt={1} mt={2} mb={4}>
            <TableContainer
              component={Paper}
              key={index}
              sx={{
                border: "1px solid",
                borderColor: "divider_opaque",
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
                          width: header.trim() === "Option" ? "220px" : "none",
                        }}
                      >
                        {parseLine(header)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.name}>
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
                              component="th"
                              scope="row"
                              key={i}
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
                  ))}
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

      // Default
      return (
        <Typography key={index} sx={sx}>
          {parseLine(trimmed)}
        </Typography>
      );
    });
  };

  var strValue = "" + value;

  var component = parseMarkdown(strValue);

  useEffect(() => {
    onMetadataUpdate({
      headings,
      lowestHeadingLevel: Math.min(...headings.map((x) => x.level)),
      value,
    });
  }, [strValue]);

  return <Box sx={sx}>{component}</Box>;
}
