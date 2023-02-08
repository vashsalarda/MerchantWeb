import React from "react";
import { Route, Switch } from "react-router-dom";
import { connect } from "react-redux";
// javascript plugin used to create scrollbars on windows
import PerfectScrollbar from "perfect-scrollbar";

// core components
import AdminNavbar from "components/Navbars/AdminNavbar.jsx";
import Footer from "components/Footer/Footer.jsx";
import Sidebar from "components/Sidebar/Sidebar.jsx";
import FixedPlugin from "components/FixedPlugin/FixedPlugin.jsx";
import NotFound from "views/NotFound.js";

import routes from "routes.js";
import { getSession } from '../../config/session';
import { getProviderPlaces } from "../../layouts/User/UserActions";
import LoadingOverlay from 'react-loading-overlay';

import logo from "assets/img/sb-pin-logo.png";

var ps;

class Admin extends React.Component {
  constructor(props) {
    super();
    this.state = {
      backgroundColor: "blue",
      userData: {},
      loggedIn: false,
      pageType: 'food-drink',
      isLoading: true,
      sidebarOpened:
        document.documentElement.className.indexOf("nav-open") !== -1
    };
  }
  
  componentDidMount() {
    const userData = JSON.parse(getSession('userData'));
    const sessionToken = userData.sessionToken;
    let pageInfo = JSON.parse(getSession("pageInfo"));
    if(userData && userData.isSBTours) {
      this.setState({pageType:'sb-tours'});
    } else {
      if(pageInfo) {
        if(pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb') { // If pageType Grocery
          this.setState({pageType:'grocery'});
        }
      } else {
        this.props.getProviderPlaces(sessionToken,(error, result) => {
          if (!error && result) {
            if(result.places && result.places instanceof Array && result.places.length > 0 ) {
              const defaultPlace = result.places.find(item => item.isDefault);
              if(defaultPlace && defaultPlace.place && defaultPlace.place._id) {
                pageInfo = defaultPlace.place;
              } else {
                pageInfo = result.places[0].place;
              }
              if(pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb') {
                this.setState({pageType:'grocery'});
              }
            }
          }
        });
      }
    }
    this.setState({ loggedIn: true, userData: userData, isLoading: false });

    if (navigator.platform.indexOf("Win") > -1) {
      document.documentElement.className += " perfect-scrollbar-on";
      document.documentElement.classList.remove("perfect-scrollbar-off");
      ps = new PerfectScrollbar(this.refs.mainPanel, { suppressScrollX: true });
      let tables = document.querySelectorAll(".table-responsive");
      for (let i = 0; i < tables.length; i++) {
        ps = new PerfectScrollbar(tables[i]);
      }
    }
  }
  
  componentWillUnmount() {
    if (navigator.platform.indexOf("Win") > -1) {
      ps.destroy();
      document.documentElement.className += " perfect-scrollbar-off";
      document.documentElement.classList.remove("perfect-scrollbar-on");
    }
  }
  componentDidUpdate(e) {
    if (e.history.action === "PUSH") {
      if (navigator.platform.indexOf("Win") > -1) {
        let tables = document.querySelectorAll(".table-responsive");
        for (let i = 0; i < tables.length; i++) {
          ps = new PerfectScrollbar(tables[i]);
        }
      }
      document.documentElement.scrollTop = 0;
      document.scrollingElement.scrollTop = 0;
      this.refs.mainPanel.scrollTop = 0;
    }
  }
  // this function opens and closes the sidebar on small devices
  toggleSidebar = () => {
    document.documentElement.classList.toggle("nav-open");
    this.setState({ sidebarOpened: !this.state.sidebarOpened });
  };
  getRoutes = routes => {
    let defaultPage = JSON.parse(getSession("defaultPage"));
    const pageInfo = JSON.parse(getSession("pageInfo"));
    const productVouchersEnabled = pageInfo && pageInfo.productVouchersEnabled ? true : false
    const productUploadXLSEnabled = pageInfo && pageInfo.productUploadXLSEnabled ? true : false
    return routes.map((prop, key) => {
      if (prop.layout === "/admin") {
        if (this.state.pageType) {
          if(this.state.pageType === 'sb-tours') {
            if(prop.path === '/import-products') return null;
            if(prop.path === '/import-products-excel') return null;
            if(prop.path === '/page') return null;
            if(prop.path === '/product-categories') return null;
            if(prop.path === '/reports/order') return null;
            if(prop.path === '/reports/product') return null;
          } else {
            if(prop.path === '/tours') return null;
            if(prop.path === '/tour-dates') return null;
            if(defaultPage) {
              if(defaultPage !== '5ccfe6aeb99ae3280fd246dc') {
                if(prop.path === '/import-products') return null;
              }
              if(defaultPage !== '5ccfe6aeb99ae3280fd246dc' && defaultPage !== '5ea5519c91aec75b7a387d4b' && !productUploadXLSEnabled) {
                if(prop.path === '/import-products-excel') return null
              }
              if(!productVouchersEnabled) {
                if(prop.path === '/product-vouchers') return null
              }
            }
          }
        } else {
          if(prop.path === '/tours') return null;
          if(prop.path === '/tour-dates') return null;
          if(defaultPage && defaultPage !== '5ccfe6aeb99ae3280fd246dc')  {
            if(prop.path === '/import-products') return null;
          }
        }
        return (
          <Route
            exact
            path={prop.path}
            component={prop.component}
            key={key}
          />
        );
      } else {
        return null;
      }
    });
  };
  handleBgClick = color => {
    this.setState({ backgroundColor: color });
  };
  getBrandText = path => {
    for (let i = 0; i < routes.length; i++) {
      if (
        this.props.location.pathname.indexOf(
          routes[i].path
        ) !== -1
      ) {
        return routes[i].name;
      }
    }
    return "StreetBy";
  };
  render() {
    const userData = JSON.parse(getSession('userData'));
    if(!userData) {
      this.props.history.push("/login");
      window.location.reload();
    } else {
      return (
        <>
          <div className="wrapper">
            <Sidebar
              {...this.props}
              routes={routes}
              bgColor={this.state.backgroundColor}
              logo={{
                outterLink: "https://www.streetby.com/",
                text: "StreetBy",
                imgSrc: logo
              }}
              toggleSidebar={this.toggleSidebar}
            />
            <div
              className="main-panel"
              ref="mainPanel"
              data={this.state.backgroundColor}
            >
              <AdminNavbar
                {...this.props}
                brandText={this.getBrandText(this.props.location.pathname)}
                toggleSidebar={this.toggleSidebar}
                sidebarOpened={this.state.sidebarOpened}
              />
              <Switch>
                {this.getRoutes(routes)}
                <Route path="*" component={NotFound} />
              </Switch>
              {this.props.location.pathname.indexOf("statement-of-agreement") !== -1 ? null : (
                <Footer fluid />
              )}
            </div>
          </div>
          <FixedPlugin
            bgColor={this.state.backgroundColor}
            handleBgClick={this.handleBgClick}
          />
          <LoadingOverlay
            active={this.state.isLoading}
            spinner
            text='Loading...'
            >
          </LoadingOverlay>
        </>
      );
    }
  }
}

const mapStateToProps = () => ({});

export default connect(
  mapStateToProps,{getProviderPlaces}
)(Admin);
