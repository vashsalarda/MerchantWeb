import React from "react";
import { Link } from "react-router-dom";
import { getSession, setSession } from "../config/session";
import api from "../config/api";
import { connect } from "react-redux";
import { WithContext as ReactTags } from "react-tag-input";
import CheckboxTree from "react-checkbox-tree";
import { FontAwesomeIcon as Fa } from "@fortawesome/react-fontawesome";
import Map from "./Map";
import { PulseLoader, SyncLoader } from "react-spinners";
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';
import Switch from "react-toggle-switch";

// Import CheckboxTree styles
import "react-checkbox-tree/lib/react-checkbox-tree.css";

import { getProviderInfo } from "../layouts/User/UserActions";
import { getProductTypes } from "../layouts/Admin/actions/ProductActions";
import {
  getPageById,
  getPageTypes,
  getPageCategories,
  getAmenities,
  updatePage,
  uploadPhoto,
  removePhoto
} from "../layouts/Admin/actions/PageActions";

import {
  Alert,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Col,
  FormGroup,
  Form,
  Input,
  Label,
  Nav,
  NavItem,
  NavLink,
  Row,
} from "reactstrap";

const KeyCodes = {
  comma: 188,
  enter: 13
};

const delimiters = [KeyCodes.comma, KeyCodes.enter];

const divStyle = {
  position: 'relative',
  height: 145,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: '#666',
  borderStyle: 'solid',
  borderRadius: 5
};

class EditPage extends React.Component {
  constructor(props) {
    const userData = JSON.parse(getSession("userData"));
    const defaultPage = JSON.parse(getSession("defaultPage"));
    super(props);
    this.state = {
      pageId: defaultPage,
      pageExists: false,
      place: {},
      pageTypes: [],
      pageCategories: [],
      pageAmenities: [],
      isLoading: true,
      submitted: false,
      isSaving: false,
      userData: userData,
      checked: [],
      expanded: [],
      checkedAmty: [],
      expandedAmty: [],
      lat: 8.48479728734788,
      lng: 124.65104731086728,
      useCreatedProductCategory: false,
      showCreatedProductSubCategory: false,
      productsViewGrid: false,
      isUploading: false,
      activeStep: 'page-info',
      steps: {
        pageInfo: true,
        address: true,
        pageCategory: true,
        otherSettings: true,
        images: true,
        bankInfo: true
      },
      warnings: [],
      hideTutorials: false,
      cities: []
    };
  }

  componentDidMount() {
    const userData = JSON.parse(getSession("userData"));
    const sessionToken = userData.sessionToken;
    const pageId = this.state.pageId;

    if (userData !== null) {
      this.props.getPageById(pageId, sessionToken, (error, result) => {
        if (!error && result) {
          
          const pageObj = result.page;
          let tagsList = pageObj.tags.filter(item => item.trim() !== '');
          let tagsArray = [];

          if(tagsList instanceof Array && tagsList.length > 0) {
            tagsList.forEach((item) => {
              let listItem = {};
              listItem.id = item;
              listItem.text = item;
              tagsArray.push(listItem);
            });
          }

          let categoriesIdArray = [];
          if(pageObj.pagecategories instanceof Array && pageObj.pagecategories.length > 0) {
            pageObj.pagecategories.forEach(cat => {
              let catId = cat._id;
              categoriesIdArray.push(catId);
            });
          }

          let amenitiesArray = [];
          if(pageObj.amenities instanceof Array && pageObj.amenities.length > 0) {
            pageObj.amenities.forEach(item => {
              let itemId = item._id;
              amenitiesArray.push(itemId);
            });
          }
          
          this.setState({
            pageExists: true,
            pageId: pageObj._id,
            place: {
              pageType: pageObj.pageType,
              name: pageObj.name,
              about: pageObj.about,
              addressLine1: pageObj.addressLine1,
              addressLine2: pageObj.addressLine2,
              city: pageObj.city,
              province: pageObj.province,
              country: pageObj.country,
              postalCode: pageObj.postalCode,
              location: pageObj.location,
              tags2d: tagsArray,
              amenities: pageObj.amenities,
              destinations: pageObj.destinations,
              contactName: pageObj.contactName,
              email: pageObj.email,
              defaultContactNumber: pageObj.v,
              callContactNumber: pageObj.callContactNumber,
              landlineNumber: [],
              mobileNumber: [],
              website: pageObj.website,
              priceCategory: pageObj.priceCategory,
              hasLowestPrice: pageObj.hasLowestPrice,
              lowestPrice: pageObj.lowestPrice,
              pagecategories: pageObj.pagecategories,
              businessHours: pageObj.businessHours,
              isActive: pageObj.isActive,
              isVerified: pageObj.isVerified,
              paymentMethod: pageObj.paymentMethod,
              loginUrl: (pageObj.privateApiInfo && pageObj.privateApiInfo.loginUrl) ? pageObj.privateApiInfo.loginUrl : "",
              apiUsername: (pageObj.privateApiInfo && pageObj.privateApiInfo.username) ? pageObj.privateApiInfo.username : "",
              apiPassword: (pageObj.privateApiInfo && pageObj.privateApiInfo.password) ? pageObj.privateApiInfo.password : "",
              productsUrl: (pageObj.privateApiInfo && pageObj.privateApiInfo.productsUrl) ? pageObj.privateApiInfo.productsUrl : "",
              apiKey: (pageObj.privateApiInfo && pageObj.privateApiInfo.apiKey) ? pageObj.privateApiInfo.apiKey : "",
              useCreatedProductCategory: pageObj.useCreatedProductCategory,
              showCreatedProductSubCategory: pageObj.showCreatedProductSubCategory,
              productsViewGrid: pageObj.productsViewGrid,
              notificationText: pageObj.productsNotificationText && pageObj.productsNotificationText.notificationText ? pageObj.productsNotificationText.notificationText : '',
              notificationType: pageObj.productsNotificationText && pageObj.productsNotificationText.notificationType ? pageObj.productsNotificationText.notificationType : 'default',
              accountName: (pageObj.bankaccount && pageObj.bankaccount.accountName) ? pageObj.bankaccount.accountName : "",
              accountNumber: (pageObj.bankaccount && pageObj.bankaccount.accountNumber) ? pageObj.bankaccount.accountNumber : "",
              bankName: (pageObj.bankaccount && pageObj.bankaccount.bankName) ? pageObj.bankaccount.bankName : "",
              photos: pageObj.photos ? pageObj.photos : [],
              hideTutorials: (pageObj.hideTutorials && pageObj.hideTutorials === true) ? true : false
            },
            checked: [...categoriesIdArray],
            checkedAmty: [...amenitiesArray],
            lat: pageObj.location.coordinates[1],
            lng: pageObj.location.coordinates[0],
          },function() { this.setState({ isLoading: false }) });

          let warnings = [];
          if(this.state.place.photos && this.state.place.photos.length < 1) {
            warnings = [...warnings,'You have not added a profile photo for your store.'];
          }
          if(this.state.place.accountName && this.state.place.accountNumber && this.state.place.bankName) {
            if(this.state.place.accountName === '' || this.state.place.accountNumber === '' || this.state.place.bankName === '') {
              warnings = [...warnings,'The bank details you provide is incomplete.'];
            }
          } else {
            warnings.push('You have not provided bank details for your store.');
          }
          if(this.state.place.addressLine1 === '' || this.state.place.city === '') {
            warnings = [...warnings,'Please provide address details for your store.'];
          }
          this.setState({ warnings: warnings });
        } else if(error) {
          this.setState({ isLoading: false });
        }
      });
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
    const { tags2d } = this.state.place;
    const newTags = tags2d.filter((tag, index) => index !== i);
    this.setState({
      place: {
        ...this.state.place,
        tags2d: newTags
      }
    });
  }

  handleAddition = (tag) => {
    const { tags2d } = this.state.place;
    tags2d.push(tag);
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
    });
  }

  onKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  onDismiss = () => {
    let pageInfo = JSON.parse(getSession("pageInfo"));
    this.setState({
      place: {
        ...this.state.place,
        hideTutorials: true
      }
    });
    pageInfo.hideTutorials = true;
    setSession('pageInfo',JSON.stringify(pageInfo));
  }

  onHideTutorials = () => {
    if (!window.confirm("Are you sure you want to hide this section permanently?")) {
      return false;
    }
    let pageInfo = JSON.parse(getSession("pageInfo"));
    let userData = JSON.parse(getSession("userData"));
    const sessionToken = userData.sessionToken;
    const place = { 
      hideTutorials: true
    }
    this.props.updatePage(place, pageInfo._id, sessionToken, (error, result) => {
      if (result) {
        this.setState({
          place: {
            ...this.state.place,
            hideTutorials: true
          }
        });
        pageInfo.hideTutorials = true;
        setSession('pageInfo',JSON.stringify(pageInfo));
      }
    });
  }

  handleSubmit = (e) =>{
    e.preventDefault();
    const hasCategories = JSON.parse(getSession("hasCategories"));
    const hasProducts = JSON.parse(getSession("hasProducts"));
    const userData = JSON.parse(getSession("userData"));
    const pageInfo = JSON.parse(getSession("pageInfo"));
    if(!userData) {
      this.showNotificationError('You are not logged in. Please login to continue.');
      setTimeout(() => { 
        this.props.history.push("/login");
        window.location.reload();
      },2000);
    }
    const sessionToken = userData.sessionToken;
  
    const { place, pageId: placeId
     } = { ...this.state };

    if (place.name && place.pageType && place.addressLine1 && place.city) {

      if (!window.confirm("Do you want to save this page?")) {
        return false;
      }

      this.setState({ submitted: true, isSaving: true });
      
      if (place) {
        const { lat, lng } = this.state;
        const location = {
          type: "Point",
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

        const privateApiInfo = {
          loginUrl: this.state.place.loginUrl ? this.state.place.loginUrl : "",
          username: this.state.place.apiUsername ? this.state.place.apiUsername : "",
          password: this.state.place.apiPassword ? this.state.place.apiPassword : "",
          productsUrl: this.state.place.productsUrl ? this.state.place.productsUrl : "",
          apiKey: this.state.place.apiKey ? this.state.place.apiKey : "",
        }
       
        let productsNotificationText = {};
        if (this.state.place.notificationText && this.state.place.notificationType) {
          productsNotificationText = {
            notificationText: this.state.place.notificationText,
            notificationType: this.state.place.notificationType
          };
        }
        place.bankaccount = {
          bankName: this.state.place.bankName ? this.state.place.bankName : '',
          accountName: this.state.place.accountName ? this.state.place.accountName : '',
          accountNumber: this.state.place.accountNumber ? this.state.place.accountNumber : ''
        }
        place.productsNotificationText = productsNotificationText;
        place.privateApiInfo = privateApiInfo;
        delete place.tags2d;
        delete place.loginUrl;
        delete place.apiUsername;
        delete place.apiPassword;
        delete place.productsUrl;
        delete place.apiKey;
        delete place.notificationText;
        delete place.notificationType;
        delete place.bankName;
        delete place.accountName;
        delete place.accountNumber
                
        this.props.updatePage(place, placeId, sessionToken, (error, result) => {
          if (result) {
            this.setState({ submitted: false, isSaving: false });
            const pageInfoUpdated = {
              _id: placeId,
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
              hideTutorials: pageInfo.hideTutorials,
              productUploadXLSEnabled: place.productUploadXLSEnabled ? true : false,
              productVouchersEnabled: place.productVouchersEnabled ? true : false
            }
            setSession('pageInfo',JSON.stringify(pageInfoUpdated));
            if(place) {
              if(place.isActive !== true) {
                if(hasCategories) {
                  if(hasProducts) {
                    this.showNotification('Store has been updated. You can now activate your store.');
                    setTimeout(() => { this.props.history.push("/activate-store") }, 3000);
                  } else  {
                    this.showNotification('Store has been updated. You can now add products.');
                    setTimeout(() => { this.props.history.push("/products/new") }, 3000);
                  }
                } else {
                  this.showNotification('Store information has been updated. You can now add categories.');
                  setTimeout(() => { this.props.history.push("/product-categories/new") }, 3000);
                }
              } else {
                this.showNotification('Store information has been updated.');
                setTimeout(() => {  this.props.history.push("/page") }, 3000);
              }
            }
          } else {
            if (error) {
              if (error.response && error.response.status) {
                if(error.response.status === 401) { 
                  this.showNotificationError('Invalid credentials. Please try again');
                  setTimeout(() => {
                    this.props.history.push("/page");
                    window.location.reload();
                  }, 2000);
                } else {
                  if (typeof error.response.statusText === 'string') {
                    this.showNotificationError(error.response.statusText);
                  } else {
                    this.showNotificationError('There is an error saving the page.');
                  }
                }
              } else {
                if (error.message && typeof error.message === 'string') {
                  this.showNotificationError(error.message);
                } else {
                  this.showNotificationError('There is an error saving the page.');
                }
              }
            }
            this.setState({ submitted: false, isSaving: false });
          }
        });
      } else {
        this.setState({ submitted: false, isSaving: false });
        this.showNotificationError('Page information is missing.');
      }
    } else {
      this.setState({ submitted: true });
      this.showNotificationError('Some fields are required. Please fill the required fields.');
    }
  }

  handleFileUpload = (e) => {
    const userData = JSON.parse(getSession("userData"));
    const files = e.target.files;
    const images = this.state.place.photos;

    if(images.length<6) {
      this.setState({isUploading: true});
      const pageId = this.state.pageId;
      const sessionToken = userData.sessionToken;
      const images = this.state.place.photos;
      const formData = new FormData();
      formData.append('file', files[0]);
      this.props.uploadPhoto(pageId, formData, sessionToken, (error, result) => {
        if (!error && result) {
          this.setState({ isUploading:false });
          const photo = result;
          if(photo._id) {
            images.push(photo);
            this.setState({
              place: {
                ...this.state.place,
                photos: images
              }
            });
          }
        } else {
          this.setState({ isUploading:false });
          if (error.response && typeof error.response === 'string') {
            console.error(error.response);
            this.showNotificationError(error.response);
          } else {
            console.error({error});
            this.showNotificationError('There is an error uploading the file. Please try again');
          }
        }
      });
    } else {
      this.setState({ isUploading:false });
      console.log('No. of files: ',files.length);
      alert('You are only allowed to upload a maximum of 6 files!');
    }
  }

  removeImage = (e) => {
    const userData = JSON.parse(getSession("userData"));
    const pageId = this.state.pageId;
    const imgId = e.currentTarget.dataset.id;
    const sessionToken = userData.sessionToken;

    this.props.removePhoto(pageId, imgId, sessionToken, (error, result) => {
      if (!error && result) {
        if(result.deleted==='ok') {
          const images = this.state.place.photos;
          const newImages = images.filter(item => item._id !== imgId);
          this.setState({
            place: {
              ...this.state.place,
              photos: newImages
            }
          });
          this.showNotification('Image was successfully removed.');
        }
      } else {
        if (error.response && typeof error.response === 'string') {
          console.error(error.response);
          this.showNotificationError(error.response);
        } else {
          console.error({error});
          this.showNotificationError('There is error removing the image.');
        }
      }
    });
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

  renderVerticalNavBar() {
    return(
      <Nav vertical >
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'page-info' ? " active-link" : "")} to="#" 
            onClick={() => { 
              this.setState({activeStep: 'page-info' } ) 
            }}
          >
            Place Information<span style={{float:"right"}}><Fa icon="chevron-right" /></span>
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
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'images' ? " active-link" : "") + (this.state.steps.images === false ? " disabled" : "")} to="#" 
            onClick={() => { 
              if(this.state.steps.images === true) {
                this.setState({ activeStep: 'images' } );
              }
            }}
          >
            Images <span style={{float:"right"}}><Fa icon="chevron-right" /></span>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'bank-info' ? " active-link" : "") + (this.state.steps.bankInfo === false ? " disabled" : "")} to="#" 
            onClick={() => { 
              if(this.state.steps.bankInfo === true) {
                this.setState({ activeStep: 'bank-info' } );
              }
            }}
          >
            Bank Details <span style={{float:"right"}}><Fa icon="chevron-right" /></span>
          </NavLink>
        </NavItem>
      </Nav>
    );
  }

  renderPageInfo(place) {
    return(
      <>
        <Row>
          <Col md="6" sm="12">
            <FormGroup
              className={
                this.state.submitted && !place.name
                  ? " has-danger"
                  : ""
              }
            >
              <label htmlFor="name" className="control-label">
                Name <em className="text-muted">(Required)</em>
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Page Name"
                type="text"
                value={this.state.place.name}
                onChange={this.handleChange}
                autoComplete="off"
              />
            </FormGroup>
          </Col>
          <Col md="6" sm="12">
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
          <Col md="12">
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
          <Col md="6">
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
          <Col md="6">
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
          <Col md="6">
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
          <Col md="6">
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
          <Col md="6">
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
          <Col md="6">
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
          <Col md="12">
            <FormGroup>
              <Map
                google={this.props.google}
                center={{
                  lat: this.state.lat,
                  lng: this.state.lng
                }}
                address={`${place.addressLine1}, ${place.city}, ${place.province}, ${place.country}`}
                city={this.state.place.city}
                height="450px"
                zoom={15}
                onDragMarkerEnd={this.updateCoordinates}
              />
            </FormGroup>
          </Col>
        </Row>
      </>
    );
  }

  renderPageCategory(amenitiesTree,categoriesTree,icons) {
    return(
      <>
        <Row>
          <Col md="12">
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
                onCheck={checked => this.setState({ checked })}
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
            className="pr-md-1"
            md="12"
            style={{ marginTop: "15px" }}
          >
            <FormGroup>
              <label
                htmlFor="pageAmenities"
                className="control-label sub-legend"
              >
                Amenities
              </label>
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
    );
  }

  renderOtherSettings(place) {
    const pageInfo = JSON.parse(getSession("pageInfo"));
    return(
      <>
        { pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb' &&
          <Row>
            <Col md="6" sm="12">
              <FormGroup>
                <label htmlFor="notificationText" className="control-label">
                  Products Notification Text
                </label>
                <Input
                  id="notificationText"
                  name="notificationText"
                  placeholder="Notification Text"
                  type="text"
                  value={place.notificationText}
                  onChange={this.handleChange}
                  autoComplete="off"
                />
              </FormGroup>
            </Col>
            <Col md="6" sm="12">
              <FormGroup>
                <label className="control-label">Notification Type</label>
                <Input
                  id="notificationType"
                  name="notificationType"
                  placeholder="Notification Type"
                  type="select"
                  value={place.notificationType}
                  onChange={this.handleChange}
                >
                  <option value="default">Default</option>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="danger">Danger</option>
                </Input>
              </FormGroup>
            </Col>
          </Row>
        }
        <Row>
          <Col
            className="pr-md-1"
            md="12"
            sm="12"
            style={{ marginTop: "15px" }}
          >
            <FormGroup>
              <label
                htmlFor="tags"
                className="control-label sub-legend"
              >
                Tags
              </label>
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
        { pageInfo &&
          <>
            { pageInfo.pageType === '5cd141d10d437be772373ddb' &&
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label>
                      <Switch
                        onClick={() => {
                          this.setState({
                            place: {
                              ...this.state.place,
                              useCreatedProductCategory: !place.useCreatedProductCategory
                            }
                          });
                        }}
                        on={place.useCreatedProductCategory}
                      />
                      Use Product Categories
                    </Label>
                  </FormGroup>
                </Col>
              </Row>
            }
            { pageInfo.pageType === '5cd141d10d437be772373ddb' &&
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label>
                      <Switch
                        onClick={() => {
                          this.setState({
                            place: {
                              ...this.state.place,
                              showCreatedProductSubCategory: !place.showCreatedProductSubCategory
                            }
                          });
                        }}
                        on={place.showCreatedProductSubCategory}
                      />
                      Show Product Sub-Categories
                    </Label>
                  </FormGroup>
                </Col>
              </Row>
            }
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
        }
        { pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb' &&
          <>
            <Row>
              <Col sm="12">
                <Alert color="primary">These are information for your private API.</Alert>
              </Col>
            </Row>
            <Row>
              <Col md="12">
                <FormGroup>
                  <label htmlFor="loginUrl" className="control-label">
                    Login URL
                  </label>
                  <Input
                    id="loginUrl"
                    name="loginUrl"
                    placeholder="Login URL"
                    type="text"
                    value={this.state.place.loginUrl}
                    onChange={this.handleChange}
                    autoComplete="off"
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md="6" sm="12">
                <FormGroup>
                  <label htmlFor="apiUsername" className="control-label">
                    Username
                  </label>
                  <Input
                    id="apiUsername"
                    name="apiUsername"
                    placeholder="API Username"
                    type="text"
                    value={this.state.place.apiUsername}
                    onChange={this.handleChange}
                    autoComplete="off"
                  />
                </FormGroup>
              </Col>
              <Col md="6" sm="12">
                <FormGroup>
                  <label htmlFor="apiPassword" className="control-label">
                    API Password
                  </label>
                  <Input
                    id="apiPassword"
                    name="apiPassword"
                    placeholder="API Password"
                    type="password"
                    value={this.state.place.apiPassword}
                    onChange={this.handleChange}
                    autoComplete="off"
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md="12">
                <FormGroup>
                  <label htmlFor="productsUrl" className="control-label">
                    Products URL
                  </label>
                  <Input
                    id="productsUrl"
                    name="productsUrl"
                    placeholder="Products URL"
                    type="text"
                    value={this.state.place.productsUrl}
                    onChange={this.handleChange}
                    autoComplete="off"
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md="12" sm="12">
                <FormGroup>
                  <label htmlFor="apiKey" className="control-label">
                    API Key
                  </label>
                  <Input
                    id="apiKey"
                    name="apiKey"
                    placeholder="API Key"
                    type="text"
                    value={this.state.place.apiKey}
                    onChange={this.handleChange}
                    autoComplete="off"
                  />
                </FormGroup>
              </Col>
            </Row>
          </>
        }
      </>
    )
  }

  renderBankInfo(place) {
    return(
      <>
        <Row>
          <Col sm="12">
            <Alert color="primary">Enter your bank details. This will be used for depositing gateway transactions.</Alert>
          </Col>
        </Row>
        <Row>
          <Col md="12">
            <FormGroup>
              <label htmlFor="bankName" className="control-label">
                Bank Name
              </label>
              <Input
                id="bankName"
                name="bankName"
                placeholder="Bank"
                type="text"
                value={place.bankName || ''}
                onChange={this.handleChange}
                autoComplete="off"
              />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col md="6" sm="12">
            <FormGroup>
              <label htmlFor="accountName" className="control-label">
                Account Name
              </label>
              <Input
                id="accountName"
                name="accountName"
                placeholder="Account Name"
                type="text"
                value={place.accountName || ''}
                onChange={this.handleChange}
                autoComplete="off"
              />
            </FormGroup>
          </Col>
          <Col md="6" sm="12">
            <FormGroup>
              <label htmlFor="accountNumber" className="control-label">
                Account Number
              </label>
              <Input
                id="accountNumber"
                name="accountNumber"
                placeholder="Account Number"
                type="text"
                value={place.accountNumber || ''}
                onChange={this.handleChange}
                autoComplete="off"
              />
            </FormGroup>
          </Col>
        </Row>
      </>
    );
  }

  renderImages(place) {
    return(
      <>
        <Row>
          <Col sm="12">
            <Alert color="primary">Upload image as profile photo for your store</Alert>
          </Col>
        </Row>
        <Row>
          <Col md="6">
            <FormGroup>
              <div className="upload-photo" style={{ margin: '10px auto', border: '1px solid #ccc', 'backgroundColor': '#efefef' }}>
                <Input name="images" label='upload file' type='file' onChange={this.handleFileUpload} style={divStyle} />
                  <ul className="product-photos">
                    {place.photos && place.photos.length > 0 &&
                      <>
                        {place.photos.map(({original, thumb, _id: id }) =>
                          <li key={id} >
                            <img alt={original} title={id} src={thumb}/>
                            <button data-id={id} type="button" onClick={this.removeImage} className="remove-image"><span style={{color:'#fefefe'}}>&times;</span></button>
                          </li>
                        )}
                      </>
                    }
                    {this.state.isUploading &&
                      <li style={{border:'0',padding:'10px'}}>
                        <SyncLoader
                          sizeUnit={"px"}
                          size={15}
                          color={'#1d8cf8'}
                          loading={this.state.isUploading}
                        />
                      </li>
                    }
                  </ul>
              </div>
            </FormGroup>
          </Col>
        </Row>
      </>
    );
  }

  renderNoPageAdded() {
    return (
      <div className="content">
        <div className="react-notification-alert-container">
          <NotificationAlert ref="notify" />
        </div>
        <Row>
          <Col sm="12" md="12" lg="12">
            <Card>
              <CardBody>
                <Alert color="danger">
                  <h4 className="alert-heading">No Page Added</h4>
                  <hr />
                  <p className="mb-0">
                    You have not added a page yet. Click{" "} <Link to="/add-page">here</Link> {" "}to add a new page.
                  </p>
                </Alert>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    );
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
    const hasCategories = JSON.parse(getSession("hasCategories"));
    const hasProducts = JSON.parse(getSession("hasProducts"));
    const pageInfo = JSON.parse(getSession("pageInfo"));
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
              value: value,
              label: label,
              children: []
            };
            feature1.push(feature);
          });
          children1 = feature1;
        }
        const children = children1;
        const amenity = {
          value: value,
          label: label,
          children: children
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

    if(this.state.isLoading) {
      return (
        <>
          <div className="content">
            <Row>
              <Col sm="12" md="12" lg="12">
                <Card>
                  <CardHeader>
                    <h4 className="title">Edit Page</h4>
                  </CardHeader>
                  <CardBody>
                    <PulseLoader
                      sizeUnit={"px"}
                      size={15}
                      color={'#1d8cf8'}
                      loading={this.state.isLoading}
                    />
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </div>
        </>
      );
    } else {
      if(this.state.pageExists) {
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
                        <h4 className="title">Edit Page - <em>{this.state.place.name}</em></h4>
                      </CardHeader>
                      <CardBody>
                        {!pageInfo.hideTutorials &&
                          <Row>
                            <Col md="12">
                              <Alert className="alert-compact" color="primary" isOpen={!pageInfo.hideTutorials} toggle={this.onDismiss} fade={false}>
                                <h4 className="alert-heading">New on Setup Store?</h4>
                                <hr />
                                <p className="mb-0">
                                  Check our videos here on how to setup your store.<br /> 
                                </p>
                                <a className="btn btn-sm btn-primary-v2" href="https://www.youtube.com/watch?v=k8VEDqbPv7w">View Tutorials</a>
                                <Button
                                  className="btn-fill btn-sm"
                                  color="danger"
                                  type="button"
                                  onClick={this.onHideTutorials}
                                >
                                  Hide Permanently
                                </Button>
                              </Alert>
                            </Col>
                          </Row>
                        }
                        <Row>
                          {this.state.place.isVerified !== true &&
                            <Col sm="12">
                              <Row>
                                <Col md="12">
                                  <Alert color="warning">
                                    <h4 className="alert-heading">You Have Not Agreed with our Terms & Policies</h4>
                                    <hr />
                                    <p className="mb-0">
                                      You must agree  with our Terms & Policies. Click {" "} <Link to="/statement-of-agreement">here</Link> {" "} to read our Terms & Policies.
                                    </p>
                                  </Alert>
                                </Col>
                              </Row>
                            </Col>
                          }
                          {this.state.place.isVerified && hasCategories && hasProducts && this.state.place.isActive !== true &&
                            <Col sm="12">
                              <Row>
                                <Col md="12">
                                  <Alert color="danger">
                                    <h4 className="alert-heading">Store Not Activated</h4>
                                    <hr />
                                    <p className="mb-0">
                                      You must activate your store so it will appear in the app and you can start selling.<br /> 
                                      Click {" "} <Link to="/activate-store">here</Link> {" "} to activate you store.
                                    </p>
                                  </Alert>
                                </Col>
                              </Row>
                            </Col>
                          }
                          <Col sm="12" md="3" lg="3">
                            {this.renderVerticalNavBar()}
                          </Col>
                          <Col sm="12" md="9" lg="9">
                          {this.state.warnings && this.state.warnings.length > 0 &&
                            <Row>
                              <Col sm="12">
                                {this.state.warnings.map((error,index) => {
                                  return(<Alert key={index} color="warning"><Fa icon="exclamation-triangle" /> {error}</Alert>)
                                })}
                              </Col>
                            </Row>
                          }
                          {(this.state.activeStep === 'page-info' && this.state.steps.pageInfo === true) ? this.renderPageInfo(this.state.place) :
                            (this.state.activeStep === 'address' && this.state.steps.address === true) ? this.renderAddress(this.state.place) :
                            (this.state.activeStep === 'page-category' && this.state.steps.pageCategory === true) ? this.renderPageCategory(amenitiesTree,categoriesTree,icons) :
                            (this.state.activeStep === 'other-settings' && this.state.steps.otherSettings === true)  ? this.renderOtherSettings(this.state.place) :
                            (this.state.activeStep === 'bank-info' && this.state.steps.bankInfo === true) ? this.renderBankInfo(this.state.place) :
                            (this.state.activeStep === 'images' && this.state.steps.images === true) ? this.renderImages(this.state.place) :
                            this.renderPageInfo(this.state.place)}
                          </Col>
                        </Row>
                      </CardBody>
                      <CardFooter>
                        <Button
                          className="btn-fill btn-round"
                          color="info"
                          type="submit"
                        >
                          Save
                        </Button>
                        <Link
                          to="/products"
                          className="btn btn-round btn-light"
                        >
                          Back
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
      } else {
        return(this.renderNoPageAdded());
      }
    }
  }
}

const mapStateToProps = () => ({});

export default connect(
  mapStateToProps,
  {
    getPageById,
    getProductTypes,
    getProviderInfo,
    getPageTypes,
    getPageCategories,
    getAmenities,
    updatePage,
    uploadPhoto,
    removePhoto
  }
)(EditPage);