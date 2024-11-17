import { useEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";
import { defaultCode, defaultOptionsJS, LocalStorageKeys } from "../constants";

// Hooks for the JSConfuser and Code Worker
import useJSConfuser from "../hooks/useJSConfuser";
import useCodeWorker from "../hooks/useCodeWorker";
import useSEO from "../hooks/useSEO";

// File Storage And Settings
import { getObfuscatedFileName } from "../utils/file-utils";
import { useLocalStorage } from "usehooks-ts";
import { useSearchParams } from "react-router-dom";

// Editor Components
import EditorPanel from "../components/editor/EditorPanel";
import EditorNav from "../components/editor/EditorNav";
import EditorFileDrop from "../components/editor/EditorFileDrop";

import OptionsDialog from "../components/dialogs/OptionsDialog";
import ConsoleDialog from "../components/dialogs/ConsoleDialog";
import ErrorDialog from "../components/dialogs/ErrorDialog";
import LoadingBackdrop from "../components/dialogs/LoadingBackdrop";

// Obfuscator Options
import { convertOptionsToJS, evaluateOptionsOrJS } from "../utils/option-utils";
import presets from "js-confuser/dist/presets";
import useEditorComponent from "../hooks/useEditorComponent";

export default function PageEditor() {
  useSEO(
    "JS-Confuser Editor",
    "A JavaScript obfuscator that runs in your browser."
  );

  const JSConfuser = useJSConfuser();
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

  var [loadingInfo, setLoadingInfo] = useState({ progress: "", percent: "" });

  var [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  var [showError, setShowError] = useState(false);
  var [showOptionsDialog, setShowOptionsDialog] = useState(false);
  var [showConsoleDialog, setShowConsoleDialog] = useState(false);

  /**
   * Obfuscates the user's code
   */
  const obfuscateCode = () => {
    const { tabs } = editorComponent;

    if (tabs.length === 0) {
      alert("Please open a file to obfuscate");
      return;
    }

    let activeModel = editorComponent.getActiveModel();

    return new Promise((resolve, reject) => {
      // Get the current value from the editor
      let originalCode = activeModel.getValue();

      try {
        // Obfuscate the code using JS-Confuser
        JSConfuser.obfuscate(originalCode, optionsJSRef.current, {
          onComplete: (data) => {
            setShowLoadingOverlay(false);

            var { code, profileData } = data;

            var outputFileName = getObfuscatedFileName(activeModel.title);

            var model = editorComponent.newTab(code, outputFileName);
            model.profileData = profileData;

            resolve(true);
          },
          onError: (data) => {
            setShowLoadingOverlay(false);
            setError({
              errorString: data.errorString,
              errorStack: data.errorStack,
            });
            setShowError(true);

            resolve(false);
          },
          onProgress: (data) => {
            setLoadingInfo({
              progress:
                (data.nextTransform || data.currentTransform) +
                " (" +
                data.index +
                "/" +
                data.totalTransforms +
                ")",
              percent: data.index / data.totalTransforms,
            });
          },
        });
        setLoadingInfo({ progress: "Starting...", percent: 0 });
        setShowLoadingOverlay(true);
        setShowError(false);
      } catch (error) {
        resolve(false);
        console.error("Obfuscation failed:", error);
      }
    });
  };

  const evaluateCode = () => {
    const { editor } = editorComponent;
    var model = editor?.getModel();
    if (model.title === "JSConfuser.ts") {
      model.saveContent();

      obfuscateCode()
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
      <LoadingBackdrop
        open={showLoadingOverlay}
        loadingInfo={loadingInfo}
        handleClose={() => {}}
        onCancel={() => {
          JSConfuser.cancel();
          setShowLoadingOverlay(false);
        }}
      />

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
        obfuscateCode={obfuscateCode}
        evaluateCode={evaluateCode}
        resetEditor={() => {
          editorComponent.setTabs([]);
          editorComponent.newTab(defaultCode, "Untitled.js");
        }}
        setOptionsJS={setOptionsJS}
        preObfuscationAnalysis={() => {
          JSConfuser.preObfuscationAnalysis(
            editorComponent.getActiveModel().getValue()
          )
            .then((data) => {
              var map = new Map(data.nodes);

              var display = {};

              for (var [key, value] of map) {
                if (key.type === "FunctionDeclaration") {
                  display[key.id.name] = value;
                }
              }

              editorComponent.newTab(
                JSON.stringify(display, null, 2),
                "PreObfuscation.json"
              );
            })
            .catch((err) => {
              setShowError(true);
              setError({
                errorString: err.toString(),
                errorStack: err.stack,
              });
            });
        }}
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

      <Box display="flex" height="calc(100vh - 40px)">
        <EditorPanel
          options={options}
          setOptions={setOptions}
          obfuscateCode={obfuscateCode}
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
