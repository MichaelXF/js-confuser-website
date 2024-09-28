import { useEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";
import { defaultCode, defaultOptionsJS, LocalStorageKeys } from "../constants";

// Hooks for the JSConfuser and Code Worker
import useJSConfuser from "../hooks/useJSConfuser";
import useCodeWorker from "../hooks/useCodeWorker";
import useSEO from "../hooks/useSEO";

// File Storage And Settings
import {
  getFileExtension,
  getLanguageFromFileExtension,
  getObfuscatedFileName,
  saveFileToIndexedDB,
} from "../utils/file-utils";
import { useLocalStorage } from "usehooks-ts";
import { useSearchParams } from "react-router-dom";

// Editor Components
import EditorPanel from "../components/editor/EditorPanel";
import EditorNav from "../components/editor/EditorNav";
import EditorFileDrop from "../components/editor/EditorFileDrop";
import { EditorComponent } from "../components/editor/EditorComponent";

import OptionsDialog from "../components/dialogs/OptionsDialog";
import ConsoleDialog from "../components/dialogs/ConsoleDialog";
import ErrorDialog from "../components/dialogs/ErrorDialog";
import LoadingBackdrop from "../components/dialogs/LoadingBackdrop";

// Obfuscator Options
import { convertOptionsToJS, evaluateOptionsOrJS } from "../utils/option-utils";
import presets from "js-confuser/dist/presets";

export default function PageEditor() {
  useSEO(
    "JS-Confuser Editor",
    "A JavaScript obfuscator that runs in your browser."
  );

  const JSConfuser = useJSConfuser();
  const codeWorker = useCodeWorker();

  const [params, setSearchParams] = useSearchParams();

  /**
   * @type {React.MutableRefObject<{monaco: Monaco, editor: Monaco.editor}>}
   */
  const ref = useRef();

  useEffect(() => {
    if (ref.current) {
      var code = params.get("code");
      var config = params.get("config");
      var preset = params.get("preset");

      if (code) {
        let model = ref.current.editor.getModel();

        model.setNonDirtyValue(code);
      }
      if (config) {
        setOptionsJS(config);
        editOptionsFile();
      }
      if (preset) {
        setOptions(presets[preset]);
      }

      if (code || config) {
        setSearchParams({});
      }
    }
  }, [ref?.current]);

  /**
   * @type {Monaco.editor.ITextModel}
   */
  let [activeTab, setActiveTab] = useState();

  /**
   * @type {Monaco.editor.ITextModel[]}
   */
  let [tabs, setTabs] = useState([]);

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

    var found = tabs.find((t) => t.identity === "internal_options");
    if (found) {
      found.setNonDirtyValue(value);
    }
  };

  const options = useMemo(() => {
    return evaluateOptionsOrJS(optionsJS);
  }, [optionsJS]);

  const setOptions = (optionsOrFn) => {
    var optionsValue =
      typeof optionsOrFn === "function" ? optionsOrFn(options) : optionsOrFn;
    var newOptionsJS = convertOptionsToJS(optionsValue);

    setOptionsJS(newOptionsJS);

    var tab = tabs.find((t) => t.title === "options.js");
    if (tab) {
      tab.setNonDirtyValue(newOptionsJS);
    }
  };

  const tabsRef = useRef();
  tabsRef.current = tabs;

  function changeTab(tabOrIndex) {
    var tab =
      typeof tabOrIndex === "number" ? tabsRef.current[tabOrIndex] : tabOrIndex;

    // Only if a numbered tab was not found, return
    // Else it's a logic error
    if (typeof tabOrIndex === "number" && !tab) return;

    const { editor } = ref.current;
    editorSetModel(editor, tab);

    setActiveTab(tab);
  }

  function editorSetModel(editor, model) {
    var currentModel = editor.getModel();
    if (currentModel) {
      currentModel.viewState = editor.saveViewState();
    }
    editor.setModel(model);

    if (model.viewState) {
      editor.focus();
      editor.restoreViewState(model.viewState);

      requestAnimationFrame(() => {
        editor.focus();
      });

      delete model.viewState;
    }
  }

  function newTab(value = "", fileName = "Untitled.js", onSave, identity) {
    const { monaco, editor } = ref.current;

    if (!onSave) {
      onSave = () => {
        if (editorOptionsRef.current.saveToBrowser) {
          saveFileToIndexedDB(newModel.title, newModel.getValue()).catch(
            (err) => {
              newTab(err.toString(), "File Error");
            }
          );
        } else {
          // Not implemented
        }
      };
    }

    if (!identity) {
      identity = Math.random();
    } else {
      var alreadyOpen = monaco.editor
        .getModels()
        .find((t) => t.identity === identity);
      if (alreadyOpen) {
        setTabs((tabs) =>
          tabs.includes(alreadyOpen) ? tabs : [...tabs, alreadyOpen]
        );
        alreadyOpen.onSave = onSave;
        alreadyOpen.setValue(value);
        changeTab(alreadyOpen);
        return;
      }
    }

    const fileExtension = getFileExtension(fileName);

    var uri = monaco.Uri.parse("file:///" + identity + "." + fileExtension);

    const newModel = monaco.editor.createModel(
      value,
      getLanguageFromFileExtension(fileExtension),
      uri
    );

    newModel.title = fileName;
    newModel.identity = identity;

    newModel.onSave = onSave;

    newModel.rename = (newName) => {
      newModel.title = newName;
      newModel.setIsDirty(true);

      monaco.editor.setModelLanguage(
        newModel,
        getLanguageFromFileExtension(getFileExtension(newName))
      );
    };

    var lastSavedContent = value;

    newModel.onDidChangeContent(() => {
      const currentContent = editor.getValue();
      const isModified = currentContent !== lastSavedContent;

      newModel.setIsDirty(isModified);
    });

    newModel.setNonDirtyValue = (value) => {
      lastSavedContent = value;
      newModel.setValue(value);
    };

    newModel.setIsDirty = (isDirty) => {
      newModel.isDirty = isDirty;
      const el = document.getElementById("tab-" + newModel.identity);
      if (el) {
        el.style.opacity = isDirty ? 1 : 0;
      }
    };

    newModel.saveContent = () => {
      lastSavedContent = editor.getValue();
      newModel.setIsDirty(false);
      newModel.onSave(lastSavedContent);
    };

    editorSetModel(editor, newModel);

    setTabs((tabs) => [...tabs, newModel]);
    setActiveTab(newModel);

    setTimeout(() => {
      editor.focus();
    }, 16);

    return newModel;
  }

  function closeTab(tab) {
    var { editor } = ref.current;

    var newTabs = tabsRef.current?.filter((t, i) => t !== tab);
    setTabs(newTabs);

    if (editor) {
      const activeTab = editor.getModel();
      if (activeTab === tab && newTabs.length) {
        changeTab(newTabs[Math.max(0, newTabs.length - 1)]);
      }
      if (newTabs.length === 0) {
        editor.setValue("// Open a new file to start");
      }
    }
  }

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
   * Returns the current model that isn't the JSConfuser.ts model
   */
  const getActiveModel = () => {
    const { editor } = ref.current;

    let activeModel = editor.getModel();
    if (activeModel.title === "JSConfuser.ts") {
      activeModel = tabsRef.current.find((t) => t.title !== "JSConfuser.ts");
    }
    return activeModel;
  };

  /**
   * Obfuscates the user's code
   */
  const obfuscateCode = () => {
    if (tabsRef?.current?.length === 0) {
      alert("Please open a file to obfuscate");
      return;
    }

    let activeModel = getActiveModel();

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

            var model = newTab(code, outputFileName);
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

  const editOptionsFile = () => {
    newTab(
      optionsJSRef.current,
      "JSConfuser.ts",
      (value) => {
        setOptionsJS(value);
      },
      "internal_options"
    );
  };

  const getSelectedTextOrFullContent = () => {
    const editor = ref.current?.editor;
    if (!editor) return "";

    const selection = editor.getSelection();

    // Check if there is a selection
    if (selection && !selection.isEmpty()) {
      return editor.getModel().getValueInRange(selection);
    } else {
      // Return the entire content if no selection is present
      return editor.getValue();
    }
  };

  const evaluateCode = () => {
    const { editor } = ref.current;
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
    const { editor } = ref.current;
    if (!editor) return;

    const code = editor.getValue();

    codeWorker
      .convertTSCodeToJSCode(code)
      .then((jsCode) => {
        newTab(jsCode, "Output.js");
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
            const { editor } = ref.current;
            if (editor) {
              editor.focus();
            }
          });
        }}
        getEditorCode={() => {
          return getSelectedTextOrFullContent();
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
        editOptionsFile={editOptionsFile}
        newTab={newTab}
        obfuscateCode={obfuscateCode}
        evaluateCode={evaluateCode}
        resetEditor={() => {
          setTabs([]);
          newTab(defaultCode, "Untitled.js");
        }}
        setOptionsJS={setOptionsJS}
        optionsJS={optionsJS}
        getRef={() => ref}
        activeTab={activeTab}
        getEditor={() => ref.current?.editor}
        codeWorker={codeWorker}
        convertCode={convertCode}
        closeTab={closeTab}
        closeModals={closeModals}
        changeTab={changeTab}
        focusEditor={() => {
          requestAnimationFrame(() => {
            const { editor } = ref.current;
            if (editor) {
              editor.focus();
            }
          });
        }}
        shareURL={() => {
          var searchParams = new URLSearchParams();
          searchParams.set("code", getActiveModel().getValue());
          searchParams.set("config", optionsJS);

          var url =
            window.location.origin +
            window.location.pathname +
            "?" +
            searchParams.toString();

          window.navigator.clipboard.writeText(url);
        }}
      />

      <EditorFileDrop newTab={newTab} />

      <Box display="flex" height="calc(100vh - 40px)">
        <EditorPanel
          activeTab={activeTab}
          options={options}
          setOptions={setOptions}
          obfuscateCode={obfuscateCode}
          openOptionsDialog={() => {
            setShowOptionsDialog(true);
          }}
          editOptionsFile={editOptionsFile}
          evaluateCode={evaluateCode}
          convertCode={convertCode}
        />
        <EditorComponent
          activeTab={activeTab}
          tabs={tabs}
          newTab={newTab}
          closeTab={closeTab}
          changeTab={changeTab}
          ref={ref}
        />
      </Box>
    </div>
  );
}
