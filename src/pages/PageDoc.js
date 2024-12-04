import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import Nav from "../components/Nav";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import PageDocHome from "./PageDocHome";
import PageDocGeneric from "./PageDocGeneric";
import { getDocs } from "../utils/doc-utils";
import DocSearchDialog from "../components/dialogs/DocSearchDialog";
import DocNavigation from "../components/docs/DocNavigation";
import DocTableOfContents from "../components/docs/DocTableOfContents";
import { useTheme } from "@emotion/react";
import { Close, Menu } from "@mui/icons-material";

export default function PageDoc() {
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

  const theme = useTheme();

  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const iconButtonSx = {
    color: "text.secondary",
  };

  const docNavigation = (
    <DocNavigation
      pathname={pathname}
      navigationItems={navigationItems}
      openSearchDialog={() => {
        setShowSearchDialog(true);
      }}
      onItemClick={() => {
        if (isPhone) {
          setShowMobileMenu(false);
        }
      }}
    />
  );

  const mainContentHeight = "calc(100vh - 65px)";

  return (
    <Box>
      <Nav />

      <Box display="flex" height={mainContentHeight}>
        {isPhone ? (
          <>
            <IconButton
              sx={{
                position: "fixed",
                top: "70px",
                right: "10px",
                zIndex: 1000,
                ...iconButtonSx,
              }}
              onClick={() => {
                setShowMobileMenu(true);
              }}
            >
              <Menu />
            </IconButton>

            <Dialog
              open={showMobileMenu}
              onClose={() => {
                setShowMobileMenu(false);
              }}
              fullScreen={true}
            >
              <IconButton
                sx={{
                  position: "fixed",
                  top: "10px",
                  right: "10px",
                  zIndex: 1000,
                  ...iconButtonSx,
                }}
                onClick={() => {
                  setShowMobileMenu(false);
                }}
              >
                <Close />
              </IconButton>
              <DialogContent>{docNavigation}</DialogContent>
            </Dialog>
          </>
        ) : null}

        {!isPhone ? (
          <Box
            borderRight="1px solid"
            borderColor="divider"
            maxWidth="300px"
            width="100%"
            maxHeight={mainContentHeight}
            height="100%"
            overflow="auto"
            flexShrink={0}
            p={1}
            sx={{
              scrollbarWidth: "thin",
            }}
          >
            {docNavigation}
          </Box>
        ) : null}

        <DocSearchDialog
          open={showSearchDialog}
          onClose={() => setShowSearchDialog(false)}
        />

        <Box key={pathname} width="100%">
          <Box
            display="flex"
            overflow="auto"
            maxHeight={mainContentHeight}
            height="100%"
            width="100%"
          >
            <Box
              sx={{
                p: 4,
                px: {
                  md: 10,
                },
                maxWidth: "1100px",
                mx: "auto",
                width: "100%",
                flexShrink: 1,
                flexGrow: 1,
              }}
            >
              {DocPage}
            </Box>
            {!isPhone
              ? !isHomePage && (
                  <DocTableOfContents
                    metadata={metadata}
                    maxHeight={mainContentHeight}
                  />
                )
              : null}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
