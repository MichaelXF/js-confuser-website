import { BrowserRouter, Route, Routes } from "react-router-dom";
import PageHome from "./pages/PageHome";
import PageEditor from "./pages/PageEditor";
import PageDoc from "./pages/PageDoc";
import ScrollToTop from "./components/ScrollToTop";
import PageAST from "./pages/PageAST";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<PageHome />} />
        <Route path="/editor" element={<PageEditor />} />
        <Route path="/ast" element={<PageAST />} />
        <Route path="/docs/" element={<PageDoc />} />
        <Route path="/docs/:group/:subpath" element={<PageDoc />} />
      </Routes>
    </BrowserRouter>
  );
}
