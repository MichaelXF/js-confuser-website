import { Button, Modal } from "rsuite";
import { OptionContext } from "../App";
import { useContext } from "react";

export default function ModalConfig({show, onHide}){
  
  var {options} = useContext(OptionContext);

  var orderedKeys = Object.keys(options).sort();
  var display = Object.create(null);

  orderedKeys.forEach(x=>options[x] ? display[x] = options[x] : undefined);
  delete display.globalVariables;

  if ( display.lock && Object.keys(display.lock).filter(x=>!display.lock[x] || !display.lock[x].length).length == 0 ) {
    delete display.lock;
  }


  return <Modal show={show} onHide={onHide}>

    <Modal.Header>
        <Modal.Title>Config</Modal.Title>
      </Modal.Header>
    <Modal.Body>
    
      <pre>
        {JSON.stringify(display, null, 4)}
      </pre>

    </Modal.Body>
    <Modal.Footer>
      <Button onClick={onHide} appearance="subtle">
        Close
      </Button>
    </Modal.Footer>
  </Modal>

};