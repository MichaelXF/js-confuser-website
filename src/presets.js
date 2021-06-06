import { presets } from "js-confuser";

const object = {
  low: { ...presets.low, target: "browser" },
  medium: { ...presets.medium, target: "browser" },
  high: { ...presets.high, target: "browser" },
};
export default object;
