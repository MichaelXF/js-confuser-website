import {
  InsertDriveFile,
  KeyboardArrowDown,
  KeyboardArrowRight,
  KeyboardArrowUp,
} from "@mui/icons-material";
import { Button, Stack, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import {
  camelCaseToTitleCase,
  formatNumberWithCommas,
  formatPercentage,
  formatSize,
  formatTimeDuration,
} from "../../utils/format-utils";
import { downloadJavaScriptFile } from "../../utils/file-utils";

function InfoRow({ label, value, tooltip }) {
  return (
    <Stack direction="row" alignItems="center" mb={"2px"}>
      <Typography color="text.secondary">{label}</Typography>
      <Tooltip title={tooltip} placement="right" disableInteractive={true}>
        <Typography color="white" ml="auto">
          {value}
        </Typography>
      </Tooltip>
    </Stack>
  );
}

export default function EditorPanelDownload({ evaluateCode, activeTab }) {
  const profileData = activeTab?.profileData;
  var avgTransformTime = 0;

  var displayTransforms = [];
  var [showMore, setShowMore] = useState(false);

  if (typeof profileData === "object" && profileData) {
    var { transforms } = profileData;

    // Calculate the average transformation time
    avgTransformTime =
      Object.keys(transforms).reduce(
        (a, b) => transforms[b].transformTime + a,
        0
      ) / Object.keys(transforms).length;

    // Sort the keys based on obfuscation time
    var sortedKeys = Object.keys(transforms);

    sortedKeys.sort(
      (a, b) => transforms[b].transformTime - transforms[a].transformTime
    );

    for (var transformName of sortedKeys) {
      displayTransforms.push({
        transformName: transformName,
        ...transforms[transformName],
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
          value: formatTimeDuration(profileData?.obfuscationTime),
        },
        {
          label: "Original file size",
          value: formatSize(profileData?.originalSize),
        },
        {
          label: "New file size",
          value: formatSize(profileData?.newSize),
        },
        {
          label: "File size increase",
          value: formatPercentage(
            profileData?.newSize / profileData?.originalSize
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
              value: formatTimeDuration(profileData?.parseTime),
            },
            {
              label: "Compile Time",
              value: formatTimeDuration(profileData?.compileTime),
            },
            {
              label: "Transforms",
              value: `${profileData?.totalTransforms}/${profileData?.totalPossibleTransforms}`,
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
        .map(({ transformName, transformTime, changeData }, i) => {
          var tooltip = undefined;

          var keys = Object.keys(changeData || {});
          var allZero =
            keys.length && keys.every((key) => changeData[key] === 0);

          if (keys.length) {
            tooltip = (
              <>
                {Object.keys(changeData).map((key) => {
                  var number = changeData[key];
                  var noun = camelCaseToTitleCase(key);
                  var prefix = `obfuscated`;
                  if (key === "deadCode") {
                    noun = "Dead Code Blocks";
                    prefix = "inserted";
                  }
                  if (key === "variables") {
                    prefix = "renamed";
                  }
                  if (key === "labelsRenamed" || key === "labelsRemoved") {
                    noun = "Labels";
                    prefix = key === "labelsRenamed" ? "renamed" : "removed";
                  }
                  if (key === "objects") {
                    prefix = "extracted";
                  }
                  if (key === "opaquePredicates") {
                    prefix = "created";
                  }

                  if (number === 1 && noun.endsWith("s")) {
                    noun = noun.slice(0, -1);
                  }

                  return (
                    <Typography key={key}>
                      {formatNumberWithCommas(number)} {noun} {prefix}
                    </Typography>
                  );
                })}
              </>
            );
          } else {
            tooltip = <Typography>No change data available</Typography>;
          }

          return (
            <InfoRow
              key={i}
              label={allZero ? <s>{transformName}</s> : transformName}
              value={formatTimeDuration(transformTime)}
              tooltip={tooltip}
            />
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
