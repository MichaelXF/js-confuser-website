import {
  InsertDriveFile,
  KeyboardArrowDown,
  KeyboardArrowRight,
  KeyboardArrowUp,
} from "@mui/icons-material";
import { Button, Stack, Typography } from "@mui/material";
import { useState } from "react";
import {
  formatPercentage,
  formatSize,
  formatTimeDuration,
} from "../utils/format-utils";
import { downloadJavaScriptFile } from "../utils/file-utils";

function InfoRow({ label, value, key }) {
  return (
    <Stack direction="row" alignItems="center" key={key} mb={"2px"}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography color="white" ml="auto">
        {value}
      </Typography>
    </Stack>
  );
}

export default function EditorPanelDownload({ evaluateCode, activeTab }) {
  const obfuscationInfo = activeTab?.obfuscationInfo;
  var avgTransformTime = 0;

  var displayTransforms = [];
  var [showMore, setShowMore] = useState(false);

  if (typeof obfuscationInfo === "object" && obfuscationInfo) {
    var { transformationTimes } = obfuscationInfo;

    // Calculate the average transformation time
    avgTransformTime =
      Object.keys(transformationTimes).reduce(
        (a, b) => transformationTimes[b] + a,
        0
      ) / Object.keys(transformationTimes).length;

    // Sort the keys based on obfuscation time
    var sortedKeys = Object.keys(transformationTimes);

    sortedKeys.sort((a, b) => transformationTimes[b] - transformationTimes[a]);

    for (var transformName of sortedKeys) {
      displayTransforms.push({
        name: transformName,
        time: transformationTimes[transformName],
      });
    }
  }

  return (
    <>
      <Button
        sx={{
          fontWeight: "bold",
          width: "100%",
          minHeight: "42px",
        }}
        startIcon={<InsertDriveFile sx={{ transform: "scale(0.9)" }} />}
        variant="contained"
        onClick={() => {
          var model = activeTab;
          if (model) {
            model.setIsDirty(false);
            downloadJavaScriptFile(model.getValue(), model.title);
          }
        }}
      >
        Download File
      </Button>

      <Button
        sx={{
          fontWeight: "bold",
          width: "100%",
          minHeight: "42px",
          mt: 2,
          bgcolor: "divider",
          color: "primary.main",
        }}
        startIcon={<KeyboardArrowRight sx={{ transform: "scale(1.1)" }} />}
        color="inherit"
        onClick={() => {
          evaluateCode();
        }}
      >
        Evaluate Code
      </Button>

      <Typography mt={4} mb={4} variant="h6">
        Obfuscation Info
      </Typography>
      {[
        {
          label: "Obfuscation Time",
          value: formatTimeDuration(obfuscationInfo?.obfuscationTime),
        },
        {
          label: "Original file size",
          value: formatSize(obfuscationInfo?.originalSize),
        },
        {
          label: "New file size",
          value: formatSize(obfuscationInfo?.newSize),
        },
        {
          label: "File size increase",
          value: formatPercentage(
            obfuscationInfo?.newSize / obfuscationInfo?.originalSize
          ),
        },
      ].map(({ label, value }, i) => {
        return <InfoRow key={i} label={label} value={value} />;
      })}

      {showMore
        ? [
            {
              label: "Avg. Transform Time",
              value: formatTimeDuration(avgTransformTime),
            },
            {
              label: "Parse Time",
              value: formatTimeDuration(obfuscationInfo?.parseTime),
            },
            {
              label: "Compile Time",
              value: formatTimeDuration(obfuscationInfo?.compileTime),
            },
            {
              label: "Transforms",
              value: `${obfuscationInfo?.totalTransforms}/${obfuscationInfo?.totalPossibleTransforms}`,
            },
          ].map((row, i) => {
            return <InfoRow key={i} label={row.label} value={row.value} />;
          })
        : null}

      <Typography variant="h6" my={4}>
        Transforms
      </Typography>

      {displayTransforms
        .slice(0, showMore ? displayTransforms.length : 3)
        .map(({ name, time }, i) => {
          return (
            <InfoRow key={i} label={name} value={formatTimeDuration(time)} />
          );
        })}

      <Button
        onClick={() => {
          setShowMore(!showMore);
        }}
        fullWidth
        sx={{ mt: 2, mb: 10 }}
        size="small"
        endIcon={showMore ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
      >
        {!showMore ? "View" : "Hide"} More
      </Button>
    </>
  );
}
