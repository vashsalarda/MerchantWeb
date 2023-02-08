import React from "react";
import { connect } from "react-redux";
import { getSession, setSession } from "../../config/session";
import api from "../../config/api";
import { Link } from "react-router-dom";
import { WithContext as ReactTags } from 'react-tag-input';
import Switch from "react-toggle-switch";
import CheckboxTree from 'react-checkbox-tree';
import { FontAwesomeIcon as Fa } from '@fortawesome/react-fontawesome';
import queryString from "query-string";
import { PulseLoader, SyncLoader } from 'react-spinners';
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';
import { format } from 'date-fns';
import QRCode from 'qrcode.react';

import {
  getProductById,
  getProductTypes,
  getProductCategories,
  getProductCategoriesV2,
  updateProduct,
  uploadPhoto,
  removePhoto,
} from "../../layouts/Admin/actions/ProductActions";

import { getProviderPlaces } from "../../layouts/User/UserActions";

import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  FormGroup,
  Form,
  Input,
  Nav,
  NavItem,
  NavLink,
  Row,
  Col,
  Label,
  Table
} from "reactstrap";

// Keycodes used as tags delimiter
const KeyCodes = {
  comma: 188,
  enter: 13,
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

class EditProduct extends React.Component {
  constructor(props) {
    super(props);
    const productId = props.match.params._id;
    this.state = {
      productId: productId,
      productExist: false,
      product: null,
      productTypes: [],
      productCategories: [],
      places: [],
      checked: [],
      expanded: [],
      isLoading: true,
      isSaving: false,
      submitted: false,
      isUploading: false,
      isGrocery: false,
      pageType: 'food-drink',
      images: [],
      disableBarcode: true,
      disableItemcode: true,
      message: "",
      messageOpen: false,
      page: 1,
      keyword: "",
      status: "",
      availability: "",
      category: "",
      subCategory: "",
      activeStep: 'product-info',
      steps: {
        productInfo: true,
        price: true,
        productSettings: true,
        productCategory: true,
        images: true,
        vouchers: true,
      },
      hideTutorials: false,
      isGenerating: false,
    };
  }

  componentDidMount() {
    const userData = JSON.parse(getSession("userData"));
    const pageInfo = JSON.parse(getSession("pageInfo"));
    const placeId = JSON.parse(getSession("defaultPage"));
    const url = this.props.location.search;
    const query = queryString.parse(url);
    if(query.message && query.message !== '') {
      this.setState({
        message: query.message,
        messageOpen: true
      });
    }
    if(query.page && Number(query.page) > 1) {
      this.setState({ page: query.page });
    }
    if(query.keyword && query.keyword !== '') {
      this.setState({ keyword: query.keyword });
    }
    if(query.status && query.status !== '') {
      this.setState({ status: query.status });
    }
    if(query.availability && query.availability !== '') {
      this.setState({ status: query.status });
    }
    if(query.category && query.category !== '') {
      this.setState({ category: query.category });
    }
    if(query.subCategory && query.subCategory !== '') {
      this.setState({ subC: query.subCategory });
    }

    if(pageInfo) {
      if(pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb') { // If pageType Grocery
        this.setState({isGrocery:true});
        this.setState({pageType:'grocery'});
      } else if (pageInfo.pageType === '5dea2304f6bba08323a3ddce') { // If pageType SB Tours
        this.setState({pageType:'sb-tours'});
      }
    }

    if (userData !== null) {
      const sessionToken = userData.sessionToken;
      const productId = this.state.productId;
      this.setState({ hideTutorials: (pageInfo && pageInfo.hideTutorials && pageInfo.hideTutorials === true) ? true : false });
      this.props.getProductById(productId, sessionToken, (error, result) => {
        if (!error && result) {
          const productObj = result.product;
          let tagsList = productObj.tags.filter(item => item.trim() !== '');
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
          if(pageInfo && pageInfo.useCreatedProductCategory) {
            if(productObj.productCategories instanceof Array && productObj.productCategories.length > 0) {
              productObj.productCategories.forEach(cat => {
                if(cat && cat._id && cat.parent !== undefined && cat.parent !== null) {
                  let catId = cat._id;
                  categoriesIdArray.push(catId);
                }
              });
            }
          } else {
            if(productObj.categories instanceof Array && productObj.categories.length > 0) {
              productObj.categories.forEach(cat => {
                if(cat && cat._id) {
                  let catId = cat._id;
                  categoriesIdArray.push(catId);
                }
              });
            }
          }

          this.setState({
            productExist: true,
            product: {
              name: productObj.name,
              placeId: productObj.places[0]._id,
              summary: productObj.summary,
              description: productObj.description,
              tags2d: tagsArray,
              productType: productObj.productType ? productObj.productType._id : null,
              isFeatured: productObj.isFeatured,
              forSale: productObj.forSale,
              isActive: productObj.isActive,
              barcode: productObj.barcode,
              itemCode: productObj.itemCode,
              unit: productObj.unit,
              limit: productObj.limit,
              autofullfill: productObj.autofullfill,
              cost: productObj.cost,
              price: productObj.price,
              comparePrice: productObj.comparePrice,
              amenitites: productObj.amenity,
              productCategories: productObj.productCategories,
              photos: productObj.photos,
              forDinein: (productObj.options && productObj.options.DineIn) ? productObj.options.DineIn : false,
              forPickup: (productObj.options && productObj.options.PickUp) ? productObj.options.PickUp : false,
              forDelivery: (productObj.options && productObj.options.Delivery) ? productObj.options.Delivery : false,
              containerFeeAmt: (productObj.containerFee && productObj.containerFee.amount) ? productObj.containerFee.amount : 0,
              containerFeeDelivery: (productObj.containerFee && productObj.containerFee.supportedOrderOption && productObj.containerFee.supportedOrderOption.delivery) ? productObj.containerFee.supportedOrderOption.delivery : false,
              containerFeePickup: (productObj.containerFee && productObj.containerFee.supportedOrderOption && productObj.containerFee.supportedOrderOption.pickup) ? productObj.containerFee.supportedOrderOption.pickup : false,
              vouchers: productObj.vouchers ? productObj.vouchers : []
            },
            checked: [...categoriesIdArray]
          });
          this.setState({ isLoading: false });
        } else if(error) {
          this.setState({ isLoading: false });
        }
      });
      this.props.getProductTypes((error, result) => {
        if (!error && result) {
          this.setState({ productTypes: result });
        }
      });
      this.props.getProviderPlaces(sessionToken,(error, result) => {
        if (!error && result) {
          this.setState({ places: result.places });
        }
      });
      if(pageInfo && pageInfo.useCreatedProductCategory) {
        const query = {
          status: 'active'
        }
        this.props.getProductCategoriesV2(placeId, query, sessionToken, (error, result) => {
          if (!error && result) {
            this.setState({ productCategories: result });
          }
        });
      } else {
        this.props.getProductCategories(sessionToken, (error, result) => {
          if (!error && result) {
            this.setState({ productCategories: result });
          }
        });
      }
    } else {
      this.props.history.push("/login");
      window.location.reload();
    }
  }

  handleDelete = (i) => {
    const { tags2d } = this.state.product;
    const newTags = tags2d.filter((tag, index) => index !== i);
    this.setState({
      product: {
        ...this.state.product,
        tags2d: newTags
      }
    });
  }

  handleAddition = (tag) => {
    const { tags2d } = this.state.product;
    tags2d.push(tag);
    this.setState({
      product: {
        ...this.state.product,
        tags2d: tags2d
      }
    });
  }

  handleDrag = (tag, currPos, newPos) => {
    const tags2d = [...this.state.product.tags2d];
    const newTags = tags2d.slice();
    newTags.splice(currPos, 1);
    newTags.splice(newPos, 0, tag);
    this.setState({
      product: {
        ...this.state.product,
        tags2d: newTags
      }
    });
  }

  handleChangeDesc = (data) => {
    this.setState({
      product: {
        ...this.state.product,
        description: data
      }
    });
  }

  handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = e.target.checked;
      value = checked;
    }
    this.setState({
      product: {
        ...this.state.product,
        [name]: value
      }
    });
  }

  handleDisableBarcode = (e) => {
    this.setState(prevState => ({disableBarcode: !prevState.disableBarcode}));
  }

  handleDisableItemcode = (e) => {
    this.setState(prevState => ({disableItemcode: !prevState.disableItemcode}));
  }

  handleFileUpload = (e) => {
    const userData = JSON.parse(getSession("userData"));
    const files = e.target.files;
    const images = this.state.product.photos;

    if(images.length<6) {
      this.setState({isUploading: true});
      const productId = this.state.productId;
      const sessionToken = userData.sessionToken;
      const images = this.state.product.photos;
      const formData = new FormData();
      formData.append('file', files[0]);
      this.props.uploadPhoto(productId, formData, sessionToken, (error, result) => {
        if (!error && result) {
          this.setState({ isUploading:false });
          const photo = result;
          if(photo._id) {
            images.push(photo);
            this.setState({
              product: {
                ...this.state.product,
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
    const productId = this.state.productId;
    const imgId = e.currentTarget.dataset.id;
    const sessionToken = userData.sessionToken;

    this.props.removePhoto(productId, imgId, sessionToken, (error, result) => {
      if (!error && result) {
        if(result.deleted==='ok') {
          const images = this.state.product.photos;
          const newImages = images.filter(item => item._id !== imgId);
          this.setState({
            product: {
              ...this.state.product,
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

  onAlertDismiss = (e) => {
    this.setState(prevState => ({
      messageOpen: !prevState.messageOpen
    }));
  };

  onDismiss = () => {
    this.setState({ hideTutorials: true });
    let pageInfo = JSON.parse(getSession("pageInfo"));
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
    api(sessionToken).patch(`/provider/places/${pageInfo._id}`, place)
      .then(response => {
        if (response && response.data && response.data.status === 'ok') {
          this.setState({ hideTutorials: true });
          pageInfo.hideTutorials = true;
          setSession('pageInfo',JSON.stringify(pageInfo));
        } else {
          this.showNotificationError('An unknown error occured. Please try again!');
        }
      })
      .catch(error => {
        this.setState({ submitted: false, isSaving: false });
        if(error.response && typeof error.response === 'string' ) {
          this.showNotificationError(error.response);
        } else {
          this.showNotificationError('An unknown error occured. Please try again!');
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

  handleSubmit = (e) => {
    e.preventDefault();
    const userData = JSON.parse(getSession("userData"));
    const pageInfo = JSON.parse(getSession("pageInfo"));
    let sessionToken = "";
    let product;
    let productId;
    if(userData) {
      sessionToken = userData.sessionToken;
      product = {...this.state.product};
      productId = this.state.productId;
    } else {
      this.props.history.push("/login");
      window.location.reload();
    }

    if (product) {
      if (product.name && product.productType && !isNaN(product.price) && product.price > 0) {
        if (!window.confirm("Do you want to save this item?")){
          return false;
        }

        this.setState({ submitted: true, isSaving: true });
        if (this.state.product.tags2d) {
          const tagsMapped = this.state.product.tags2d.map(item => item.id);
          product.tags = tagsMapped;
        } else {
          product.tags = [];
        }

        const productCategories = this.state.productCategories;
        if (this.state.checked) {
          const categoriesArr = this.state.checked;
          let newCategories = [];
          let parentArr = [];
          if(categoriesArr instanceof Array && categoriesArr.length > 0) {
            if(pageInfo && pageInfo.useCreatedProductCategory) {
              categoriesArr.forEach(item => {
                const category = productCategories.find(cat => cat._id === item);
                if(category) {
                  const categoryObj = {
                    _id: category._id,
                    parent: (category.parent && category.parent._id) ? category.parent._id : null,
                    name: category.name,
                    slug: category.slug,
                  }
                  newCategories.push(categoryObj);
                  if(category.parent && category.parent._id) {
                    parentArr.push(category.parent._id);
                  }
                }
              });
              const parentArrUnique = Array.from(new Set(parentArr));
              const parentCategories = productCategories.filter(function(item) {
                return parentArrUnique.includes(item._id); 
              })
              newCategories = [...newCategories,...parentCategories];
              product.productCategories = newCategories;
            } else {
              categoriesArr.forEach(item => {
                const category = productCategories.find(cat => cat._id === item);
                if(category) {
                  const categoryObj = {
                    _id: category._id,
                    name: category.name,
                    slug: category.slug,
                  }
                  newCategories.push(categoryObj);
                }
              });
              product.categories = newCategories;
            }
          }
        } else {
          product.categories = [];
          product.productCategories = [];
        }

        product.options = {
          DineIn: product.forDinein,
          PickUp: product.forPickup,
          Delivery: product.forDelivery,
        }
        product.containerFee = {
          supportedOrderOption: {
            pickup: product.containerFeePickup,
            delivery: product.containerFeeDelivery,
          },
          amount: Number(product.containerFeeAmt),
        }

        delete product.tags2d;
        delete product.forDinein;
        delete product.forPickup;
        delete product.forDelivery;
        delete product.containerFeeAmt;
        delete product.containerFeeDelivery;
        delete product.containerFeePickup;
        delete product.dateAdded;
        delete product.lastUpdated;

        this.props.updateProduct(product, productId, sessionToken, (error, result) => {
          if (result) {
            this.setState({ submitted: false, isSaving: false });
            if(pageInfo.isActive !== true) {
              this.showNotification('Product has been updated. You can now activate your store.');
              setTimeout(() => { this.props.history.push("/activate-store") }, 1000);
            } else {
              this.showNotification('Product changes has been saved.');
              setTimeout(() => {
                let queryStr = "?";
                let query = "";
                queryStr += (this.state.page && this.state.page > 1 ? `page=${this.state.page}&` : ``);
                queryStr += (this.state.keyword && this.state.keyword !== '' ? `keyword=${this.state.keyword}&` : ``);
                queryStr += (this.state.status && this.state.status !== '' ? `status=${this.state.status}&` : ``);
                queryStr += (this.state.availability && this.state.availability !== '' ? `availability=${this.state.availability}&` : ``);
                queryStr += (this.state.category && this.state.category !== '' ? `category=${this.state.category}&` : ``);
                queryStr += (this.state.subCategory && this.state.subCategory !== '' ? `subCategory=${this.state.subCategory}&` : ``);
                const lastChar = queryStr.substr(queryStr.length - 1);
                if(lastChar === '&') {
                  query = queryStr.slice(0, -1);
                }
                this.props.history.push("/products" + query);
              }, 1000);
            }
          } else {
            if (error) {
              if(error.response && error.response.status && error.response.status === 403) {
                this.setState({ submitted: false, isSaving: false });
                setTimeout(() => {
                  this.props.history.push("/products");
                }, 1000);
                this.showNotificationError('You are not allowed to update this product.');
              } else {
                this.showNotificationError(error.response);
              }

            } else {
              this.setState({ submitted: false, isSaving: false });
              this.showNotificationError('An unknown error occured. Please try again.');
            }
          }
        });

      } else {
        this.setState({ submitted: true });
        this.showNotificationError('Some fields are required. Please fill the required fields.');
      }
    } else {
      setTimeout(() => { this.setState({ submitted: false, isSaving: false }); }, 1000);
      this.showNotificationError('Product information is missing.');
    }
  }

  onKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  }

  generateVoucherCodes = () => {
    const { productId, product } = this.state
    if(product.vouchers && product.vouchers.length > 0) {
      if (!window.confirm("The product has existing voucher code, do you still want to continue generating the voucher codes?")){
        return false;
      }
    } else {
      if (!window.confirm("Do you want to continue generating the voucher codes?")){
        return false;
      }
    }
    this.setState({ isGenerating: true })
    console.log("Generating codes...")
    let userData = JSON.parse(getSession("userData"));
    const token = userData.sessionToken;
    const payload = {
      number: 100
    }
    api(token).post(`/product-vouchers/${productId}/generate-codes`, payload)
      .then(resp => {
        if (resp && resp.data && resp.statusText === "OK" ) {
          const { data: added }  = resp
          this.showNotification(`${added.length} voucher codes has been added successfully for this product.`)
        } else {
          this.showNotificationError('An unknown error occured on generating voucher codes. Please try again!')
        }
        this.setState({ isGenerating: false });
      })
      .catch(error => {
        console.error(error);
        this.setState({ isGenerating: false });
        if(error.response) {
          if(typeof error.response === 'string' ) {
            this.showNotificationError(error.response)
          } else if (error.response && error.response.data && error.response.data.message && typeof error.response.data.message === 'string' ) {
            this.showNotificationError(error.response.data.message)
          } else {
            this.showNotificationError('An unknown error occured. Please try again!');
          }
        } else {
          this.showNotificationError('An unknown error occured. Please try again!');
        }
      });
  }

  renderProductTypes() {
    if(this.state.productTypes !== undefined || this.state.productTypes != null) {
      const activeProductTypes = this.state.productTypes.filter(item => item.isActive);
      return activeProductTypes.map((item, index) => (
        <option key={index} value={item._id}>{item.name}</option>
      ));
    }
  }

  renderVerticalNavBar() {
    return(
      <Nav vertical >
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'product-info' ? " active-link" : "")} to="#" 
            onClick={() => { 
              this.setState({activeStep: 'product-info' } ) 
            }}
          >
            Product Information<span style={{float:"right"}}><Fa icon="chevron-right" /></span>
          </NavLink> 
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'price' ? " active-link" : "") + (this.state.steps.price === false ? " disabled" : "")} to="#" 
            onClick={() => { 
              if(this.state.steps.price === true) {
                this.setState({ activeStep: 'price' } );
              }
            }}
          >
            Price <span style={{float:"right"}}><Fa icon="chevron-right" /></span>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'product-settings' ? " active-link" : "") + (this.state.steps.productSettings === false ? " disabled" : "")} to="#" 
            onClick={() => { 
              if(this.state.steps.productSettings === true) {
                this.setState({ activeStep: 'product-settings' } );
              }
            }}
          >
            Product Settings <span style={{float:"right"}}><Fa icon="chevron-right" /></span>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'product-category' ? " active-link" : "") + (this.state.steps.productCategory === false ? " disabled" : "")} to="#" 
            onClick={() => { 
              if(this.state.steps.productCategory === true) {
                this.setState({ activeStep: 'product-category' } );
              }
            }}
          >
            Product Category <span style={{float:"right"}}><Fa icon="chevron-right" /></span>
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
        {this.state.product.vouchers && this.state.product.vouchers.length > 0 &&
          <NavItem>
            <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'vouchers' ? " active-link" : "") + (this.state.steps.vouchers === false ? " disabled" : "")} to="#" 
              onClick={() => { 
                if(this.state.steps.vouchers === true) {
                  this.setState({ activeStep: 'vouchers' } );
                }
              }}
            >
              Vouchers <span style={{float:"right"}}><Fa icon="chevron-right" /></span>
            </NavLink>
          </NavItem>
        }
      </Nav>
    );
  }

  renderProductInfoStep(product) {
    const { submitted } = this.state;
    return(
      <>
        <Row>
          <Col sm="12" md="12" lg="12">
            <FormGroup
              className={submitted && !product.name ? " has-danger" : ""}
            >
              <label htmlFor="name" className="control-label">Product Name <em className="text-muted">(Required)</em></label>
              <Input
                id="name"
                name="name"
                className="name"
                placeholder="Product Name"
                type="text"
                value={product.name}
                onChange={this.handleChange}
                autoComplete="off"
              />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col sm="12" md="6" lg="6">
            <FormGroup
              className={submitted && !product.productType ? " has-danger" : "" }
            >
              <label htmlFor="productType" className="control-label">Product Type <em className="text-muted">(Required)</em></label>
              <Input
                id="productType"
                name="productType"
                className="productType"
                placeholder="Product Type"
                type="select"
                value={product.productType}
                onChange={this.handleChange}
              >
                <option value="">Select One</option>
                {this.renderProductTypes()}
              </Input>
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col md="12">
            <FormGroup>
              <label htmlFor="description" className="control-label">Description</label>
              <Input
                id="description"
                name="description"
                placeholder="Description"
                type="textarea"
                value={product.description}
                onChange={this.handleChange}
                style={{height:'150px'}}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col md="6">
            <FormGroup>
              <label htmlFor="tags" className="control-label">Tags</label>
              <ReactTags
                tags={product.tags2d}
                delimiters={delimiters}
                handleDelete={this.handleDelete}
                handleAddition={this.handleAddition}
                handleDrag={this.handleDrag}
                autofocus={false}
              />
            </FormGroup>
            <FormGroup className="enable-field-group">
              <label htmlFor="barcode" className="control-label">
                Barcode
              </label>
            </FormGroup>
            <FormGroup>
              <Label check>
                <Input
                  type="checkbox"
                  className="enable-disable-checkbox"
                  id="disableBarcode"
                  name="disableBarcode"
                  defaultChecked={
                    !this.state.disableBarcode
                  }
                  onChange={this.handleDisableBarcode}
                />
                <span className="form-check-sign">
                  <span className="check" />
                </span>
                Enable Barcode
              </Label>
              <Input
                readOnly={this.state.disableBarcode}
                id="barcode"
                name="barcode"
                className="barcode"
                placeholder="Barcode"
                type="text"
                value={product.barcode}
                onChange={this.handleChange}
              />
            </FormGroup>
            <FormGroup className="enable-field-group">
              <label htmlFor="barcode" className="control-label">
                Item Code
              </label>
            </FormGroup>
            <FormGroup>
              <Label check>
                <Input
                  type="checkbox"
                  className="enable-disable-checkbox"
                  id="disableItemcode"
                  name="disableItemcode"
                  defaultChecked={
                    !this.state.disableItemcode
                  }
                  onChange={this.handleDisableItemcode}
                />
                <span className="form-check-sign">
                  <span className="check" />
                </span>
                Enable Item Code
              </Label>
              <Input
                readOnly={this.state.disableItemcode}
                id="itemCode"
                name="itemCode"
                className="itemCode"
                placeholder="Item Code"
                type="text"
                value={product.itemCode}
                onChange={this.handleChange}
              />
            </FormGroup>
          </Col>
        </Row>
      </>
    )
  }

  renderPriceStep(product) {
    const { submitted } = this.state;
    return(
      <Row>
        <Col md="4">
          <FormGroup
            className={
              submitted && (!product.price || isNaN(product.price) || product.price <= 0)
                ? " has-danger"
                : ""
            }
          >
            <label htmlFor="price" className="control-label">
              Price <em className="text-muted">(Required)</em>
            </label>
            <Input
              id="price"
              name="price"
              placeholder="&#8369;"
              type="text"
              value={product.price}
              onChange={this.handleChange}
            />
          </FormGroup>
        </Col>
        <Col className="px-md-1" md="4">
          <FormGroup>
            <label htmlFor="comparePrice" className="control-label">
              Compare Price
            </label>
            <Input
              id="comparePrice"
              name="comparePrice"
              placeholder="&#8369;"
              type="text"
              value={product.comparePrice}
              onChange={this.handleChange}
            />
          </FormGroup>
        </Col>
      </Row>
    )
  }

  renderProductSettings(product) {
    return(
      <>
        <Row>
          <Col md="4">
            <FormGroup>
              <Label>
                <Switch
                  onClick={() => {
                    this.setState({
                      product: {
                        ...this.state.product,
                        forSale: !product.forSale
                      }
                    });
                  }}
                  on={product.forSale}
                />
                For Sale (Availability)
              </Label>
            </FormGroup>
            <FormGroup>
              <Label>
                <Switch
                  onClick={() => {
                    this.setState({
                      product: {
                        ...this.state.product,
                        autofullfill: !product.autofullfill
                      }
                    });
                  }}
                  on={product.autofullfill}
                />
                Auto-confirm
              </Label>
            </FormGroup>
          </Col>
          <Col md="4">
            <FormGroup>
              <Label>
                <Switch
                  onClick={() => {
                    this.setState({
                      product: {
                        ...this.state.product,
                        isActive: !product.isActive
                      }
                    });
                  }}
                  on={product.isActive}
                />
                Publish
              </Label>
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col md="4" style={{ marginBottom: "15px" }}>
            <FormGroup>
              <Label className="control-label">
                Pick-up Options
              </Label>
            </FormGroup>
            <FormGroup check>
              <Label check>
                <Input
                  type="checkbox"
                  className=""
                  id="forPickup"
                  name="forPickup"
                  defaultChecked={product.forPickup}
                  onChange={this.handleChange}
                />
                <span className="form-check-sign">
                  <span className="check" />
                </span>
                Pickup
              </Label>
            </FormGroup>
            <FormGroup check>
              <Label check>
                <Input
                  type="checkbox"
                  className=""
                  id="forDelivery"
                  name="forDelivery"
                  defaultChecked={product.forDelivery}
                  onChange={this.handleChange}
                />
                <span className="form-check-sign">
                  <span className="check" />
                </span>
                Delivery
              </Label>
            </FormGroup>
            <FormGroup check>
              <Label check>
                <Input
                  type="checkbox"
                  className=""
                  id="forDinein"
                  name="forDinein"
                  defaultChecked={product.forDinein}
                  onChange={this.handleChange}
                />
                <span className="form-check-sign">
                  <span className="check" />
                </span>
                Dine In
              </Label>
            </FormGroup>
          </Col>
          <Col className="px-md-1" md="4" style={{ marginBottom: "15px" }}>
            <Row>
              <Col md="12">
                <FormGroup>
                  <Label className="control-label">
                    Charges and Fees
                  </Label>
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md="12">
                <FormGroup>
                  <Label>
                    <Switch
                      onClick={() => {
                        const nextStatus = !product.containerFeeDelivery;
                        this.setState({
                          product: {
                            ...this.state.product,
                            containerFeeDelivery: nextStatus
                          }
                        });
                      }}
                      on={product.containerFeeDelivery}
                    />
                    Container Fee
                  </Label>
                </FormGroup>
                <FormGroup>
                  <Input
                    id="containerFeeAmt"
                    name="containerFeeAmt"
                    className="containerFeeAmt"
                    placeholder="Enter Amount"
                    type="text"
                    value={product.containerFeeAmt}
                    onChange={this.handleChange}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>
                    <Switch
                      onClick={() => {
                        const nextStatus = !product.containerFeePickup;
                        this.setState({
                          product: {
                            ...this.state.product,
                            containerFeePickup: nextStatus
                          }
                        });
                      }}
                      on={this.state.product.containerFeePickup}
                    />
                    Applicable for Pickup
                  </Label>
                </FormGroup>
              </Col>
            </Row>
          </Col>
          <Col md="4" style={{ marginBottom: "15px" }}>
            <Row>
              <Col md="12">
                <FormGroup>
                  <label htmlFor="unit" className="control-label">
                    Product Unit
                  </label>
                  <Input
                    id="unit"
                    name="unit"
                    className="unit"
                    placeholder="Enter Unit (kg, lbs, L)"
                    type="text"
                    value={product.unit}
                    onChange={this.handleChange}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md="12">
                <FormGroup>
                  <label htmlFor="limit" className="control-label">
                    Product Limit (per order)
                  </label>
                  <Input
                    id="limit"
                    name="limit"
                    className="limit"
                    placeholder="Enter product limit"
                    type="text"
                    value={product.limit}
                    onChange={this.handleChange}
                  />
                </FormGroup>
              </Col>
            </Row>
          </Col>
        </Row>
      </>
    );
  }

  renderProductCategory(categoriesTree,icons) {
    return(
      <>
        <Row>
          <Col md="12">
            <FormGroup>
              <label className="control-label">
                Select Product Categories
              </label>
              <CheckboxTree
                nodes={categoriesTree}
                checked={this.state.checked}
                expanded={this.state.expanded}
                onCheck={checked => this.setState({ checked })}
                onExpand={expanded => this.setState({ expanded })}
                showNodeIcon={false}
                icons={icons}
                nativeCheckboxes
              />
            </FormGroup>
          </Col>
        </Row>
      </>
    );
  }

  renderImages(product) {
    return(
      <>
        <Row>
          <Col md="6">
            <FormGroup>
              <label htmlFor="images" className="control-label">Upload Photo</label>
              <div className="upload-photo" style={{ margin: '10px auto', border: '1px solid #ccc', 'backgroundColor': '#efefef' }}>
                <Input name="images" label='upload file' type='file' onChange={this.handleFileUpload} style={divStyle} />
                  <ul className="product-photos">
                    {product.photos.length > 0 &&
                      <>
                        {product.photos.map(({original, thumb, _id: id }) =>
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

  renderVouchers(product) {
    return(
      <>
        <Row>
          <Col lg="12" md="12" sm="12">
            <FormGroup>
              <h4>Product Vouchers</h4>
              <div className="vouchers">
                <Link to="/product-vouchers" className="btn btn-round btn-sm btn-info">Manage Vouchers</Link>
                {product.vouchers && product.vouchers.length > 0 ?
                  (
                    <Table className="product-vouchers table-striped responsive" responsive>
                      <thead>
                        <tr>
                          <th>&nbsp;</th>
                          <th colSpan="2">Code</th>
                          <th>Product</th>
                          <th>Used</th>
                          <th>Added</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.vouchers.map((item,index) =>
                          <tr key={item._id}>
                            <td>{index+1}.</td>
                            <td>
                              <QRCode 
                                size={50}
                                value={item.code} 
                              />
                            </td>
                            <td>
                              <span style={{ fontFamily:'monospace'}}>{item.code}</span>
                            </td>
                            <td>{product.name}</td>
                            {item.isUsed ? 
                              (<td><Badge color="secondary">YES</Badge></td>) :
                              (<td><Badge color="success">NO</Badge></td>) }
                            <td>{format(new Date(item.createdAt),"MMM dd, yyyy hh:mm a")}</td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  )
                  :
                  (<p><em className="text-danger">No vouchers added.</em></p>)
                }
              </div>
            </FormGroup>
          </Col>
        </Row>
      </>
    );
  }

  render() {
    const userData = JSON.parse(getSession("userData"));
    const pageInfo = JSON.parse(getSession("pageInfo"));

    let userId = "";
    if(userData) {
      userId = userData.userId;
    } else {
      this.props.history.push("/login");
      window.location.reload();
    }

    let { product } = this.state;

    const productCategories = this.state.productCategories;
    const parentCategories = productCategories.filter(item => !item.parent);
    const childCategoriesMain = productCategories.filter(item => item.parent);
    let childCategories = [];

    childCategoriesMain.forEach(item => {
      if(item.provider === undefined || item.provider.toString() === userId ) {
        childCategories.push(item);
      }
    });

    let categoriesTree = [];
    if (parentCategories) {
      parentCategories.forEach(cat => {
        const value = cat._id.toString();
        const label = cat.name;
        let sublist = [];

        sublist = childCategories.filter( item => item.parent._id.toString() === value );

        let children1 = [];
        if(sublist instanceof Array && sublist.length > 0) {
          let category1 = [];
          sublist.forEach(cat => {
            const value = cat._id;
            const label = cat.name;
            const category = {
              value: value,
              label: label,
              children: [],
            }
            category1.push(category);
          });
          children1 = category1;
        }
        const children = children1;
        const category = {
          value: value,
          label: label,
          children: children,
        }
        categoriesTree.push(category);
      });
    }

    const icons = {
      check: <Fa className="rct-icon rct-icon-check" icon={['far', 'check-square']} />,
      uncheck: <Fa className="rct-icon rct-icon-uncheck" icon={['far', 'square']} />,
      halfCheck: <Fa className="rct-icon rct-icon-half-check" icon={['far', 'check-square']} />,
      expandClose: <Fa className="rct-icon rct-icon-expand-close" icon="chevron-right" />,
      expandOpen: <Fa className="rct-icon rct-icon-expand-open" icon="chevron-down" />,
      expandAll: <Fa className="rct-icon rct-icon-expand-all" icon="plus-square" />,
      collapseAll: <Fa className="rct-icon rct-icon-collapse-all" icon="minus-square" />,
      parentClose: <Fa className="rct-icon rct-icon-parent-close" icon={['far', 'folder']} />,
      parentOpen: <Fa className="rct-icon rct-icon-parent-open" icon={['far', 'folder-open']} />,
      leaf: <Fa className="rct-icon rct-icon-leaf-close" icon={['far', 'file']} />
    }

    if(this.state.pageType !== 'sb-tours') {
      if(this.state.isLoading) {
        return (
          <>
            <div className="content">
              <Row>
                <Col sm="12" md="12" lg="12">
                  <Card>
                    <CardHeader>
                      <h4 className="title">Edit Product</h4>
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
        let queryStr = "?";
        let query = "";
        queryStr += (this.state.page && this.state.page > 1 ? `page=${this.state.page}&` : ``);
        queryStr += (this.state.keyword && this.state.keyword !== '' ? `keyword=${this.state.keyword}&` : ``);
        queryStr += (this.state.status && this.state.status !== '' ? `status=${this.state.status}&` : ``);
        queryStr += (this.state.availability && this.state.availability !== '' ? `availability=${this.state.availability}&` : ``);
        queryStr += (this.state.category && this.state.category !== '' ? `category=${this.state.category}&` : ``);
        queryStr += (this.state.subCategory && this.state.subCategory !== '' ? `subCategory=${this.state.subCategory}&` : ``);
        const lastChar = queryStr.substr(queryStr.length - 1);
        if(lastChar === '&') {
          query = queryStr.slice(0, -1);
        }
        const cancelLink = `/products${query}`;
        if(this.state.product) {
          return (
            <>
              <div className="content">
                <div className="react-notification-alert-container">
                  <NotificationAlert ref="notify" />
                </div>
                <Row>
                  <Col sm="12" md="12" lg="12">
                    <Alert color="success" isOpen={this.state.messageOpen} toggle={this.onAlertDismiss}>
                      {this.state.message}
                    </Alert>
                    <Card>
                      <Form onSubmit={this.handleSubmit} onKeyPress={this.onKeyPress}>
                        <CardHeader>
                          <h4 className="title">Edit Product - <em>{product.name}</em></h4>
                        </CardHeader>
                        <CardBody>
                          <Row>
                            {!pageInfo.hideTutorials &&
                              <Col sm="12">
                                <Row>
                                  <Col md="12">
                                    <Alert className="alert-compact" color="primary" isOpen={!this.state.hideTutorials} toggle={this.onDismiss} fade={false}>
                                      <h4 className="alert-heading">New on Products?</h4>
                                      <hr />
                                      <p className="mb-0">
                                        Check our videos here on how to manage your products.<br /> 
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
                              </Col>
                            }
                          </Row>
                          <Row>
                            <Col sm="12" md="3" lg="3">
                              {this.renderVerticalNavBar()}
                            </Col>
                            <Col sm="12" md="9" lg="9">
                              {(this.state.activeStep === 'product-info' &&
                                this.state.steps.productInfo === true) ?
                                this.renderProductInfoStep(this.state.product) :
                                (this.state.activeStep === 'price' && this.state.steps.price === true) ?
                                this.renderPriceStep(this.state.product) :
                                (this.state.activeStep === 'product-settings' && this.state.steps.productSettings === true) ?
                                this.renderProductSettings(this.state.product) :
                                (this.state.activeStep === 'product-category' && this.state.steps.productCategory === true) ?
                                this.renderProductCategory(categoriesTree,icons) :
                                (this.state.activeStep === 'images' && this.state.steps.images === true) ?
                                this.renderImages(this.state.product) :
                                (this.state.activeStep === 'vouchers' && this.state.steps.vouchers === true && this.state.product.vouchers && this.state.product.vouchers.length > 0) ?
                                this.renderVouchers(this.state.product) :
                                this.renderProductInfoStep(this.state.product)
                              }
                            </Col>
                          </Row>
                        </CardBody>
                        <CardFooter>
                          <Button className="btn-round" color="info" type="submit">Save</Button>
                          <Link to={cancelLink} className="btn btn-round btn-light">Cancel</Link>
                        </CardFooter>
                      </Form>
                    </Card>
                  </Col>
                </Row>
              </div>
              <LoadingOverlay
                active={this.state.isSaving}
                spinner
                text='Saving...'
                >
              </LoadingOverlay>
              <LoadingOverlay
                active={this.state.isGenerating}
                spinner
                text='Generating Vouchers Codes...'
                >
              </LoadingOverlay>
            </>
          );
        } else {
          return (
            <>
              <div className="content">
                <Row>
                  <Col sm="12" md="12" lg="12">
                    <Card>
                      <CardHeader>
                        <h4 className="title">Edit Product</h4>
                      </CardHeader>
                      <CardBody>
                        <h4 className="text-danger">Product not found</h4>
                      </CardBody>
                      <CardFooter>
                        <Link to={cancelLink} className="btn btn-round btn-default">Back to Products</Link>
                      </CardFooter>
                    </Card>
                  </Col>
                </Row>
              </div>
            </>
          );
        }
      }
    } else {
      return (
        <>
          <div className="content">
            <Row>
              <Col sm="12" md="12" lg="12">
                <Card>
                  <CardHeader>
                    <h4>This page is disabled.</h4>
                  </CardHeader>
                  <CardBody></CardBody>
                </Card>
              </Col>
            </Row>
          </div>
        </>
      );
    }
  }
}

const mapStateToProps = () => ({});

export default connect(
  mapStateToProps,
  {
    getProductById,
    getProductTypes,
    getProductCategories,
    getProductCategoriesV2,
    getProviderPlaces,
    updateProduct,
    uploadPhoto,
    removePhoto,
  }
)(EditProduct);