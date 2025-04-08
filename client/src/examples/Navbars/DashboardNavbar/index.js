// Import your components and dependencies
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import PropTypes from "prop-types";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import Breadcrumbs from "examples/Breadcrumbs";
import { useVisionUIController, setTransparentNavbar } from "context";
import AuthNavMenu from "components/AuthNavMenu"; // Import the Auth Menu component

function DashboardNavbar({ absolute, light, isMini }) {
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useVisionUIController();
  const { miniSidenav, transparentNavbar, fixedNavbar } = controller;
  const route = useLocation().pathname.split("/").slice(1);

  useEffect(() => {
    // Setting the navbar type
    if (fixedNavbar) {
      setNavbarType("sticky");
    } else {
      setNavbarType("static");
    }

    // A function that sets the transparent state of the navbar.
    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar);
    }

    /**
     The event listener that's calling the handleTransparentNavbar function when
     scrolling the window.
    */
    window.addEventListener("scroll", handleTransparentNavbar);

    // Call the handleTransparentNavbar function to set the state with the initial value.
    handleTransparentNavbar();

    // Remove event listener on cleanup
    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  return (
    <AppBar
      position={absolute ? "absolute" : navbarType}
      color="inherit"
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light })}
    >
      <Toolbar sx={(theme) => navbarContainer(theme)}>
        <VuiBox color="inherit" mb={{ xs: 1, md: 0 }} sx={(theme) => navbarRow(theme, { isMini })}>
          <Breadcrumbs icon="home" title={route[route.length - 1]} route={route} light={light} />
        </VuiBox>
        {isMini ? null : (
          <VuiBox sx={(theme) => navbarRow(theme, { isMini })}>
            <VuiBox pr={1}>
              <VuiInput
                placeholder="Type here..."
                icon={{ component: "search", direction: "left" }}
                sx={({ palette: { white } }) => ({
                  "& .MuiInputBase-root": {
                    color: white.main,
                  },
                  "& .MuiInputBase-input": {
                    color: white.main,
                  },
                })}
              />
            </VuiBox>
            <VuiBox color={light ? "white" : "inherit"}>
              {/* Add the AuthNavMenu component */}
              <AuthNavMenu />

              <IconButton size="small" color="inherit" sx={{ ml: 1 }}>
                <Icon>settings</Icon>
              </IconButton>
              <IconButton
                size="small"
                color="inherit"
                sx={{ ml: 1 }}
                component={Link}
                to="/notifications"
              >
                <Icon>notifications</Icon>
              </IconButton>
            </VuiBox>
          </VuiBox>
        )}
      </Toolbar>
    </AppBar>
  );
}

// Navbar styles
function navbar(theme, { transparentNavbar, absolute, light }) {
  return {
    boxShadow: "none",
    backdropFilter: transparentNavbar ? "none" : `saturate(200%) blur(30px)`,
    backgroundColor: transparentNavbar
      ? "transparent"
      : theme.functions.rgba(theme.palette.background.default, 0.8),

    color: light ? "white" : "inherit",
    top: absolute ? 0 : "12px",
    minHeight: "75px",
    display: "grid",
    alignItems: "center",
    borderRadius: "20px",
    paddingTop: absolute ? theme.spacing(4) : "",
    paddingBottom: absolute ? theme.spacing(4) : "",
    paddingRight: absolute ? theme.spacing(2) : theme.spacing(2),
    paddingLeft: absolute ? theme.spacing(2) : theme.spacing(2),
    "& > *": {
      transition: "all 100ms ease-in-out",
    },
  };
}

function navbarContainer(theme) {
  return {
    display: "flex",
    alignItems: "center",
    minHeight: "75px",
    justifyContent: "space-between",
    p: 0,
  };
}

function navbarRow(theme, { isMini }) {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    minHeight: "75px",
    padding: isMini ? theme.spacing(0, 0, 0, 0) : theme.spacing(0, 0, 0, 0),
  };
}

// Setting default values for the props of DashboardNavbar
DashboardNavbar.defaultProps = {
  absolute: false,
  light: false,
  isMini: false,
};

// Typechecking props for the DashboardNavbar
DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
};

export default DashboardNavbar;