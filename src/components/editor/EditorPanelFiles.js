import { Button } from "@mui/material";
import { useEffect, useState } from "react";
import { listAllFiles } from "../../utils/file-utils";

/**
 * Unused panel - Maybe in the future we can add a file explorer
 */
export default function EditorPanelFiles({ editorComponent }) {
  var [files, setFiles] = useState([]);

  useEffect(() => {
    listAllFiles().then((files) => {
      setFiles(files);
    });
  }, []);

  return (
    <>
      {files.map((file, i) => {
        return (
          <Button
            key={i}
            variant="text"
            color="inherit"
            fullWidth={true}
            sx={{
              textAlign: "left",
              justifyContent: "flex-start",
              color: "text.secondary",
              fontWeight: "normal",
            }}
            onClick={() => {
              editorComponent.newTabFromFile(file);
            }}
          >
            {file}
          </Button>
        );
      })}
    </>
  );
}
