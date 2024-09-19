import { useEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";
import { defaultCode, defaultOptionsJS } from "../constants";

// Import your worker
import LoadingBackdrop from "../components/LoadingBackdrop";
import EditorPanel from "../components/EditorPanel";
import { EditorComponent } from "../components/EditorComponent";
import { useLocalStorage } from "usehooks-ts";
import OptionsDialog from "../components/OptionsDialog";
import useJSConfuser from "../hooks/useJSConfuser";
import ConsoleDialog from "../components/ConsoleDialog";
import { saveFileToIndexedDB } from "../utils/file-utils";
import EditorNav from "../components/EditorNav";
import { EditorFileDrop } from "../components/EditorFileDrop";
import ErrorDialog from "../components/ErrorDialog";
import { useSearchParams } from "react-router-dom";
import useCodeWorker from "../hooks/useCodeWorker";
import { convertOptionsToJS, evaluateOptionsOrJS } from "../utils/option-utils";
import useSEO from "../hooks/useSEO";
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
        var model = ref.current.editor.getModel();

        model.setValue(code);
        model.setIsDirty(false);
      }
      if (config) {
        setOptionsJS(config);
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
    "JSConfuser_Options",
    defaultOptionsJS
  );
  const optionsJSRef = useRef();
  optionsJSRef.current = optionsJS;

  const [editorOptions, setEditorOptions] = useLocalStorage(
    "JSConfuser_EditorOptions",
    {
      formatOnSave: true,
      saveToBrowser: true,
    }
  );
  const editorOptionsRef = useRef();
  editorOptionsRef.current = editorOptions;
  const getEditorOptions = () => editorOptionsRef.current;

  const setOptionsJS = (value) => {
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

    console.log(newOptionsJS);
    setOptionsJS(newOptionsJS);

    var tab = tabs.find((t) => t.title === "options.js");
    if (tab) {
      tab.setValue(newOptionsJS);
    }
  };

  function changeTab(tabOrIndex) {
    var tab = typeof tabOrIndex === "number" ? tabs[tabOrIndex] : tabOrIndex;

    const { editor } = ref.current;
    editorSetModel(editor, tab);

    setActiveTab(tab);
  }

  const tabsRef = useRef();
  tabsRef.current = tabs;

  function editorSetModel(editor, model) {
    var currentModel = editor.getModel();
    if (currentModel) {
      currentModel.viewState = editor.saveViewState();
    }
    editor.setModel(model);

    if (model.viewState) {
      editor.focus();
      editor.restoreViewState(model.viewState);

      delete model.viewState;
    }
  }

  function newTab(value = "", fileName = "Untitled.js", onSave, identity) {
    const { monaco, editor } = ref.current;

    if (!onSave) {
      onSave = () => {
        if (editorOptions.saveToBrowser) {
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

    const fileExtension = fileName.split(".").pop();

    function getLanguageFromFileName(filName) {
      return (
        {
          js: "javascript",
          ts: "typescript",
          json: "json",
        }[fileExtension] || "plaintext"
      );
    }

    var uri = monaco.Uri.parse("file:///" + identity + "." + fileExtension);

    const newModel = monaco.editor.createModel(
      value,
      getLanguageFromFileName(),
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
        getLanguageFromFileName(newName)
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

  // Function to obfuscate the code
  const obfuscateCode = () => {
    if (tabsRef?.current?.length === 0) {
      alert("Please open a file to obfuscate");
      return;
    }
    const { editor } = ref.current;

    let activeModel = editor.getModel();
    if (activeModel.title === "JSConfuser.ts") {
      activeModel = tabsRef.current.find((t) => t.title !== "JSConfuser.ts");
    }

    return new Promise((resolve, reject) => {
      // Get the current value from the editor
      let originalCode = activeModel.getValue();

      try {
        // Obfuscate the code using JS-Confuser
        JSConfuser.obfuscate(originalCode, optionsJSRef.current, {
          onComplete: (data) => {
            setShowLoadingOverlay(false);

            var { code, profileData } = data;

            console.log(profileData);

            var outputFileName = "Obfuscated.js";
            if (typeof activeModel.title === "string") {
              outputFileName = activeModel.title;

              // file.obfuscated.js -> file.obfuscated.2.js
              // file.obfuscated.2.js -> file.obfuscated.3.js
              if (
                outputFileName.includes(".obfuscated.") &&
                outputFileName.endsWith(".js")
              ) {
                var num =
                  parseInt(
                    outputFileName.split(".obfuscated.")[1].split(".js")[0]
                  ) + 1;
                if (Number.isNaN(num) || num < 1) {
                  num = 2;
                }

                outputFileName =
                  outputFileName.split(".obfuscated")[0] +
                  ".obfuscated." +
                  num +
                  ".js";
              } else if (outputFileName.endsWith(".js")) {
                // Replace .js with .obfuscated.js
                outputFileName = activeModel.title.replace(
                  ".js",
                  ".obfuscated.js"
                );
              } else {
                // No file extension -> file.obfuscated.js
                outputFileName = outputFileName + ".obfuscated.js";
              }
            }

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
      optionsJS,
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

  const activeModelRef = useRef();
  activeModelRef.current = showError || showOptionsDialog || showConsoleDialog;

  // Function to close all modals and return true if any were open
  const closeModals = () => {
    // Check if any modal is currently open
    const wasAnyModalOpen = activeModelRef.current;

    // Close all modals
    setShowError(false);
    setShowOptionsDialog(false);
    setShowConsoleDialog(false);

    activeModelRef.current = false;

    // Return true if any modal was open
    return wasAnyModalOpen;
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
        focusEditor={() => {
          requestAnimationFrame(() => {
            const { editor } = ref.current;
            if (editor) {
              editor.focus();
            }
          });
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
