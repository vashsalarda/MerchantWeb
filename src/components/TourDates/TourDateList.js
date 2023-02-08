import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { getSession } from "../../config/session";
import api from "../../config/api";
import { 
  getProductCategories,
  getProductCategoriesV2,
  getProductCategoriesAll,
  getProductCategoriesAllV2,
  deleteProductCategory
} from "../../layouts/Admin/actions/ProductCategoryActions";
import { getPageById } from "../../layouts/Admin/actions/PageActions";
import { format } from 'date-fns'
import queryString from "query-string";
import { FontAwesomeIcon as Fa } from "@fortawesome/react-fontawesome";
import Pagination from "react-js-pagination";
import { PulseLoader } from 'react-spinners';
import NotificationAlert from "react-notification-alert";
import DatePicker from "react-datepicker";
import Switch from "react-toggle-switch";

import imageComming from "assets/img/product-image-default.png";

import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  CardFooter,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  Table,
  Row,
  Col,
  FormGroup,
  Input,
} from "reactstrap";

class TourDates extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tourDate: {
        type: "",
        status: "",
        place: "",
        placeName: "",
        price: "",
        promotionalText: "",
        isActive: false,
        dateStart: new Date(),
        dateEnd: new Date()
      },
      tourDates: [],
      tour: "",
      tours: [],
      tourDateId: "",
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
      isLoading: true,
      addTourDateModalOpen: false,
      submittedTourDate: false,
      addingTourDate: false,
      editTourDateModalOpen: false,
      submittedTourDateEdit: false,
      edingTourDate: false,
      today: new Date(),
      dateStart: new Date(),
      dateEnd: new Date()
    };
  }

  componentDidMount() {
    const userData = JSON.parse(getSession("userData"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    let activePage = query.page ? Number(query.page) : 1;
    let tour = query.tour ? query.tour : "";
    let sortBy = query.sortBy ? query.sortBy : "created";
    let sort = query.sort ? query.sort : "desc";
    let message = query.message ? query.message : "";
    let keyword = query.keyword;
    let queryStr = "?" + queryString.stringify(query);
    if (userData !== null) {
      const sessionToken = userData.sessionToken;
      this.setState({
        tourDate: {
          type: "",
          status: "",
          place: "",
          placeName: "",
          price: "",
          promotionalText: "",
          isActive: false,
          dateStart: new Date(),
          dateEnd: new Date()
        },
        tour,
        activePage: activePage,
        sort: sort,
        sortBy: sortBy,
        keyword: keyword,
        message: message,
      });
      this.refreshTourDates(queryStr);
      api(sessionToken).get('/provider/tours')
        .then(response => {
          if(response && response.data) {
              const { tours } = response.data;
              this.setState({
                tours
              });
            this.setState({isLoading:false});
          } else {
            this.setState({isLoading:false});
          }
        })
        .catch(error => {
          this.setState({isLoading:false});
        })
    }
  }

  renderRows() {
    if(this.state.isLoading) {
      return (
        <tr>
          <td colSpan="8">
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
        this.state.tourDates instanceof Array &&
        this.state.tourDates.length > 0
      ) {
        return this.state.tourDates.map((item , index, tourDatesArr) => (
          <tr key={item._id}>
            <td>{format(new Date(item.dateStart),'MMM dd, yyyy')} - {format(new Date(item.dateEnd),'MMM dd, yyyy')}</td>
            <td>&#8369;{numberWithCommas(item.price)}</td>
            <td>{item.place && item.place.name}</td>
            <td>
              <Switch
                onClick={() => {
                  const nextStatus = !item.isActive;
                  this.toggleSwitchIsActive(item);
                  tourDatesArr[index].isActive = nextStatus;
                  this.setState({
                    tourDates: tourDatesArr
                  });
                }}
                on={item.isActive}
              />
            </td>
            <td width="75" align="center">
              <Link to="#" style={{paddingRight:"10px"}} onClick={this.editTourDate} data-id={item._id}>
                <Fa icon="edit" />
              </Link>
              <Link to="#" className="text-danger" onClick={this.handleDelete} data-item={item._id}>
                <Fa icon="trash-alt"/>
              </Link>
            </td>
          </tr>
        ));
      } else {
        return (
          <tr>
            <td colSpan="5">
              <strong className="text-danger">
                <em>No dates found</em>
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

    let imgSrc = imageComming;
    if(photos instanceof Array && photos.length > 0) {
      imgSrc = photos[0].thumb;
    }
    return (
      <img
        className="thumb"
        src={imgSrc}
        alt={name}
        title={name}
      />
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
      this.refreshTourDates(queryStr);
    }
  }

  handleChangeTourDate = (e) => {
    let { name, value } = e.target;
    this.setState({
      tourDate: {
        ...this.state.tourDate,
        [name]: value
      }
    });
  }

  handleChangeStartDate = (date) => {
    this.setState({dateStart: date});
    this.setState({
      tourDate: {
        ...this.state.tourDate,
        dateStart: date
      }
    });
  }

  handleChangeEndDate = (date) => {
    this.setState({dateEnd: date});
    this.setState({
      tourDate: {
        ...this.state.tourDate,
        dateEnd: date
      }
    });
  }

  handleDelete = (e) => {
    if (!window.confirm("Do you want to delete this item?")){
      return false;
    }
    let url = this.props.location.search;
    let query = queryString.parse(url);
    if(query.message) {
      delete query.message;
    }
    let queryStr = "?" + queryString.stringify(query);
    const tourDateId = e.currentTarget.dataset.item;
    if(tourDateId) {
      const userData = JSON.parse(getSession("userData"));
      if(userData) {
        const sessionToken = userData.sessionToken;
        api(sessionToken).delete(`/provider/tour-dates/${tourDateId}`)
          .then(response => {
            if (response && response.data) {
              if(response.data && response.data.status === 'deleted') {
                this.showNotification('Item has been deleted successfully!');
                this.refreshTourDates(queryStr);
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
                  this.refreshTourDates(queryStr);
                }, 1000);
                this.showNotificationError('You are not allowed to delete this tour date.');
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

  handleChangeTour = (e) => {
    this.setState({ isLoading: true });
    let { value } = e.target;
    let url = this.props.location.search;
    let query = queryString.parse(url);
    if(query.message) {
      delete query.message;
    }

    if (value !== "") {
      query.tour = value;
    } else {
      delete query.tour;
    }
    let queryStr = "?" + queryString.stringify(query);
    this.setState({ tour: value, activePage: 1 });
    this.refreshTourDates(queryStr);
  }

  handlePageChange = (pageNumber) => {
    this.setState({ isLoading: true });
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    query.page = pageNumber;
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ activePage: pageNumber });
    this.refreshTourDates(queryStr);
  }

  handleChangePerPage = (e) => {
    this.setState({isLoading:true});
    let { value } = e.target;
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
    this.refreshTourDates(queryStr);
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
    query.sortBy = sortBy
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ sort: sort });
    this.setState({ sortBy: sortBy });
    this.refreshTourDates(queryStr);
  }

  toggleSwitchIsActive(tourDate) {
    const userData = JSON.parse(getSession("userData"));
    const sessionToken = userData.sessionToken;
    const { _id: tourDateId } = tourDate;
    let tourDateNew = {
      isActive: !tourDate.isActive
    }
    api(sessionToken).patch(`/provider/tour-dates/${tourDateId}/update-status`, tourDateNew)
      .then(response => {
        if (response && response.data) {
          this.showNotification('Tour Date updated.');
        }
      })
      .catch(error => {
        this.setState({ submitted: false, isSaving: false });
        if(error.response && typeof error.response === 'string' ) {
          this.showNotificationError(error.response);
        } else {
          this.showNotificationError('There is a error updating the Tour Date!');
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

  refreshTourDates(queryStr) {
    const query = queryString.parse(queryStr);
    const message = query.message
    if(message) {
      delete query.message;
      this.showNotification(message);
    }
    
    this.props.history.push("/tour-dates" + queryStr);
    const userData = JSON.parse(getSession("userData"));
    const { sessionToken } = userData;

    if (userData !== null) {
      if(userData && userData.isSBTours) {
        api(sessionToken).get('/provider/tour-dates', { params: query })
          .then(response => {
            if(response && response.data) {
              const { tourDates, pagination } = response.data;
              this.setState({
                tourDates,
                pagination
              });
              this.setState({isLoading:false});
            } else {
              this.setState({isLoading:false});
            }
          })
          .catch(error => {
            console.error({error});
            this.setState({isLoading:false});
          })
      }
    }
  } 

  renderTours() {
    if (this.state.tours !== undefined || this.state.tours !== null) {
      const tours = this.state.tours;
      return tours.map((item, index) => (
        <option key={index} value={item._id}>
          {item.name}
        </option>
      ));
    }
  }

  renderAddTourDateModal() {
    return (
      <Modal className="modal-lg" isOpen={this.state.addTourDateModalOpen} toggle={this.addTourDateModalOpen} backdrop="static">
        <div className="modal-header">
          <Col sm="12"><h4 className="modal-title">Add Tour Date</h4></Col>
          <button type="button" className="close" onClick={this.toggleAddTourDateModal} aria-label="Close" style={{color:"rgba(0, 0, 0, 0.6)"}}><span aria-hidden="true">×</span></button>
        </div>
        <ModalBody>
          <form action="">
            <Col sm="12">
              <Row>
                <Col sm="6">
                  <FormGroup className={ this.state.submitted && !this.state.tourDate.dateStart ? " has-danger" : "" }>
                    <label htmlFor="dateStart" className="control-label" style={{display:'block'}}>Start Date:</label>
                    <DatePicker
                      id="add-dateStart"
                      name="startDate"
                      className="form-control"
                      autoComplete="off"
                      selectsStart
                      startDate={this.state.dateStart}
                      endDate={this.state.dateEnd}
                      minDate={this.state.today}
                      selected={this.state.dateStart}
                      onChange={this.handleChangeStartDate}
                    />
                  </FormGroup>
                </Col>
                <Col sm="6">
                  <FormGroup className={ this.state.submitted && !this.state.tourDate.dateEnd ? " has-danger" : "" }>
                    <label htmlFor="add-dateEnd" className="control-label" style={{display:'block'}}>End Date:</label>
                    <DatePicker
                      id="add-dateEnd"
                      name="startDate"
                      className="form-control"
                      autoComplete="off"
                      selectsStart
                      startDate={this.state.dateStart}
                      endDate={this.state.dateEnd}
                      minDate={this.state.dateStart}
                      selected={this.state.dateEnd}
                      onChange={this.handleChangeEndDate}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup className={ this.state.submittedTourDate && !this.state.tourDate.price ? " has-danger" : "" }>
                    <label htmlFor="add-price" className="control-label">Price <em className="text-muted">(Required)</em></label>
                    <Input
                      id="add-price"
                      name="price"
                      placeholder="&#8369;"
                      type="text"
                      defaultValue={this.state.tourDate.price}
                      onChange={this.handleChangeTourDate}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup className={ this.state.submittedTourDate && !this.state.tourDate.place ? " has-danger" : "" }>
                    <label htmlFor="add-tour" className="control-label">Tour <em className="text-muted">(Required)</em></label>
                    <Input
                      id="add-tour"
                      name="place"
                      placeholder="Select tour"
                      type="select"
                      onChange={this.handleChangeTourDate}
                      value={this.state.tourDate.place}
                    >
                      <option value="">-Select-</option>
                      {this.renderTours()}
                    </Input>
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup>
                    <label htmlFor="tour-date-type" className="control-label">Type</label>
                    <Input
                      id="add-type"
                      name="type"
                      type="select"
                      onChange={this.handleChangeTourDate}
                      value={this.state.tourDate.type}
                    >
                      <option value="solo">Solo</option>
                      <option value="joiner">Joiner</option>
                      <option value="couple">Couple</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col sm="12" md="6" lg="6">
                  <FormGroup>
                    <Label>
                      <Switch
                        onClick={() => {
                          this.setState({
                            tourDate: {
                              ...this.state.tourDate,
                              isActive: !this.state.tourDate.isActive
                            }
                          });
                        }}
                        on={this.state.tourDate.isActive}
                      />
                      Is Active
                    </Label>
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup>
                    <label htmlFor="add-promotionalText" className="control-label">Promotional Text</label>
                    <Input
                      id="add-promotionalText"
                      name="promotionalText"
                      placeholder="Promotional Text"
                      type="textarea"
                      defaultValue={this.state.tourDate.promotionalText}
                      onChange={this.handleChangeTourDate}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </Col>
          </form>
        </ModalBody>
        <ModalFooter>
          <Col sm="12">
            <Button color="info" onClick={this.handleAddTourDate}>Add</Button>{' '}
              {this.state.addingTourDate && (
                <img
                  alt="loading"
                  src="data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA=="
                />
              )}
            <Button color="secondary" onClick={this.toggleAddTourDateModal}>Cancel</Button>
          </Col>
        </ModalFooter>
      </Modal>
    );
  }

  toggleAddTourDateModal = () => {
    this.setState(prevState => ({
      addTourDateModalOpen: !prevState.addTourDateModalOpen,
      tourDate: {
        type: "",
        status: "",
        place: "",
        placeName: "",
        price: "",
        promotionalText: "",
        isActive: false,
        dateStart: new Date(),
        dateEnd: new Date()
      },
      dateStart: new Date(),
      dateEnd: new Date()
    }));
  }

  handleAddTourDate = (e) => {
    e.preventDefault();
    this.setState({ addingTourDate: true, submittedTourDate: true });
    let { tourDate } = this.state;
    delete tourDate.placeName;
    if(tourDate && tourDate.dateStart && tourDate.dateEnd && tourDate.price && tourDate.place) {
      const userData = JSON.parse(getSession("userData"));
      const sessionToken = userData.sessionToken;
      if (!window.confirm("Do you want to save this item?")){
        return false;
      }
      this.setState({ submitted: true, isSaving: true });
      api(sessionToken).post(`/provider/tour-dates`, tourDate)
        .then(response => {
          if (response && response.data) {
            let url = this.props.location.search;
            let query = queryString.parse(url);
            let activePage = query.page ? Number(query.page) : 1;
            let tour = query.tour ? query.tour : "";
            let sortBy = query.sortBy ? query.sortBy : "created";
            let sort = query.sort ? query.sort : "desc";
            let keyword = query.keyword;
            let queryStr = "?" + queryString.stringify(query);

            if(query.message) {
              delete query.message;
            }
          
            this.setState({
              activePage: activePage,
              tour: tour,
              sort: sort,
              sortBy: sortBy,
              keyword: keyword,
            });

            this.refreshTourDates(queryStr);
            this.setState({ addingTourDate: false, submittedAddon: false });
            this.toggleAddTourDateModal();
            this.showNotification('Tour date has been added!');
          }
        })
        .catch(error => {
          this.setState({ addingTourDate: false, submittedAddon: false });
          if(error.response && typeof error.response === 'string' ) {
            this.showNotificationError(error.response);
          } else {
            this.showNotificationError('There is a error saving the tour date!');
          }
        });
    } else {
      this.setState({ addingTourDate: false });
      this.showNotificationError('Some fields are required!');
    }
  }

  handleEditTourDate = (e) => {
    e.preventDefault();
    let { tourDateId, tourDate } = this.state;
    delete tourDate.placeName;
    if(tourDate && tourDate.dateStart && tourDate.dateEnd && tourDate.price && tourDate.place) {
      const userData = JSON.parse(getSession("userData"));
      const sessionToken = userData.sessionToken;
      if (!window.confirm("Do you want to save the changes to this item?")) {
        return false;
      } else {
        this.setState({ editingTourDate: true, submittedTourDateEdit: true });
      }
      api(sessionToken).patch(`/provider/tour-dates/${tourDateId}`, tourDate)
        .then(response => {
          if (response && response.data) {
            let url = this.props.location.search;
            let query = queryString.parse(url);
            let activePage = query.page ? Number(query.page) : 1;
            let tour = query.tour ? query.tour : "";
            let sortBy = query.sortBy ? query.sortBy : "created";
            let sort = query.sort ? query.sort : "desc";
            let keyword = query.keyword;
            let queryStr = "?" + queryString.stringify(query);

            if(query.message) {
              delete query.message;
            }
            this.setState(prevState => ({
              editTourDateModalOpen: !prevState.editTourDateModalOpen,
              submittedTourDateEdit: false,
              editingTourDate: false, 
              activePage: activePage,
              tour: tour,
              sort: sort,
              sortBy: sortBy,
              keyword: keyword,
            }));
            this.refreshTourDates(queryStr);
            this.showNotification('Tour date has been added!');
          }
        })
        .catch(error => {
          this.setState({ editingTourDate: false, submittedTourDateEdit: false });
          if(error.response && typeof error.response === 'string' ) {
            this.showNotificationError(error.response);
          } else {
            this.showNotificationError('There is a error saving the tour date!');
          }
        });
    } else {
      this.setState({ editingTourDate: false });
      this.showNotificationError('Some fields are required!');
    }
  }

  editTourDate = (e) => {
    const userData = JSON.parse(getSession("userData"));
    const tourDateId = e.currentTarget.dataset.id;
    if (userData !== null) {
      const sessionToken = userData.sessionToken;
      api(sessionToken).get(`/provider/tour-dates/${tourDateId}`)
        .then(response => {
          if(response && response.data) {
            const { tourDate } = response.data;
            if(tourDate) {
              this.setState(prevState => ({ 
                submittedHighlightEdit: false,
                editTourDateModalOpen: !prevState.editTourDateModalOpen,
                tourDateId: tourDate._id,
                tourDate: {
                  type: tourDate.type ? tourDate.type : "",
                  status: tourDate.status ? tourDate.status : "",
                  place: tourDate.place._id ? tourDate.place._id : "",
                  placeName: tourDate.place.name ? tourDate.place.name : "",
                  price: tourDate.price ? tourDate.price : "",
                  promotionalText: tourDate.promotionalText ? tourDate.promotionalText : "",
                  isActive: tourDate.isActive ? tourDate.isActive : false,
                  dateStart: tourDate.dateStart ? new Date(tourDate.dateStart) : new Date(),
                  dateEnd: tourDate.dateEnd ? new Date(tourDate.dateEnd) : new Date()
                },
                dateStart: new Date(),
                dateEnd: new Date()
              }));
            }
          }
        })
        .catch(error => {
          console.error({error});
        })
    } else {
      this.props.history.push("/login");
      window.location.reload();
    }
    
  }

  renderEditTourDateModal() {
    return (
      <Modal className="modal-lg" isOpen={this.state.editTourDateModalOpen} toggle={this.editTourDateModalOpen} backdrop="static">
        <div className="modal-header">
          <Col sm="12">
            <h4 className="modal-title">Edit Tour Date - <em className="text-info">{this.state.tourDate.placeName} - {format(new Date(this.state.tourDate.dateStart),'MMM dd, yyyy')} to {format(new Date(this.state.tourDate.dateEnd),'MMM dd, yyyy')}</em></h4>
          </Col>
          <button type="button" className="close" onClick={this.toggleEditTourDateModal} aria-label="Close" style={{color:"rgba(0, 0, 0, 0.6)"}}><span aria-hidden="true">×</span></button>
        </div>
        <ModalBody>
          <form action="">
            <Col sm="12">
              <Row>
                <Col sm="6">
                  <FormGroup className={ this.state.submitted && !this.state.tourDate.dateStart ? " has-danger" : "" }>
                    <label htmlFor="dateStart" className="control-label" style={{display:'block'}}>Start Date:</label>
                    <DatePicker
                      id="add-dateStart"
                      name="startDate"
                      className="form-control"
                      autoComplete="off"
                      selectsStart
                      startDate={this.state.tourDate.dateStart}
                      endDate={this.state.dateEnd}
                      minDate={this.state.today}
                      selected={this.state.tourDate.dateStart}
                      onChange={this.handleChangeStartDate}
                    />
                  </FormGroup>
                </Col>
                <Col sm="6">
                  <FormGroup className={ this.state.submitted && !this.state.tourDate.dateEnd ? " has-danger" : "" }>
                    <label htmlFor="add-dateEnd" className="control-label" style={{display:'block'}}>End Date:</label>
                    <DatePicker
                      id="add-dateEnd"
                      name="startDate"
                      className="form-control"
                      autoComplete="off"
                      selectsStart
                      startDate={this.state.tourDate.dateStart}
                      endDate={this.state.dateEnd}
                      minDate={this.state.dateStart}
                      selected={this.state.tourDate.dateEnd}
                      onChange={this.handleChangeEndDate}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup className={ this.state.submittedTourDate && !this.state.tourDate.price ? " has-danger" : "" }>
                    <label htmlFor="add-price" className="control-label">Price <em className="text-muted">(Required)</em></label>
                    <Input
                      id="add-price"
                      name="price"
                      placeholder="&#8369;"
                      type="text"
                      defaultValue={this.state.tourDate.price}
                      onChange={this.handleChangeTourDate}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup className={ this.state.submittedTourDate && !this.state.tourDate.place ? " has-danger" : "" }>
                    <label htmlFor="add-tour" className="control-label">Tour <em className="text-muted">(Required)</em></label>
                    <Input
                      id="add-tour"
                      name="place"
                      placeholder="Select tour"
                      type="select"
                      onChange={this.handleChangeTourDate}
                      value={this.state.tourDate.place}
                    >
                      <option value="">-Select-</option>
                      {this.renderTours()}
                    </Input>
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup>
                    <label htmlFor="tour-date-type" className="control-label">Type</label>
                    <Input
                      id="add-type"
                      name="type"
                      type="select"
                      onChange={this.handleChangeTourDate}
                      value={this.state.tourDate.type}
                    >
                      <option value="solo">Solo</option>
                      <option value="joiner">Joiner</option>
                      <option value="couple">Couple</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col sm="12" md="6" lg="6">
                  <FormGroup>
                    <Label>
                      <Switch
                        onClick={() => {
                          this.setState({
                            tourDate: {
                              ...this.state.tourDate,
                              isActive: !this.state.tourDate.isActive
                            }
                          });
                        }}
                        on={this.state.tourDate.isActive}
                      />
                      Is Active
                    </Label>
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup>
                    <label htmlFor="add-promotionalText" className="control-label">Promotional Text</label>
                    <Input
                      id="add-promotionalText"
                      name="promotionalText"
                      placeholder="Promotional Text"
                      type="textarea"
                      defaultValue={this.state.tourDate.promotionalText}
                      onChange={this.handleChangeTourDate}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </Col>
          </form>
        </ModalBody>
        <ModalFooter>
          <Col sm="12">
            <Button color="info" onClick={this.handleEditTourDate}>Save</Button>{' '}
              {this.state.editingTourDate && (
                <img
                  alt="loading"
                  src="data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA=="
                />
              )}
            <Button color="secondary" onClick={this.toggleEditTourDateModal}>Cancel</Button>
          </Col>
        </ModalFooter>
      </Modal>
    );
  }

  toggleEditTourDateModal = () => {
    if(this.state.editTourDateModalOpen === true) {
      if (!window.confirm("Do you want to discard these changes?")){
        return false;
      }
    }
    this.setState(prevState => ({
      submittedTourDateEdit: false,
      editTourDateModalOpen: !prevState.editTourDateModalOpen,
      tourDate: {
        type: "",
        status: "",
        place: "",
        placeName: "",
        price: "",
        promotionalText: "",
        isActive: false,
        dateStart: new Date(),
        dateEnd: new Date()
      },
      dateStart: new Date(),
      dateEnd: new Date()
    }));
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
                  <CardTitle tag="h4">
                    <strong>Tour Dates</strong>
                  </CardTitle>
                  <Row>
                    <Col md="4" sm="6">
                      <FormGroup>
                        <label htmlFor="tour" className="control-label">
                          Tour:
                        </label>
                        <Input
                          id="tour"
                          name="tour"
                          placeholder="Select tour"
                          type="select"
                          onChange={this.handleChangeTour}
                          value={this.state.tour}
                        >
                          <option value="">All</option>
                          {this.renderTours()}
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md="4" sm="6" className="pull-right offset-md-4 offset-sm-3">
                      <Button type="button" onClick={this.toggleAddTourDateModal} className="pull-right btn btn-round btn-info btn-sm">
                        <Fa icon="plus" />&nbsp;Add New
                      </Button>
                    </Col>
                  </Row>
                </CardHeader>
                <CardBody>
                  <Table className="tablesorter table-striped responsive" responsive>
                    <thead className="text-primary">
                      <tr>
                        <th>Date</th>
                        <th onClick={this.sortPrice}>
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
                        </th>
                        <th>Place</th>
                        <th>Active</th>
                        <th>&nbsp;</th>
                      </tr>
                    </thead>
                    <tbody>{this.renderRows()}</tbody>
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
                              <p><strong>Page <em>{this.state.activePage}</em> of <em>{Math.ceil(this.state.pagination.total/this.state.pagination.limit)}</em> of <em>{this.state.pagination.total}</em> items.</strong></p>
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
          <div className="portal">
            {this.renderAddTourDateModal()}
            {this.renderEditTourDateModal()}
          </div>
        </div>
      </>
    );
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
    getProductCategories, 
    getProductCategoriesV2, 
    getProductCategoriesAll, 
    getProductCategoriesAllV2, 
    deleteProductCategory,
    getPageById,
  }
)(TourDates);