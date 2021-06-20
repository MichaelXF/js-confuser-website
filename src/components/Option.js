import { useState, useMemo } from "react";
import {
  Button,
  Checkbox,
  DatePicker,
  Dropdown,
  Input,
  InputNumber,
  Tag,
  TagGroup,
  Toggle,
  Animation,
} from "rsuite";
import "./Option.scss";

const toTitleCase = (camelCase) =>
  camelCase
    .replace(/([A-Z])/g, (match) => ` ${match}`)
    .replace(/^./, (match) => match.toUpperCase())
    .trim();

export default function Option({
  name,
  displayName,
  type = "probability",
  modes,
  initialValue = false,
  onChange,
}) {
  var displayName = displayName || toTitleCase(name + "");

  var [value, setValue] = useState(initialValue);
  var [percentEditor, setPercentEditor] = useState(
    typeof initialValue === "number"
  );

  var [adding, setAdding] = useState(type == "regex[]" ? "/domain\\.com/" : "");

  function updateValue(newValue) {
    if (newValue === undefined) {
      throw new Error("undefined from " + type + " '" + name + "'");
    }

    if (newValue !== value) {
      setValue(newValue);
      onChange(newValue);
    }
  }

  if (type == "probability") {
    if (!modes) {
      if (percentEditor) {
        return (
          <div className='option option-checkbox'>
            <div className='flex'>
              <Checkbox
                onChange={() => {
                  updateValue(false);
                  setPercentEditor(false);
                }}
                indeterminate={true}
              >
                {" "}
                {displayName}
              </Checkbox>
              <InputNumber
                step={2}
                min={0}
                max={100}
                className='ml-2'
                defaultValue={value * 100}
                style={{ width: "120px" }}
                onChange={(value) => {
                  updateValue(value / 100);
                }}
                postfix='%'
              />
            </div>
          </div>
        );
      }
      return (
        <div className='option option-checkbox'>
          <div className='flex'>
            <Checkbox
              onChange={(_value, checked) => updateValue(checked)}
              defaultChecked={value}
            >
              {" "}
              {displayName}
            </Checkbox>
            <Button
              onClick={() => {
                updateValue(1);
                setPercentEditor(true);
              }}
              className='ml-2'
              size='sm'
              appearance='link'
            >
              Percent (%)
            </Button>
          </div>
        </div>
      );
    } else {
      return (
        <div className='option'>
          <p>{displayName}</p>
          <Dropdown
            className='my-1'
            title={
              toTitleCase(
                typeof value === "object"
                  ? Object.keys(value)
                      .map(
                        (x) =>
                          toTitleCase(x) +
                          ": " +
                          Math.floor(value[x] * 100) +
                          "%"
                      )
                      .join(", ")
                  : value + ""
              ) || "Choose one"
            }
          >
            {modes.map((x) => {
              return (
                <Dropdown.Item
                  onSelect={() => {
                    updateValue(x);
                  }}
                >
                  {toTitleCase(x)}
                </Dropdown.Item>
              );
            })}
          </Dropdown>
        </div>
      );
    }
  }
  if (type == "date") {
    return (
      <div className='option'>
        <div className='flex items-center mt-3'>
          <p className='mr-2'>{displayName}</p>

          <DatePicker
            value={value}
            onChange={(date) => {
              updateValue(date);
            }}
          />
        </div>
      </div>
    );
  } else if (type == "boolean") {
    return (
      <div className='option option-checkbox'>
        <Checkbox
          onChange={(_value, checked) => updateValue(checked)}
          defaultChecked={initialValue}
        >
          {" "}
          {displayName}
        </Checkbox>
      </div>
    );
  } else if (type == "number") {
    return (
      <div className='option'>
        <p>{displayName}</p>
        <InputNumber onChange={updateValue} />
      </div>
    );
  } else if (type == "regex[]") {
    var valid = adding.startsWith("/");

    return (
      <div className='option mb-3'>
        <div className='flex'>
          <p className='mb-1'>{displayName}</p>
          <small className='ml-auto'>
            <a href='https://regexr.com/' target='_blank'>
              Learn Regex
            </a>
          </small>
        </div>

        <div className='mb-2'>
          <div className='flex items-center'>
            <Input
              placeholder='/^domain.com$/g'
              defaultValue={adding}
              onChange={setAdding}
            ></Input>
            <Button
              appearance='primary'
              className='ml-2 flex-shrink-0'
              onClick={() => {
                if (!value) {
                  value = [];
                }
                value.push(adding);
                updateValue([...value]);
              }}
            >
              Add Regex
            </Button>
          </div>

          <div className='mt-2'>
            <Animation.Collapse in={!valid}>
              <p className='text-danger'>Invalid Regex.</p>
            </Animation.Collapse>
          </div>
        </div>

        <div className='mb-2'>
          <TagGroup>
            {(value || []).map((x, i) => {
              return (
                <Tag
                  closable
                  onClose={() => {
                    value.splice(i, 1);
                    updateValue([...value]);
                  }}
                >
                  {x}
                </Tag>
              );
            })}
          </TagGroup>
        </div>
      </div>
    );
  } else if (type == "string") {
    return (
      <div className='option mb-3'>
        <div className='flex'>
          <p>{displayName}</p>
        </div>

        <div className='mb-2'>
          <Input
            placeholder='onLockTriggered'
            defaultValue={adding}
            onChange={updateValue}
          ></Input>
        </div>
      </div>
    );
  } else if (type == "array") {
    var valueSet = new Set(value || []);
    var possibleValues = modes.filter((mode) => !valueSet.has(mode));

    return (
      <div className='option mb-3'>
        <p>{displayName}</p>

        <div className='mt-1 mb-2 flex'>
          <TagGroup>
            {(value || []).map((x, i) => {
              return (
                <Tag
                  closable
                  onClose={() => {
                    value.splice(i, 1);
                    updateValue([...value]);
                  }}
                >
                  {x}
                </Tag>
              );
            })}
          </TagGroup>

          <Dropdown
            appearance='default'
            title='Add'
            size='sm'
            placement='bottomEnd'
            disabled={possibleValues.length === 0}
            className='ml-auto'
          >
            {possibleValues.map((mode) => {
              return (
                <Dropdown.Item
                  onSelect={() => {
                    updateValue([...(value || []), mode]);
                  }}
                >
                  {toTitleCase(mode)}
                </Dropdown.Item>
              );
            })}
          </Dropdown>
        </div>
      </div>
    );
  }

  return null;
}
