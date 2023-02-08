import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { getSession, setSession } from "../../config/session";
import api from "../../config/api";
import { 
  getProductCategories,
  getProductCategoriesV2,
  getProductCategoriesAll,
  getProductCategoriesAllV2,
  deleteProductCategory,
  updateProductCategory
} from "../../layouts/Admin/actions/ProductCategoryActions";
import { getPageById } from "../../layouts/Admin/actions/PageActions";
import { format } from 'date-fns'
import queryString from "query-string";
import Switch from "react-toggle-switch";
import { FontAwesomeIcon as Fa } from "@fortawesome/react-fontawesome";
import Pagination from "react-js-pagination";
import { PulseLoader } from 'react-spinners';
import NotificationAlert from "react-notification-alert";

import imageComming from "assets/img/product-image-default.png";

import {
  Alert,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Table,
  Row,
  Col,
  FormGroup,
  Input,
  Media
} from "reactstrap";

class ProductCategory extends React.Component {
  constructor(props) {
    super();
    this.state = {
      productCategories: [],
      productCategoriesMain: [],
      useCreatedProductCategory: false,
      place: {},
      defaultPage: "",
      pagination: {},
      activePage: 1,
      selectedPage: "",
      sortBy: "",
      sort: "",
      keyword: "",
      size: 25,
      message: "",
      parent: "",
      status: "",
      categoryType: "",
      isLoading: true,
      hideTutorials: false
    };
  }

  componentDidMount() {
    let url = this.props.location.search;
    let query = queryString.parse(url);
    let activePage = query.page ? Number(query.page) : 1;
    let parent = query.parent ? query.parent : "";
    let sortBy = query.sortBy ? query.sortBy : "created";
    let sort = query.sort ? query.sort : "desc";
    let message = query.message ? query.message : "";
    let keyword = query.keyword;
    let status = query.status;
    let queryStr = "?" + queryString.stringify(query);
    const pageInfo = JSON.parse(getSession("pageInfo"));
    this.setState({
      activePage: activePage,
      parent: parent,
      sort: sort,
      sortBy: sortBy,
      keyword: keyword,
      message: message,
      status: status,
      hideTutorials: (pageInfo && pageInfo.hideTutorials && pageInfo.hideTutorials === true) ? true : false
    });
    this.refreshProductCategoryList(queryStr);
  }

  renderRows(productCategories) {
    let pageInfo = JSON.parse(getSession("pageInfo"));
    let colSpan = "10";
    if(pageInfo && pageInfo._id === '5ccfe6aeb99ae3280fd246dc') {
      colSpan = "9";
    }
    if(this.state.isLoading) {
      return (
        <tr>
          <td colSpan={colSpan}>
            <PulseLoader
              sizeUnit={"px"}
              size={15}
              color={'#1d8cf8'}
              loading={this.state.isLoading}
            />
          </td>
        </tr>
      );
    } else {
      if (
        productCategories instanceof Array &&
        productCategories.length > 0
      ) {
        if(pageInfo && pageInfo.useCreatedProductCategory) {
          return productCategories.map((item, index, categoriesArr) => (
            <tr key={item._id}>
              <td width="50">{this.renderImage(item)}</td>
              <td>
                <Link to={"/product-categories/" + item._id + "/edit"} style={{paddingRight:"10px"}}>
                  {item.name}
                </Link>
              </td>
              <td style={{ whiteSpace: 'nowrap'}}>{format(new Date(item.createdAt),'MMM dd, yyyy hh:mm a')}</td>
              <td style={{ whiteSpace: 'nowrap'}}>{format(new Date(item.updatedAt),'MMM dd, yyyy hh:mm a')}</td>
              <td width="150">{item.slug}</td>
              <td>{item.description && item.description.replace(/(<([^>]+)>)/ig,"")}</td>
              {pageInfo && pageInfo._id === '5ccfe6aeb99ae3280fd246dc' &&
                <td>{item.code}</td>
              }
              <td width="150">{ item.parent && item.parent.name && item.parent.name}</td>
              <td>
                <Switch
                  onClick={() => {
                    const nextStatus = !item.isActive;
                    this.toggleSwitchIsActive(item);
                    categoriesArr[index].isActive = nextStatus;
                    this.setState({
                      productCategories: categoriesArr
                    });
                  }}
                  on={item.isActive ? item.isActive : false}
                />
              </td>
              <td width="75" align="center">
                <Link to={"/product-categories/" + item._id + "/edit"} style={{paddingRight:"10px"}}>
                  <Fa icon="edit" />
                </Link>
                <Link to="#" className="text-danger" onClick={this.handleDelete} data-item={item._id}>
                  <Fa icon="trash-alt"/>
                </Link>
              </td>
              <td>
                &nbsp;
              </td>
            </tr>
          ));
        } else {
          return productCategories.map(item => (
            <tr key={item._id}>
              <td width="50">{this.renderImage(item)}</td>
              <td>{item.name}</td>
              <td style={{ whiteSpace: 'nowrap'}}>{format(new Date(item.createdAt),'MMM dd, yyyy hh:mm a')}</td>
              <td style={{ whiteSpace: 'nowrap'}}>{format(new Date(item.updatedAt),'MMM dd, yyyy hh:mm a')}</td>
              <td width="150">{item.slug}</td>
              <td>{item.description && item.description.replace(/(<([^>]+)>)/ig,"")}</td>
              <td width="150">{ item.parent && item.parent.name && item.parent.name}</td>
              <td width="75" align="center">&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          ));
        }
      } else {
        return (
          <tr>
            <td colSpan={colSpan}>
              <h5 className="text-danger">
                <em>No category found</em>
              </h5>
            </td>
          </tr>
        );
      }
    }
  }

  renderImage(item) {
    const {
      name,
      photos,
    } = item;

    let imgSrc = imageComming;
    if(photos instanceof Array && photos.length > 0) {
      imgSrc = photos[0].thumb;
    }
    return (
      <Media className="mt-1">
        <Media left middle>
          <Media
            object
            data-src={imgSrc}
            src={imgSrc}
            alt={name}
            title={name}
          />
        </Media>
      </Media>
    );
  }

  renderPlaces() {
    if (this.state.places !== undefined || this.state.places != null) {
      return this.state.places.map((item, index) => (
        <option key={index} value={item.place._id.toString()}>
          {item.place.name}
        </option>
      ));
    }
  }

  handleChangeKeyword = (e) => {
    let { value } = e.target;
    this.setState({keyword: value});
  }

  handleEnter = (e) => {
    let { key } = e;
    if (key === 'Enter') {
      this.setState({ isLoading:true, activePage:1 });
      let { keyword } = this.state;

      let defaultPage = JSON.parse(getSession("defaultPage"));
      let url = this.props.location.search;
      let query = queryString.parse(url);
      delete query.page;
      delete query.message;
      if (keyword !== "") {
        query.keyword = keyword;
      } else {
        delete query.keyword;
      }
      let queryStr = "?" + queryString.stringify(query);
      this.refreshProductCategoryList(queryStr, defaultPage);
    }
  }

  handleDelete = (e) => {
    if (!window.confirm("Do you want to delete this category?")){
      return false;
    }
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    query.message = "Category has been deleted successfully.";
    let queryStr = "?" + queryString.stringify(query);
    const categoryId = e.currentTarget.dataset.item;
    if(categoryId) {
      const userData = JSON.parse(getSession("userData"));
      const sessionToken = userData.sessionToken;
      this.props.deleteProductCategory(
        categoryId,
        sessionToken,
        (error, result) => {
          if (!error && result) {
            if(result.status==="deleted") {
              this.refreshProductCategoryList(queryStr,defaultPage);
            } else {
              this.showNotificationError('There is an error deleting the category');
            }
          } else {
            if (error) {
              console.error({error});
              if(error && error.response && typeof error.response === 'string') {
                this.showNotificationError(error.response);
              } else {
                this.showNotificationError('There is an error deleting the category');
              }
            }
          }
        }
      );
    }
  }

  handleChangeParent = (e) => {
    this.setState({ isLoading: true });
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    let { value } = e.target;
    if(value !== "") {
      this.setState({ categoryType: "child" });
      query.categoryType = "child";
    }
    query.page = 1;
    delete query.message;
    if (value !== "") {
      query.parent = value;
    } else {
      delete query.parent;
    }
    let queryStr = "?" + queryString.stringify(query);
    this.setState({ parent: value, activePage: 1 });
    this.refreshProductCategoryList(queryStr,defaultPage);
  }

  handleChangeStatus = (e) => {
    this.setState({ isLoading: true });
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    let { value } = e.target;
    query.page = 1;
    delete query.message;
    if (value !== "") {
      query.status = value;
    } else {
      delete query.status;
    }
    let queryStr = "?" + queryString.stringify(query);
    this.setState({ status: value, activePage: 1 });
    this.refreshProductCategoryList(queryStr,defaultPage);
  }

  handleChangeParentChild = (e) => {
    this.setState({ isLoading: true });
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    let { value } = e.target;
    if(value === 'parent') {
      this.setState({ parent: "" });
      delete query.parent;
    }
    query.page = 1;
    delete query.message;
    if (value !== "") {
      query.categoryType = value;
    } else {
      delete query.categoryType;
    }
    let queryStr = "?" + queryString.stringify(query);
    this.setState({ categoryType: value, activePage: 1 });
    this.refreshProductCategoryList(queryStr,defaultPage);
  }

  handlePageChange = (pageNumber) => {
    this.setState({ isLoading: true });
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    query.page = pageNumber;
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ activePage: pageNumber });
    this.refreshProductCategoryList(queryStr,defaultPage);
  }

  handleChangePerPage = (e) => {
    this.setState({isLoading:true});
    let { value } = e.target;

    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    if (value !== "") {
      query.size = value;
    } else {
      delete query.size;
    }
    let queryStr = "?" + queryString.stringify(query);
    this.setState({ size: value });
    this.refreshProductCategoryList(queryStr, defaultPage);
  }

  sortCreated = () => {
    let sort = "";
    if (this.state.sortBy === "created") {
      if (this.state.sort !== "desc") {
        sort = "desc";
      } else {
        sort = "asc";
      }
    } else {
      sort = "desc";
    }
    let sortBy = "created";
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    query.sort = sort;
    query.sortBy = sortBy
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ sort: sort });
    this.setState({ sortBy: sortBy });
    this.refreshProductCategoryList(queryStr,defaultPage);
  }

  sortUpdated = () => {
    let sort = "";
    if (this.state.sortBy === "updated") {
      if (this.state.sort !== "desc") {
        sort = "desc";
      } else {
        sort = "asc";
      }
    } else {
      sort = "desc";
    }
    let sortBy = "updated";
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    query.sort = sort;
    query.sortBy = sortBy
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ sort: sort });
    this.setState({ sortBy: sortBy });
    this.refreshProductCategoryList(queryStr,defaultPage);
  }

  sortName = () => {
    let sort = "";
    if (this.state.sortBy === "name") {
      if (this.state.sort !== "desc") {
        sort = "desc";
      } else {
        sort = "asc";
      }
    } else {
      sort = "desc";
    }
    let sortBy = "name";
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    query.sort = sort;
    query.sortBy = sortBy
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ sort: sort });
    this.setState({ sortBy: sortBy });
    this.refreshProductCategoryList(queryStr,defaultPage);
  }

  sortSlug = () => {
    let sort = "";
    if (this.state.sortBy === "slug") {
      if (this.state.sort !== "desc") {
        sort = "desc";
      } else {
        sort = "asc";
      }
    } else {
      sort = "desc";
    }
    let sortBy = "slug";
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    query.sort = sort;
    query.sortBy = sortBy
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ sort: sort });
    this.setState({ sortBy: sortBy });
    this.refreshProductCategoryList(queryStr,defaultPage);
  }
  
  sortCode = () => {
    let sort = "";
    if (this.state.sortBy === "code") {
      if (this.state.sort !== "desc") {
        sort = "desc";
      } else {
        sort = "asc";
      }
    } else {
      sort = "desc";
    }
    let sortBy = "code";
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    query.sort = sort;
    query.sortBy = sortBy
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ sort: sort });
    this.setState({ sortBy: sortBy });
    this.refreshProductCategoryList(queryStr,defaultPage);
  }

  toggleSwitchIsActive(category) {
    const userData = JSON.parse(getSession("userData"));
    const sessionToken = userData.sessionToken;
    const categoryId = category._id;
    if (category) {
      this.props.updateProductCategory(category, categoryId, sessionToken, (error, result) => {
        if (result) {
          this.showNotification('Category successfully updated.');
        } else {
          if (error) {
            this.showNotificationError(error.response);
          } else {
            this.showNotificationError('Category not updated.');
          }
        }
      });
    } else {
      this.showNotificationError('No category found.');
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
    if(message && typeof message === 'string') {
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
        autoDismiss: 2
      }
      if(notification && this.refs.notify && this.refs.notify.notificationAlert) {
        this.refs.notify.notificationAlert(notification);
      }
    }
  }

  showNotificationError(message) {
    if(message && typeof message === 'string') {
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
        autoDismiss: 2
      }
      if(notification && this.refs.notify && this.refs.notify.notificationAlert) {
        this.refs.notify.notificationAlert(notification);
      }
    }
  }

  refreshProductCategoryList(queryStr) {
    const query = queryString.parse(queryStr);
    const message = query.message
    if(message) {
      delete query.message;
      this.showNotification(message);
    }
    
    this.props.history.push("/product-categories" + queryStr);
    const userData = JSON.parse(getSession("userData"));
    const placeId = JSON.parse(getSession("defaultPage"));
    const pageInfo = JSON.parse(getSession("pageInfo"));
    const { sessionToken } = userData;
    let useCreatedProductCategory = false;

    if (userData !== null) {
      if(placeId && pageInfo && pageInfo.useCreatedProductCategory) {
        if(pageInfo.useCreatedProductCategory) {
          useCreatedProductCategory = true;
        }
        if(useCreatedProductCategory) {
          this.props.getProductCategoriesAllV2(
            {},
            placeId,
            sessionToken,
            (error, result) => {
              if (!error && result) {
                const productCategoriesAll = result;
                if(productCategoriesAll instanceof Array && productCategoriesAll.length > 0) {
                  setSession('hasCategories',true);
                  const productCategoriesMain = productCategoriesAll.filter(cat => !cat.parent);
                  this.setState({
                    productCategoriesMain: productCategoriesMain,
                  }, function() { this.setState({ isLoading: false }) });
                } else {
                  setSession('hasCategories',false);
                  this.setState({
                    productCategoriesMain: [],
                  });
                }
              }
            }
          );
          this.props.getProductCategoriesV2(
            query,
            placeId,
            sessionToken,
            (error, result) => {
              if (!error && result) {
                this.setState({ 
                  productCategories: result.productCategories,
                  pagination: result.pagination
                }, function() { this.setState({ isLoading: false }) });
              } else {
                this.setState({ isLoading: false });
              }
            }
          );
        } else {
          this.props.getProductCategoriesAll(
            {},
            sessionToken,
            (error, result) => {
              if (!error && result) {
                const productCategoriesAll = result;
                if(productCategoriesAll instanceof Array && productCategoriesAll.length > 0) {
                  const productCategoriesMain = productCategoriesAll.filter(cat => !cat.parent);
                  this.setState({
                    productCategoriesMain: productCategoriesMain,
                  }, function() { this.setState({ isLoading: false }) });
                } else {
                  this.setState({
                    productCategoriesMain: [],
                  }, function() { this.setState({ isLoading: false }) });
                }
              }
            }
          );
          this.props.getProductCategories(
            query,
            sessionToken,
            (error, result) => {
              if (!error && result) {
                this.setState({ 
                  productCategories: result.productCategories, 
                  pagination: result.pagination 
                }, function() { this.setState({ isLoading: false }) });
              } else {
                this.setState({ isLoading: false });
              }
            }
          );
        }
      } else {
        this.props.getProductCategoriesAll(
          {},
          sessionToken,
          (error, result) => {
            if (!error && result) {
              const productCategoriesAll = result;
              if(productCategoriesAll instanceof Array && productCategoriesAll.length > 0) {
                const productCategoriesMain = productCategoriesAll.filter(cat => !cat.parent);
                this.setState({
                  productCategoriesMain: productCategoriesMain,
                }, function() { this.setState({ isLoading: false }) });
              } else {
                this.setState({
                  productCategoriesMain: [],
                }, function() { this.setState({ isLoading: false }) });
              }
            }
          }
        );
        this.props.getProductCategories(
          query,
          sessionToken,
          (error, result) => {
            if (!error && result) {
              this.setState({ 
                productCategories: result.productCategories, 
                pagination: result.pagination 
              }, function() { this.setState({ isLoading: false }) });
            } else {
              this.setState({ isLoading: false });
            }
          }
        );
      }
    }
  } 

  renderProductCategoriesMain() {
    if (
      this.state.productCategoriesMain !== undefined ||
      this.state.productCategoriesMain !== null
    ) {
      const productCategoriesMain = this.state.productCategoriesMain;
      return productCategoriesMain.map((item, index) => (
        <option key={index} value={item._id}>
          {item.name}
        </option>
      ));
    }
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

  render() {
    const pageInfo = JSON.parse(getSession("pageInfo"));
    const hasCategories = JSON.parse(getSession("hasCategories"));
    const hasProducts = JSON.parse(getSession("hasProducts"));
    if(pageInfo && pageInfo._id) {
      if(pageInfo.isVerified === true) {
        return (
          <>
            <div className="content">
              <div className="react-notification-alert-container">
                <NotificationAlert ref="notify" />
              </div>
              <Row>
                <Col md="12">
                  <Card>
                    <CardHeader>
                      <h4 className="title">Product Categories - <em>{pageInfo.name}</em></h4>
                      <Row>
                        {hasCategories && hasProducts && pageInfo.isActive !== true &&
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
                        <Col className="pr-md-1" md="3">
                          <FormGroup>
                            <label htmlFor="keyword" className="control-label">
                              Search
                            </label>
                            <Input
                              id="keyword"
                              name="keyword"
                              type="text"
                              placeholder="Search category..."
                              onChange={this.handleChangeKeyword}
                              onKeyPress={this.handleEnter}
                              value={this.state.keyword || ''}
                            >
                            </Input>
                          </FormGroup>
                        </Col>
                        <Col className="px-md-1" md="3">
                          <FormGroup>
                            <label htmlFor="page" className="control-label">
                              Status
                            </label>
                            <Input
                              id="status"
                              name="status"
                              className="status"
                              placeholder="Status"
                              type="select"
                              onChange={this.handleChangeStatus}
                              value={this.state.status}
                            >
                              <option value="">All</option>
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </Input>
                          </FormGroup>
                        </Col>
                        <Col className="pl-md-1" md="3">
                          <FormGroup>
                            <label htmlFor="page" className="control-label">
                              Parent Category
                            </label>
                            <Input
                              id="productStatus"
                              name="productStatus"
                              className="productStatus"
                              placeholder="productStatus"
                              type="select"
                              onChange={this.handleChangeParent}
                              value={this.state.parent}
                            >
                              <option value="">All</option>
                              {this.renderProductCategoriesMain()}
                            </Input>
                          </FormGroup>
                        </Col>
                        <Col className="px-md-1" md="3">
                          <FormGroup>
                            <label htmlFor="page" className="control-label">
                              Parent or Child
                            </label>
                            <Input
                              id="parentChild"
                              name="parentChild"
                              className="parentChild"
                              placeholder="Parent or Child "
                              type="select"
                              onChange={this.handleChangeParentChild}
                              value={this.state.categoryType}
                            >
                              <option value="">All</option>
                              <option value="parent">Parent</option>
                              <option value="child">Child</option>
                            </Input>
                          </FormGroup>
                        </Col>
                      </Row>
                      { pageInfo && pageInfo.useCreatedProductCategory && 
                        <Row className="pull-right">
                          <Col md="12">
                            <Link
                              to="/product-categories/new"
                              className="btn btn-round btn-info btn-sm"
                            >
                              <Fa icon="plus" />&nbsp;Add New
                            </Link>
                            <Link
                              to="/import-categories-excel"
                              className="btn btn-round btn-info btn-sm"
                            >
                              <Fa icon="file-excel" />&nbsp;Upload Categories
                            </Link>
                          </Col>
                        </Row>
                      }
                    </CardHeader>
                    <CardBody>
                      <Table className="tablesorter table-striped responsive" responsive>
                        <thead className="text-primary">
                          <tr>
                            <th>&nbsp;</th>
                            <th onClick={this.sortName}>
                              Name{" "}
                              {this.state.sortBy === "name" &&
                                this.state.sort === "desc" && (
                                  <Fa icon="arrow-down" className="text-info" />
                                )}{" "}
                              {this.state.sortBy === "name" &&
                                this.state.sort === "asc" && (
                                  <Fa icon="arrow-up" className="text-info" />
                                )}{" "}
                              {this.state.sortBy !== "name" && (
                                  <Fa icon="arrow-down" className="text-disabled" />
                                )}{" "}
                            </th>
                            <th onClick={this.sortCreated}>
                              Added{" "}
                              {this.state.sortBy === "created" &&
                                this.state.sort === "desc" && (
                                  <Fa icon="arrow-down" className="text-info" />
                                )}{" "}
                              {this.state.sortBy === "created" &&
                                this.state.sort === "asc" && (
                                  <Fa icon="arrow-up" className="text-info" />
                                )}{" "}
                              {this.state.sortBy !== "created" && (
                                  <Fa icon="arrow-down" className="text-disabled" />
                                )}{" "}
                            </th>
                            <th onClick={this.sortUpdated}>
                              Updated{" "}
                              {this.state.sortBy === "updated" &&
                                this.state.sort === "desc" && (
                                  <Fa icon="arrow-down" className="text-info" />
                                )}{" "}
                              {this.state.sortBy === "updated" &&
                                this.state.sort === "asc" && (
                                  <Fa icon="arrow-up" className="text-info" />
                                )}{" "}
                              {this.state.sortBy !== "updated" && (
                                  <Fa icon="arrow-down" className="text-disabled" />
                                )}{" "}
                            </th>
                            <th onClick={this.sortSlug}>
                              Slug{" "}
                              {this.state.sortBy === "slug" &&
                                this.state.sort === "desc" && (
                                  <Fa icon="arrow-down" className="text-info" />
                                )}{" "}
                              {this.state.sortBy === "slug" &&
                                this.state.sort === "asc" && (
                                  <Fa icon="arrow-up" className="text-info" />
                                )}{" "}
                              {this.state.sortBy !== "slug" && (
                                  <Fa icon="arrow-down" className="text-disabled" />
                                )}{" "}
                            </th>
                            <th>Description</th>
                            {pageInfo && pageInfo._id === '5ccfe6aeb99ae3280fd246dc' &&
                              <th onClick={this.sortCode}>
                                Code{" "}
                                {this.state.sortBy === "code" &&
                                  this.state.sort === "desc" && (
                                    <Fa icon="arrow-down" className="text-info" />
                                  )}{" "}
                                {this.state.sortBy === "code" &&
                                  this.state.sort === "asc" && (
                                    <Fa icon="arrow-up" className="text-info" />
                                  )}{" "}
                                {this.state.sortBy !== "code" && (
                                    <Fa icon="arrow-down" className="text-disabled" />
                                  )}{" "}
                              </th>
                            }
                            <th>Parent</th>
                            <th>Status</th>
                            <th>&nbsp;</th>
                          </tr>
                        </thead>
                        <tbody>{this.renderRows(this.state.productCategories)}</tbody>
                      </Table>
                    </CardBody>
                    <CardFooter>
                      <Row>
                        <Col md="12">
                          <Row className="pull-right">
                            <Col md="4" lg="4">
                              <FormGroup>
                                {this.state.pagination && this.state.pagination.total > 0 &&
                                  <Input
                                    style={{marginBottom:'5px'}}
                                    id="perPage"
                                    name="perPage"
                                    type="select"
                                    onChange={this.handleChangePerPage}
                                    value={this.state.size}
                                  >
                                    <option value="10">10 / page</option>
                                    <option value="25">25 / page</option>
                                    <option value="50">50 / page</option>
                                    <option value="100">100 / page</option>
                                  </Input>
                                }
                              </FormGroup>
                            </Col>
                            <Col md="8" lg="8">
                              {this.state.pagination && this.state.pagination.total > 0 &&
                                <>
                                  <Pagination
                                    innerClass="pagination"
                                    activePage={this.state.activePage}
                                    itemsCountPerPage={this.state.pagination.limit}
                                    totalItemsCount={this.state.pagination.total}
                                    pageRangeDisplayed={3}
                                    onChange={this.handlePageChange}
                                  />
                                  <p>Page <em>{this.state.activePage}</em> of <em>{Math.ceil(this.state.pagination.total/this.state.pagination.limit)}</em> of <em>{numberWithCommasOnly(this.state.pagination.total)}</em> categories.</p>
                                </>
                              }
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                    </CardFooter>
                  </Card>
                </Col>
              </Row>
            </div>
          </>
        );
      } else {
        return (this.renderPageNotVerified());
      }
    } else {
      return (this.renderNoPageAdded());
    }
  }
}

const numberWithCommasOnly = x => {
  return priceRound(x,0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const priceRound = (price, dec) => {
  if (dec === undefined) {
    dec = 2;
  }
  if (price !== 0) {
    if (!price || isNaN(price)) {
      throw new Error("price is not a number" + price);
    }
  }
  const str = parseFloat(Math.round(price * 100) / 100).toFixed(dec);
  return str;
};

const mapStateToProps = () => ({});

export default connect(
  mapStateToProps,
  {
    getProductCategories, 
    getProductCategoriesV2, 
    getProductCategoriesAll, 
    getProductCategoriesAllV2, 
    deleteProductCategory,
    getPageById,
    updateProductCategory
  }
)(ProductCategory);
