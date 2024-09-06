import { Box } from "@mui/material";
import Nav from "../components/Nav";
import { useEffect, useLayoutEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import PageDocHome from "./PageDocHome";
import PageDocGeneric from "./PageDocGeneric";
import { getDocs } from "../utils/doc-utils";
import DocSearchDialog from "../components/DocSearchDialog";
import DocNavigation from "../components/DocNavigation";
import DocTableOfContents from "../components/DocTableOfContents";
import useSEO from "../hooks/useSEO";

export default function PageDoc() {
  var { group } = useParams();
  var { pathname } = useLocation();

  if (pathname.endsWith("/")) {
    pathname = pathname.substring(0, pathname.length - 1);
  }
  pathname = pathname.toLowerCase();

  var { navigationItems } = getDocs();

  var [showSearchDialog, setShowSearchDialog] = useState(false);

  var [metadata, setMetadata] = useState();

  var isHomePage = pathname === "/docs";
  var DocPage = isHomePage ? (
    <PageDocHome
      onMetadataUpdate={(value) => {
        setMetadata(value);
      }}
    />
  ) : (
    <PageDocGeneric
      onMetadataUpdate={(value) => {
        setMetadata(value);
      }}
    />
  );

  return (
    <Box>
      <Nav />

      <Box display="flex" height="calc(100vh - 65px)">
        <DocNavigation
          pathname={pathname}
          navigationItems={navigationItems}
          openSearchDialog={() => {
            setShowSearchDialog(true);
          }}
        />

        <DocSearchDialog
          open={showSearchDialog}
          onClose={() => setShowSearchDialog(false)}
        />

        <Box key={pathname}>
          <Box
            display="flex"
            overflow="auto"
            maxHeight="calc(100vh - 65px)"
            height="100%"
            width="100%"
          >
            <Box
              sx={{
                p: 4,
                px: 10,
                maxWidth: "1100px",
                mx: "auto",
                width: "100%",
                flexShrink: 1,
                flexGrow: 1,
              }}
            >
              {DocPage}
            </Box>
            {!isHomePage && <DocTableOfContents metadata={metadata} />}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
