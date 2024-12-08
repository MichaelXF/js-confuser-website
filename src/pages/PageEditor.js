import { useCallback, useEffect, useRef, useState } from "react";
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
import { convertOptionsToJS } from "../utils/option-utils";
import presets from "js-confuser/dist/presets";
import useEditorComponent from "../hooks/useEditorComponent";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import useEvalWorker from "../hooks/useEvalWorker";

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
      liveObfuscation: false,
      showSideEditor: false,
    }
  );
  const editorOptionsRef = useRef();
  editorOptionsRef.current = editorOptions;
  const getEditorOptions = () => editorOptionsRef.current;

  const setOptionsJSCode = (value) => {
    optionsJSRef.current = value;
    setOptionsLocalStorageJS(value);

    const foundTab = editorComponent.tabs.find(
      (t) => t.identity === "internal_options"
    );
    if (foundTab) {
      foundTab.setNonDirtyValue(value);
    }
  };

  const [options, setOptionsJSObject] = useState({});
  const optionsRef = useRef();
  optionsRef.current = options;
  const evalWorker = useEvalWorker();

  const setOptions = useCallback((optionsOrFn) => {
    const optionsValue =
      typeof optionsOrFn === "function"
        ? optionsOrFn(optionsRef.current)
        : optionsOrFn;

    // Options is already a JS object
    // Simply store it in local storage and convert to replicate as a module.exports = {...}
    if (typeof optionsValue === "object" && optionsValue !== null) {
      setOptionsJSObject(optionsValue);
      setOptionsJSCode(convertOptionsToJS(optionsValue));
      return;
    }

    // Options is user JavaScript code
    setOptionsJSCode(optionsValue);

    evalWorker
      .evaluateOptions(optionsValue, editorOptionsRef.current)
      .then((optionsObject) => {
        setOptionsJSObject(optionsObject);
      })
      .catch((error) => {
        console.error(error);

        setOptionsJSObject({
          target: null,
          error: error,
        });
      });
  }, []);

  // On mount, load options for first time
  const initRef = useRef(false);
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      setOptions(optionsJS);
    }
  }, []);

  function onEditorError(error) {
    setError(error);
    setShowError(true);
  }

  // Side editor for live obfuscation
  // Maybe more stuff in the future
  const editorComponentSecondary = useEditorComponent({
    optionsJSRef,
    setOptions,
    editorOptionsRef,
    onError: onEditorError,
    onMount() {},
  });

  const editorComponent = useEditorComponent({
    optionsJSRef,
    setOptions,
    editorOptionsRef,
    onError: onEditorError,
    onMount() {
      editorComponent.newTabFromFile("Untitled.js", defaultCode, true);
    },
    sideEditorComponent: editorComponentSecondary,
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
        setOptions(config);
        editorComponent.openOptionsFile();
      }
      // Preset in URL - Update options (Preserve target field)
      if (preset) {
        setOptions((options) => {
          return {
            ...presets[preset],
            target: options.target || "browser",
          };
        });
      }

      if (code || config) {
        setSearchParams({});
      }
    }
  }, [editorComponent.ref.current]);

  const [error, setError] = useState();
  const [showError, setShowError] = useState(false);
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  const [showConsoleDialog, setShowConsoleDialog] = useState(false);

  const evaluateCode = () => {
    let { editor } = editorComponent;

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

  const showSideEditor = editorOptions.showSideEditor;

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
          editorComponent.onMount();
        }}
        setOptions={setOptions}
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
          const searchParams = new URLSearchParams();
          searchParams.set("code", editorComponent.getActiveModel().getValue());
          searchParams.set("config", optionsJS);

          const url =
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

        <PanelGroup direction="horizontal">
          <Panel minSize={30} id="mainEditor" order={1}>
            {editorComponent.element}
          </Panel>
          {showSideEditor && (
            <>
              <PanelResizeHandle />
              <Panel
                collapsible={true}
                minSize={30}
                id="sideEditor"
                order={2}
                onCollapse={() => {
                  setEditorOptions((options) => {
                    return {
                      ...options,
                      showSideEditor: false,
                      liveObfuscation: false,
                    };
                  });
                }}
              >
                {editorComponentSecondary.element}
              </Panel>
            </>
          )}
        </PanelGroup>
      </Box>
    </div>
  );
}
