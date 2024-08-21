import React from "react";
import { Skeleton, Box, Grid } from "@mui/material";

export default function ArticleSkeleton() {
  return (
    <Box>
      {/* Article Title */}
      <Skeleton variant="text" sx={{ fontSize: "2.5rem", width: "65%" }} />

      {/* Subtitle */}
      <Skeleton
        variant="text"
        sx={{ fontSize: "1.5rem", width: "40%", marginTop: 1 }}
      />

      {/* Article Meta */}
      <Skeleton
        variant="text"
        sx={{ fontSize: "1rem", width: "30%", marginTop: 1 }}
      />

      {/* Paragraphs */}
      <Skeleton
        variant="text"
        sx={{ fontSize: "1rem", width: "100%", marginTop: 2 }}
      />
      <Skeleton
        variant="text"
        sx={{ fontSize: "1rem", width: "100%", marginTop: 1 }}
      />
      <Skeleton
        variant="text"
        sx={{ fontSize: "1rem", width: "100%", marginTop: 1 }}
      />
      <Skeleton
        variant="text"
        sx={{ fontSize: "1rem", width: "90%", marginTop: 1 }}
      />

      {/* Image */}
      <Skeleton
        variant="rectangular"
        sx={{ width: "100%", height: 200, marginTop: 3 }}
      />

      {/* List */}
      <Box sx={{ marginTop: 3 }}>
        <Skeleton variant="text" sx={{ fontSize: "1.25rem", width: "30%" }} />
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Skeleton variant="text" sx={{ fontSize: "1rem", width: "80%" }} />
          </Grid>
          <Grid item xs={12}>
            <Skeleton variant="text" sx={{ fontSize: "1rem", width: "80%" }} />
          </Grid>
          <Grid item xs={12}>
            <Skeleton variant="text" sx={{ fontSize: "1rem", width: "80%" }} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
