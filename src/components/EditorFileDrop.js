import { Backdrop, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

export function EditorFileDrop({ newTab }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false); // Reset dragging state on drop

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target.result;
        newTab(content, file.name);
      };

      reader.onerror = () => {
        console.error("Failed to read file");
      };

      reader.readAsText(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true); // Set dragging state to true when dragging over
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false); // Reset dragging state when leaving the window
  };

  useEffect(() => {
    // Add global event listeners for drag and drop
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleFileDrop);

    // Clean up event listeners on component unmount
    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleFileDrop);
    };
  }, []);

  return (
    <Backdrop
      open={isDragging}
      sx={{
        alignItems: "flex-start",
        zIndex: 1000,
      }}
    >
      <Typography variant="h6" p={4}>
        Drop file anywhere...
      </Typography>
    </Backdrop>
  );
}
