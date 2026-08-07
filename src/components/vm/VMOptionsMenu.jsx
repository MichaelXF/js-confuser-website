import * as React from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { KeyboardArrowDown } from "@mui/icons-material";

export default function VMOptionsMenu({ sx, options }) {
  const id = React.useId();
  const buttonId = `${id}-button`;
  const menuId = `${id}-menu`;

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <Button
        id={buttonId}
        aria-controls={open ? menuId : undefined}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={handleClick}
        sx={sx}
        color="inherit"
        endIcon={<KeyboardArrowDown />}
      >
        Options
      </Button>

      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            "aria-labelledby": buttonId,
          },
        }}
      >
        {options.map((entry, i) => {
          return (
            <MenuItem
              key={i}
              onClick={() => {
                entry.onClick?.();
                handleClose();
              }}
              sx={{
                minWidth: "200px",
              }}
              disabled={entry.disabled === true}
            >
              {entry.label}
            </MenuItem>
          );
        })}
      </Menu>
    </div>
  );
}
