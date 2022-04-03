import { useContext, useState, useEffect } from "react";
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

import { OptionContext } from "../App.js";
import { groups } from "../groups";

import Option from "../components/Option.js";
import Presets from "../presets";

const { Column, HeaderCell, Cell, Pagination } = Table;

export default function ModalOptions({ show, onHide }) {
  var { options, setOptions } = useContext(OptionContext);
  var [custom, setCustom] = useState(false);
  var [oldOptions, setOldOptions] = useState();

  useEffect(() => {
    if (show) {
      setOldOptions({ ...options });
    }
  }, [!!show]);

  return (
    <Modal show={show} onHide={onHide} size={custom ? "md" : "sm"}>
      <Modal.Header>
        <Modal.Title>Options</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {custom ? (
          <>
            <a
              className='m-4 link cursor-pointer'
              onClick={() => setCustom(false)}
            >
              Back
            </a>

            {Object.keys(groups).map((name, i) => {
              return (
                <div className='group-container p-4 rounded' key={i}>
                  <h6 className='mb-1'>{name}</h6>

                  {groups[name].map((option, i) => {
                    var currentValue = option.parentField
                      ? options[option.parentField] &&
                        options[option.parentField][option.name]
                      : options[option.name];

                    return (
                      <div className='option-container' key={i}>
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
                      </div>
                    );
                  })}
                  <hr />
                </div>
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
                  performance: "30%",
                  sample: (
                    <a
                      href='https://github.com/MichaelXF/js-confuser/blob/master/samples/low.js'
                      target='_blank'
                    >
                      Sample
                    </a>
                  ),
                },

                {
                  preset: "Medium",
                  performance: "52%",
                  sample: (
                    <a
                      href='https://github.com/MichaelXF/js-confuser/blob/master/samples/medium.js'
                      target='_blank'
                    >
                      Sample
                    </a>
                  ),
                },
                {
                  preset: "High",
                  performance: "98%",
                  sample: (
                    <a
                      href='https://github.com/MichaelXF/js-confuser/blob/master/samples/high.js'
                      target='_blank'
                    >
                      Sample
                    </a>
                  ),
                },
              ]}
            >
              <Column width={130} align='center' fixed>
                <HeaderCell>Preset</HeaderCell>
                <Cell dataKey='preset' />
              </Column>

              <Column width={200}>
                <HeaderCell>Performance Reduction</HeaderCell>
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
        <Button
          onClick={() => {
            onHide();
            setOptions(oldOptions);
          }}
          appearance='subtle'
        >
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
