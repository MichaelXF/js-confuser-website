import { Panel } from "rsuite";

export default function Group({ options = [], label = "" }) {
  return (
    <Panel>
      <h3>{label}</h3>

      {options}
    </Panel>
  );
}
