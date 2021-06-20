import MainPage from "./MainPage";
import { createContext, useMemo } from "react";
import Presets from "./presets";
import { useLocalStorage } from "./useLocalStorage";

export const ThemeContext = createContext({ theme: "", setTheme: () => {} });
export const OptionContext = createContext({
  options: {},
  setOptions: () => {},
});

export default function App() {
  var [theme, setTheme] = useLocalStorage("jsconfuser_theme", "Material");
  var [options, setOptions] = useLocalStorage("jsconfuser_options", {
    ...Presets.medium,
  });

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
        <MainPage />
      </OptionContext.Provider>
    </ThemeContext.Provider>
  );
}
