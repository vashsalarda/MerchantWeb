import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import queryString from "query-string";
import { getSession, setSession } from "../../config/session";
import api from "../../config/api";
import { PulseLoader } from "react-spinners";
import { 
  getProductOrders,
  getProductOrdersGrocery,
  getProductOrdersXls,
  getProductOrdersGroceryXls 
} from "../../layouts/Admin/actions/ProductActions";
import { getProductCategoriesAll, getProductCategoriesAllV2 } from "../../layouts/Admin/actions/ProductCategoryActions";
import { getPageById } from "../../layouts/Admin/actions/PageActions";
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';
import Select from 'react-select';
import Switch from 'react-toggle-switch';

import defaultProductImage from "assets/img/product-image-default.png";

import {
  Alert,
  FormGroup,
  Input,
  Button,
  Table,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Media,
  Row,
  Col
} from "reactstrap";

import "react-datepicker/dist/react-datepicker.css";

import { startOfDay, endOfDay } from 'date-fns'

class ProductReports extends React.Component {
  constructor(props) {
    super(props);
    const datesStr = new Date().toISOString();
    this.state = {
      page: {},
      transactions: [],
      productCategories: [],
      productCategoriesSub: [],
      startDate: startOfDay(new Date()),
      endDate: endOfDay(new Date()),
      startDateStr: datesStr,
      endDateStr: datesStr,
      selectedPaymentMethod: '',
      selectedProductCategory: "",
      selectedProductCategorySub: "",
      filterDate: "deliveryDate",
      pagination: {},
      activePage: 1,
      sortBy: "quantitySoldDesc",
      status: "payment_pending",
      isLoading: false,
      isGrocery: false,
      isGeneratingXls: false,
      showTests: false
    };
  }

  componentDidMount() {
    const userData = JSON.parse(getSession("userData"));
    const defaultPage = JSON.parse(getSession("defaultPage"));
    const sessionToken = userData.sessionToken;
    const pageInfo = JSON.parse(getSession("pageInfo"));
    if(pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb') { // If Grocery
      this.setState({isGrocery:true});
    }
    if (defaultPage && defaultPage!=="") {
      this.props.getPageById(defaultPage, sessionToken, (error, result) => {
        if (error) {
          this.showNotificationError('An error occured. Cannot find the page information!');
        } else {
          if(result) {
            const { _id, name, addressLine1: address, city, province, email, balances } = result.page;
            this.setState({
              page: {
                _id,
                name,
                address,
                city,
                province,
                email,
                balances,
              }
            });
            this.getCategories(pageInfo, defaultPage, sessionToken);
          } else {
            this.showNotificationError('Page not found.');
          }
        }
      });
    }
  }

  handleChangeStartDate = (date) => {
    const datesStr = new Date(date).toISOString();
    this.setState({startDate: date});
    this.setState({startDateStr: datesStr});
  }

  handleChangeEndDate = (date) => {
    const datesStr = new Date(date).toISOString();
    this.setState({endDate: date});
    this.setState({endDateStr: datesStr});
  }

  handleChangeFilterDate = (e) => {
    let { value } = e.target;
    this.setState({ filterDate: value });
  }

  handleChangePaymentMethod = (e) => {
    let { value } = e.target;
    this.setState({ selectedPaymentMethod: value });
  }

  handleChangeStatus = (e) => {
    let { value } = e.target;
    this.setState({ status: value });
  }

  handleChangeProductCategory = (e) => {
    this.setState({isLoading:true});
    let pageId = JSON.parse(getSession("defaultPage"));
    let value = "";
    const productCategoriesAll = this.state.productCategoriesAll;
    let productCategoriesSub = [];
    let query = {};

    query.dateStart = this.state.startDateStr;
    query.dateEnd = this.state.endDateStr;
    if(this.state.selectedProductCategory !== '') {
      query.category = this.state.selectedProductCategory;
    }
    if(this.state.selectedProductCategorySub !== '') {
      query.subCategory = this.state.selectedProductCategorySub;
    }
    if(this.state.selectedPaymentMethod !== '') {
      query.selectedPaymentMethod = this.state.selectedPaymentMethod;
    }
    if(this.state.status !== '') {
      query.status = this.state.status;
    }
    if(this.state.filterDate !== '') {
      query.filterDate = this.state.filterDate;
    }
    
    query.pageId = pageId;
    if (e && e.value) {
      value = e.value;
      productCategoriesSub = productCategoriesAll.filter(item => item.parent && item.parent.id.toString() === value);
      query.category = value;
    } else {
      delete query.category;
    }
    delete query.subCategory;
    let queryStr = "?" + queryString.stringify(query);
    this.setState({ selectedProductCategory: value, selectedProductCategorySub: "", productCategoriesSub: productCategoriesSub });
    this.generateTxnsList(queryStr);
  }

  handleChangeProductCategorySub = (e) => {
    this.setState({isLoading:true});
    let pageId = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);

    query.dateStart = this.state.startDateStr;
    query.dateEnd = this.state.endDateStr;
    if(this.state.selectedProductCategory !== '') {
      query.category = this.state.selectedProductCategory;
    }
    if(this.state.selectedProductCategorySub !== '') {
      query.subCategory = this.state.selectedProductCategorySub;
    }
    if(this.state.selectedPaymentMethod !== '') {
      query.selectedPaymentMethod = this.state.selectedPaymentMethod;
    }
    if(this.state.status !== '') {
      query.status = this.state.status;
    }
    if(this.state.filterDate !== '') {
      query.filterDate = this.state.filterDate;
    }
    
    query.pageId = pageId;
    let value = "";
    if (e && e.value) {
      value = e.value;
      query.subCategory = value;
    } else {
      delete query.subCategory;
    }
    let queryStr = "?" + queryString.stringify(query);
    this.setState({ selectedProductCategorySub: value});
    this.generateTxnsList(queryStr);
  }

  handleChangeSortBy = (e) => {
    let { value } = e.target;
    this.setState({ sortBy: value });
  }

  handleToggleShowTests = (e) => {
    this.setState(prevState => ({showTests: !prevState.showTests}));
  }

  generateList = () => {
    let pageId = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    query.dateStart = this.state.startDateStr;
    query.dateEnd = this.state.endDateStr;
    if(this.state.selectedProductCategory !== '') {
      query.category = this.state.selectedProductCategory;
    }
    if(this.state.selectedProductCategorySub !== '') {
      query.subCategory = this.state.selectedProductCategorySub;
    }
    if(this.state.selectedPaymentMethod !== '') {
      query.selectedPaymentMethod = this.state.selectedPaymentMethod;
    }
    if(this.state.status !== '') {
      query.status = this.state.status;
    }
    if(this.state.filterDate !== '') {
      query.filterDate = this.state.filterDate;
    }
    if(this.state.sortBy !== '') {
      query.sortBy = this.state.sortBy;
    }
    if(this.state.showTests) {
      query.showTests = this.state.showTests;
    }
    
    query.pageId = pageId;
    let queryStr = "?" + queryString.stringify(query);
    this.generateTxnsList(queryStr);
  }

  exportList = () => {
    this.setState({ isGeneratingXls: true });
    let sort = "";
    let sortBy = "price";
    const userData = JSON.parse(getSession("userData"));
    const pageId = JSON.parse(getSession("defaultPage"));
    const { sessionToken } = userData;
    if (this.state.sort !== "desc") {
      sort = "desc";
    } else {
      sort = "asc";
    }
    
    let url = this.props.location.search;
    let query = queryString.parse(url);
    query.dateStart = this.state.startDateStr;
    query.dateEnd = this.state.endDateStr;
    if(this.state.selectedProductCategory !== '') {
      query.category = this.state.selectedProductCategory;
    }
    if(this.state.selectedProductCategorySub !== '') {
      query.subCategory = this.state.selectedProductCategorySub;
    }
    if(this.state.selectedPaymentMethod !== '') {
      query.selectedPaymentMethod = this.state.selectedPaymentMethod;
    }
    if(this.state.status !== '') {
      query.status = this.state.status;
    }
    if(this.state.filterDate !== '') {
      query.filterDate = this.state.filterDate;
    }
    if(this.state.showTests) {
      query.showTests = this.state.showTests;
    }

    query.pageId = pageId;

    this.setState({ sort: sort });
    this.setState({ sortBy: sortBy });
    if (userData !== null) {
      if(this.state.isGrocery) {
        this.props.getProductOrdersGroceryXls(
          query,
          sessionToken,
          (error, result) => {
            if (result && result.data && result.data.status === 'success' && result.data.filename) {
              const fileName = result.data.filename;
              this.setState({ isGeneratingXls: false });
              window.open(fileName);
            } else {
              this.setState({ isGeneratingXls: false });
              this.showNotificationError('No transactions found.');
            }
          }
        );
      } else {
        this.props.getProductOrdersXls(
          query,
          sessionToken,
          (error, result) => {
            if (result && result.data && result.data.status === 'success' && result.data.filename) {
              const fileName = result.data.filename;
              this.setState({ isGeneratingXls: false });
              window.open(fileName);
            } else {
              this.setState({ isGeneratingXls: false });
              this.showNotificationError('No transactions found.');
            }
          }
        );
      }
    } else {
      this.setState({ isGeneratingXls: false });
    }
  }

  generateTxnsList(queryStr) {
    this.setState({isLoading:true});
    const query = queryString.parse(queryStr);
    const userData = JSON.parse(getSession("userData"));
    const pageInfo = JSON.parse(getSession("pageInfo"));
    const { sessionToken } = userData;
    
    if (userData !== null) {
      if(pageInfo) {
        if(this.state.isGrocery) {
          this.props.getProductOrdersGrocery(
            query,
            sessionToken,
            (error, result) => {
              if (!error && result && result.data) {
                const txns = result.data;
                this.setState({ transactions:txns });
              } else {
                this.setState({ transactions:[] });
              }
              this.setState({ isLoading:false });
            }
          );
        } else {
          this.props.getProductOrders(
            query,
            sessionToken,
            (error, result) => {
              if (!error && result && result.data) {
                const txns = result.data;
                this.setState({ transactions:txns });
              } else {
                this.setState({ transactions:[] });
              }
              this.setState({ isLoading:false });
            }
          );
        }
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

  renderImage(item) {
    const {
      name,
      photos,
    } = item;

    let primaryPhoto;
    if (photos && (photos[0] !== undefined || photos[0] != null)) {
      primaryPhoto = photos[0];
    } else {
      primaryPhoto = {
        thumb: defaultProductImage,
      }
    }
    return (
      <Media className="mt-1">
        { primaryPhoto && primaryPhoto.thumb &&
          <Media left middle>
            <Media
              object
              data-src={primaryPhoto.thumb}
              src={primaryPhoto.thumb}
              alt={name}
              title={name}
            />
          </Media>
        }
      </Media>
    );
  }

  renderRows() {
    let colSpan = 9;
    if(this.state.isGrocery) {
      colSpan = 10;
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
        this.state.transactions instanceof Array &&
        this.state.transactions.length > 0
      ) {
        if(this.state.isGrocery) {
          return this.state.transactions.map((item, index) => (
            <tr key={index}>
              <td>{index+1}&middot;{this.renderImage(item)}</td>
              <td>
                <Link target="_blank" to={`/products/${item._id}/edit`}>{item.productName}</Link>
              </td>
              <td>{item.categories && item.categories.length > 0 && item.categories.filter(item => !item.parent).map(cat => cat.name).join(", ")}</td>
              <td>{item.categories && item.categories.length > 0 && item.categories.filter(item => item.parent!== null).map(cat => cat.name).join(", ")}</td>
              <td>...{item._id.substring(18, 24)}</td>
              <td style={{whiteSpace:"nowrap"}}>{item.itemCode}</td>
              <td>{item.barcode}</td>
              <td>&#8369;{numberWithCommas(item.price)}</td>
              <td align="center">{item.quantitySold}</td>
              <td>&#8369;{numberWithCommas(item.totalSales)}</td>
            </tr>
          ));
        } else {
          return this.state.transactions.map((item, index) => (
            <tr key={index}>
              <td>{index+1}&middot;{this.renderImage(item)}</td>
              <td>
                <Link target="_blank" to={`/products/${item._id}/edit`}>{item.productName}</Link>
              </td>
              <td>{item.categories && item.categories.length > 0 && item.categories.map(cat => cat.name).join(", ")}</td>
              <td>...{item._id.substring(18, 24)}</td>
              <td style={{whiteSpace:"nowrap"}}>{item.itemCode}</td>
              <td>{item.barcode}</td>
              <td>&#8369;{numberWithCommas(item.price)}</td>
              <td align="center">{item.quantitySold}</td>
              <td>&#8369;{numberWithCommas(item.totalSales)}</td>
            </tr>
          ));
        }
      } else {
        return (
          <tr>
            <td colSpan={colSpan}>
              <h5 className="text-danger">
                <em>No transactions found.</em>
              </h5>
            </td>
          </tr>
        );
      }
    }
  }

  getCategories(pageInfo,defaultPage,sessionToken) {
    if(this.state.isGrocery) { // If Grocery
      this.setState({isGrocery:true});
      this.props.getProductCategoriesAllV2(
        {},
        defaultPage,
        sessionToken,
        (error, result) => {
          if (!error && result) {
            const categoriesAll = result;
            if(categoriesAll instanceof Array && categoriesAll.length > 0) {
              let productCategoriesAll = [];
              let productCategoriesMain = [];
              let productCategoriesSub = [];
              categoriesAll.forEach(item => {
                const category = {
                  value: item._id,
                  label: item.name,
                  parent: item.parent,
                }
                productCategoriesAll.push(category);
              });
              productCategoriesMain = productCategoriesAll.filter(item => !item.parent);
              const categoryFirst = {
                value: "",
                label: "All",
                parent: "",
              }
              productCategoriesMain = [categoryFirst,...productCategoriesMain];
              if(this.state.selectedProductCategory) {
                productCategoriesSub = productCategoriesAll.filter(item => item.parent && item.parent.id.toString() === this.state.selectedProductCategory);
              }
              this.setState({
                productCategoriesAll: productCategoriesAll,
                productCategories: productCategoriesMain,
                productCategoriesSub: productCategoriesSub,
              });
              
            } else {
              this.setState({
                productCategories: [],
              });
            }
          }
        }
      );
    } else {
      this.props.getProductCategoriesAll(
        {},
        sessionToken,
        (error, result) => {
          if (!error && result) {
            const categoriesAll = result;
            if(categoriesAll instanceof Array && categoriesAll.length > 0) {
              let productCategoriesAll = [];
              let productCategoriesMain = [];
              let productCategoriesSub = [];
              categoriesAll.forEach(item => {
                const category = {
                  value: item._id,
                  label: item.name,
                  parent: item.parent,
                }
                productCategoriesAll.push(category);
              });
              productCategoriesMain = productCategoriesAll.filter(item => !item.parent);
              const categoryFirst = {
                value: "",
                label: "All",
                parent: "",
              }
              productCategoriesMain = [categoryFirst,...productCategoriesMain];
              if(this.state.selectedProductCategory) {
                productCategoriesSub = productCategoriesAll.filter(item => item.parent && item.parent.id.toString() === this.state.selectedProductCategory);
              }
              this.setState({
                productCategoriesAll: productCategoriesAll,
                productCategories: productCategoriesMain,
                productCategoriesSub: productCategoriesSub,
              });
              
            } else {
              this.setState({
                productCategories: [],
              });
            }
          }
        }
      );
    }
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

  renderNoProductsAdded() {
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
                  <h4 className="alert-heading">No Products Added</h4>
                  <hr />
                  <p className="mb-0">
                    You need to add a product before you can activate your store. Click{" "} <Link to="/products/new">here</Link> {" "}to add a product.
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
    const hasProducts = JSON.parse(getSession("hasProducts"));
    const hasCategories = JSON.parse(getSession("hasCategories"));
    if(pageInfo && pageInfo._id) {
      if(pageInfo.isVerified === true) {
        if(hasProducts === true) {
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
                        <h4 className="title">Product Order Reports - <em>{this.state.page.name}</em></h4>
                        {!pageInfo.hideTutorials &&
                          <Row>
                            <Col sm="12">
                              <Row>
                                <Col md="12">
                                  <Alert className="alert-compact" color="primary" isOpen={!this.state.hideTutorials} toggle={this.onDismiss} fade={false}>
                                    <h4 className="alert-heading">New on Product Reports?</h4>
                                    <hr />
                                    <p className="mb-0">
                                      Check our videos here on how to manage your Product Reports.<br /> 
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
                          </Row>
                        }
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
                          <Col className="pr-md-1" md="6">
                            <Row>
                              <Col md="6">
                                <FormGroup>
                                  <label htmlFor="startDate" className="control-label" style={{display:'block'}}>
                                    Start Date:
                                  </label>
                                  { this.state.filterDate && this.state.filterDate === 'deliveryDate' 
                                    ?
                                    <DatePicker
                                      name="startDate"
                                      className="form-control"
                                      selectsStart
                                      startDate={this.state.startDate}
                                      endDate={this.state.endDate}
                                      selected={this.state.startDate}
                                      onChange={this.handleChangeStartDate}
                                      showTimeSelect
                                      dateFormat="MMMM d, yyyy h:mm aa"
                                      timeIntervals={30}
                                      timeCaption="Time"
                                      autoComplete="off"
                                    />
                                    :
                                    <DatePicker
                                      name="startDate"
                                      className="form-control"
                                      selectsStart
                                      startDate={this.state.startDate}
                                      endDate={this.state.endDate}
                                      selected={this.state.startDate}
                                      onChange={this.handleChangeStartDate}
                                      dateFormat="MMMM d, yyyy"
                                      autoComplete="off"
                                    />
                                  }
                                </FormGroup>
                              </Col>
                              <Col md="6">  
                                <FormGroup>
                                  <label htmlFor="endDate" className="control-label" style={{display:'block'}}>
                                    End Date:
                                  </label>
                                  { this.state.filterDate && this.state.filterDate === 'deliveryDate' 
                                    ?
                                    <DatePicker
                                      name="endDate"
                                      selectsEnd
                                      startDate={this.state.startDate}
                                      endDate={this.state.endDate}
                                      className="form-control"
                                      selected={this.state.endDate}
                                      onChange={this.handleChangeEndDate}
                                      showTimeSelect
                                      dateFormat="MMMM d, yyyy h:mm aa"
                                      timeIntervals={30}
                                      timeCaption="Time"
                                      autoComplete="off"
                                    />
                                    :
                                    <DatePicker
                                      name="endDate"
                                      selectsEnd
                                      startDate={this.state.startDate}
                                      endDate={this.state.endDate}
                                      className="form-control"
                                      selected={this.state.endDate}
                                      onChange={this.handleChangeEndDate}
                                      dateFormat="MMMM d, yyyy"
                                      autoComplete="off"
                                    />
                                  }
                                </FormGroup>
                              </Col>
                            </Row>
                            <Row>
                              <Col md="6">
                                <FormGroup>
                                  <label htmlFor="filterDate" className="control-label">
                                    Filter Date by:
                                  </label>
                                  <Input
                                    id="filterDate"
                                    name="filterDate"
                                    type="select"
                                    onChange={this.handleChangeFilterDate}
                                    value={this.state.filterDate}
                                  >
                                    <option value="deliveryDate">Delivery Date</option>
                                    <option value="orderDate">Date Ordered</option>
                                  </Input>
                                </FormGroup>
                              </Col>
                              <Col md="6">
                                <FormGroup>
                                  <label htmlFor="sortBy" className="control-label">
                                    Sort by:
                                  </label>
                                  <Input
                                    id="sortBy"
                                    name="sortBy"
                                    type="select"
                                    onChange={this.handleChangeSortBy}
                                    value={this.state.sortBy}
                                  >
                                    <option value="productName">Product - A to Z</option>
                                    <option value="productNameDesc">Product - Z to A</option>
                                    <option value="quantitySold">Qty. Sold - Low to High</option>
                                    <option value="quantitySoldDesc">Qty. Sold - High to Low</option>
                                    <option value="price">Price - Low to High</option>
                                    <option value="priceDesc">Price - High to Low</option>
                                  </Input>
                                </FormGroup>
                              </Col>
                            </Row>
                          </Col>
                          <Col className="pl-md-1" md="6">
                            <Row>
                              <Col md="6">
                                <FormGroup>
                                  <label htmlFor="category" className="control-label">
                                    Category:
                                  </label>
                                  <Select
                                    className="react-select"
                                    name="category"
                                    styles={{fontSize:'13px !important'}}
                                    options={this.state.productCategories}
                                    onChange={this.handleChangeProductCategory}
                                    placeholder="Select main category"
                                    value={this.state.productCategories.filter(item => item.value === this.state.selectedProductCategory)}
                                  />
                                </FormGroup>
                              </Col>
                              <Col md="6">
                                <FormGroup>
                                  <label htmlFor="subCategory" className="control-label">
                                    Subcategory:
                                  </label>
                                  <Select
                                    className="react-select"
                                    name="subCategory"
                                    styles={{fontSize:'13px !important'}}
                                    isClearable={true}
                                    options={this.state.productCategoriesSub}
                                    onChange={this.handleChangeProductCategorySub}
                                    placeholder="Select sub category"
                                    value={this.state.productCategoriesSub.filter(item => item.value === this.state.selectedProductCategorySub)}
                                  />
                                </FormGroup>
                              </Col>
                            </Row>
                            <Row>
                              <Col md="6">
                                <FormGroup>
                                  <label htmlFor="paymentMethod" className="control-label">
                                    Payment Method:
                                  </label>
                                  <Input
                                    id="paymentMethod"
                                    name="paymentMethod"
                                    type="select"
                                    onChange={this.handleChangePaymentMethod}
                                    value={this.state.selectedPaymentMethod}
                                  >
                                    <option value="">All</option>
                                    <option value="cash">Cash</option>
                                    <option value="gcash">G-Cash</option>
                                    <option value="paynamics">Paynamics</option>
                                    <option value="paymongo">Paymongo</option>
                                    <option value="cc">Paypal</option>
                                    <option value="direct-transfer">Direct Transfer</option>
                                  </Input>
                                </FormGroup>
                              </Col>
                              <Col md="6">
                                <FormGroup>
                                  <label htmlFor="status" className="control-label">
                                    Status:
                                  </label>
                                  <Input
                                    id="status"
                                    name="status"
                                    type="select"
                                    onChange={this.handleChangeStatus}
                                    value={this.state.status}
                                  >
                                    <option value="">All</option>
                                    <option value="for_confirmation">For Confirmation</option>
                                    <option value="payment_pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="void">Void</option>
                                  </Input>
                                </FormGroup>
                              </Col>
                            </Row>
                          </Col>
                          <Col className="pr-md-1" md="6">
                            <Row>
                              <Col md="6">
                                <FormGroup>
                                  <label className="control-label">
                                    <Switch
                                      onClick={this.handleToggleShowTests}
                                      on={this.state.showTests}
                                    />
                                    &nbsp;Show Test Txns
                                  </label>
                                </FormGroup>
                              </Col>
                            </Row>
                          </Col>
                        </Row>
                        <Row>
                          <Col md="12">
                            <FormGroup>
                              <Button className="btn-round" color="info" type="button" onClick={this.generateList}>
                                Generate
                              </Button>
                              <Button className="btn-round" color="info" type="button" onClick={this.exportList}>
                                Export
                              </Button>
                            </FormGroup>
                          </Col>
                        </Row>
                      </CardHeader>
                      <CardBody>
                        <Table className="tablesorter table-striped fs12" responsive>
                          <thead className="text-primary bg-gray">
                            { this.state.isGrocery ? (
                                <tr>
                                  <th>#</th>
                                  <th>Product</th>
                                  <th>Category</th>
                                  <th style={{whiteSpace:"nowrap"}}>Sub-category</th>
                                  <th>Product ID</th>
                                  <th>Item Code</th>
                                  <th>Barcode</th>
                                  <th>SRP</th>
                                  <th>Qty. Sold</th>
                                  <th>Total Sales</th>
                                </tr>
                              ) : (
                                <tr>
                                  <th>#</th>
                                  <th>Product</th>
                                  <th>Category</th>
                                  <th>Product Id</th>
                                  <th>Item Code</th>
                                  <th>Barcode</th>
                                  <th>SRP</th>
                                  <th>Qty. Sold</th>
                                  <th>Total Sales</th>
                                </tr>
                              )
                            } 
                          </thead>
                          <tbody>
                            {this.renderRows()}
                          </tbody>
                        </Table>
                      </CardBody>
                      <CardFooter>
                      </CardFooter>
                    </Card>
                  </Col>
                </Row>
              </div>
              <LoadingOverlay
                active={this.state.isGeneratingXls}
                spinner
                text='Generating...'
                >
              </LoadingOverlay>
            </>
          );
        } else {
          return (this.renderNoProductsAdded());
        }
      } else {
        return (this.renderPageNotVerified());
      }
    } else {
      return (this.renderNoPageAdded());
    }
  }
}

const numberWithCommas = x => {
  return priceRound(x).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
    getProductOrders,
    getProductOrdersGrocery,
    getProductOrdersXls,
    getProductOrdersGroceryXls,
    getPageById,
    getProductCategoriesAll,
    getProductCategoriesAllV2,
  }
)(ProductReports);