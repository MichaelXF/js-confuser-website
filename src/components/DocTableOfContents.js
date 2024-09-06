import { OpenInNew } from "@mui/icons-material";
import { Box, Button, Link, Typography } from "@mui/material";

export default function DocTableOfContents({ metadata }) {
  return (
    <Box
      flexShrink={0}
      maxWidth="300px"
      width="100%"
      pr={4}
      pl={2}
      position="sticky"
      top="0px"
      pt={4}
    >
      <Box pb={4} px={1}>
        <Typography
          sx={{ color: "text.secondary", textTransform: "uppercase" }}
          variant="body2"
          mb={2}
        >
          Feedback
        </Typography>

        <Typography color="text.secondary_darker" fontSize="0.925rem">
          Please help us improve by <br />
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
        px={1}
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
              justifyContent: "flex-start",
              textAlign: "left",
              mb: "2px",
              fontSize: "0.8125rem",
              width: "100%",
            }}
            fullWidth
            key={heading.index + ":" + heading.label}
            component={"a"}
            href={heading.to}
            title={heading.label}
          >
            <Typography
              sx={{
                overflowWrap: "break-word",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                pr: 1,
              }}
              variant="inherit"
            >
              {heading.label}
            </Typography>
          </Button>
        );
      })}
    </Box>
  );
}
