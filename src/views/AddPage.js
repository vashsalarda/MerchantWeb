import React from "react";
import { Link } from "react-router-dom";
import { getSession } from "../config/session";
import api from "../config/api";
import { connect } from "react-redux";
import { WithContext as ReactTags } from "react-tag-input";
import CheckboxTree from "react-checkbox-tree";
import { FontAwesomeIcon as Fa } from "@fortawesome/react-fontawesome";
import Map from "./Map";
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';
import Switch from "react-toggle-switch";

// Import CheckboxTree styles
import "react-checkbox-tree/lib/react-checkbox-tree.css";

import { getProviderInfo } from "../layouts/User/UserActions";
import { getProductTypes } from "../layouts/Admin/actions/ProductActions";
import {
  addPage,
  getPageTypes,
  getPageCategories,
  getAmenities
} from "../layouts/Admin/actions/PageActions";
import { setSession } from "../config/session";

import {
  Alert,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  FormGroup,
  Form,
  Input,
  Label,
  Nav,
  NavItem,
  NavLink,
  Row,
  Col
} from "reactstrap";

const KeyCodes = {
  comma: 188,
  enter: 13
};

const delimiters = [KeyCodes.comma, KeyCodes.enter];

class AddPage extends React.Component {
  constructor(props) {
    const userData = JSON.parse(getSession("userData"));
    super(props);
    this.state = {
      place: {
        pageType: "",
        name: "",
        about: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        province: "",
        country: "",
        postalCode: "",
        location: "",
        tags2d: [],
        amenities: [],
        streetby: {
          commission: 0,
          userDiscount: 0
        },
        pagecategories: [],
        isActive: false,
        isVerified: false,
        useCreatedProductCategory: true,
        showCreatedProductSubCategory: true,
        productsViewGrid: true
      },
      pageTypes: [],
      pageCategories: [],
      pageAmenities: [],
      isSaving: false,
      submitted: false,
      userData: userData,
      checked: [],
      expanded: [],
      checkedAmty: [],
      expandedAmty: [],
      lat: 8.48479728734788,
      lng: 124.65104731086728,
      activeStep: 'page-info',
      steps: {
        pageInfo: true,
        address: true,
        pageCategory: true,
        otherSettings: true
      },
      submitBtnDisabled: true,
      nextBtnToAddress: true,
      nextBtnToPageCategory: true,
      nextBtnToOtherSettings: true,
      cities: []
    };
  }

  componentDidMount() {
    const userData = JSON.parse(getSession("userData"));

    if (userData !== null) {
      this.props.getPageTypes((error, result) => {
        if (!error && result) {
          this.setState({ pageTypes: result });
        }
      });
      this.props.getPageCategories((error, result) => {
        if (!error && result) {
          this.setState({ pageCategories: result });
        }
      });
      this.props.getAmenities((error, result) => {
        if (!error && result) {
          this.setState({ pageAmenities: result });
        }
      });
      api().get('/provider/supported-cities')
        .then(response => {
          if(response && response.data) {
            const cities = response.data;
            this.setState({cities});
          }
        })
        .catch(error => {
          console.error(error);
        })
    }
  }

  handleDelete = (i) => {
    let tags2d = this.state.place.tags2d;
    const newTags = tags2d.filter((tag, index) => index !== i);
    this.setState({
      place: {
        ...this.state.place,
        tags2d: newTags
      }
    });
  }

  handleAddition = (tag) => {
    let tags2d = this.state.place.tags2d;
    tags2d = [...tags2d,tag];
    this.setState({
      place: {
        ...this.state.place,
        tags2d: tags2d
      }
    });
  }

  handleDrag = (tag, currPos, newPos) => {
    const tags2d = [...this.state.place.tags2d];
    const newTags = tags2d.slice();

    newTags.splice(currPos, 1);
    newTags.splice(newPos, 0, tag);

    this.setState({
      place: {
        ...this.state.place,
        tags2d: newTags
      }
    });
  }

  handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = e.target.checked;
      value = checked;
    }
    if(name === 'city' && value) {
      const { cities } = this.state;
      const selectedCity = cities && cities.length > 0 ? cities.find(item => item.name === value) : {};
      const { location: { coordinates } } = selectedCity && selectedCity.location ? selectedCity : {};
      if(coordinates && coordinates.length > 0 ) {
        const latVal = Number(coordinates[1]);
        const lngVal = Number(coordinates[0]);
        if(latVal > 0 && lngVal > 0) {
          this.setState({
            lat: latVal,
            lng: lngVal
          });
        } else {
          this.setState({
            lat: 8.48479728734788,
            lng: 124.65104731086728,
          });
          this.showNotificationError('Map coordinates values are invalid!');
        }
      }
    }
    this.setState({
      place: {
        ...this.state.place,
        [name]: value
      }
    }, function() {
      if(this.state.activeStep==='page-info') {
        if(this.state.place.name !== '' && this.state.place.pageType !== '' ) {
          this.setState({nextBtnToAddress:false})
        } else {
          this.setState({nextBtnToAddress:true})
        }
      } else if(this.state.activeStep==='address') {
        if(this.state.place.address !== '' && this.state.place.city !== '' ) {
          this.setState({nextBtnToPageCategory:false})
        } else {
          this.setState({nextBtnToPageCategory:true})
        }
      }
      if(this.state.place.name !== '' &&
        this.state.place.pageType !== '' &&
        this.state.place.address !== '' && 
        this.state.place.city !== '' && 
        this.state.place.pageCategories && 
        this.state.place.pageCategories.length > 0
      ) {
        this.setState({submitBtnDisabled:false})
      }
    });
  }

  handleNextToAddress = (e) => {
    e.preventDefault();
    this.setState({ submitted: true});
    if(this.state.activeStep==='page-info') {
      if(this.state.place.name !== '' && this.state.place.pageType !== '' ) {
        this.setState({
          steps: {
            ...this.state.steps,
            address: true
          },
          activeStep: 'address'
        });
        this.setState({ submitted: false });
      } else {
        this.setState({
          steps: {
            ...this.state.steps,
            address: false
          }
        });
        this.setState({ submitted: false });
      }
    }
  }

  handleNextToPageCategory = (e) => {
    e.preventDefault();
    this.setState({ submitted: true});
    if(this.state.activeStep==='address') {
      if(this.state.place.address !== '' && this.state.place.city !== '' ) {
        this.setState({
          steps: {
            ...this.state.steps,
            pageCategory: true
          },
          activeStep: 'page-category'
        });
        this.setState({ submitted: false });
      } else {
        this.setState({
          steps: {
            ...this.state.steps,
            pageCategory: false
          }
        });
        this.setState({ submitted: false });
      }
    }
  }

  handleNextToOtherSettings = (e) => {
    e.preventDefault();
    this.setState({ submitted: true});
    if(this.state.activeStep==='page-category') {
      if(this.state.checked && this.state.checked.length > 0) {
        this.setState({
          steps: {
            ...this.state.steps,
            otherSettings: true
          },
          activeStep: 'other-settings'
        });
        this.setState({ submitted: false });
      } else {
        this.setState({
          steps: {
            ...this.state.steps,
            otherSettings: false
          }
        });
        this.setState({ submitted: false });
      }
    }
  }

  handleSubmit = (e) => {
    e.preventDefault();

    if (!window.confirm("Do you want to save this page?")) {
      return false;
    }

    const userData = JSON.parse(getSession("userData"));
    const sessionToken = userData.sessionToken;
    const { place } = { ...this.state };

    if (place) {

      const { lat, lng } = this.state;
      const location = {
        coordinates: [lng,lat],
      }

      place.location = location;

      if (this.state.place.tags2d) {
        const tagsMapped = this.state.place.tags2d.map(item => item.id);
        place.tags = tagsMapped;
      } else {
        place.tags = [];
      }

      const pageCategories = this.state.pageCategories;

      if (this.state.checked) {
        const categoriesArr = this.state.checked;
        categoriesArr.forEach(item => {
          const category = pageCategories.find(cat => cat._id === item);
          const categoryObj = {
            _id: category._id,
            name: category.name,
            slug: category.slug
          };
          place.pagecategories.push(categoryObj);
        });
      } else {
        place.pagecategories = [];
      }

      const pageAmenities = this.state.pageAmenities;
      let allFeatures = [];
      pageAmenities.forEach(item => {
        const features = item.features;
        allFeatures = allFeatures.concat(features);
      });

      if (this.state.checkedAmty) {
        const amenitiesArr = this.state.checkedAmty;
        amenitiesArr.forEach(item => {
          const amenity = allFeatures.find(amty => amty._id === item);
          const amenityObj = {
            _id: amenity._id,
            name: amenity.name,
            description: amenity.description,
            icon: amenity.icon,
            isTop: false
          };
          place.amenities.push(amenityObj);
        });
      } else {
        place.amenities = [];
      }
      delete place.tags2d;
    }
    if (place.name && place.pageType) {
      this.setState({ submitted: true, isSaving: true });
      this.props.addPage(place, sessionToken, (error, result) => {
        if (error) {
          console.error({error});
          this.setState({ submitted:false, isSaving:false });
          if(error instanceof String) {
            this.showNotificationError(error);
          } else if(error.response && error.response instanceof String) {
            this.showNotificationError(error.response);
          } else {
            this.showNotificationError('There is an problem saving the page. Please try again!');
          }
        } else {
          this.setState({ submitted:false, isSaving:false });
          this.showNotification('A new page has been added!');
          const { place } = result;
          const pageInfo = {
            _id: place._id,
            name: place.name,
            addressLine1: place.addressLine1,
            city: place.city,
            country: place.country,
            province: place.province,
            postalCode: place.postalCode,
            pageType: place.pageType,
            bankaccount: place.bankaccount,
            isVerified: place.isVerified,
            isActive: place.isActive,
            photos: place.photos,
            useCreatedProductCategory: place.useCreatedProductCategory,
            hideTutorials: true,
            productUploadXLSEnabled: place.productUploadXLSEnabled ? true : false,
            productVouchersEnabled: place.productVouchersEnabled ? true : false
          }
          setSession('pageInfo',JSON.stringify(pageInfo));
          setSession('defaultPage',JSON.stringify(place._id));
          setSession('hasCategories',false);
          setSession('hasProducts',false);
          this.setState({ defaultPage: place._id });
          setTimeout(() => {
            this.props.history.push("/statement-of-agreement");
            window.location.reload();
          }, 2000);
        }
      });
    } else {
      this.setState({ submitted:true });
      this.showNotificationError('Some field are required! Please fill the missing fields.');
    }
  }

  showNotification(message) {
    if(message) {
      const notification = {
        place: 'tc',
        message: (
          <div>
            <div>
              {message}
            </div>
          </div>
        ),
        type: "success",
        icon: "",
        autoDismiss: 5
      }
      this.refs.notify.notificationAlert(notification);
    }
  }

  showNotificationError(message) {
    if(message) {
      const notification = {
        place: 'tc',
        message: (
          <div>
            <div>
              {message}
            </div>
          </div>
        ),
        type: "danger",
        icon: "",
        autoDismiss: 5
      }
      this.refs.notify.notificationAlert(notification);
    }
  }

  updateCoordinates = (lat, lng) => {
    this.setState({
      lat: lat,
      lng: lng
    });
  }

  onKeyPress = e => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

   renderPageTypes() {
    if (this.state.pageTypes !== undefined || this.state.pageTypes != null) {
      const activePageTypes = this.state.pageTypes.filter(
        item => (item.isActive = !false)
      );

      return activePageTypes.map((item, index) => (
        <option key={index} value={item._id}>
          {item.name}
        </option>
      ));
    }
  }

  

  renderVerticalNav() {
    return(
      <Nav vertical>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'page-info' ? " active-link" : "")} to="#" 
            onClick={() => { 
              this.setState({activeStep: 'page-info' } ) 
            }}
          >
            Store Information<span style={{float:"right"}}><Fa icon="chevron-right" /></span>
          </NavLink> 
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'address' ? " active-link" : "") + (this.state.steps.address === false ? " disabled" : "")} to="#" 
            onClick={() => { 
              if(this.state.steps.address === true) {
                this.setState({ activeStep: 'address' } );
              }
            }}
          >
            Address <span style={{float:"right"}}><Fa icon="chevron-right" /></span>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'page-category' ? " active-link" : "") + (this.state.steps.pageCategory === false ? " disabled" : "")} to="#"  
            onClick={() => { 
              if(this.state.steps.pageCategory === true) {
                this.setState({ activeStep: 'page-category' } );
              }
            }}
          >
            Categories &amp; Amenities <span style={{float:"right"}}><Fa icon="chevron-right" /></span>
          </NavLink> 
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'other-settings' ? " active-link" : "") + (this.state.steps.otherSettings === false ? " disabled" : "")} to="#"
            onClick={() => { 
              if(this.state.steps.otherSettings === true) {
                this.setState({ activeStep: 'other-settings' } );
              }
            }}
          >
            Other Settings <span style={{float:"right"}}><Fa icon="chevron-right" /></span>
          </NavLink>
        </NavItem>
      </Nav>
    )
  }

  renderPageInfo(place) {
    return(
      <>
        <Row>
          <Col lg="12" md="12" sm="12">
            <FormGroup>
              <Alert color="primary">
                Select a name, type and add description for your store.
              </Alert>
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col className="" md="6" sm="12">
            <FormGroup
              className={
                this.state.submitted && !place.name
                  ? " has-danger"
                  : ""
              }
            >
              <label htmlFor="name" className="control-label">Name <em className="text-muted">(Required)</em></label>
              <Input
                id="name"
                name="name"
                placeholder="Page Name"
                type="text"
                value={place.name}
                onChange={this.handleChange}
                autoComplete="off"
              />
            </FormGroup>
          </Col>
          <Col className="" md="6" sm="12">
            <FormGroup
              className={
                this.state.submitted &&
                !place.pageType
                  ? " has-danger"
                  : ""
              }
            >
              <label className="control-label">Industry <em className="text-muted">(Required)</em></label>
              <Input
                id="pageType"
                name="pageType"
                placeholder="Industry"
                type="select"
                value={place.pageType}
                onChange={this.handleChange}
              >
                <option value="">Select Industry</option>
                {this.renderPageTypes()}
              </Input>
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col className="" sm="12">
            <FormGroup style={{ marginBottom: "1.25rem" }}>
              <label htmlFor="about" className="control-label">About</label>
              <Input
                id="about"
                name="about"
                placeholder="About"
                type="textarea"
                value={place.about}
                onChange={this.handleChange}
                style={{height:'150px'}}
              />
            </FormGroup>
          </Col>
        </Row>
      </>
    )
  }

  renderAddress(place) {
    return(
      <>  
        <Row>
          <Col lg="12" md="12" sm="12">
            <FormGroup>
              <Alert color="primary">
                Add address information of your store.
              </Alert>
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col className="" md="6">
            <FormGroup>
              <label
                htmlFor="addressLine1"
                className="control-label"
              >
                Address <em>(Line 1)</em>
              </label>
              <Input
                name="addressLine1"
                placeholder="Address (Line 1)"
                type="text"
                value={place.addressLine1}
                onChange={this.handleChange}
              />
            </FormGroup>
          </Col>
          <Col className="" md="6">
            <FormGroup>
              <label
                htmlFor="addressLine2"
                className="control-label"
              >
                Address <em>(Line 2)</em>
              </label>
              <Input
                name="addressLine2"
                placeholder="Address (Line 2)"
                type="text"
                value={place.addressLine2}
                onChange={this.handleChange}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col className="" md="6">
            <FormGroup>
              <label htmlFor="city" className="control-label">
                City
              </label>
              <Input
                id="city"
                bsSize="lr"
                name="city"
                placeholder="City/Town"
                type="select"
                value={place.city}
                onChange={this.handleChange}
              >
                <option value="">City/Town</option>
                {this.renderCities(this.state.cities)}
              </Input>
            </FormGroup>
          </Col>
          <Col className="" md="6">
            <FormGroup>
              <label
                htmlFor="province"
                className="control-label"
              >
                Province
              </label>
              <Input
                name="province"
                placeholder="Province"
                type="text"
                value={place.province}
                onChange={this.handleChange}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col className="" md="6">
            <FormGroup>
              <label
                htmlFor="country"
                className="control-label"
              >
                Country
              </label>
              <Input
                name="country"
                placeholder="Country"
                type="text"
                value={place.country}
                onChange={this.handleChange}
              />
            </FormGroup>
          </Col>
          <Col className="" md="6">
            <FormGroup>
              <label
                htmlFor="postalCode"
                className="control-label"
              >
                Postal Code
              </label>
              <Input
                name="postalCode"
                placeholder="Postal Code"
                type="text"
                value={place.postalCode}
                onChange={this.handleChange}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col className="" md="12" style={{minHeight:'460px'}}>
            <FormGroup>
              {this.state.lat && this.state.lng &&
                <Map
                  google={this.props.google}
                  center={{
                    lat: this.state.lat,
                    lng: this.state.lng
                  }}
                  height="450px"
                  zoom={15}
                  address={`${this.state.place.addressLine1}, ${this.state.place.city}, ${this.state.place.province}`}
                  city={this.state.place.city}
                  onDragMarkerEnd={this.updateCoordinates}
                />
              }
            </FormGroup>
          </Col>
        </Row>
      </>
    )
  }

  renderPageCategory(amenitiesTree,categoriesTree,icons) {
    return(
      <>
        <Row>
          <Col lg="12" md="12" sm="12">
            <FormGroup>
              <Alert color="primary">
                Select categories and amenities.
              </Alert>
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col className="" md="12">
            <FormGroup>
              <label
                htmlFor="pageCategory"
                className="control-label sub-legend"
              >
                Page Category{" "}
              </label>
              <CheckboxTree
                nodes={categoriesTree}
                checked={this.state.checked}
                expanded={this.state.expanded}
                onCheck={
                  checked => this.setState({ checked }, function() {
                    if(this.state.activeStep==='page-category') {
                      if(this.state.checked && this.state.checked.length > 0 ) {
                        this.setState({nextBtnToOtherSettings:false})
                      } else {
                        this.setState({nextBtnToOtherSettings:true})
                      }
                    }
                    if(this.state.place.name !== '' &&
                      this.state.place.pageType !== '' &&
                      this.state.place.address !== '' && 
                      this.state.place.city !== '' && 
                      this.state.checked && 
                      this.state.checked.length > 0
                    ) {
                      this.setState({submitBtnDisabled:false})
                    }
                  })
                }
                onExpand={expanded =>
                  this.setState({ expanded })
                }
                showNodeIcon={false}
                icons={icons}
                nativeCheckboxes
              />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col
            className=""
            md="12"
            style={{ marginTop: "15px" }}
          >
            <FormGroup>
              <Label
                htmlFor="pageAmenities"
                className="control-label sub-legend"
              >
                Amenities
              </Label>
              <CheckboxTree
                nodes={amenitiesTree}
                checked={this.state.checkedAmty}
                expanded={this.state.expandedAmty}
                onCheck={checked =>
                  this.setState({ checkedAmty: checked })
                }
                onExpand={expanded =>
                  this.setState({ expandedAmty: expanded })
                }
                noCascade
                showNodeIcon={false}
                icons={icons}
                onlyLeafCheckboxes={true}
                nativeCheckboxes
              />
            </FormGroup>
          </Col>
        </Row>
      </>
    )
  }

  renderOtherSettings(place) {
    return(
      <>
        <Row>
          <Col lg="12" md="12" sm="12">
            <FormGroup>
              <Alert color="primary">
                Add tags and other settings for your store.
              </Alert>
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col
            className=""
            md="6"
            sm="12"
          >
            <FormGroup>
              <Label
                htmlFor="tags"
                className="control-label sub-legend"
              >
                Tags
              </Label>
              <ReactTags
                tags={place.tags2d}
                delimiters={delimiters}
                handleDelete={this.handleDelete}
                handleAddition={this.handleAddition}
                handleDrag={this.handleDrag}
                autofocus={false}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col md="6">
            <FormGroup>
              <Label>
                <Switch
                  onClick={() => {
                    this.setState({
                      place: {
                        ...this.state.place,
                        productsViewGrid: !place.productsViewGrid
                      }
                    });
                  }}
                  on={place.productsViewGrid}
                />
                Product Grid View
              </Label>
            </FormGroup>
          </Col>
        </Row>
      </>
    )
  }

  renderCities(cities) {
    if (cities && cities.length > 0) {
      const activePageTypes = cities.filter(
        item => (item.isActive = !false)
      );
      return activePageTypes.map((item, index) => (
        <option key={index} value={item.name}>
          {item.name}
        </option>
      ));
    }
  }

  render() {
    const pageCategories = this.state.pageCategories;
    const parentCategories = pageCategories.filter(item => !item.parent);
    const childCategories = pageCategories.filter(item => item.parent);
    let categoriesTree = [];
    if (parentCategories) {
      parentCategories.forEach(cat => {
        const value = cat._id.toString();
        const label = cat.name;
        const sublist = childCategories.filter(
          item => item.parent.toString() === value
        );
        let children1 = [];
        if (sublist instanceof Array && sublist.length > 0) {
          let category1 = [];
          sublist.forEach(cat => {
            const value = cat._id;
            const label = cat.name;
            const category = {
              value: value,
              label: label,
              children: []
            };
            category1.push(category);
          });
          children1 = category1;
        }
        const children = children1;
        const category = {
          value: value,
          label: label,
          children: children
        };
        categoriesTree.push(category);
      });
    }

    const pageAmenities = this.state.pageAmenities;
    let amenitiesTree = [];
    if (pageAmenities) {
      pageAmenities.forEach(item => {
        const value = item._id;
        const label = item.type[0].name;
        const sublist = item.features;
        let children1 = [];
        if (sublist instanceof Array && sublist.length > 0) {
          let feature1 = [];
          sublist.forEach(subItem => {
            const value = subItem._id;
            const label = subItem.name;
            const feature = {
              value,
              label,
            };
            feature1.push(feature);
          });
          children1 = feature1;
        }
        const children = children1;
        const amenity = {
          value,
          label,
          children
        };
        amenitiesTree.push(amenity);
      });
    }

    const icons = {
      check: (
        <Fa
          className="rct-icon rct-icon-check"
          icon={["far", "check-square"]}
        />
      ),
      uncheck: (
        <Fa
          className="rct-icon rct-icon-uncheck"
          icon={["far", "square"]}
        />
      ),
      halfCheck: (
        <Fa
          className="rct-icon rct-icon-half-check"
          icon={["far", "check-square"]}
        />
      ),
      expandClose: (
        <Fa
          className="rct-icon rct-icon-expand-close"
          icon="chevron-right"
        />
      ),
      expandOpen: (
        <Fa
          className="rct-icon rct-icon-expand-open"
          icon="chevron-down"
        />
      ),
      expandAll: (
        <Fa
          className="rct-icon rct-icon-expand-all"
          icon="plus-square"
        />
      ),
      collapseAll: (
        <Fa
          className="rct-icon rct-icon-collapse-all"
          icon="minus-square"
        />
      ),
      parentClose: (
        <Fa
          className="rct-icon rct-icon-parent-close"
          icon={["far", "folder"]}
        />
      ),
      parentOpen: (
        <Fa
          className="rct-icon rct-icon-parent-open"
          icon={["far", "folder-open"]}
        />
      ),
      leaf: (
        <Fa
          className="rct-icon rct-icon-leaf-close"
          icon={["far", "file"]}
        />
      )
    };

    return (
      <>
        <div className="content">
          <div className="react-notification-alert-container">
            <NotificationAlert ref="notify" />
          </div>
          <Row>
            <Col sm="12" md="12" lg="12">
              <Card>
                <Form onSubmit={this.handleSubmit} onKeyPress={this.onKeyPress}>
                  <CardHeader>
                    <h4 className="title">Add New Page</h4>
                  </CardHeader>
                  <CardBody>
                    <Row>
                      <Col sm="12" md="12" lg="12">
                        <Row>
                          <Col className="" sm="4">
                            {this.renderVerticalNav()}
                          </Col>
                          <Col className="" md="8" sm="8">
                            {
                              (this.state.activeStep === 'page-info' && this.state.steps.pageInfo === true) ? this.renderPageInfo(this.state.place) :
                              (this.state.activeStep === 'address' && this.state.steps.address === true) ? this.renderAddress(this.state.place) :
                              (this.state.activeStep === 'page-category' && this.state.steps.pageCategory === true) ? this.renderPageCategory(amenitiesTree,categoriesTree,icons) :
                              (this.state.activeStep === 'other-settings' && this.state.steps.pageCategory === true) ? this.renderOtherSettings(this.state.place) : this.renderPageInfo(this.state.place)
                            }
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </CardBody>
                  <CardFooter>
                    <Button
                      className="btn-fill btn-round"
                      disabled={this.state.submitBtnDisabled}
                      color="info"
                      onClick={this.handleSubmitButton}
                    >
                      Save
                    </Button>
                    {this.state.activeStep==='page-info' &&
                      <Button
                        className="btn-fill btn-round"
                        disabled={this.state.nextBtnToAddress}
                        color="info"
                        type="button"
                        onClick={this.handleNextToAddress}
                      >
                        Next
                      </Button>
                    }
                    {this.state.activeStep==='address' &&
                      <Button
                        className="btn-fill btn-round"
                        disabled={this.state.nextBtnToPageCategory}
                        color="info"
                        type="button"
                        onClick={this.handleNextToPageCategory}
                      >
                        Next
                      </Button>
                    }
                    {this.state.activeStep==='page-category' &&
                      <Button
                        className="btn-fill btn-round"
                        disabled={this.state.nextBtnToOtherSettings}
                        color="info"
                        type="button"
                        onClick={this.handleNextToOtherSettings}
                      >
                        Next
                      </Button>
                    }
                    <Link
                      to="/products"
                      className="btn btn-round btn-info"
                    >
                      Cancel
                    </Link>
                  </CardFooter>
                </Form>
              </Card>
            </Col>
          </Row>
          <LoadingOverlay
            active={this.state.isSaving}
            spinner
            text='Saving...'
            >
          </LoadingOverlay>
        </div>
      </>
    );
  }
}

const mapStateToProps = () => ({});

export default connect(
  mapStateToProps,
  {
    addPage,
    getProductTypes,
    getProviderInfo,
    getPageTypes,
    getPageCategories,
    getAmenities
  }
)(AddPage);
