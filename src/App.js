import "./App.scss";
import { createContext, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import PageMain from "./pages/PageMain";
import { DEFAULT_OPTIONS } from "./Constants";

export const ThemeContext = createContext({ theme: "", setTheme: () => {} });
export const OptionContext = createContext({
  options: {},
  setOptions: () => {},
});

export default function App() {
  var [theme, setTheme] = useLocalStorage("jsconfuser_theme", "Material");
  var [options, setOptions] = useLocalStorage(
    "jsconfuser_options",
    DEFAULT_OPTIONS
  );

  var themeValue = useMemo(() => {
    return {
      theme,
      setTheme,
    };
  }, [theme]);
  var optionsValue = useMemo(() => {
    return {
      options,
      setOptions,
    };
  }, [options]);

  return (
    <ThemeContext.Provider value={themeValue}>
      <OptionContext.Provider value={optionsValue}>
        <PageMain />
      </OptionContext.Provider>
    </ThemeContext.Provider>
  );
}
