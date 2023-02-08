/*eslint-disable*/
import React from "react";
import { NavLink, Link } from "react-router-dom";
// nodejs library to set properties for components
import { PropTypes } from "prop-types";
// javascript plugin used to create scrollbars on windows
import { connect } from "react-redux";
import PerfectScrollbar from "perfect-scrollbar"
import { getSession } from '../../config/session';
import { getProviderPlaces } from "../../layouts/User/UserActions";

// reactstrap components
import { Badge, Nav } from "reactstrap";

var ps;

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.activeRoute.bind(this);
    this.state = {
      isGrocery: false,
      pageType: 'food-drink',
    };
  }
  // verifies if routeName is the one active (in browser input)
  activeRoute(routeName) {
    return this.props.location.pathname.indexOf(routeName) > -1 ? "active" : "";
  }

  componentDidMount() {
    const userData = JSON.parse(getSession('userData'));
    const sessionToken = userData.sessionToken;
    let pageInfo = JSON.parse(getSession("pageInfo"));
    
    if(userData && userData.isSBTours) {
      this.setState({pageType:'sb-tours'});
    } else {
      if(pageInfo) { // If pageType Grocery
        if(pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb') { // If pageType Grocery
          this.setState({isGrocery:true});
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
                this.setState({isGrocery:true});
                this.setState({pageType:'grocery'});
              }
            }
          }
        });
      }
    }
    if (navigator.platform.indexOf("Win") > -1) {
      ps = new PerfectScrollbar(this.refs.sidebar, {
        suppressScrollX: true,
        suppressScrollY: false
      });
    }
  }
  componentWillUnmount() {
    if (navigator.platform.indexOf("Win") > -1) {
      ps.destroy();
    }
  }
  linkOnClick = () => {
    document.documentElement.classList.remove("nav-open");
  };
  // onLogout = () => {
  //   if (window.confirm("Are you sure you want to logout?")){
  //     localStorage.clear();
  //     if(getSession('userData') === null) {
  //       this.props.history.push('/login');
  //       window.location.reload();
  //       return this.setState({ loggedIn: false });
  //     }
  //     return true;
  //   } else {
  //     return false;
  //   }
  // };
  render() {
    let pageInfo = JSON.parse(getSession("pageInfo"));
    let userData = JSON.parse(getSession("userData"));
    let defaultPage = JSON.parse(getSession("defaultPage"));
    const { bgColor, routes, rtlActive, logo } = this.props;
    const sidebarRoutes = routes.filter(item => item.showOnSidebar );
    let logoImg = null;
    let logoText = null;
    if (logo !== undefined) {
      if (logo.outterLink !== undefined) {
        logoImg = (
          <a
            href={logo.outterLink}
            className="simple-text logo-mini"
            target="_blank"
            onClick={this.props.toggleSidebar}
          >
            <div className="logo-img">
              <img src={logo.imgSrc} alt="react-logo" />
            </div>
          </a>
        );
        logoText = (
          <a
            href={logo.outterLink}
            className="simple-text logo-normal"
            target="_blank"
            onClick={this.props.toggleSidebar}
          >
            {logo.text}
          </a>
        );
      } else {
        logoImg = (
          <Link
            to={logo.innerLink}
            className="simple-text logo-mini"
            onClick={this.props.toggleSidebar}
          >
            <div className="logo-img">
              <img src={logo.imgSrc} alt="react-logo" />
            </div>
          </Link>
        );
        logoText = (
          <Link
            to={logo.innerLink}
            className="simple-text logo-normal"
            onClick={this.props.toggleSidebar}
          >
            {logo.text}
          </Link>
        );
      }
    }
    return (
      <div className="sidebar" data={bgColor}>
        <div className="sidebar-wrapper" ref="sidebar">
          {logoImg !== null || logoText !== null ? (
            <div className="logo">
              {logoImg}
              {logoText}
            </div>
          ) : null}
          <Nav>
            {sidebarRoutes.map((prop, key) => {
              if (prop.redirect) return null;
              if (pageInfo) {
                const productVouchersEnabled = pageInfo && pageInfo.productVouchersEnabled ? true : false
                const productUploadXLSEnabled = pageInfo && pageInfo.productUploadXLSEnabled ? true : false
                if (userData.isSBTours === 'sb-tours') {
                  if(prop.path === '/import-products') return null;
                  if(prop.path === '/page') return null;
                  if(prop.path === '/product-categories') return null;
                  if(prop.path === '/products') return null;
                  if(prop.path === '/reports/order') return null;
                  if(prop.path === '/reports/product') return null;
                } else {
                  if(pageInfo.isVerified !== true || pageInfo.isActive !== true) {
                    if(prop.path === '/order-list') return null;
                    if(prop.path === '/reports/sales') return null;
                    if(prop.path === '/reports/order') return null;
                    if(prop.path === '/reports/product') return null;
                  }
                  //if(prop.path === '/import-products') return null;
                  if(prop.path === '/orders') return null;
                  if(prop.path === '/tours') return null;
                  if(prop.path === '/tour-dates') return null;
                  if(defaultPage) {
                    if(defaultPage !== '5ccfe6aeb99ae3280fd246dc') {
                      if(prop.path === '/import-products') return null;
                    }
                    if(defaultPage !== '5ccfe6aeb99ae3280fd246dc' && defaultPage !== '5ea5519c91aec75b7a387d4b' && !productUploadXLSEnabled) {
                      if(prop.path === '/import-products-excel') return null;
                    }
                    if(!productVouchersEnabled) {
                      if(prop.path === '/product-vouchers') return null
                    }
                  }
                }
              } else {
                if(prop.path === '/import-products') return null;
                if(prop.path === '/orders') return null;
                if(prop.path === '/tours') return null;
                if(prop.path === '/tour-dates') return null;
                if(prop.path === '/order-list') return null;
                if(prop.path === '/reports/sales') return null;
                if(prop.path === '/reports/order') return null;
                if(prop.path === '/reports/product') return null;
              }

              return (
                <li
                  className={
                    this.activeRoute(prop.path) +
                    (prop.pro ? " active-pro" : "")
                  }
                  key={key}
                >
                  <NavLink
                    to={prop.path}
                    className="nav-link"
                    activeClassName="active"
                    onClick={this.props.toggleSidebar}
                  >
                    <i className={prop.icon} />
                <p>{rtlActive ? prop.rtlName : prop.name}</p>
                  </NavLink>
                </li>
              );
            })}
            {/* <li key="1911">
              <NavLink to="" onClick={this.onLogout} className="nav-link" href="#"><i className="tim-icons icon-button-power"></i><p>Logout</p></NavLink>
            </li> */}
          </Nav>
        </div>
      </div>
    );
  }
}

Sidebar.defaultProps = {
  rtlActive: false,
  bgColor: "blue",
  routes: [{}]
};

Sidebar.propTypes = {
  // if true, then instead of the routes[i].name, routes[i].rtlName will be rendered
  // insde the links of this component
  rtlActive: PropTypes.bool,
  bgColor: PropTypes.oneOf(["primary", "blue", "green"]),
  routes: PropTypes.arrayOf(PropTypes.object),
  logo: PropTypes.shape({
    // innerLink is for links that will direct the user within the app
    // it will be rendered as <Link to="...">...</Link> tag
    innerLink: PropTypes.string,
    // outterLink is for links that will direct the user outside the app
    // it will be rendered as simple <a href="...">...</a> tag
    outterLink: PropTypes.string,
    // the text of the logo
    text: PropTypes.node,
    // the image src of the logo
    imgSrc: PropTypes.string
  })
};

const mapStateToProps = () => ({});

export default connect(
  mapStateToProps, { getProviderPlaces }
)(Sidebar);
