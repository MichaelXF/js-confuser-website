import { useContext, useState } from "react";
import {
  Button,
  Icon,
  IconButton,
  Modal,
  Panel,
  Radio,
  RadioGroup,
  Row,
  Table,
  Tooltip,
  Whisper,
} from "rsuite";

import { groups, OptionContext } from "../App.js";
import Option from "../components/Option.js";
import Presets from "../presets";

const { Column, HeaderCell, Cell, Pagination } = Table;

export default function Options({ show, onHide }) {
  var { options, setOptions } = useContext(OptionContext);
  var [custom, setCustom] = useState(false);

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header>
        <Modal.Title>Options</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {custom ? (
          <>
            <Button appearance='link' onClick={() => setCustom(false)}>
              Use Preset
            </Button>

            {Object.keys(groups).map((name) => {
              return (
                <Panel bordered className='m-1' style={{ overflowY: "scroll" }}>
                  <h6>{name}</h6>

                  {groups[name].map((option, i) => {
                    var currentValue = option.parentField
                      ? options[option.parentField] &&
                        options[option.parentField][option.name]
                      : options[option.name];

                    return (
                      <div className='option-container'>
                        <Option
                          {...option}
                          initialValue={currentValue}
                          onChange={(value) => {
                            if (option.parentField) {
                              if (!options[option.parentField]) {
                                options[option.parentField] = {};
                              }
                              options[option.parentField][option.name] = value;

                              if (value === false) {
                                delete options[option.parentField][option.name];
                              }
                            } else {
                              options[option.name] = value;
                              if (value === false) {
                                delete options[option.name];
                              }
                            }
                            setOptions({
                              ...options,
                              preset: null,
                            });
                          }}
                        />

                        <small>{option.description}</small>
                      </div>
                    );
                  })}
                </Panel>
              );
            })}
          </>
        ) : (
          <>
            <p className='mb-4'>Choose an obfuscation preset</p>

            <div className='flex items-center'>
              <RadioGroup
                name='radioList'
                inline
                appearance='picker'
                defaultValue={options.preset}
                onChange={(value) => {
                  var cloned = { ...Presets[value] };

                  setOptions({
                    ...options,
                    ...cloned,
                  });
                }}
              >
                <Radio value='low'>Low</Radio>
                <Radio value='medium'>Medium</Radio>
                <Radio value='high'>High</Radio>
              </RadioGroup>
              <Button
                appearance={options.preset ? "default" : "primary"}
                className='ml-auto'
                onClick={() => setCustom(true)}
              >
                <span className='flex items-center'>
                  <Icon icon='cog' className='mr-1' />
                  Custom Preset
                </span>
              </Button>
            </div>

            <Table
              className='mt-6'
              data={[
                {
                  preset: "Low",
                  performance: "-5% to -10%",
                  sample: <a href=''>Sample</a>,
                },
                {
                  preset: "Medium",
                  performance: "-20% to -30%",
                  sample: <a href=''>Sample</a>,
                },
                {
                  preset: "High",
                  performance: "-50% to -70%",
                  sample: <a href=''>Sample</a>,
                },
              ]}
            >
              <Column width={130} align='center' fixed>
                <HeaderCell>Preset</HeaderCell>
                <Cell dataKey='preset' />
              </Column>

              <Column width={200}>
                <HeaderCell>Performance Hit</HeaderCell>
                <Cell dataKey='performance' />
              </Column>

              <Column width={100}>
                <HeaderCell>Sample</HeaderCell>
                <Cell dataKey='sample' />
              </Column>
            </Table>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onHide} appearance='primary'>
          Save
        </Button>
        <Button onClick={onHide} appearance='subtle'>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
