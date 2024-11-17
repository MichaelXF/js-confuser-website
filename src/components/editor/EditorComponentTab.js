import { Close } from "@mui/icons-material";
import { Box, Button, IconButton, Typography } from "@mui/material";
import { useState } from "react";

export default function EditorComponentTab({ isActive, tab, editorComponent }) {
  // State hook purely for triggering a re-render
  // tab.title is not reactive
  var [state, setState] = useState({});

  return (
    <Button
      sx={{
        color: isActive ? "text.secondary" : "text.secondary",
        height: "30px",
        cursor: "pointer",
        backgroundColor: isActive ? "divider" : "transparent",
        borderTopRightRadius: 4,
        borderTopLeftRadius: 4,
        textTransform: "none",
        minWidth: "110px",
        pl: 2,
        pr: 1,
        whiteSpace: "nowrap",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
      color="inherit"
      display="flex"
      onClick={() => editorComponent.changeTab(tab)}
      title="Right click to rename"
      component="div"
    >
      <Typography
        variant="body2"
        onContextMenu={(e) => {
          e.stopPropagation();
          e.preventDefault();

          var newName = prompt("Enter a new name for the tab", tab?.title);

          if (newName) {
            tab.rename(newName);
            setState(newName);
          }
        }}
      >
        {tab?.title}
        <Typography
          variant="inherit"
          id={"tab-" + tab?.identity}
          component="span"
          style={{ opacity: 0 }}
        >
          {" "}
          *
        </Typography>
      </Typography>

      <Box sx={{ ml: "auto", pr: 2 }}></Box>

      <IconButton
        size="small"
        color="inherit"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();

          editorComponent.closeTab(tab);
        }}
      >
        <Close sx={{ fontSize: "14px" }} />
      </IconButton>
    </Button>
  );
}
