import {
  clearAllFiles,
  deleteFileFromIndexedDB,
  downloadJavaScriptFile,
  listAllFiles,
  openJavaScriptFile,
} from "../../utils/file-utils";
import React, { useEffect, useRef, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Checkbox,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import {
  ArrowDropDown,
  Close,
  Edit,
  KeyboardArrowRight,
} from "@mui/icons-material";
import { defaultOptionsJS } from "../../constants";
import useSnackbar from "../../hooks/useSnackbar";
import { EDITOR_PANEL_WIDTH } from "./EditorPanel";
import { textEllipsis } from "../../utils/format-utils";

function EditorNavItem({
  subItem,
  editorOptions,
  setEditorOptions,
  handleParentClose,
}) {
  const [open, setOpen] = useState(false);
  const anchorEl = useRef();

  const handleClick = (event) => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const id = open ? "simple-popover" : undefined;

  let disabled = subItem.disabled;
  if (subItem.onlyIf) {
    var items = subItem.onlyIf.split(",");
    var foundDisabled = items.find((item) => !editorOptions[item]);
    if (foundDisabled) {
      disabled = true;
    }
  }

  return (
    <React.Fragment>
      {subItem.items ? (
        <Menu
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          id={id}
          open={open}
          anchorEl={() => anchorEl.current}
          onClose={handleClose}
          MenuListProps={{
            sx: { py: 0 },
          }}
        >
          {subItem.items.map((subSubItem, index) => {
            return (
              <EditorNavItem
                key={index}
                subItem={subSubItem}
                editorOptions={editorOptions}
                setEditorOptions={setEditorOptions}
                handleParentClose={() => {
                  handleParentClose();
                  handleClose();
                }}
              />
            );
          })}
        </Menu>
      ) : null}

      <MenuItem
        ref={anchorEl}
        disabled={disabled}
        onClick={(e) => {
          subItem.onClick && subItem.onClick();

          if (subItem.items) {
            handleClick(e);
            return;
          }

          if (subItem.type === "checkbox") {
            setEditorOptions((editorOptions) => {
              return {
                ...editorOptions,
                [subItem.key]: !editorOptions[subItem.key],
              };
            });
            return;
          }

          if (subItem.type === "input") {
            var newValue = prompt(
              "Enter a new value for " + subItem.label,
              editorOptions[subItem.key]
            );
            if (newValue === null) return;

            setEditorOptions((editorOptions) => {
              return {
                ...editorOptions,
                [subItem.key]: newValue,
              };
            });
            return;
          }

          if (subItem.keepOpen) return;

          handleParentClose();
        }}
      >
        <Typography variant="inherit" pr={2} mr="auto">
          {subItem.label}
        </Typography>
        {subItem.type === "checkbox" ? (
          <Checkbox
            sx={{ fontSize: "1.35rem", p: 0 }}
            color="primary"
            checked={!!editorOptions[subItem.key]}
          />
        ) : null}
        {subItem.type === "input" ? (
          <Box display="flex" color="text.secondary_darker" alignItems="center">
            <Typography
              fontSize="0.875rem"
              display="inline-block"
              component="span"
            >
              {textEllipsis(editorOptions[subItem.key] || "", 10)}
            </Typography>
            <Box ml={"4px"}>
              <Edit sx={{ transform: "translateY(2px)" }} />
            </Box>
          </Box>
        ) : null}
        {subItem.items ? (
          <KeyboardArrowRight
            sx={{
              color: "text.secondary",
            }}
          />
        ) : null}
        {subItem.onRemove ? (
          <Close
            sx={{ color: "text.secondary" }}
            onClick={(e) => {
              e.stopPropagation();
              subItem.onRemove();
            }}
          />
        ) : null}
        {subItem.shortcut
          ? subItem.shortcut.split("+").map((key, index) => {
              return (
                <Typography
                  key={index}
                  variant="code"
                  fontWeight="bold"
                  textTransform="uppercase"
                  borderRadius={2}
                  p="0.35rem"
                  fontSize="0.7rem"
                  bgcolor="divider"
                  color="text.secondary"
                  ml={1}
                >
                  {key}
                </Typography>
              );
            })
          : null}
      </MenuItem>
    </React.Fragment>
  );
}

export default function EditorNav({
  getEditorOptions,
  setEditorOptions,
  resetEditor,
  evaluateCode,
  setOptionsJS,
  codeWorker,
  convertCode,
  focusEditor,
  closeModals,
  shareURL,
  editorComponent,
}) {
  const snackbar = useSnackbar();

  /**
   * @type {React.useState<null | HTMLElement>}
   */
  const [anchorEl, setAnchorEl] = useState();
  const [anchorName, setAnchorName] = useState();

  /**
   * @param {React.MouseEvent<HTMLButtonElement>} event
   */
  const handleClick = (event, name) => {
    setAnchorEl(event.currentTarget);
    setAnchorName(name);
  };
  const handleClose = () => {
    setAnchorEl(null);
    setAnchorName(null);

    focusEditor();
  };

  var [recentFiles, setRecentFiles] = useState([]);
  useEffect(() => {
    async function load() {
      var files = await listAllFiles();
      setRecentFiles(files);
    }

    load();
  }, []);

  const NavItems = [
    {
      label: "File",
      items: [
        // Switch to file 1-9
        ...new Array(9).fill(0).map((_, i) => {
          var humanIndex = i + 1;
          return {
            label: "Change To File " + humanIndex,
            shortcut: "Ctrl + " + humanIndex,
            onClick: () => {
              editorComponent.changeTab(i);
            },
            hidden: true,
          };
        }),
        {
          label: "New File",
          shortcut: "Ctrl + N",
          onClick: () => {
            editorComponent.newTab("");
          },
        },
        {
          label: "Open File",
          shortcut: "Ctrl + O",
          onClick: () => {
            openJavaScriptFile()
              .then(({ content, filename }) => {
                editorComponent.newTab(content, filename);
              })
              .catch((err) => {
                snackbar.showError(err);
              });
          },
        },
        {
          label: "Open Recent",
          items: [
            ...recentFiles.map((file) => {
              return {
                label: file,
                onClick: async () => {
                  editorComponent.newTabFromFile(file);
                },
                onRemove: async () => {
                  await deleteFileFromIndexedDB(file);
                  setRecentFiles((files) => files.filter((f) => f !== file));
                },
              };
            }),
            {
              label: "Clear All Recent Files",
              onClick: () => {
                setRecentFiles([]);
                clearAllFiles();
              },
              disabled: !recentFiles.length,
              keepOpen: true,
            },
          ],
        },

        {
          label: "Close File",
          shortcut: "Ctrl + W",
          onClick: () => {
            closeModals();
            editorComponent.closeTab(editorComponent.activeTab);
          },
          hidden: true,
        },

        {
          label: "Save File",
          shortcut: "Ctrl + S",
          onClick: async () => {
            if (getEditorOptions().formatOnSave) {
              await formatDocument();
            }
            editorComponent.activeTab.saveContent?.();
          },
        },
        {
          label: "Download File",
          shortcut: "Ctrl + Shift + S",
          onClick: async () => {
            var model = editorComponent.activeTab;
            if (model) {
              model.setIsDirty(false);
              downloadJavaScriptFile(model.getValue(), model.title);
            }
          },
        },
        {
          label: "Format Document",
          shortcut: "Ctrl + Shift + F",
          onClick: () => {
            formatDocument();
          },
        },
        {
          label: "Format On Save",
          type: "checkbox",
          key: "formatOnSave",
        },
        {
          label: "Share",
          onClick: () => {
            shareURL();

            snackbar.showSuccess("Copied link to clipboard");
          },
        },
      ],
    },
    {
      label: "Tools",
      items: [
        {
          label: "Obfuscate Code",
          shortcut: "Ctrl + Enter",
          onClick: () => {
            editorComponent.obfuscateCode();
          },
        },
        {
          label: "Evaluate Code",
          shortcut: "Shift + Enter",
          onClick: evaluateCode,
        },
        {
          label: "Strict Mode Evaluation",
          type: "checkbox",
          key: "strictModeEval",
        },
        {
          label: "Allow Network Requests",
          type: "checkbox",
          key: "allowNetworkRequests",
        },
        {
          label: "Convert TypeScript to JavaScript",
          onClick: convertCode,
        },
        {
          label: "Edit JSConfuser.ts",
          shortcut: "Ctrl + P",
          onClick: editorComponent.openOptionsFile,
        },
        {
          label: "Advanced Tools",
          items: [
            {
              label: "Pre-Obfuscation Analysis",
              onClick: () => {
                editorComponent.JSConfuser.preObfuscationAnalysis(
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
                    alert(err.toString());
                  });
              },
            },
            {
              label: "Apply Transformation",
              onClick: async () => {
                var names = await editorComponent.JSConfuser.getTransformations(
                  editorComponent.optionsJS
                );
                var name = prompt(
                  "Enter the transformation name:\n" +
                    names.map((name, i) => `${i + 1}. ${name}`).join("\n")
                );

                if (name && !isNaN(name)) {
                  name = names[parseInt(name) - 1];
                }
                if (!name) return;
                if (!names.includes(name)) {
                  alert("Invalid transformation name");
                  return;
                }

                var activeTab = editorComponent.getActiveModel();
                var { code } =
                  await editorComponent.JSConfuser.applyTransformations(
                    activeTab.getValue(),
                    editorComponent.optionsJS,
                    [name]
                  );
                activeTab.setValue(code);
              },
            },
            {
              label: "Capture In-Depth Insights",
              type: "checkbox",
              key: "captureInsights",
            },
            {
              onlyIf: "captureInsights",
              label: "Capture Performance Insights",
              type: "checkbox",
              key: "capturePerformanceInsights",
            },
            {
              onlyIf: "captureInsights,capturePerformanceInsights",
              label: "Performance Iterations",
              type: "input",
              key: "performanceIterations",
            },
          ],
        },
      ],
    },
    {
      label: "Reset",
      items: [
        {
          label: "Reset Editor",
          onClick: resetEditor,
        },
        {
          label: "Reset Options",
          onClick: () => {
            setOptionsJS(defaultOptionsJS);
          },
        },
      ],
      mr: "auto",
    },
    {
      label: "NPM",
      href: "https://npmjs.com/package/js-confuser",
    },
    {
      label: "GitHub",
      href: "https://github.com/MichaelXF/JS-Confuser",
    },
    {
      label: "Docs",
      to: "/docs/",
    },
  ];

  // Prevent the default browser behavior for Ctrl + N
  useEffect(() => {
    /**
     * @param {KeyboardEvent} e
     * @returns
     */
    const handleKeyDown = (e) => {
      var isCtrlCmdKey = e.ctrlKey || e.metaKey;
      var isShiftKey = e.shiftKey;

      if (!isCtrlCmdKey && !isShiftKey) return;

      NavItems.forEach((group) => {
        if (!group.items) return;
        group.items.forEach((item) => {
          if (item.shortcut) {
            var items = item.shortcut
              .toLowerCase()
              .split("+")
              .map((x) => x.trim());

            var key = items.pop();

            for (var mod of items) {
              if (mod === "ctrl" && !isCtrlCmdKey) return;
              if (mod === "shift" && !isShiftKey) return;
            }

            if (isShiftKey && !items.includes("shift")) return;

            // console.log(e.key, key);

            if (e.key.toLowerCase() === key) {
              e.preventDefault();

              item.onClick && item.onClick();
            }
          }
        });
      });
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function formatDocument() {
    const { editor } = editorComponent;
    if (!editor) return;

    // Add custom shortcut for formatting (Ctrl + Shift + F)
    //   editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
    //   formatDocument();
    // });

    const model = editor.getModel();
    const language = model.getLanguageId();
    const code = editor.getValue();

    try {
      var formattedCode = await codeWorker.formatCode(code, language);
      // If the code hasn't changed, do nothing
      if (formattedCode === code) {
        return;
      }

      // Get the full range of the current content
      const fullModelRange = model.getFullModelRange();

      // Tab was closed before the format was complete
      if (editor.getModel() !== model) return;

      // Apply the edit using executeEdits without moving the cursor
      editor.executeEdits(null, [
        {
          range: fullModelRange,
          text: formattedCode,
          forceMoveMarkers: false,
        },
      ]);

      // Optionally, you can push an undo stop to keep undo/redo history intact
      editor.pushUndoStop();
    } catch (error) {
      console.error("Failed to format document:", error);
    }
  }

  return (
    <AppBar
      position="static"
      sx={{
        color: "text.primary",
        height: "40px",
        pr: "5px",
      }}
      variant="mini"
    >
      <Toolbar variant="mini">
        <Stack direction="row" alignItems="center" width="100%" flexGrow={1}>
          <Link to="/">
            <Typography
              variant="body1"
              fontWeight="bold"
              color="primary.main"
              minWidth={EDITOR_PANEL_WIDTH}
              px={2}
            >
              JS-Confuser
            </Typography>
          </Link>

          {NavItems.map((item, index) => {
            return (
              <React.Fragment key={index}>
                <Button
                  variant="text"
                  sx={{
                    color: "text.secondary",
                    height: "30px",
                    cursor: "pointer",
                    backgroundColor: "transparent",
                    textTransform: "none",
                    px: 2,
                    maxWidth: "none",
                    mr: item.mr,
                  }}
                  color="inherit"
                  endIcon={item.items ? <ArrowDropDown /> : null}
                  onClick={(event) => {
                    handleClick(event, item.label);
                  }}
                  component={item.to && Link}
                  to={item.to}
                  href={item.href}
                  target={item.href && "_blank"}
                >
                  {item.label}
                </Button>
                {item.items ? (
                  <Menu
                    id={"basic-menu-" + item.label}
                    anchorEl={anchorEl}
                    open={anchorEl ? anchorName === item.label : false}
                    onClose={handleClose}
                    MenuListProps={{
                      "aria-labelledby": "basic-button",
                    }}
                    disableRestoreFocus={true}
                  >
                    {item.items.map((subItem, subIndex) => {
                      if (subItem.hidden) return null;

                      return (
                        <EditorNavItem
                          key={subIndex}
                          subItem={subItem}
                          editorOptions={getEditorOptions()}
                          setEditorOptions={setEditorOptions}
                          handleParentClose={handleClose}
                        />
                      );
                    })}
                  </Menu>
                ) : null}
              </React.Fragment>
            );
          })}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
