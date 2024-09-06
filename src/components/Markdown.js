import React, { useEffect, useRef, useState } from "react";
import {
  Typography,
  Link,
  Box,
  Divider,
  ListItem,
  IconButton,
  Table,
  TableContainer,
  Paper,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import CodeViewerTabbed from "./CodeViewerTabbed"; // Assume this component is imported
import json5 from "json5";
import useJSConfuser from "../hooks/useJSConfuser";
import { textEllipsis, toUrlCase } from "../utils/format-utils";
import { OpenInNew, Tag } from "@mui/icons-material";
import { trimRemovePrefix } from "../utils/md-utils";

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
      elements.push(<strong key={match.index}>{match[2]}</strong>);
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

export default function Markdown({ value, onMetadataUpdate }) {
  var optionsRef = useRef();
  var editorRef = useRef();

  var JSConfuser = useJSConfuser();

  function obfuscate(value) {
    function setOutputValue(strValue) {
      if (editorRef.current) {
        editorRef.current.setValue(strValue);
      }
    }

    var options = optionsRef.current;
    if (options && typeof value === "string") {
      JSConfuser.obfuscate(value, options, {
        onComplete: ({ obfuscated }) => {
          setOutputValue(obfuscated);
        },
        onError: (error) => {
          setOutputValue("// " + error.errorString);
        },
      });
    }
  }

  const headings = [];

  const parseMarkdown = (markdown) => {
    const lines = markdown.split("\n");

    const skipLines = new Set();
    let allowBreak = false;

    return lines.map((line, index) => {
      if (skipLines.has(index)) {
        return <React.Fragment key={index}></React.Fragment>;
      }

      var trimmed = line.trim();

      if (!trimmed && allowBreak) {
        return (
          <React.Fragment key={index}>
            <br />
          </React.Fragment>
        );
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
        return (
          <Typography
            variant={`h${headingLevel}`}
            key={index}
            gutterBottom
            mt={headings.length === 1 ? 0 : 4}
            id={headingHash}
            className="HeadingScrollMargin"
          >
            {parseLine(headingText, true)}
          </Typography>
        );
      }

      if (trimmed.startsWith("---{")) {
        var endLineIndex = -1;
        for (let i = index + 1; i < lines.length; i++) {
          if (lines[i].trim().startsWith("---")) {
            endLineIndex = i;
            break;
          }
        }
        if (endLineIndex !== -1) {
          for (let i = index; i < endLineIndex + 1; i++) {
            skipLines.add(i);
          }

          var metadataString = trimmed.slice(3).trim();
          var valueLines = lines.slice(index + 1, endLineIndex);
          var firstIndention =
            valueLines[0].length - valueLines[0].trimStart().length;

          try {
            var metadata = json5.parse(metadataString);
          } catch (e) {
            console.error(metadataString);
            throw new Error(e);
          }

          var value = valueLines
            .map((line) =>
              line.slice(0, firstIndention).trim().length === 0
                ? line.slice(firstIndention)
                : ((firstIndention = 0), line)
            )
            .join("\n")
            .trim();

          allowBreak = false;

          if (metadata.live) {
            // eval string
            var optionsOrJS = metadata.options;
            if (typeof optionsOrJS === "string") {
              throw new Error("Not implemented");
            }
            optionsRef.current = optionsOrJS;

            console.log("Setting to", index);
          }

          return (
            <Box key={index} my={3}>
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
                <CodeViewerTabbed
                  defaultValue={""}
                  header={"Output.js"}
                  language={metadata.language}
                  onMount={(editor) => {
                    editorRef.current = editor;
                    obfuscate(value);
                  }}
                />
              ) : null}
            </Box>
          );
        }
      }

      if (trimmed.startsWith("---")) {
        allowBreak = false;
        return <Divider sx={{ my: 4 }} key={index} />;
      }

      if (trimmed.startsWith("- ")) {
        var bulletLevel = 0;
        var bulletPoint = trimmed;

        do {
          bulletPoint = bulletPoint.slice(2).trim();
          bulletLevel++;
        } while (bulletPoint.startsWith("- "));

        allowBreak = false;

        var paddingInlineStart = bulletLevel * 28;

        return (
          <Typography>
            <ul
              style={{
                marginBlock: "8px",
                paddingInlineStart: paddingInlineStart + "px",
              }}
            >
              <li>{parseLine(bulletPoint)}</li>
            </ul>
          </Typography>
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

        return (
          <TableContainer
            component={Paper}
            key={index}
            sx={{ my: 2, border: "2px solid", borderColor: "divider_opaque" }}
          >
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  {headerNames.map((header, i) => (
                    <TableCell key={i}>{parseLine(header)}</TableCell>
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
                          <TableCell component="th" scope="row" key={i} sx={sx}>
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
        );
      }

      if (trimmed) {
        allowBreak = true;
      }

      // Default
      return <React.Fragment key={index}>{parseLine(line)}</React.Fragment>;
    });
  };

  var strValue = "" + value;

  var component = parseMarkdown(strValue);

  useEffect(() => {
    onMetadataUpdate({
      headings,
      lowestHeadingLevel: Math.min(...headings.map((x) => x.level)),
    });
  }, [strValue]);

  return <Box lineHeight={"32px"}>{component}</Box>;
}
