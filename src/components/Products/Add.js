import React from "react";
import { connect } from "react-redux";
import { getSession, setSession } from "../../config/session";
import api from "../../config/api";
import { Link } from "react-router-dom";
import { FontAwesomeIcon as Fa } from '@fortawesome/react-fontawesome';
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';

import {
  getProductTypes,
  addProduct,
} from "../../layouts/Admin/actions/ProductActions";

import { Alert, Button, Card, CardHeader, CardBody, CardFooter, FormGroup, Form, Input,
  Nav, NavItem, NavLink, Row, Col
} from "reactstrap";

class AddProduct extends React.Component {
  constructor(props) {
    const defaultPage = JSON.parse(getSession("defaultPage"));
    super(props);
    this.state = {
      product: {
        name: "",
        description: "",
        productType: "",
        forSale: false,
        isActive: false,
        unit: "",
        limit: "",
        autofullfill: false,
        price: "",
        comparePrice: "",
        placeId: defaultPage
      },
      productTypes: [],
      productCategories: [],
      places: [],
      checked: [],
      expanded: [],
      isLoading: false,
      submitted: false,
      submittedHighlight: false,
      isSaving: false,
      isGrocery: false,
      pageType: 'food-drink',
      activeStep: 'product-info',
      steps: {
        productInfo: true
      },
      hideTutorials: false
    };
  }

  componentDidMount() {
    const userData = JSON.parse(getSession("userData"));
    const pageInfo = JSON.parse(getSession("pageInfo"));

    if(pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb') { // If pageType Grocery
      this.setState({isGrocery:true});
      this.setState({pageType:'grocery'});
    } else if (pageInfo && pageInfo.pageType === '5dea2304f6bba08323a3ddce') { // If pageType SB Tours
      this.setState({pageType:'sb-tours'});
    }

    if (userData !== null) {
      this.setState({ hideTutorials: (pageInfo && pageInfo.hideTutorials && pageInfo.hideTutorials === true) ? true : false });
      this.props.getProductTypes((error, result) => {
        if (!error && result) {
          this.setState({ productTypes: result });
        }
      });
    } else {
      this.props.history.push("/login");
      window.location.reload();
    }
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

  handleChangeSection = (e) => {
    let { name, value } = e.target;
    this.setState({
      section: {
        ...this.state.section,
        [name]: value
      }
    });
  }

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

    if(pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb') { // If pageType Grocery
      this.setState({isGrocery:true});
    }

    if(userData) {
      const sessionToken = userData.sessionToken;
      const product = {...this.state.product};
      if (
        product.name &&
        product.productType &&
        !isNaN(product.price) &&
        product.price > 0 &&
        product.placeId
      ) {

        if (!window.confirm("Do you want to save this item?")) {
          return false;
        }

        this.setState({ submitted: true, isSaving: true });

        if (product) {
          product.tags = [];
          product.categories = [];
          product.productCategories = [];
          product.options = {
            DineIn: false,
            PickUp: false,
            Delivery: false,
          }
          product.containerFee = {
            supportedOrderOption: {
              pickup: false,
              delivery: false,
            },
            amount: 0
          }
        }

        this.props.addProduct(product, sessionToken, (error, result) => {
          if (result) {
            setSession('hasProducts',true);
            this.setState({ submitted: false, isSaving: false });
            if(result._id) {
              this.showNotification('New product has been added.');
              setTimeout(() => {
                this.props.history.push(`/products/${result._id}/edit?message=Complete the product by adding photos &amp; category etc.`);
              }, 3000);
            } else {
              this.showNotification('New product has been added.');
              setTimeout(() => {
                this.props.history.push("/products");
              }, 3000);
            }
          } else {
            if (error) {
              this.setState({ submitted: false, isSaving: false });
              this.showNotificationError(error.response);
            } else {
              this.setState({ submitted: false, isSaving: false });
              this.showNotificationError('An unknown error occured. Please try again.');
            }
          }
        });
      } else {
        this.setState({ submitted: true });
        this.showNotificationError('Some fields are required. Please fill in the required fields.');
      }
    } else {
      this.props.history.push("/login");
      window.location.reload();
    }
  }

  onKeyPress = e => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  renderProductTypes() {
    if (
      this.state.productTypes !== undefined ||
      this.state.productTypes !== null
    ) {
      const activeProductTypes = this.state.productTypes.filter(
        item => item.isActive
      );
      return activeProductTypes.map((item, index) => (
        <option key={index} value={item._id}>
          {item.name}
        </option>
      ));
    }
  }

  renderPlaces() {
    if (this.state.places !== undefined || this.state.places !== null) {
      return this.state.places.map((item, index) => (
        <option key={index} value={item.place._id}>
          {item.place.name}
        </option>
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
      </Nav>
    );
  }

  renderProductInfoStep(product) {
    return(
      <>
        <Row>
          <Col lg="12" md="12" sm="12">
            <FormGroup>
              <Alert color="primary">
                Add basic information of the product.
              </Alert>
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col lg="6" md="6" sm="12">
            <FormGroup
              className={
                this.state.submitted && !product.name
                  ? " has-danger"
                  : ""
              }
            >
              <label htmlFor="name" className="control-label">
                Product Name <em className="text-muted">(Required)</em>
              </label>
              <Input
                id="name"
                name="name"
                className="name"
                placeholder="Product Name"
                type="text"
                value={product.name}
                onChange={this.handleChange}
              />
            </FormGroup>
          </Col>
          <Col lg="6" md="6" sm="12">
            <FormGroup
              className={
                this.state.submitted && !product.productType
                  ? " has-danger"
                  : ""
              }
            >
              <label htmlFor="productType" className="control-label">
                Product Type <em className="text-muted">(Required)</em>
              </label>
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
          <Col sm="12">
            <FormGroup>
              <label htmlFor="description" className="control-label" >Description</label>
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
          <Col md="4">
            <FormGroup
              className={
                this.state.submitted && (!product.price || isNaN(product.price) || product.price <= 0)
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
                className="price"
                placeholder="&#8369;"
                type="text"
                value={product.price}
                onChange={this.handleChange}
              />
            </FormGroup>
          </Col>
          <Col md="4">
            <FormGroup>
              <label htmlFor="comparePrice" className="control-label">
                Compare Price
              </label>
              <Input
                id="comparePrice"
                name="comparePrice"
                className="comparePrice"
                placeholder="&#8369;"
                type="text"
                value={product.comparePrice}
                onChange={this.handleChange}
              />
            </FormGroup>
          </Col>
        </Row>
      </>
    )
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

  renderPageNotVerified() {
    return(
      <div className="content">
        <div className="react-notification-alert-container">
          <NotificationAlert ref="notify" />
        </div>
        <Row>
          <Col sm="12" md="12" lg="12">
            <Card>
              <CardBody>
                <Alert color="danger">
                  <h4 className="alert-heading">You Have Not Agreed with our Terms & Policies</h4>
                  <hr />
                  <p className="mb-0">
                    You must agree  with our Terms & Policies. Click {" "} <Link to="/statement-of-agreement">here</Link> {" "} to read our Terms & Policies.
                  </p>
                </Alert>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  renderPageDisabled() {
    return(
      <div className="content">
        <div className="react-notification-alert-container">
          <NotificationAlert ref="notify" />
        </div>
        <Row>
          <Col sm="12" md="12" lg="12">
            <Card>
              <CardBody>
                <Alert color="danger">
                  <h4 className="alert-heading">This page is disabled.</h4>
                  <hr />
                  <p className="mb-0">
                    Click {" "} <Link to="/products">here</Link> {" "} to go back to the main page.
                  </p>
                </Alert>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  render() {
    let { pageType } = this.state;
    let categoriesTree = [];
    const pageInfo = JSON.parse(getSession("pageInfo"));
    const productCategories = this.state.productCategories;
    if(productCategories instanceof Array && productCategories.length > 0) {
      const parentCategories = productCategories.filter(item => !item.parent);
      const childCategories = productCategories.filter(item => item.parent);
      if (parentCategories) {
        parentCategories.forEach(cat => {
          const value = cat._id.toString();
          const label = cat.name;
          let sublist = [];
          if(pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb') { // If Grocery
            sublist = childCategories.filter( item => item.parent._id.toString() === value );
          } else {
            sublist = childCategories.filter( item => item.parent._id.toString() === value );
          }
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
    }

    if(pageInfo && pageInfo._id) {
      if(pageInfo.isVerified === true) {
        if(pageType !== 'sb-tours') {
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
                          <h4 className="title">Add New Product</h4>
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
                              {(this.state.activeStep === 'product-info' && this.state.steps.productInfo === true) ? 
                                this.renderProductInfoStep(this.state.product) :
                                this.renderProductInfoStep(this.state.product)
                              }
                            </Col>
                          </Row>
                        </CardBody>
                        <CardFooter>
                          <Button className="btn-round" color="info" type="submit">
                            Save
                          </Button>
                          <Link to="/products" className="btn btn-round btn-light">
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
        } else if(pageType && pageType === 'sb-tours') {
          return (this.renderPageDisabled());
        }
      } else {
        return(this.renderPageNotVerified());
      }
    } else {
      return(this.renderNoPageAdded());
    }
  }
}

const mapStateToProps = () => ({});

export default connect(
  mapStateToProps,
  {
    getProductTypes,
    addProduct
  }
)(AddProduct);
