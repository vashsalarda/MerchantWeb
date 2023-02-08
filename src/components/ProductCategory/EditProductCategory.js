import React from "react";
import { connect } from "react-redux";
import { getSession, setSession } from "../../config/session";
import api from "../../config/api";
import { Link } from "react-router-dom";
import { PulseLoader } from 'react-spinners';
import slugify from 'slugify';
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';

import {
  getProductCategoryById,
  getProductCategoriesAllV2,
  updateProductCategory,
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

class EditProductCategory extends React.Component {
  constructor(props) {
    super(props);
    const categoryId = props.match.params._id;
    this.state = {
      categoryId: categoryId,
      categoryExist: false,
      category: {},
      productCategories: [],
      productCategoriesMain: [],
      images: [],
      isLoading: true,
      isSaving: false,
      submitted: false,
      hideTutorials: false
    };
  }

  componentDidMount() {
    const userData = JSON.parse(getSession("userData"));
    const placeId = JSON.parse(getSession("defaultPage"));
    const pageInfo = JSON.parse(getSession("pageInfo"));
    const sessionToken = userData.sessionToken;
    const { categoryId } = this.state;
    const query = {};

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
              const productCategoriesParent = productCategories.filter(cat => !cat.parent);
              const productCategoriesMain = productCategoriesParent.filter(cat => cat._id !== categoryId);
              this.setState({
                productCategories: productCategories,
                productCategoriesMain: productCategoriesMain,
              },() => this.setState({ isLoading: false }) );
            }
          } else {
            this.setState({ isLoading: false });
          }
        }
      );
      this.props.getProductCategoryById(categoryId, sessionToken, (error, result) => {
        if (!error && result) {
          const categoryObj = result;
          this.setState({
            categoryExist: true,
            category: {
              name: categoryObj.name,
              slug: categoryObj.slug,
              description: categoryObj.description,
              parent: categoryObj.parent ? categoryObj.parent : "",
              provider: categoryObj.provider,
              ancestors: categoryObj.ancestors,
              photos: (categoryObj.photos) ? categoryObj.photos : [],
            },
          });
          this.setState({ isLoading: false });
        } else if(error) {
          this.setState({ isLoading: false });
        }
      });
    }
  }

  handleChangeDesc = (data) => {
    this.setState({
      category: {
        ...this.state.category,
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

  handleFileUpload = (e) => {
    const userData = JSON.parse(getSession("userData"));
    const files = e.target.files;
    const images = this.state.category.photos;
    if(images.length < 1) {
      const categoryId = this.state.categoryId;
      const sessionToken = userData.sessionToken;
      const formData = new FormData();
      formData.append('file', files[0]);
      this.props.uploadPhoto(categoryId, formData, sessionToken, (error, result) => {
        if (!error && result) {
          const photo = result;
          if(photo._id) {
            images.push(photo);
            this.setState({
              category: {
                ...this.state.category,
                photos: images
              }
            });
          }
        } else {
          if (error) {
            alert("There is an error in uploading the file.");
          }
        }
      });
    } else {
      console.log('No. of files: ',files.length);
      alert('You are only allowed to upload one(1) file!');
    }
  }

  removeImage = (e) => {
    const userData = JSON.parse(getSession("userData"));
    const categoryId = this.state.categoryId;
    const imgId = e.currentTarget.dataset.id;
    const sessionToken = userData.sessionToken;
    
    this.props.removePhoto(categoryId, imgId, sessionToken, (error, result) => {
      if (!error && result) {
        if(result.deleted==='ok') {
          const images = this.state.category.photos;
          const newImages = images.filter(item => item._id !== imgId);
          this.setState({
            category: {
              ...this.state.category,
              photos: newImages
            }
          });
        }
      } else {
        if (error) {
          alert("There is an error in removing the image.");
        }
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
    const { sessionToken, userId } = userData;
    const { category, categoryId } = {...this.state};
    if (
      category &&
      category.name &&
      category.slug
    ) {
      if (!window.confirm("Do you want to save this item?")) {
        return false;
      }

      this.setState({ submitted: true, isSaving: true });

      if (category && category.provider && category.provider.toString() === userId) {
        const productCategoriesMain = this.state.productCategoriesMain;
        const parentCategory = this.state.category.parent;
        if(parentCategory) {
          const categoryObj = productCategoriesMain.find(cat => cat._id === parentCategory);
          category.ancestors.push(categoryObj._id);
        } else {
          category.ancestors = [];
        }
        delete category.provider;
        delete category.photos;

        if (category) {
          this.props.updateProductCategory(category, categoryId, sessionToken, (error, result) => {
            if (!error && result) {
              setTimeout(() => {
                this.setState({ submitted: false, isSaving: false });
                this.props.history.push("/product-categories?message=Product category changes has been saved.");
              }, 1000);
            } else {
              if (error) {
                setTimeout(() => { this.setState({ submitted: false, isSaving: false }); }, 1000);
                this.showNotificationError(error.response);
              }
            }
          });
        } else {
          setTimeout(() => { this.setState({ submitted: false, isSaving: false }); }, 1000);
          this.showNotificationError('Category information is missing.');
        }
      } else {
        this.showNotificationError('You are not allowed to update this category.');
        setTimeout(() => {
          this.setState({ submitted: false, isSaving: false });
          this.props.history.push("/product-categories");
        }, 1000);
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

  renderProductCategoriesMain(productCategoriesMain) {
    if (productCategoriesMain && productCategoriesMain.length > 0) {
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

    if(this.state.isLoading) {
      return (
        <>
          <div className="content">
            <Row>
              <Col sm="12" md="12" lg="12">
                <Card>
                  <CardHeader>
                    <h4 className="title">Edit Category</h4>
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
      if(this.state.categoryExist && this.state.category) {
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
                        <h4 className="title">Edit Category - <em>{this.state.category.name}</em></h4>
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
                                    onKeyUp={this.handleChange}
                                    autoComplete="off"
                                  />
                                </FormGroup>
                              </Col>
                              <Col md="12">
                                <FormGroup
                                  className={
                                    submitted && !this.state.category.slug
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
                                    onKeyUp={this.handleChange}
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
                                    <option value="">-None-</option>
                                    {this.renderProductCategoriesMain(this.state.productCategoriesMain)}
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
                              <Col lg="6" md="6" sm="12">
                                <FormGroup>
                                  <label className="control-label" htmlFor="images">Upload</label>
                                  <div className="upload-photo" style={{ margin: '10px auto', border: '1px solid #ccc', 'backgroundColor': '#efefef' }}>
                                    <Input name="images" label='upload file' type='file' onChange={this.handleFileUpload} style={divStyle} />
                                    {this.state.category.photos && this.state.category.photos.length > 0 &&
                                      <ul className="product-photos">
                                        {this.state.category.photos.map(({original, thumb, _id: id }) => 
                                          <li key={id} >
                                            <img alt={original} title={id} src={thumb}/>
                                            <button data-id={id} type="button" onClick={this.removeImage} className="remove-image"><span style={{color:'#fefefe'}}>&times;</span></button>
                                          </li>
                                        )}
                                      </ul>}
                                  </div>
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
      } else {
        return (
          <>
            <div className="content">
              <Row>
                <Col sm="12" md="12" lg="12">
                  <Card>
                    <CardHeader>
                      <h4 className="title">Edit Category</h4>
                    </CardHeader>
                    <CardBody>
                      <h4 className="text-danger">Category not found</h4>
                    </CardBody>
                    <CardFooter>
                      <Link to="/product-categories" className="btn btn-round btn-default">Back to Categories</Link>
                    </CardFooter>
                  </Card>
                </Col>
              </Row>
            </div>
          </>
        );
      }
    }
  }
}

const mapStateToProps = () => ({});

export default connect(
  mapStateToProps,
  {
    getProductCategoryById,
    getProductCategoriesAllV2,
    updateProductCategory,
    uploadPhoto,
    removePhoto
  }
)(EditProductCategory);