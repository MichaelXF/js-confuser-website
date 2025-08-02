import { useEffect, useState } from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import websiteImage1 from "../static/websiteImage1.png";
import websiteImage2 from "../static/websiteImage2.png";
import websiteImage3 from "../static/websiteImage3.png";
import websiteImage4 from "../static/websiteImage4.png";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
// import websiteImageDocs from "../static/websiteImageDocs.png";

const imageContainerProps = {
  boxShadow:
    "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  border: "2px solid",
  borderColor: "divider_opaque",
  borderRadius: "8px",
  overflow: "hidden",
};

const iconButtonSx = {
  color: "text.secondary",
  bgcolor: "#1d2226",
  borderRadius: "50%",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "&:hover": {
    bgcolor: "#242b30",
  },
  width: "34px",
  height: "34px",
};

export default function HomeImageCarousel() {
  const images = [websiteImage1, websiteImage2, websiteImage3, websiteImage4];
  const [zIndexes, setZIndexes] = useState([4, 3, 2, 1]);
  const [zIndexMax, setZIndexMax] = useState(4);
  const [index, setIndex] = useState(0);

  // Preload images
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  function changeImage(newIndex) {
    if (newIndex < 0) {
      newIndex = images.length + newIndex;
    }
    if (newIndex >= images.length) {
      newIndex = images.length % 4;
    }

    if (newIndex === index) {
      return;
    }

    setIndex(newIndex);
    const newZIndexMax = zIndexMax + 1;

    setZIndexes((prevZIndexes) => {
      const newZIndexes = [...prevZIndexes];
      newZIndexes[newIndex] = newZIndexMax;

      return newZIndexes;
    });

    setZIndexMax(newZIndexMax);
  }

  function nextImage() {
    changeImage((index + 1) % images.length);
  }

  return (
    <Box>
      <Box
        {...imageContainerProps}
        position="relative"
        onClick={() => {
          nextImage();
        }}
        sx={{
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <Stack
          position={"absolute"}
          bottom="32px"
          right="32px"
          direction={"row"}
          gap={1}
          zIndex={zIndexMax + 2}
        >
          <IconButton
            sx={iconButtonSx}
            children={<KeyboardArrowLeft />}
            onClick={(e) => {
              changeImage(index - 1);
              e.stopPropagation();
            }}
          />
          <IconButton
            sx={iconButtonSx}
            children={<KeyboardArrowRight />}
            onClick={(e) => {
              changeImage(index + 1);
              e.stopPropagation();
            }}
          />
        </Stack>

        {images.map((image, i) => {
          const isFirst = i == 0;
          const zIndex = zIndexes[i];
          const sx = {
            aspectRatio: "2880/1624",
            verticalAlign: "middle",
            zIndex: zIndex,
            opacity: index === i ? 1 : 0,
            transition: "opacity 0.5s",
          };

          // First image is not absolute to preserve the correct container layout
          if (isFirst) {
            return (
              <Box
                key={i}
                component="img"
                src={image}
                width="100%"
                sx={{
                  ...sx,
                  position: "relative",
                }}
              />
            );
          }

          // Absolute position to allow overlapping
          return (
            <Box
              key={i}
              component="img"
              src={image}
              width="100%"
              sx={{
                ...sx,
                position: "absolute",
                top: 0,
                left: 0,
              }}
            />
          );
        })}
      </Box>

      <Box mt={3}>
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={2}
        >
          {images.map((_image, i) => {
            const hoverBg = "rgba(109, 127, 145, 0.9)";
            return (
              <Box
                onClick={() => changeImage(i)}
                key={i}
                alt={`${i + 1}`}
                sx={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  padding: 0,
                  margin: 0,
                  border: "none",
                  cursor: "pointer",

                  transition: "background-color 0.25s",
                  backgroundColor:
                    i === index ? hoverBg : "rgba(61, 71, 81, 0.5)",
                  "&:hover": {
                    backgroundColor:
                      i === index ? hoverBg : "rgba(61, 71, 81, 0.8)",
                  },
                }}
                component="button"
              />
            );
          })}
        </Stack>
      </Box>

      <Typography
        textAlign="center"
        color="text.secondary"
        typography="body2"
        mt={2}
      >
        Animation of JS-Confuser.com Playground in Action
      </Typography>
    </Box>
  );
}
