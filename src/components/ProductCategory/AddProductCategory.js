import React from "react";
import { connect } from "react-redux";
import { getSession, setSession } from "../../config/session";
import api from "../../config/api";
import { Link } from "react-router-dom";
import slugify from 'slugify';
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';

import {
  getProductCategoriesAllV2,
  addProductCategory,
  uploadPhoto,
  removePhoto,
} from "../../layouts/Admin/actions/ProductCategoryActions";

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
  Row,
  Col,
} from "reactstrap";

class AddProductCategory extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      category: {
        name: "",
        slug: "",
        description: "",
        parent: "",
        ancestors: [],
      },
      productCategoriesMain: [],
      isLoading: false,
      isSaving: false,
      submitted: false,
      hideTutorials: false
    };
  }

  componentDidMount() {
    const query = {};
    const userData = JSON.parse(getSession("userData"));
    const placeId = JSON.parse(getSession("defaultPage"));
    const { sessionToken } = userData;
    const pageInfo = JSON.parse(getSession("pageInfo"));

    if (userData !== null) {
      this.setState({ hideTutorials: (pageInfo && pageInfo.hideTutorials && pageInfo.hideTutorials === true) ? true : false });
      this.props.getProductCategoriesAllV2(
        query,
        placeId,
        sessionToken,
        (error, result) => {
          if (!error && result) {
            const productCategories = result;
            if(productCategories instanceof Array && productCategories.length > 0) {
              const productCategoriesMain = productCategories.filter(cat => !cat.parent);
              this.setState({
                productCategories: productCategories,
                productCategoriesMain: productCategoriesMain,
              });
            }
          }
          this.setState({ isLoading: false });
        }
      );
    }
  }

  handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = e.target.checked;
      value = checked;
    }
    this.setState({
      category: {
        ...this.state.category,
        [name]: value
      }
    });
    if(name==='name') {
      const slugName = slugify(value.toLowerCase());
      if(value!=='') {
        this.setState({
          category: {
            ...this.state.category,
            slug: slugName,
            name: value
          }
        });
      } else {
        this.setState({
          category: {
            ...this.state.category,
            name: value
          }
        });
      }
    }
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
    const hasProducts = JSON.parse(getSession("hasProducts"));
    const placeId = JSON.parse(getSession("defaultPage"));
    const { sessionToken, userId } = userData;
    const category = {...this.state.category};
    if (
      category.name &&
      category.slug
    ) {
      if (!window.confirm("Do you want to save this item?")) {
        return false;
      }

      this.setState({ submitted: true, isSaving: true });

      if (category) {
        category.provider = userId;
        category.place = placeId;
        const productCategoriesMain = this.state.productCategoriesMain;
        const parentCategory = this.state.category.parent;
        if(parentCategory) {
          const categoryObj = productCategoriesMain.find(cat => cat._id === parentCategory);
          category.ancestors.push(categoryObj._id);
        } else {
          category.ancestors = [];
        }
      
        this.props.addProductCategory(category, placeId, sessionToken, (error, result) => {
          if (!error && result) {
            setSession('hasCategories',true);
            this.setState({ submitted: false, isSaving: false });
            if(pageInfo.isActive !== true) {
              if(hasProducts) {
                this.showNotification('Store has been updated. You can now activate your store.');
                setTimeout(() => { this.props.history.push("/activate-store") }, 3000);
              } else  {
                this.showNotification('Store has been updated. You can now add products.');
                setTimeout(() => { this.props.history.push("/products/new") }, 3000);
              }
            } else {
              this.showNotification('Product category has been added.');
              setTimeout(() => {  this.props.history.push("/product-categories") }, 3000);
            }
          } else {
            if (error) {
              this.showNotificationError(error.response);
              this.setState({ submitted: false, isSaving: false });
            }
          }
        });
      } else {
        setTimeout(() => { this.setState({ submitted: false, isSaving: false }); }, 1000);
        this.showNotificationError('Category information is missing.');
      }
    } else {
      this.setState({ submitted: true });
      this.showNotificationError('Some fields are required. Please fill the required fields.');
    }
  }

  onKeyPress = e => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  renderProductCategoriesMain() {
    if (
      this.state.productCategoriesMain !== undefined ||
      this.state.productCategoriesMain != null
    ) {
      const productCategoriesMain = this.state.productCategoriesMain;
      return productCategoriesMain.map((item, index) => (
        <option key={index} value={item._id}>
          {item.name}
        </option>
      ));
    }
  }

  render() {
    const pageInfo = JSON.parse(getSession("pageInfo"));
    let { submitted } = this.state;
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
                    <h4 className="title">Add New Category</h4>
                  </CardHeader>
                  <CardBody>
                    <Row>
                      {!pageInfo.hideTutorials &&
                        <Col sm="12">
                          <Row>
                            <Col md="12">
                              <Alert className="alert-compact" color="primary" isOpen={!this.state.hideTutorials} toggle={this.onDismiss} fade={false}>
                                <h4 className="alert-heading">New on Product Categories?</h4>
                                <hr />
                                <p className="mb-0">
                                  Check our videos here on how to manage your categories.<br /> 
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
                        <legend>Basic Info</legend>
                      </Col>
                      <Col sm="12" md="9" lg="9">
                        <Row>
                          <Col md="12">
                            <FormGroup
                              className={
                                submitted && !this.state.category.name
                                  ? " has-danger"
                                  : ""
                              }
                            >
                              <label htmlFor="name" className="control-label">
                                Name
                                <em className="text-muted">(Required)</em>
                              </label>
                              <Input
                                id="name"
                                name="name"
                                className="name"
                                placeholder="Category Name"
                                type="text"
                                value={this.state.category.name}
                                onChange={this.handleChange}
                                autoComplete="off"
                              />
                            </FormGroup>
                          </Col>
                          <Col md="12">
                            <FormGroup
                              className={
                                submitted && !this.state.category.name
                                  ? " has-danger"
                                  : ""
                              }
                            >
                              <label htmlFor="slug" className="control-label">
                                Slug
                                <em className="text-muted">(Required)</em>
                              </label>
                              <Input
                                id="slug"
                                name="slug"
                                placeholder="Slug"
                                type="text"
                                value={this.state.category.slug}
                                onChange={this.handleChange}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="12">
                            <FormGroup>
                              <label htmlFor="parent" className="control-label">
                                Parent Category
                              </label>
                              <Input
                                id="parent"
                                name="parent"
                                placeholder="Parent Category"
                                type="select"
                                value={this.state.category.parent}
                                onChange={this.handleChange}
                              >
                                <option value="">Select One</option>
                                {this.renderProductCategoriesMain()}
                              </Input>
                            </FormGroup>
                          </Col>
                          <Col md="12">
                            <FormGroup>
                              <label htmlFor="description" className="control-label">
                                Description
                              </label>
                              <Input
                                id="description"
                                name="description"
                                placeholder="Description"
                                type="textarea"
                                value={this.state.category.description}
                                onChange={this.handleChange}
                                style={{height:'150px'}}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </CardBody>
                  <CardFooter className="pull-right">
                    <Button className="btn-round" color="info" type="submit">
                      Save
                    </Button>
                    <Link to="/product-categories" className="btn btn-round btn-light">
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
    getProductCategoriesAllV2,
    addProductCategory,
    uploadPhoto,
    removePhoto
  }
)(AddProductCategory);
