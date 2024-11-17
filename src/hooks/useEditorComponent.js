import React, { useRef, useState } from "react";
import { EditorComponent } from "../components/editor/EditorComponent";

// File Storage And Settings
import {
  getFileExtension,
  getLanguageFromFileExtension,
  getObfuscatedFileName,
  saveFileToIndexedDB,
} from "../utils/file-utils";
import useJSConfuser from "./useJSConfuser";
import LoadingBackdrop from "../components/dialogs/LoadingBackdrop";

export default function useEditorComponent({
  optionsJSRef,
  setOptionsJS,
  editorOptionsRef,
  onError,
}) {
  const JSConfuser = useJSConfuser({
    onError: onError,
  });

  const [loadingInfo, setLoadingInfo] = useState({ progress: "", percent: "" });
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  /**
   * @type {React.MutableRefObject<{monaco: Monaco, editor: Monaco.editor}>}
   */
  const ref = useRef();

  /**
   * @type {Monaco.editor.ITextModel[]}
   */
  let [tabs, setTabs] = useState([]);

  const tabsRef = useRef();
  tabsRef.current = tabs;

  /**
   * Obfuscates the user's code
   */
  function obfuscateCode() {
    const tabs = tabsRef.current;

    if (tabs.length === 0) {
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

            onError(data);
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
      } catch (error) {
        resolve(false);
        console.error("Obfuscation failed:", error);
      }
    });
  }

  function changeTab(tabOrIndex) {
    var tab =
      typeof tabOrIndex === "number" ? tabsRef.current[tabOrIndex] : tabOrIndex;

    // Only if a numbered tab was not found, return
    // Else it's a logic error
    if (typeof tabOrIndex === "number" && !tab) return;

    const { editor } = ref.current;
    editorSetModel(editor, tab);
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
      const currentContent = newModel.getValue();
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

  const openOptionsFile = () => {
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

  const editorComponent = {
    get JSConfuser() {
      return JSConfuser;
    },
    ref,
    get editor() {
      return ref.current.editor;
    },
    get monaco() {
      return ref.current.monaco;
    },
    get tabs() {
      return tabsRef.current;
    },
    get activeTab() {
      return ref.current?.editor.getModel();
    },
    get optionsJS() {
      return optionsJSRef.current;
    },

    obfuscateCode,
    setTabs,
    closeTab,
    changeTab,
    newTab,
    openOptionsFile,
    getActiveModel,
    getSelectedTextOrFullContent,

    overlayElement: (
      <LoadingBackdrop
        open={showLoadingOverlay}
        loadingInfo={loadingInfo}
        handleClose={() => {}}
        onCancel={() => {
          JSConfuser.cancel();
          setShowLoadingOverlay(false);
        }}
      />
    ),

    /**
     * @type {React.ReactElement}
     */
    element: null,
  };

  editorComponent.element = (
    <EditorComponent editorComponent={editorComponent} ref={ref} />
  );

  return editorComponent;
}
