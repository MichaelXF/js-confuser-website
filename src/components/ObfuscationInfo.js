import {
  Box,
  Button,
  Divider,
  Flex,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "@chakra-ui/react";
import { ArrowDownIcon, ArrowUpIcon, InfoIcon } from "@chakra-ui/icons";
import { useState } from "react";

const formatTime = (ms) => {
  if (ms > 1000 * 60) {
    return Math.floor(ms / 1000 / 60).toLocaleString() + "m";
  }

  return (Math.floor((ms / 1000) * 100) / 100).toLocaleString() + "s";
};
const formatSize = (b) => {
  if (b > 1000 * 1000) {
    return Math.floor(b / 1000 / 1000).toLocaleString() + "mb";
  }
  return Math.floor(b / 1000).toLocaleString() + "kb";
};
const formatPercentage = (p) => Math.floor(p * 100).toLocaleString() + "%";

// The ObfuscationInfo popover shows relevant information about the obfuscation such as times, transforms, and file size
export default function ObfuscationInfo({ obfuscationInfo }) {
  var avgTransformTime = 0;

  var displayTransforms = [];
  var [showMore, setShowMore] = useState(false);

  if (typeof obfuscationInfo === "object") {
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
    <Popover trigger="hover" placement="top">
      <PopoverTrigger>
        <Box p={2} cursor="pointer">
          <InfoIcon color="gray.400" />
        </Box>
      </PopoverTrigger>
      <PopoverContent fontSize="sm">
        <PopoverArrow />
        <PopoverBody color="gray.300">
          <Text color="white" fontWeight="bold" fontSize="lg" mb={2}>
            Obfuscation Info
          </Text>

          <Flex align="center">
            <Text>Obfuscation Time</Text>
            <Text color="white" ml="auto">
              {formatTime(obfuscationInfo.obfuscationTime)}
            </Text>
          </Flex>
          <Flex align="center">
            <Text>Original file size</Text>
            <Text color="white" ml="auto">
              {formatSize(obfuscationInfo.originalSize)}
            </Text>
          </Flex>
          <Flex align="center">
            <Text>New file size</Text>
            <Text color="white" ml="auto">
              {formatSize(obfuscationInfo.newSize)}
            </Text>
          </Flex>
          <Flex align="center">
            <Text>File size increase</Text>
            <Text color="white" ml="auto">
              {formatPercentage(
                obfuscationInfo.newSize / obfuscationInfo.originalSize
              )}
            </Text>
          </Flex>

          {showMore ? (
            <>
              <Flex align="center">
                <Text>Avg. Transform Time</Text>
                <Text color="white" ml="auto">
                  {formatTime(avgTransformTime)}
                </Text>
              </Flex>
              <Flex align="center">
                <Text>Parse Time</Text>
                <Text color="white" ml="auto">
                  {formatTime(obfuscationInfo.parseTime)}
                </Text>
              </Flex>
              <Flex align="center">
                <Text>Compile Time</Text>
                <Text color="white" ml="auto">
                  {formatTime(obfuscationInfo.compileTime)}
                </Text>
              </Flex>
              <Flex align="center">
                <Text>Transforms</Text>
                <Text color="white" ml="auto">
                  {obfuscationInfo.totalTransforms}/
                  {obfuscationInfo.totalPossibleTransforms}
                </Text>
              </Flex>
            </>
          ) : null}

          <Divider my={2} />

          <Text color="white" fontWeight="bold" fontSize="lg" mb={2}>
            Transforms
          </Text>

          {displayTransforms
            .slice(0, showMore ? displayTransforms.length : 3)
            .map(({ name, time }, i) => {
              return (
                <Flex align="center" key={i}>
                  <Text>{name}</Text>
                  <Text color="white" ml="auto">
                    {formatTime(time)}
                  </Text>
                </Flex>
              );
            })}

          <Box mt={2} mb={2} textAlign="center">
            <Button
              variant="link"
              colorScheme="blue"
              size="sm"
              rightIcon={showMore ? <ArrowUpIcon /> : <ArrowDownIcon />}
              onClick={() => {
                setShowMore(!showMore);
              }}
            >
              {!showMore ? "View more" : "View less"}
            </Button>
          </Box>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
