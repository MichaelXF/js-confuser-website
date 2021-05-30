import { presets } from "js-confuser";

const object = {
  low: { ...presets.low, compact: false },
  medium: { ...presets.medium, compact: false },
  high: { ...presets.high, compact: false },
};
export default object;
