import { useState } from "react";
import ReactECharts from "echarts-for-react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
} from "@mui/material";
import { useTheme } from "@emotion/react";

function msToSeconds(ms) {
  if (ms < 1000) {
    return Math.floor((ms / 1000) * 100) / 100;
  }

  return Math.floor((ms / 1000) * 10) / 10;
}

function createObfuscationTimesChart(profileData, theme) {
  const categories = [];
  const times = [];

  Object.keys(profileData?.transforms ?? {}).forEach((transformName) => {
    var transform = profileData.transforms[transformName];

    categories.push(transformName);
    times.push(msToSeconds(transform.transformTime));
  });
  // Chart options
  return {
    title: {
      text: "Obfuscation Times for Each Transform",
      left: "center",
      textStyle: {
        color: theme.palette.text.primary,
      },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: theme.palette.background.paper,
      textStyle: {
        color: theme.palette.text.primary,
      },
    },
    xAxis: {
      type: "category",
      data: categories,
      axisLabel: {
        rotate: 45,
        fontSize: 10,
        color: theme.palette.text.secondary,
      },
      axisLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
    },
    yAxis: {
      type: "value",
      name: "Time (s)", // Add unit to the axis name
      nameTextStyle: {
        color: theme.palette.text.secondary_darker,
      },
      axisLabel: {
        formatter: "{value}s", // Append "S" to each label
        color: theme.palette.text.secondary,
      },
      textStyle: {
        color: theme.palette.text.secondary,
      },
      axisLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
      splitLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
    },
    series: [
      {
        name: "Transform Time",
        type: "bar",
        data: times,
        itemStyle: {
          color: theme.palette.primary.main_darker,
        },
        label: {
          show: true,
          position: "top",
          formatter: "{c}s", // Add "S" to the bar labels
          color: theme.palette.text.primary,
        },
      },
    ],
    textStyle: {
      // Global font style
      fontFamily: theme.typography.fontFamily,
      color: theme.palette.text.primary, // Applies to labels and text elements
    },
    backgroundColor: theme.palette.background.default,
  };
}

function createFileSizeChart(profileData, theme) {
  const transforms = [
    { name: "Source Code", fileSize: profileData.originalSize },
    ...Object.entries(profileData.transforms).map(([key, value]) => ({
      name: key,
      fileSize: value.fileSize,
    })),
  ];

  // Determine the largest file size to decide the unit
  const maxSize = Math.max(...transforms.map((t) => t.fileSize));
  const isMB = maxSize >= 1024 * 1024;
  const unit = isMB ? "mb" : "kb";
  const conversionFactor = isMB ? 1024 * 1024 : 1024;

  const categories = transforms.map((t) => t.name);
  const sizes = transforms.map((t) =>
    t.fileSize < conversionFactor
      ? Math.floor((t.fileSize / conversionFactor) * 10) / 10
      : Math.floor(t.fileSize / conversionFactor)
  );

  // Chart options
  return {
    title: {
      text: "File Size for Each Transform",
      left: "center",
      textStyle: {
        color: theme.palette.text.primary,
      },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: theme.palette.background.paper,
      textStyle: {
        color: theme.palette.text.primary,
      },
      formatter: (params) => {
        const { axisValue, data } = params[0];
        return `${axisValue}: ${data}${unit}`;
      },
    },
    xAxis: {
      type: "category",
      data: categories,
      axisLabel: {
        rotate: 45,
        fontSize: 10,
        color: theme.palette.text.secondary,
      },
      axisLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
    },
    yAxis: {
      type: "value",
      name: `File Size (${unit})`,
      nameTextStyle: {
        color: theme.palette.text.secondary_darker,
      },
      axisLabel: {
        formatter: `{value} ${unit}`,
        color: theme.palette.text.secondary,
      },
      axisLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
      splitLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
    },
    series: [
      {
        name: "File Size",
        type: "line",
        areaStyle: {
          color: theme.palette.primary.main_darker,
          opacity: 0.5,
        },
        symbolSize: 4,
        data: sizes,
        lineStyle: {
          color: theme.palette.primary.main,
        },
        itemStyle: {
          color: theme.palette.primary.main,
        },
        labelLine: {
          lineStyle: {
            color: theme.palette.primary.main,
          },
        },
        label: {
          show: true,
          formatter: `{c}${unit}`,
          position: "top",
          color: theme.palette.text.secondary,
          distance: 10,
        },
        emphasis: {
          disabled: true,
          label: {
            textShadowColor: "#000",
            color: "#fff",
            shadowColor: "#000",
          },
          symbolSize: 0,
          scale: false,
        },
      },
    ],
    textStyle: {
      // Global font style
      fontFamily: theme.typography.fontFamily,
      color: theme.palette.text.primary, // Applies to labels and text elements
    },
    backgroundColor: theme.palette.background.default,
  };
}

function createNodeCountsChart(profileData, theme) {
  // Process the data for chart
  const transformNames = Object.keys(profileData.transforms);
  const functionsData = transformNames.map(
    (name) => profileData.transforms[name].nodeCounts.functions
  );
  const blocksData = transformNames.map(
    (name) => profileData.transforms[name].nodeCounts.blocks
  );
  const controlFlowData = transformNames.map(
    (name) => profileData.transforms[name].nodeCounts.controlFlow
  );

  // Chart options
  return {
    title: {
      show: false,
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    legend: {
      textStyle: {
        color: theme.palette.text.primary,
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: theme.palette.background.paper,
      textStyle: {
        color: theme.palette.text.primary,
      },
    },
    xAxis: {
      type: "value",
      axisLabel: {
        color: theme.palette.text.primary,
      },
      axisLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
      splitLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
    },
    yAxis: {
      type: "category",
      name: "Transforms",
      nameTextStyle: {
        color: theme.palette.text.secondary_darker,
      },
      data: transformNames,
      axisLabel: {
        color: theme.palette.text.secondary,
      },
      axisLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
    },
    series: [
      {
        name: "Functions",
        type: "bar",
        stack: "total",
        label: {
          show: true,
          color: theme.palette.text.primary,
        },
        emphasis: {
          focus: "series",
        },
        data: functionsData,
        itemStyle: {
          color: theme.palette.primary.main,
        },
      },
      {
        name: "Blocks",
        type: "bar",
        stack: "total",
        label: {
          show: true,
          color: "#000",
        },
        emphasis: {
          focus: "series",
        },
        data: blocksData,
        itemStyle: {
          color: theme.palette.warning.main,
        },
      },
      {
        name: "Control Flow",
        type: "bar",
        stack: "total",
        label: {
          show: true,
          color: theme.palette.text.primary,
        },
        emphasis: {
          focus: "series",
        },
        data: controlFlowData,
        itemStyle: {
          color: theme.palette.error.main,
        },
      },
    ],
    textStyle: {
      // Global font style
      fontFamily: theme.typography.fontFamily,
      color: theme.palette.text.primary, // Applies to labels and text elements
    },
    backgroundColor: theme.palette.background.default,
  };
}

function createPerformanceChart(profileData, theme) {
  // Extract data
  const transformNames = ["Original", ...Object.keys(profileData.transforms)];
  let executionTimes = [
    profileData.originalExecutionTime,
    ...Object.values(profileData.transforms).map((t) => t.executionTime),
  ].map((ms) => {
    if (ms >= 1) {
      return Math.floor(ms);
    }

    return Math.floor(ms * 10) / 10;
  });

  // Chart options
  return {
    title: {
      text: "Performance of Each Transform",
      left: "center",
      textStyle: {
        color: theme.palette.text.primary,
      },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: theme.palette.background.paper,
      textStyle: {
        color: theme.palette.text.primary,
      },
    },
    xAxis: {
      type: "category",
      data: transformNames,
      axisLabel: {
        rotate: 45,
        fontSize: 10,
        color: theme.palette.text.secondary,
      },
      axisLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
    },
    yAxis: {
      type: "value",
      name: "Time (ms)", // Add unit to the axis name
      nameTextStyle: {
        color: theme.palette.text.secondary_darker,
      },
      axisLabel: {
        formatter: "{value}ms", // Append "S" to each label
        color: theme.palette.text.secondary,
      },
      textStyle: {
        color: theme.palette.text.secondary,
      },
      axisLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
      splitLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
    },
    series: [
      {
        name: "Execution Time",
        type: "bar",
        data: executionTimes,
        itemStyle: {
          color: theme.palette.primary.main_darker,
        },
        label: {
          show: true,
          position: "top",
          formatter: "{c}ms", // Add "S" to the bar labels
          color: theme.palette.text.primary,
        },
      },
    ],
    textStyle: {
      // Global font style
      fontFamily: theme.typography.fontFamily,
      color: theme.palette.text.primary, // Applies to labels and text elements
    },
    backgroundColor: theme.palette.background.default,
  };
}

export default function InsightsDialog({ open, onClose, profileData }) {
  const theme = useTheme();

  const [tab, setTab] = useState(0);

  const chartOptions = {
    0: createObfuscationTimesChart,
    1: createFileSizeChart,
    2: createNodeCountsChart,
    3: createPerformanceChart,
  }[tab]?.(profileData, theme);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth={true}>
      <DialogTitle component="div">
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
            <Tab label="Obfuscation Times" />
            <Tab label="File Size" />
            <Tab label="Node Counts" />
            {profileData.capturePerformanceInsights && (
              <Tab label="Performance" />
            )}
          </Tabs>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: 0 }}>
        <Box sx={{ minWidth: "600px" }}>
          {chartOptions ? (
            <ReactECharts
              key={tab}
              option={chartOptions}
              style={{ height: "440px", width: "100%" }}
            />
          ) : null}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
