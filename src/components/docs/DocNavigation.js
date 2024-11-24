import { Box, Button, Collapse, Stack } from "@mui/material";
import { ChevronRight, KeyboardArrowDown, Search } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { DOC_PATH_SEPARATOR } from "../../utils/doc-utils";

const NAV_ITEM_HEIGHT = "36px";

function NavItem({
  item,
  open,
  setOpen,
  parent,
  depth = 0,
  pathname,
  onItemClick,
}) {
  let openLabel = item.fullLabel;

  const isOpen = !!open[openLabel];
  let isActive = pathname === item.to?.toLowerCase();

  let leftBorders = new Array(depth).fill(0).map((_, i) => {
    return (
      <Box
        borderRight="2px solid"
        borderColor={"divider"}
        width="16px"
        mr={2}
        flexShrink={0}
        key={i}
      />
    );
  });

  if (!item.children) {
    return (
      <Button
        sx={{
          textTransform: "none",
          width: "100%",
          textAlign: "left",
          justifyContent: "flex-start",
          alignItems: "stretch",
          p: 0,
          fontWeight: isActive ? "bold" : "normal",
          color: isActive ? "primary.main" : "inherit",
          height: NAV_ITEM_HEIGHT,
          bgcolor: isActive ? "divider" : "transparent",
        }}
        color="inherit"
        component={Link}
        to={item.to}
        onClick={() => {
          onItemClick();
        }}
      >
        {leftBorders}

        <Box px={1} alignSelf="center">
          {item.label}
        </Box>
      </Button>
    );
  }

  return (
    <Box>
      <Button
        sx={{
          textTransform: "none",
          width: "100%",
          textAlign: "left",
          justifyContent: "flex-start",
          alignItems: "stretch",
          p: 0,
          height: NAV_ITEM_HEIGHT,
        }}
        color="inherit"
        onClick={() => {
          setOpen((open) => ({
            ...open,
            [openLabel]: !open[openLabel],
          }));
        }}
      >
        {leftBorders}
        <Stack direction="row" alignItems="center" p={1}>
          <ChevronRight
            fontSize="small"
            sx={{ mr: "4px", color: "primary.main" }}
            component={isOpen ? KeyboardArrowDown : ChevronRight}
          />
          {item.label}
        </Stack>
      </Button>

      <Collapse in={isOpen}>
        <Stack direction="column">
          {item.children.map((childItem, index) => {
            return (
              <NavItem
                key={index}
                item={childItem}
                open={open}
                setOpen={setOpen}
                parent={item}
                pathname={pathname}
                depth={depth + 1}
                onItemClick={onItemClick}
              />
            );
          })}
        </Stack>
      </Collapse>
    </Box>
  );
}

export default function DocNavigation({
  openSearchDialog,
  navigationItems,
  pathname,
  onItemClick,
}) {
  function createOpenObject(open = {}) {
    var mergeObject = {};
    function checkChildren(parentItem) {
      for (let item of parentItem.children) {
        if (item.to && item.to.toLowerCase() === pathname) {
          if (!open[item.fullLabel]) {
            // Open this item
            mergeObject[item.fullLabel] = true;

            // Ensure all parent items are open too
            var paths = item.fullLabel.split(DOC_PATH_SEPARATOR);
            for (var i = 0; i < paths.length; i++) {
              mergeObject[paths.slice(0, i).join(DOC_PATH_SEPARATOR)] = true;
            }
            return;
          }
        }
        if (item.children) {
          checkChildren(item);
        }
      }
    }
    for (let item of navigationItems) {
      checkChildren(item);
    }

    return mergeObject;
  }

  // First render make sure the correct nav items are expanded
  var [open, setOpen] = useState(() => createOpenObject());

  // On tab change, make sure the correct nav items are expanded
  useEffect(() => {
    var mergeObject = createOpenObject();
    setOpen((open) => {
      return { ...open, ...mergeObject };
    });
  }, [pathname]);

  /**
   * @type {import("@mui/material").ButtonProps}
   */
  const btnProps = {
    sx: {
      color: "primary.main",
      cursor: "pointer",
      px: 2,
      py: "8px",
      borderRadius: "6px",
      transition: "0.3s ease background-color",
      "&:hover": {
        bgcolor: "primary.alpha",
      },
      fontWeight: "normal",
      typography: "1rem",
      alignItems: "center",
    },
    display: "flex",
    fullWidth: true,
  };

  return (
    <Box>
      <Box mt={1} mb={2}>
        <Button
          {...btnProps}
          onClick={() => {
            openSearchDialog();
          }}
        >
          <Search sx={{ mr: 1, fontSize: "1.125rem", color: "primary.main" }} />
          Search the docs...
        </Button>
      </Box>

      {navigationItems.map((section, index) => {
        return (
          <NavItem
            item={section}
            key={index}
            open={open}
            setOpen={setOpen}
            parent={null}
            pathname={pathname}
            onItemClick={onItemClick}
          />
        );
      })}

      <Box pb={12}></Box>
    </Box>
  );
}
