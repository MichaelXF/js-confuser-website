import { useEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";
import { defaultCode, defaultOptionsJS, LocalStorageKeys } from "../constants";

// Hooks for the JSConfuser and Code Worker
import useCodeWorker from "../hooks/useCodeWorker";
import useSEO from "../hooks/useSEO";

import { useLocalStorage } from "usehooks-ts";
import { useSearchParams } from "react-router-dom";

// Editor Components
import EditorPanel from "../components/editor/EditorPanel";
import EditorNav from "../components/editor/EditorNav";
import EditorFileDrop from "../components/editor/EditorFileDrop";

import OptionsDialog from "../components/dialogs/OptionsDialog";
import ConsoleDialog from "../components/dialogs/ConsoleDialog";
import ErrorDialog from "../components/dialogs/ErrorDialog";

// Obfuscator Options
import { convertOptionsToJS, evaluateOptionsOrJS } from "../utils/option-utils";
import presets from "js-confuser/dist/presets";
import useEditorComponent from "../hooks/useEditorComponent";

export default function PageEditor() {
  useSEO(
    "JS-Confuser Editor",
    "A JavaScript obfuscator that runs in your browser."
  );

  const codeWorker = useCodeWorker();

  const [params, setSearchParams] = useSearchParams();

  const [optionsJS, setOptionsLocalStorageJS] = useLocalStorage(
    LocalStorageKeys.JsConfuserOptionsJS,
    defaultOptionsJS
  );

  const optionsJSRef = useRef();
  optionsJSRef.current = optionsJS;

  const [editorOptions, setEditorOptions] = useLocalStorage(
    LocalStorageKeys.JsConfuserEditorOptions,
    {
      formatOnSave: true,
      saveToBrowser: true,
      captureInsights: false,
      capturePerformanceInsights: false,
      performanceIterations: 10,
    }
  );
  const editorOptionsRef = useRef();
  editorOptionsRef.current = editorOptions;
  const getEditorOptions = () => editorOptionsRef.current;

  const setOptionsJS = (value) => {
    optionsJSRef.current = value;
    setOptionsLocalStorageJS(value);

    var found = editorComponent.tabs.find(
      (t) => t.identity === "internal_options"
    );
    if (found) {
      found.setNonDirtyValue(value);
    }
  };

  const editorComponent = useEditorComponent({
    optionsJSRef,
    setOptionsJS,
    editorOptionsRef,
    onError: (error) => {
      setError(error);
      setShowError(true);
    },
  });

  useEffect(() => {
    if (editorComponent.ref.current) {
      var code = params.get("code");
      var config = params.get("config");
      var preset = params.get("preset");

      if (code) {
        let model = editorComponent.editor.getModel();

        model.setNonDirtyValue(code);
      }
      if (config) {
        setOptionsJS(config);
        editorComponent.openOptionsFile();
      }
      if (preset) {
        setOptions(presets[preset]);
      }

      if (code || config) {
        setSearchParams({});
      }
    }
  }, [editorComponent.ref.current]);

  const options = useMemo(() => {
    return evaluateOptionsOrJS(optionsJS);
  }, [optionsJS]);

  const setOptions = (optionsOrFn) => {
    var optionsValue =
      typeof optionsOrFn === "function" ? optionsOrFn(options) : optionsOrFn;
    var newOptionsJS = convertOptionsToJS(optionsValue);

    setOptionsJS(newOptionsJS);
  };

  var [error, setError] = useState();

  if (options.error) {
    error = {
      errorString: "Invalid JSConfuser Options",
      errorStack: options.error,
    };
  }

  var [showError, setShowError] = useState(false);
  var [showOptionsDialog, setShowOptionsDialog] = useState(false);
  var [showConsoleDialog, setShowConsoleDialog] = useState(false);

  const evaluateCode = () => {
    const { editor } = editorComponent;
    var model = editor?.getModel();
    if (model.title === "JSConfuser.ts") {
      model.saveContent();

      editorComponent
        .obfuscateCode()
        .then((success) => {
          if (success) {
            evaluateCode();
          }
        })
        .catch(() => {
          // Should never happen
          alert("Failed to obfuscate code");
        });
      return;
    }

    // Purposely making my code IMPOSSIBLE for AI to understand
    // Nope, this is just using a unique key which triggers ->
    // Re-render -> Console Dialog Re-render -> Console Re-evaluates code
    setShowConsoleDialog({});
  };

  const convertCode = async () => {
    const { editor } = editorComponent;
    if (!editor) return;

    const code = editor.getValue();

    codeWorker
      .convertTSCodeToJSCode(code)
      .then((jsCode) => {
        editorComponent.newTab(jsCode, "Output.js");
      })
      .catch((err) => {
        setShowError(true);
        setError({
          errorString: err.toString(),
          errorStack: err.stack,
        });
      });
  };

  // Function to close all modals
  const closeModals = () => {
    // Close all modals
    setShowError(false);
    setShowOptionsDialog(false);
    setShowConsoleDialog(false);
  };

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <OptionsDialog
        open={showOptionsDialog}
        onClose={() => {
          setShowOptionsDialog(false);
        }}
        options={options}
        setOptions={setOptions}
      />

      <ConsoleDialog
        open={showConsoleDialog}
        getEditorOptions={getEditorOptions}
        onClose={() => {
          setShowConsoleDialog(false);
          requestAnimationFrame(() => {
            const { editor } = editorComponent;
            if (editor) {
              editor.focus();
            }
          });
        }}
        getEditorCode={() => {
          return editorComponent.getSelectedTextOrFullContent();
        }}
      />

      <ErrorDialog
        open={showError}
        onClose={() => {
          setShowError(false);
        }}
        error={error}
      />

      <EditorNav
        getEditorOptions={getEditorOptions}
        setEditorOptions={setEditorOptions}
        evaluateCode={evaluateCode}
        resetEditor={() => {
          editorComponent.setTabs([]);
          editorComponent.newTab(defaultCode, "Untitled.js");
        }}
        setOptionsJS={setOptionsJS}
        codeWorker={codeWorker}
        convertCode={convertCode}
        closeModals={closeModals}
        editorComponent={editorComponent}
        focusEditor={() => {
          requestAnimationFrame(() => {
            const { editor } = editorComponent;
            if (editor) {
              editor.focus();
            }
          });
        }}
        shareURL={() => {
          var searchParams = new URLSearchParams();
          searchParams.set("code", editorComponent.getActiveModel().getValue());
          searchParams.set("config", optionsJS);

          var url =
            window.location.origin +
            window.location.pathname +
            "?" +
            searchParams.toString();

          window.navigator.clipboard.writeText(url);
        }}
      />

      <EditorFileDrop newTab={editorComponent.newTab} />

      {editorComponent.overlayElement}

      <Box display="flex" height="calc(100vh - 40px)">
        <EditorPanel
          options={options}
          setOptions={setOptions}
          openOptionsDialog={() => {
            setShowOptionsDialog(true);
          }}
          evaluateCode={evaluateCode}
          convertCode={convertCode}
          editorComponent={editorComponent}
        />
        {editorComponent.element}
      </Box>
    </div>
  );
}
