import React from "react";
import { connect } from "react-redux";
import api from "../../config/api";
import { Link } from "react-router-dom";
import { getSession, setSession } from "../../config/session";
import {
  getProductsByPageId,
  getProductsGroceryByPageId,
  getProductsByProviderId,
  updateProduct,
  deleteProduct
} from "../../layouts/Admin/actions/ProductActions";
import { getProductCategoriesAll, getProductCategoriesAllV2 } from "../../layouts/Admin/actions/ProductCategoryActions";
import { getProviderPlaces } from "../../layouts/User/UserActions";
import queryString from "query-string";
import Switch from "react-toggle-switch";
import { FontAwesomeIcon as Fa } from "@fortawesome/react-fontawesome";
import Pagination from "react-js-pagination";
import { PulseLoader } from "react-spinners";
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';
import { format } from 'date-fns'

import defaultProductImage from "assets/img/product-image-default.png";

import { Button, Card, CardHeader, CardBody, CardFooter, Table, Row, Col, 
  Media, FormGroup, Input,
} from "reactstrap";

class Tours extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tours: [],
      checked: [],
      defaultPage: "",
      pagination: {},
      activePage: 1,
      selectedPage: "",
      selectedAvailability: "",
      selectedProductCategory: "",
      selectedProductCategorySub: "",
      sortBy: "",
      sort: "",
      status: "",
      keyword: "",
      size: 25,
      isLoading: true,
      isProcessing: false,
      isGrocery: false,
    };
  }

  componentDidMount() {
    const userData = JSON.parse(getSession("userData"));
    let pageInfo = JSON.parse(getSession("pageInfo"));
    if (userData !== null) {
      let defaultPage = JSON.parse(getSession("defaultPage"));
      const sessionToken = userData.sessionToken;
    
      if (defaultPage) {
        if (defaultPage !== "") {
          let url = this.props.location.search;
          let query = queryString.parse(url);
          let activePage = query.page ? Number(query.page) : 1;
          let status = query.status ? query.status : "";
          let sortBy = query.sortBy ? query.sortBy : "created";
          let sort = query.sort ? query.sort : "desc";
          let keyword = query.keyword ? query.keyword : "";
          let size = query.size ? query.size : 25;
          let queryStr = "?" + queryString.stringify(query);
          this.setState({
            activePage: activePage,
            selectedPage: defaultPage,
            status: status,
            sort: sort,
            sortBy: sortBy,
            keyword: keyword,
            size: size,
          });
          this.refreshProductList(queryStr);
        } else {
          this.props.getProviderPlaces(sessionToken, (error, result) => {
            if (!error && result) {
              if(result.places && result.places instanceof Array && result.places.length > 0 ) {
                const defaultPlace = result.places.find(item => item.isDefault);
                if(defaultPlace && defaultPlace._id) {
                  defaultPage = defaultPlace._id;
                  pageInfo = defaultPlace;
                } else {
                  defaultPage = result.places[0]._id;
                  pageInfo = result.places[0];
                }
              }
              setSession('pageInfo',JSON.stringify(pageInfo));
              let url = this.props.location.search;
              let query = queryString.parse(url);
              let activePage = query.page ? Number(query.page) : 1;
              let status = query.status ? query.status : "";
              let sortBy = query.sortBy ? query.sortBy : "created";
              let sort = query.sort ? query.sort : "desc";
              let keyword = query.keyword ? query.keyword : "";
              let size = query.size ? query.size : 25;
              let queryStr = "?" + queryString.stringify(query);
              this.setState({
                activePage: activePage,
                selectedPage: defaultPage,
                status: status,
                sort: sort,
                sortBy: sortBy,
                keyword: keyword,
                size: size,
              });
              this.refreshProductList(queryStr);
            } else {
              this.setState({ isLoading: false });
            }
          });
        }
      } else {
        this.props.getProviderPlaces(sessionToken, (error, result) => {
          if (!error && result) {
            if(result.places && result.places instanceof Array && result.places.length > 0 ) {
              const defaultPlace = result.places.find(item => item.isDefault);
              if(defaultPlace && defaultPlace._id) {
                defaultPage = defaultPlace._id;
                pageInfo = defaultPlace;
              } else {
                defaultPage = result.places[0]._id;
                pageInfo = result.places[0];
              }
            }
            setSession('pageInfo',JSON.stringify(pageInfo));
            let url = this.props.location.search;
            let query = queryString.parse(url);
            let activePage = query.page ? Number(query.page) : 1;
            let status = query.status ? query.status : "";
            let sortBy = query.sortBy ? query.sortBy : "created";
            let sort = query.sort ? query.sort : "desc";
            let keyword = query.keyword ? query.keyword : "";
            let size = query.size ? query.size : 25;
            let queryStr = "?" + queryString.stringify(query);
            this.setState({
              activePage: activePage,
              selectedPage: defaultPage,
              status: status,
              sort: sort,
              sortBy: sortBy,
              keyword: keyword,
              size: size,
            });
            this.refreshProductList(queryStr);
          } else {
            this.setState({ isLoading: false });
          }
        });
      }
    } else {
      this.props.history.push("/login");
      window.location.reload();
    }
  }

  renderRows() {
    if(this.state.isLoading) {
      return (
        <tr>
          <td colSpan="6">
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
        this.state.tours instanceof Array &&
        this.state.tours.length > 0
      ) {
        return this.state.tours.map((item, index, toursArr) => (
          <tr key={index}>
            <td>
              <Input
                style={{position: 'inherit', margin: '0'}}
                className="form-control"
                type="checkbox"
                name="product"
                value={item._id}
                onClick={this.handleCheck}
              />
            </td>
            <td width="450">{this.renderImage(item)}</td>
            <td width="150">{format(new Date(item.createdAt),'MMM dd, yyyy hh:mm a')}</td>
            <td align="right">&#8369;{(item.tourDetails && item.tourDetails.price) ? numberWithCommas(item.tourDetails.price) : "0.00"}</td>
            <td width="75" align="center">
              <Link to={"/tours/" + item._id + "/edit"} style={{paddingRight:"10px"}}>
                <Fa icon="edit" />
              </Link>
              <Link to="#" className="text-danger" onClick={this.handleDelete} data-item={item._id} style={{paddingRight:"10px"}}>
                <Fa icon="trash-alt"/>
              </Link>
              <Link to="#" onClick={this.cloneItem} data-item={item._id}>
                <Fa icon="copy"/>
              </Link>
            </td>
            <td>
              <Switch
                onClick={() => {
                  const nextStatus = !item.isActive;
                  this.toggleSwitchIsActive(item);
                  toursArr[index].isActive = nextStatus;
                  this.setState({
                    tours: toursArr
                  });
                }}
                on={item.isActive}
              />
            </td>
          </tr>
        ));
      } else {
        return (
          <tr>
            <td colSpan="67">
              <strong className="text-danger">
                <em>No tours found.</em>
              </strong>
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

    let primaryPhoto;
    if (photos[0] !== undefined || photos[0] != null) {
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
        <Media body>
          <Media>
            <Link to={"/tours/" + item._id + "/edit"}>
              {name}
            </Link>
          </Media>
        </Media>
      </Media>
    );
  }
 
  toggleSwitchIsActive(tour) {
    const userData = JSON.parse(getSession("userData"));
    const sessionToken = userData.sessionToken;
    const { _id: tourId } = tour;
    let tourNew = {
      isActive: !tour.isActive
    }
    api(sessionToken).patch(`/provider/tours/${tourId}/update-status`, tourNew)
      .then(response => {
        if (response && response.data) {
          this.showNotification('Tour updated.');
        }
      })
      .catch(error => {
        this.setState({ submitted: false, isSaving: false });
        if(error.response && typeof error.response === 'string' ) {
          this.showNotificationError(error.response);
        } else {
          this.showNotificationError('There is a error updating the tour!');
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

  handleChangeKeyword = (e) => {
    let { value } = e.target;
    this.setState({keyword: value});
  }

  handleEnter = (e) => {
    let { key } = e;
    if (key === 'Enter') {
      this.setState({isLoading:true});
      let { keyword } = this.state;
      let url = this.props.location.search;
      let query = queryString.parse(url);
      delete query.message;
      delete query.page;
      if (keyword !== "") {
        query.keyword = keyword;
      } else {
        delete query.keyword;
      }
      let queryStr = "?" + queryString.stringify(query);
      this.refreshProductList(queryStr);
    }
  }

  handleDelete = (e) => {
    if (!window.confirm("Do you want to delete this tour?")){
      return false;
    }
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    const message = "Tour has been deleted!";
    let queryStr = "?" + queryString.stringify(query);
    const placeId = e.currentTarget.dataset.item;
    if(placeId) {
      const userData = JSON.parse(getSession("userData"));
      if(userData) {
        const sessionToken = userData.sessionToken;
        api(sessionToken).delete(`/business/places?_id=${placeId}`)
          .then(response => {
            if (response && response.data) {
              if(response.data && response.data.status === "Deleted") {
                this.showNotification(message);
                this.refreshProductList(queryStr);
              }
            }
          })
          .catch(error => {
            if (error) {
              if(error.response && error.response.status && error.response.status === 403) {
                setTimeout(() => { 
                  this.setState({isLoading:true});
                  let url = this.props.location.search;
                  let query = queryString.parse(url);
                  delete query.message;
                  delete query.page;
                  let queryStr = "?" + queryString.stringify(query);
                  this.setState({ activePage: 1 });
                  this.refreshProductList(queryStr);
                }, 1000);
                this.showNotificationError('You are not allowed to delete this tour.');
              } else {
                this.showNotificationError(error.response);
              }
            }
          });
      } else {
        this.props.history.push("/login");
        window.location.reload();
      }
    }
  }

  cloneItem = (e) => {
    if (!window.confirm("Do you want to clone this tour?")){
      return false;
    }
    const tourId = e.currentTarget.dataset.item;
    if(tourId) {
      const userData = JSON.parse(getSession("userData"));
      if (userData !== null) {
        const sessionToken = userData.sessionToken;
        api(sessionToken).get(`/provider/tours/${tourId}`)
          .then(response => {
            if(response && response.data) {
              const { page:tour } = response.data;
              const tourData = {
                name: tour.name ? tour.name : "",
                isSuperGuide: tour.tourDetails.isSuperGuide ? tour.tourDetails.isSuperGuide : true,
                about: tour.about ? tour.about : "",
                pageType: tour.pageType ? tour.pageType : "5dea2304f6bba08323a3ddce",
                photos: tour.photos ? tour.photos : [],
                price: tour.tourDetails.price ? tour.tourDetails.price : 0,
                comparePrice: tour.tourDetails.comparePrice ? tour.tourDetails.comparePrice : 0,
                numberOfPax: tour.tourDetails.numberOfPax ? tour.tourDetails.numberOfPax : 0,
                numberOfGroups: tour.tourDetails.numberOfGroups ? tour.tourDetails.numberOfGroups : 0,
                minNumber: tour.tourDetails.minNumber ? tour.tourDetails.minNumber : 0,
                maxNumber: tour.tourDetails.maxNumber ? tour.tourDetails.maxNumber : 0,
                highlights: tour.tourDetails.activities ? tour.tourDetails.activities : [],
                sections: tour.tourDetails.sections ? tour.tourDetails.sections : [],
                addons: tour.tourDetails.addons ? tour.tourDetails.addons : []
              }
              api(sessionToken).post(`/provider/tours`, tourData)
                .then(response => {
                  if (response && response.data && response.data.place) {
                    setTimeout(() => {
                      const { _id:tourId } = response.data.place;
                      this.props.history.push(`/tours/${tourId}/edit?message=A tour has been cloned!`);
                    }, 1000);
                  }
                })
                .catch(error => {
                  if(error.response && typeof error.response === 'string' ) {
                    this.showNotificationError(error.response);
                  } else {
                    this.showNotificationError('There is an error cloning the tour!');
                  }
                });
            } else {
              this.showNotificationError('There is an error cloning the tour!');
            }
          })
          .catch(error => {
            this.showNotificationError('There is an error cloning the tour!');
          })
      } else {
        this.props.history.push("/login");
        window.location.reload();
      }
    }
  }

  handleChangeProductStatus = (e) => {
    this.setState({isLoading:true});
    let { value } = e.target;
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    delete query.page;
    if (value !== "") {
      query.status = value;
    } else {
      delete query.status;
    }
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ status: value, activePage: 1 });
    this.refreshProductList(queryStr);
  }

  handlePageChange = (pageNumber) => {
    this.setState({isLoading:true});
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    query.page = pageNumber;
    let queryStr = "?" + queryString.stringify(query);
    this.setState({ activePage: pageNumber });
    this.refreshProductList(queryStr);
  }

  handleChangePerPage = (e) => {
    this.setState({isLoading:true});
    let { value } = e.target;
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    delete query.page;
    if (value !== "") {
      query.size = value;
    } else {
      delete query.size;
    }
    let queryStr = "?" + queryString.stringify(query);
    this.setState({ size: value, activePage: 1 });
    this.refreshProductList(queryStr);
  }

  handleCheckAll = (e) => {
    let { checked: isChecked } = e.target;
    const checkboxes = document.querySelectorAll('input[name="product"]');
    const checkboxesArr = Array.from(checkboxes);
    if(isChecked) {
      const checked = checkboxesArr.map(item => item.value );
      this.setState({checked:checked});
    } else {
      this.setState({checked:[]});
    }
    checkboxes.forEach(checkbox => {
      if (isChecked) {
        checkbox.checked = true;
      } else {
        checkbox.checked = false;
      }
    });
  }

  handleCheck = (e) => {
    let { value, checked: isChecked } = e.target;
    if(isChecked) {
      this.setState({checked: [...this.state.checked, value]});
    } else {
      const checked = this.state.checked.filter((item) => value !== item);
      this.setState({checked:checked});
    }
  }

  handleDeleteChecked = () => {
    let items = 0;
    let deletedItems = 0;
    let hasError = false;
    const checked = this.state.checked;
    if(checked instanceof Array && checked.length > 0) {
      if (!window.confirm("Are you sure you want to delete this tour(s)?")){
        return false;
      }
      this.setState({isProcessing:true});
      let url = this.props.location.search;
      let query = queryString.parse(url);
      if(query.message) {
        delete query.message;
      }
      checked.forEach((tourId, index, array) => {
        const userData = JSON.parse(getSession("userData"));
        const sessionToken = userData.sessionToken;
        let tour = this.state.tours.find(item => item._id === tourId );
        tour.isActive = true;
        if (tour) {
          this.props.deleteProduct(
            tourId,
            sessionToken,
            (error, result) => {
              if(result.status==="Deleted") {
                deletedItems++;
              } else {
                if (error) {
                  hasError = true;
                }
              }
              items++;
              if(items === array.length) {
                this.setState({isProcessing:false});
                const checkAll = document.getElementById('check-all');
                checkAll.checked = false;
                const checkboxes = document.querySelectorAll('input[name="product"]');
                checkboxes.forEach(checkbox => {
                  checkbox.checked = false;
                });
                if(deletedItems > 0) {
                  const message = deletedItems + " tours(s) has been deleted.";
                  this.showNotification(message);
                  let queryStr = "?" + queryString.stringify(query);
                  this.refreshProductList(queryStr);
                } else {
                  if(hasError) {
                    this.showNotificationError('There is a error in deleting the tour(s)!');
                  }
                }
              }
            }
          );
        }
      });
    } else {
      this.showNotificationError('Please select a tour!');
    }
  }

  handlePublishChecked = () => {
    const checked = this.state.checked;
    let items = 0;
    let updatedItems = 0;
    let hasError = false;
    if(checked instanceof Array && checked.length > 0) {
      if (!window.confirm("Are you sure you want to publish this tour(s)?")){
        return false;
      }
      this.setState({isProcessing:true});
      checked.forEach((tourId, index, array) => {
        const userData = JSON.parse(getSession("userData"));
        const sessionToken = userData.sessionToken;
        let tour = this.state.tours.find(item => item._id === tourId );
        tour.isActive = true;
        if (tour) {
          this.props.updateProduct(
            tour,
            tourId,
            sessionToken,
            (error, result) => {
              if (result) {
                this.setState(prevState => {
                  const list = prevState.tours.map((item) => checkedItems(item,prevState.tours));
                  return {
                    list,
                  };
                });
                updatedItems++;
              } else {
                if (error) {
                  hasError = true;
                }
              }
              items++;
              if(items === array.length) {
                this.setState({isProcessing:false});
                if(updatedItems > 0) {
                  this.showNotification(updatedItems + ' tour(s) has been published!');
                }
                if(hasError) {
                  this.showNotificationError('There is a error in updating the tour(s)!');
                }
              }
            }
          );
        }
      });
    } else {
      this.showNotificationError('Please select a tour!');
      return false;
    }
  }

  handleUnpublishChecked = () => {
    const checked = this.state.checked;
    let items = 0;
    let updatedItems = 0;
    let hasError = false;
    if(checked instanceof Array && checked.length > 0) {
      if (!window.confirm("Are you sure you want to unpublish this tour(s)?")){
        return false;
      }
      this.setState({isProcessing:true});
      checked.forEach((tourId, index, array) => {
        const userData = JSON.parse(getSession("userData"));
        const sessionToken = userData.sessionToken;
        let tour = this.state.tours.find(item => item._id === tourId );
        tour.isActive = false;
        if (tour) {
          this.props.updateProduct(
            tour,
            tourId,
            sessionToken,
            (error, result) => {
              if (result) {
                this.setState(prevState => {
                  const list = prevState.tours.map(item => checkedItems(item,prevState.tours));
                  return {
                    list,
                  };
                });
                updatedItems++;
              } else {
                if (error) {
                  hasError = true;
                }
              }
              items++;
              if(items === array.length) {
                this.setState({isProcessing:false});
                if(updatedItems > 0) {
                  this.showNotification(updatedItems + ' tour(s) has been unpublished!');
                }
                if(hasError) {
                  this.showNotificationError('There is a error in updating the tour(s)!');
                }
              }
            }
          );
        }
      });
    } else {
      this.showNotificationError('Please select a tour!');
      return false;
    }
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
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    query.sort = sort;
    query.sortBy = sortBy;
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ sort: sort });
    this.setState({ sortBy: sortBy });
    this.refreshProductList(queryStr);
  }

  sortPrice = () => {
    let sort = "";
    if (this.state.sortBy === "price") {
      if (this.state.sort !== "desc") {
        sort = "desc";
      } else {
        sort = "asc";
      }
    } else {
      sort = "desc";
    }
    let sortBy = "price";
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    query.sort = sort;
    query.sortBy = sortBy;
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ sort: sort });
    this.setState({ sortBy: sortBy });
    this.refreshProductList(queryStr);
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
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    query.sort = sort;
    query.sortBy = sortBy;
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ sort: sort });
    this.setState({ sortBy: sortBy });
    this.refreshProductList(queryStr);
  }

  refreshProductList(queryStr) {
    const query = queryString.parse(queryStr);
    const message = query.message
    const checkAll = document.getElementById('check-all');
    checkAll.checked = false;
    const checkboxes = document.querySelectorAll('input[name="product"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    if(message) {
      delete query.message;
      this.showNotification(message);
    }

    this.props.history.push("/tours" + queryStr);
    const userData = JSON.parse(getSession("userData"));
    const { sessionToken } = userData;

    if (userData != null) {
      api(sessionToken).get('/provider/tours', { params: query })
      .then(response => {
        if(response && response.data) {
            const { tours, pagination } = response.data;
            this.setState({
              tours,
              pagination
            });
          this.setState({isLoading:false});
        } else {
          this.setState({isLoading:false});
        }
      })
      .catch(error => {
        this.setState({isLoading:false});
      })
    } else {
      this.setState({isLoading:false});
    }
  }

  render() {
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
                  <h3 className="title">Tours List</h3>
                  <Row>
                    <Col md="6">
                      <Row>
                        <Col md="6">
                          <FormGroup>
                            <Input
                              id="keyword"
                              name="keyword"
                              type="text"
                              placeholder="Search..."
                              onChange={this.handleChangeKeyword}
                              onKeyPress={this.handleEnter}
                              value={this.state.keyword}
                            >
                            </Input>
                          </FormGroup>
                        </Col>
                      </Row>
                    </Col>
                    <Col md="6">
                      <Row>
                        <Col className="offset-md-6" md="6">
                          <FormGroup>
                            <Input
                              id="productStatus"
                              name="productStatus"
                              type="select"
                              onChange={this.handleChangeProductStatus}
                              value={this.state.status}
                            >
                              <option value="">Filter by status</option>
                              <option value="active">Active</option>
                              <option value="inActive">Inactive</option>
                            </Input>
                          </FormGroup>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                  <Row>
                    <Col className="pull-right" md="12">
                      <Button
                        alt="Unpublish"
                        title="Unpublish"
                        className="btn btn-sm btn-round btn-info pull-right"
                        onClick={this.handleUnpublishChecked}
                      >
                        <Fa icon="eye-slash" />&nbsp;Unpublish
                      </Button>
                      <Button
                        alt="Publish"
                        title="Publish"
                        className="btn btn-sm btn-round btn-info pull-right"
                        onClick={this.handlePublishChecked}
                      >
                        <Fa icon="eye" />&nbsp;Publish
                      </Button>
                      <Button
                        alt="Delete"
                        title="Delete"
                        className="btn btn-sm btn-round btn-info pull-right"
                        onClick={this.handleDeleteChecked}
                      >
                        <Fa icon="archive" />&nbsp;Delete
                      </Button>
                      <Link
                        to="/tours/new"
                        alt="Add New Product"
                        title="Add New Product"
                        className="btn btn-sm btn-round btn-info pull-right"
                      >
                        <Fa icon="plus" />&nbsp;Add New
                      </Link>
                    </Col>
                  </Row>
                </CardHeader>
                <CardBody>
                  <Table className="tablesorter table-striped" responsive>
                    <thead className="text-primary">
                      <tr>
                        <th>
                          <Input
                            style={{position: 'inherit', margin: '0'}}
                            type="checkbox"
                            id="check-all"
                            onClick={this.handleCheckAll}
                          />
                        </th>
                        <th style={{whiteSpace:"nowrap"}} onClick={this.sortName}>
                          Tour{" "}
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
                        <th style={{whiteSpace:"nowrap"}} onClick={this.sortCreated}>
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
                        <th style={{whiteSpace:"nowrap"}} className="text-right" onClick={this.sortPrice}>
                          <span style={{ display: "block" }}>
                            Price{" "}
                            {this.state.sortBy === "price" &&
                              this.state.sort === "desc" && (
                                <Fa icon="arrow-down" className="text-info" />
                              )}{" "}
                            {this.state.sortBy === "price" &&
                              this.state.sort === "asc" && (
                                <Fa icon="arrow-up" className="text-info" />
                              )}{" "}
                            {this.state.sortBy !== "price" && (
                              <Fa icon="arrow-down" className="text-disabled" />
                            )}{" "}
                          </span>
                        </th>
                        <th>&nbsp;</th>
                        <th style={{whiteSpace:"nowrap"}}>Publish</th>
                      </tr>
                    </thead>
                    <tbody>{this.renderRows(this.state.tours)}</tbody>
                  </Table>
                </CardBody>
                <CardFooter>
                  <Row>
                    <Col md="12">
                      <Row className="pull-right">
                        <Col md="4" lg="4">
                          {this.state.pagination && this.state.pagination.total > 0 && (
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
                          )}
                        </Col>
                        <Col md="8" lg="8">
                          {this.state.pagination &&
                            this.state.pagination.total > 0 && (
                              <>
                                <Pagination
                                  innerClass="pagination"
                                  activePage={this.state.activePage}
                                  itemsCountPerPage={this.state.pagination.limit}
                                  totalItemsCount={this.state.pagination.total}
                                  pageRangeDisplayed={3}
                                  onChange={this.handlePageChange}
                                />
                                <p>Page <em>{this.state.activePage}</em> of <em>{Math.ceil(this.state.pagination.total/this.state.pagination.limit)}</em> of <em>{this.state.pagination.total}</em> tours.</p>
                              </>
                            )}
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </CardFooter>
              </Card>
            </Col>
          </Row>
        </div>
        <LoadingOverlay
          active={this.state.isProcessing}
          spinner
          text='Processing...'
          >
        </LoadingOverlay>
      </>
    );
  }
}

const numberWithCommas = x => {
  return priceRound(x).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const checkedItems = (item,tour) => {
  if (item._id === tour._id) {
    return item = tour;
  }
}

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
    getProductsByPageId,
    getProductsGroceryByPageId,
    getProductsByProviderId,
    getProviderPlaces,
    getProductCategoriesAll,
    getProductCategoriesAllV2,
    updateProduct,
    deleteProduct
  }
)(Tours);
