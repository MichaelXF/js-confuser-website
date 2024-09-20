import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  useMediaQuery,
} from "@mui/material";
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
import { useTheme } from "@emotion/react";
import { Close, Menu } from "@mui/icons-material";

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

  return (
    <Box>
      <Nav />

      <Box display="flex" height="calc(100vh - 65px)">
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
            maxHeight="calc(100vh - 65px)"
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
            maxHeight="calc(100vh - 65px)"
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
              ? !isHomePage && <DocTableOfContents metadata={metadata} />
              : null}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
