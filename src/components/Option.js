import { useState, useMemo } from "react";
import { QuestionMarkCircleIcon } from "@heroicons/react/solid";
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
  Tooltip,
  Whisper,
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
  description,
}) {
  var displayName = displayName || toTitleCase(name + "");

  var titleComponent = (
    <div className='flex items-center mb-1'>
      {displayName}

      <div className='ml-1 leading-none'>
        <Whisper
          placement='top'
          trigger='hover'
          speaker={<Tooltip>{description}</Tooltip>}
        >
          <QuestionMarkCircleIcon className='h-4 w-4 text-gray-500 inline-block' />
        </Whisper>
      </div>
    </div>
  );

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
            <div className='flex items-center'>
              <Checkbox
                onChange={() => {
                  updateValue(false);
                  setPercentEditor(false);
                }}
                indeterminate={true}
              >
                {" "}
                {titleComponent}
              </Checkbox>
              <InputNumber
                size='sm'
                step={2}
                min={0}
                max={100}
                className='ml-2'
                defaultValue={value * 100}
                style={{ width: "120px", height: 30 }}
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
              {titleComponent}
            </Checkbox>
            <Button
              onClick={() => {
                updateValue(1);
                setPercentEditor(true);
              }}
              className='ml-1'
              size='sm'
              appearance='link'
              style={{
                marginBottom: "3px",
              }}
            >
              %
            </Button>
          </div>
        </div>
      );
    } else {
      return (
        <div className='option'>
          <div className='mb-2'>{titleComponent}</div>
          <Dropdown
            appearance='ghost'
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
            {modes.map((x, i) => {
              return (
                <Dropdown.Item
                  onSelect={() => {
                    updateValue(x);
                  }}
                  key={i}
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
        <div className='mb-2'>{titleComponent}</div>

        <DatePicker
          value={value}
          onChange={(date) => {
            updateValue(date);
          }}
        />
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
          {titleComponent}
        </Checkbox>
      </div>
    );
  } else if (type == "number") {
    return (
      <div className='option'>
        <div className='mb-2'>{titleComponent}</div>
        <InputNumber onChange={updateValue} />
      </div>
    );
  } else if (type == "regex[]") {
    var valid = adding.startsWith("/");

    return (
      <div className='option pb-2'>
        {titleComponent}

        <div className='my-2'>
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
                  key={i}
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
          <p>{titleComponent}</p>
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
        <p>{titleComponent}</p>

        <div className='mt-1 mb-2 flex'>
          <TagGroup>
            {(value || []).map((x, i) => {
              return (
                <Tag
                  key={i}
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
                  key={mode}
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
