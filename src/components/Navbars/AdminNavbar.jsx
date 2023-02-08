import React from "react";
// nodejs library that concatenates classes
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import classNames from "classnames";
import api from "../../config/api";
import { getSession, setSession } from "../../config/session";
import { getProviderPlaces } from "../../layouts/User/UserActions";
import { getPageById } from "../../layouts/Admin/actions/PageActions";
import { FontAwesomeIcon as Fa } from "@fortawesome/react-fontawesome";
import LoadingOverlay from 'react-loading-overlay';

import logoBlu from "assets/img/sb-pin-logo-blu.png";

// reactstrap components
import {
  Collapse,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
  Input,
  NavbarBrand,
  Navbar,
  NavLink,
  Nav,
  Container,
  Modal,
} from "reactstrap";

class AdminNavbar extends React.Component {
  constructor(props) {
    const userData = JSON.parse(getSession("userData"));
    
    super(props);
    this.state = {
      collapseOpen: false,
      modalSearch: false,
      color: "navbar-transparent",
      userData: userData,
      places: [],
      defaultPage: "",
      isSwitching: false,
    };
    this.changeDefaultPage = this.changeDefaultPage.bind(this);
  }
  componentDidMount() {
    const userData = JSON.parse(getSession("userData"));
    const sessionToken = userData.sessionToken;
    const defaultPage = JSON.parse(getSession("defaultPage"));
    this.setState({ defaultPage: defaultPage });
    window.addEventListener("resize", this.updateColor);
    this.props.getProviderPlaces(sessionToken,(error, result) => {
      if (!error && result) {
        this.setState({ places: result.places });
      }
    });
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.updateColor);
  }
  // function that adds color white/transparent to the navbar on resize (this is for the collapse)
  updateColor = () => {
    if (window.innerWidth < 993 && this.state.collapseOpen) {
      this.setState({
        color: "bg-white"
      });
    } else {
      this.setState({
        color: "navbar-transparent"
      });
    }
  };
  // this function opens and closes the collapse on small devices
  toggleCollapse = () => {
    if (this.state.collapseOpen) {
      this.setState({
        color: "navbar-transparent"
      });
    } else {
      this.setState({
        color: "bg-white"
      });
    }
    this.setState({
      collapseOpen: !this.state.collapseOpen
    });
  };
  // this function is to open the Search modal
  toggleModalSearch = () => {
    this.setState({
      modalSearch: !this.state.modalSearch
    });
  };
  onLogout = () => {
    if (!window.confirm("Are you sure you want to logout?")) {
      return false;
    }
    localStorage.clear();
    setTimeout(() => { 
      if(getSession('userData') === null) {
        this.props.history.push('/login');
        window.location.reload();
        return this.setState({ loggedIn: false });
      }
    },1000);
  };
  
  renderPageSwitch(places) {
    const userData = JSON.parse(getSession("userData"));
    let defaultPage = JSON.parse(getSession('defaultPage'));
    let pageInfo = JSON.parse(getSession('pageInfo'));
    if(userData) {
      if(!pageInfo) {
        const sessionToken = userData.sessionToken;
        this.props.getProviderPlaces(sessionToken,(error, result) => {
          if (!error && result) {
            if(result.places && result.places instanceof Array && result.places.length > 0 ) {
              if(defaultPage==="") {
                const defaultPlace = result.places.find(item => item.isDefault);
                if(defaultPlace && defaultPlace._id) {
                  defaultPage = defaultPlace._id;
                  pageInfo = defaultPlace;
                  setSession('pageInfo',JSON.stringify(pageInfo));
                } else {
                  defaultPage = result.places[0]._id;
                  pageInfo = result.places[0];
                  setSession('pageInfo',JSON.stringify(pageInfo));
                }
                setSession('defaultPage',JSON.stringify(defaultPage));
              } else {
                pageInfo = result.places.find(item => item._id.toString() === defaultPage);
                setSession('pageInfo',JSON.stringify(pageInfo));
              }
            }
          }
        });
      }

      if(places) {
        return places.map((item, index) => (
          <React.Fragment key={item._id}>
            <DropdownItem divider tag="li" className="page-switch-list"/>
            <NavLink tag="li" className={ defaultPage === item._id ? 'default-page page-switch-list' : 'page-switch-list' }>
              <DropdownItem onClick={this.changeDefaultPage} data-id={item._id}>
                <div className="page-switch">
                  <Link to="#" className="page-photos">
                    <img
                      src={(item.photos && item.photos.length > 0 && item.photos[0].thumb) ? item.photos[0].thumb : logoBlu }
                      alt={item.name}
                      title={item.name}
                    />
                  </Link>
                  <p>{item.name}</p>
                </div>
              </DropdownItem>
            </NavLink>
          </React.Fragment>
        ));
      }
    }
  }

  changeDefaultPage(e) {
    const defaultPage = JSON.parse(getSession('defaultPage'));
    const defaultPageNew = e.currentTarget.dataset.id;
    if(defaultPage!==defaultPageNew) {
      this.setState({ isSwitching: true });
      const userData = JSON.parse(getSession('userData'));
      const sessionToken = userData.sessionToken;
      setSession('defaultPage',JSON.stringify(defaultPageNew));
      this.props.getPageById(defaultPageNew, sessionToken, (error, result) => {
        if (error) {
          console.error(error);
        } 
        if(result && result.page) {
          const { page } = result;
          const pageInfo = {
            _id: page._id,
            name: page.name,
            addressLine1: page.addressLine1,
            city: page.city,
            country: page.country,
            province: page.province,
            postalCode: page.postalCode,
            pageType: page.pageType,
            bankaccount: page.bankaccount,
            isVerified: page.isVerified,
            isActive: page.isActive,
            photos: page.photos,
            useCreatedProductCategory: page.useCreatedProductCategory,
            productUploadXLSEnabled: page.productUploadXLSEnabled ? true : false,
            productVouchersEnabled: page.productVouchersEnabled ? true : false
          }
          setSession('pageInfo',JSON.stringify(pageInfo));
        }
      });
      api(sessionToken).get(`/places/${defaultPage}/product-categories/get-one`)
        .then(resp => {
          if(resp) {
            setSession('hasCategories',true);
          } else {
            setSession('hasCategories',false);
          }
        })
      .catch(error => {
        setSession('hasCategories',false);
      })
      this.setState({ defaultPage: defaultPageNew });
      setTimeout(() => { 
        this.setState({ isSwitching: false });
        this.props.history.push("/products");
        window.location.reload();
      }, 3000);
    }
  }

  render() {
    let primaryPhoto = {};
    let photoThumb = "";
    if (
      this.state.userData.info.photos &&
      this.state.userData.info.photos.length > 0
    ) {
      primaryPhoto = this.state.userData.info.photos.find(
        item => item.isCover
      );
      photoThumb = primaryPhoto ? primaryPhoto.thumb : logoBlu
    } else {
      photoThumb = logoBlu;
    }
    
    return (
      <>
        <Navbar
          className={classNames("navbar-absolute", this.state.color)}
          expand="lg"
        >
          <Container fluid>
            <div className="navbar-wrapper">
              <div
                className={classNames("navbar-toggle d-inline", {
                  toggled: this.props.sidebarOpened
                })}
              >
                <button
                  className="navbar-toggler"
                  type="button"
                  onClick={this.props.toggleSidebar}
                >
                  <span className="navbar-toggler-bar bar1" />
                  <span className="navbar-toggler-bar bar2" />
                  <span className="navbar-toggler-bar bar3" />
                </button>
              </div>
              <NavbarBrand href="#" onClick={e => e.preventDefault()}>
                {this.props.brandText}
              </NavbarBrand>
            </div>
            <button
              aria-expanded={false}
              aria-label="Toggle navigation"
              className="navbar-toggler"
              data-target="#navigation"
              data-toggle="collapse"
              id="navigation"
              type="button"
              onClick={this.toggleCollapse}
            >
              <span className="navbar-toggler-bar navbar-kebab" />
              <span className="navbar-toggler-bar navbar-kebab" />
              <span className="navbar-toggler-bar navbar-kebab" />
            </button>
            <Collapse navbar isOpen={this.state.collapseOpen}>
              <Nav className="ml-auto" navbar>
                <UncontrolledDropdown nav style={{ display: "block" }}>
                  <p
                    style={{
                      fontWeight: "600",
                      fontSize: "12px",
                      lineHeight: "45px"
                    }}
                  >
                    {this.state.userData &&
                      this.state.userData.info &&
                      this.state.userData.info.name &&
                      this.state.userData.info.name}
                  </p>
                </UncontrolledDropdown>
                <UncontrolledDropdown nav>
                  <DropdownToggle
                    caret
                    color="default"
                    data-toggle="dropdown"
                    nav
                    onClick={e => e.preventDefault()}
                  >
                    <b className="caret d-none d-lg-block d-xl-block" />
                    <div className="photo">
                      <img
                        alt={ this.state.userData && this.state.userData.info && this.state.userData.info.name && this.state.userData.info.name }
                        src={ photoThumb && photoThumb } 
                      />
                    </div>
                  </DropdownToggle>
                  <DropdownMenu className="dropdown-navbar dropdown-page-switch" right tag="ul">
                    {this.renderPageSwitch(this.state.places)}
                    <NavLink tag="li">
                      <DropdownItem className="nav-item"><Fa icon="plus" /> <Link to="/add-page">Add New Page</Link></DropdownItem>
                    </NavLink>
                    <DropdownItem divider tag="li" />
                    <NavLink tag="li">
                      <DropdownItem className="nav-item"><Link to="/page" style={{display:'block'}}>Edit Page</Link></DropdownItem>
                    </NavLink>
                    <NavLink tag="li">
                      <DropdownItem className="nav-item"><Link to="/settings" style={{display:'block'}}>Settings</Link></DropdownItem>
                    </NavLink>
                    <DropdownItem divider tag="li" />
                    <NavLink tag="li">
                      <DropdownItem
                        className="nav-item"
                        onClick={this.onLogout}
                      >
                        Log out
                      </DropdownItem>
                    </NavLink>
                  </DropdownMenu>
                </UncontrolledDropdown>
                <li className="separator d-lg-none" />
              </Nav>
            </Collapse>
          </Container>
        </Navbar>
        <Modal
          modalClassName="modal-search"
          isOpen={this.state.modalSearch}
          toggle={this.toggleModalSearch}
        >
          <div className="modal-header">
            <Input id="inlineFormInputGroup" placeholder="SEARCH" type="text" />
            <button
              aria-label="Close"
              className="close"
              data-dismiss="modal"
              type="button"
              onClick={this.toggleModalSearch}
            >
              <i className="tim-icons icon-simple-remove" />
            </button>
          </div>
        </Modal>
        <LoadingOverlay
          active={this.state.isSwitching}
          spinner
          text='Switching...'
          >
        </LoadingOverlay>
      </>
    );
  }
}

const mapStateToProps = () => ({});

export default connect(
  mapStateToProps, { getProviderPlaces, getPageById }
)(AdminNavbar);
