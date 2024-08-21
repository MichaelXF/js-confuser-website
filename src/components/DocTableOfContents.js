import { OpenInNew } from "@mui/icons-material";
import { Box, Button, Link, Typography } from "@mui/material";

export default function DocTableOfContents({ metadata }) {
  return (
    <Box maxWidth="300px" width="100%" pl={10} position="sticky" top="30px">
      <Box pb={4}>
        <Typography
          sx={{ color: "text.secondary", textTransform: "uppercase" }}
          variant="body2"
          mb={2}
        >
          Feedback
        </Typography>

        <Typography color="text.secondary_darker" fontSize="0.925rem">
          Please help us improve by{" "}
          <Link
            underline="none"
            href="https://github.com/MichaelXF/js-confuser/issues"
            rel="noopener"
            target="_blank"
          >
            providing feedback
            <OpenInNew sx={{ ml: "3px", transform: "translate(0,3px)" }} />
          </Link>
        </Typography>
      </Box>

      <Typography
        mb={2}
        sx={{ color: "text.secondary", textTransform: "uppercase" }}
        variant="body2"
      >
        Contents
      </Typography>

      {metadata?.headings?.map((heading) => {
        var isNested = metadata.lowestHeadingLevel < heading.level;
        return (
          <Button
            color="inherit"
            sx={{
              color: "text.secondary_darker",
              pl: isNested ? 2 : 1,
              justifyContent: "flex-start",
              textAlign: "left",
              mb: "2px",
              fontSize: "0.8125rem",
              whiteSpace: "prewrap",
              wordBreak: "break-all",
            }}
            fullWidth
            key={heading.index + ":" + heading.label}
            component={"a"}
            href={heading.to}
          >
            {heading.label}
          </Button>
        );
      })}
    </Box>
  );
}
