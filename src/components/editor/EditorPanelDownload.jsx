import {
  East,
  InsertDriveFile,
  KeyboardArrowDown,
  KeyboardArrowRight,
  KeyboardArrowUp,
  OpenInNew,
} from "@mui/icons-material";
import { Box, Button, Link, Stack, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import {
  camelCaseToTitleCase,
  formatNumberWithCommas,
  formatPercentage,
  formatSize,
  formatTimeDuration,
} from "../../utils/format-utils";
import { downloadJavaScriptFile } from "../../utils/file-utils";
import InsightsDialog from "../dialogs/InsightsDialog";

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

export default function EditorPanelDownload({ evaluateCode, editorComponent }) {
  const { activeTab } = editorComponent;

  const profileData = activeTab?.profileData;
  let avgTransformTime = 0;

  const displayTransforms = [];
  const [showMore, setShowMore] = useState(false);

  if (typeof profileData === "object" && profileData) {
    const { transforms } = profileData;

    // Calculate the average transformation time
    avgTransformTime =
      Object.keys(transforms).reduce(
        (a, b) => transforms[b].transformTime + a,
        0
      ) / Object.keys(transforms).length;

    // Sort the keys based on obfuscation time
    const sortedKeys = Object.keys(transforms);

    sortedKeys.sort(
      (a, b) => transforms[b].transformTime - transforms[a].transformTime
    );

    for (const transformName of sortedKeys) {
      displayTransforms.push({
        transformName: transformName,
        ...transforms[transformName],
      });
    }
  }

  const getPercentChange = (originalValue, newValue) => {
    return (newValue - originalValue) / originalValue || 0;
  };

  const fileSizeIncrease = getPercentChange(
    profileData?.originalSize,
    profileData?.newSize
  );

  const [showInsights, setShowInsights] = useState(false);

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

      {profileData?.captureInsights ? (
        <>
          <InsightsDialog
            open={showInsights}
            onClose={() => {
              setShowInsights(false);
            }}
            profileData={profileData}
          />
          <Box my={4} textAlign="center">
            <Link
              href="#"
              sx={{
                cursor: "pointer",
                wordBreak: "break-word",
                width: "max-content",
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                setShowInsights(true);
              }}
            >
              View In-Depth Insights
              <OpenInNew sx={{ ml: "4px", transform: "translateY(3px)" }} />
            </Link>
          </Box>
        </>
      ) : null}

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
          value: formatPercentage(fileSizeIncrease),
        },
      ].map(({ label, value }, i) => {
        return <InfoRow key={i} label={label} value={value} />;
      })}

      {showMore
        ? [
            ...(profileData?.capturePerformanceInsights
              ? [
                  {
                    label: "Original performance",
                    value: formatTimeDuration(
                      profileData?.originalExecutionTime,
                      true
                    ),
                  },
                  {
                    label: "New performance",
                    value: formatTimeDuration(
                      profileData?.newExecutionTime,
                      true
                    ),
                  },
                  {
                    label: "Performance reduction",
                    value: formatPercentage(
                      -getPercentChange(
                        profileData?.originalExecutionTime,
                        profileData?.newExecutionTime
                      )
                    ),
                  },
                ]
              : []),

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
          var tooltip = null;

          var keys = Object.keys(changeData || {});
          var allZero =
            keys.length && keys.every((key) => changeData[key] === 0);

          if (profileData?.captureInsights) {
            const transformNames = Object.keys(profileData.transforms);
            let transformNameIndex = transformNames.indexOf(transformName);
            if (transformNameIndex !== -1) {
              let beforeTransformInfo =
                transformNameIndex === 0
                  ? {
                      fileSize: profileData.originalSize,
                      executionTime: profileData.originalExecutionTime,
                    }
                  : profileData.transforms?.[
                      transformNames[transformNameIndex - 1]
                    ];
              let transformInfo = profileData.transforms?.[transformName];

              let performanceTitle =
                "Performance " +
                (transformInfo.executionTime < beforeTransformInfo.executionTime
                  ? "improvement"
                  : "reduction");

              let createSection = (
                title,
                originalValue,
                newValue,
                formatFn,
                flipPercent = false
              ) => {
                let percentChange = getPercentChange(originalValue, newValue);
                if (flipPercent) {
                  percentChange = -percentChange;
                }

                return (
                  <Box mb={1}>
                    <Typography>
                      {title}: {formatPercentage(percentChange, true)}
                    </Typography>

                    <Stack direction="row" alignItems="center" mt="2px">
                      <Box
                        bgcolor="custom_error_alpha"
                        color="custom_error"
                        px="6px"
                        pt="2px"
                        borderRadius="4px"
                        size="small"
                        children={formatFn(originalValue)}
                      />
                      <East sx={{ mx: 1 }} />

                      <Box
                        bgcolor="custom_success_alpha"
                        color="custom_success"
                        px="6px"
                        pt="2px"
                        borderRadius="4px"
                        children={formatFn(newValue)}
                      />
                    </Stack>
                  </Box>
                );
              };

              tooltip = (
                <>
                  {createSection(
                    "File size",
                    beforeTransformInfo.fileSize,
                    transformInfo.fileSize,
                    formatSize
                  )}

                  {profileData?.capturePerformanceInsights &&
                    createSection(
                      performanceTitle,
                      beforeTransformInfo.executionTime,
                      transformInfo.executionTime,
                      (ms) => formatTimeDuration(ms, true),
                      true
                    )}
                </>
              );
            }
          }

          if (keys.length) {
            tooltip = (
              <>
                {tooltip ? tooltip : null}
                {Object.keys(changeData).map((key) => {
                  const number = changeData[key];
                  let noun = camelCaseToTitleCase(key);
                  let prefix = `obfuscated`;
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
                  if (key === "decryptionFunctions") {
                    prefix = "created";
                  }
                  if (key === "locksInserted") {
                    noun = "Locks";
                    prefix = "inserted";
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
          }

          // No change data or insights available
          if (!tooltip) {
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
