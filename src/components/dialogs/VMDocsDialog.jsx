import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import Markdown from "../Markdown.jsx";
import { camelCaseToTitleCase } from "../../utils/format-utils.jsx";
import { useEffect, useState } from "react";
import MarkdownCodeBlock from "../js-confuser-ai/components/MarkdownCodeBlock.jsx";

export default function VMDocsDialog({
  open,
  onClose,
  options,
  optionsSchema,
  setOptions,
  selectedOption,
  obfuscate,
}) {
  let schema = optionsSchema[selectedOption];

  let [output, setOutput] = useState();
  useEffect(() => {
    if (!schema || !open) return;

    setOutput(null); // Clear previous output
    async function fn() {
      if (schema.inputCode) {
        let options = { target: "browser", disassemble: true };

        var beforeOutput = await obfuscate(schema.inputCode, options);

        var afterOutput = await obfuscate(schema.inputCode, {
          ...options,
          [selectedOption]: true,
        });

        var process = (obfuscationResult, isBefore) => {
          let code = obfuscationResult.code;
          if (schema.outputDisassembled) {
            code = obfuscationResult.disassembled;
          }
          if (schema.outputBytecode) {
            code = code.split("var CONSTANTS")[0].trim(0);
          }
          if (typeof schema.outputFormatter === "function") {
            code = schema.outputFormatter(code, isBefore) || code;
          }
          return (code || "").trim();
        };

        setOutput({
          before: process(beforeOutput, true),
          after: process(afterOutput, false),
        });
      }
    }

    fn();
  }, [selectedOption, !!schema, open]);

  let markdown = `
${schema?.description}
  `;

  let suffix = schema?.outputBytecode
    ? " (Bytecode)"
    : schema?.outputDisassembled
      ? " (Disassembled)"
      : "";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>
        {camelCaseToTitleCase(selectedOption || "")}
      </DialogTitle>

      <DialogContent>
        <Markdown value={markdown} />

        {schema?.inputCode ? (
          <>
            <MarkdownCodeBlock
              header="Input Code"
              code={schema.inputCode?.trim()}
              language="javascript"
            />

            <Box mt={1}>
              <MarkdownCodeBlock
                header={"Before" + suffix}
                code={output?.before || "// Loading"}
                language="js"
              />
            </Box>
            <Box mt={1}>
              <MarkdownCodeBlock
                header={"After" + suffix}
                code={output?.after || "// Loading"}
                language="js"
              />
            </Box>
          </>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
