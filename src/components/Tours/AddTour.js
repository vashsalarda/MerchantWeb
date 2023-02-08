import React from "react";
import { connect } from "react-redux";
import { getSession } from "../../config/session";
import { Link } from "react-router-dom";
import { FontAwesomeIcon as Fa } from '@fortawesome/react-fontawesome';
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';
import Select from 'react-select';
import DatePicker from "react-datepicker";

import { addTour } from "../../layouts/Admin/actions/PageActions";

import { Button, Card, CardHeader, CardBody, CardFooter, FormGroup, Form, Input, 
  Row, Col, Label, ListGroup, ListGroupItem, Modal, ModalBody, ModalFooter
} from "reactstrap";

const options = [
  { value: 'times', label: <strong><Fa icon="times" /> fa-times</strong> },
  { value: 'trash', label: <strong><Fa icon="trash" /> fa-trash</strong> },
  { value: 'file', label: <strong><Fa icon="file" /> fa-file</strong> },
  { value: 'file-alt', label: <strong><Fa icon="file-alt" /> fa-file-alt</strong> },
  { value: 'map', label: <strong><Fa icon="map" /> fa-map</strong> },
  { value: 'cube', label: <strong><Fa icon="cube" /> fa-cube</strong> },
  { value: 'question-circle', label: <strong><Fa icon="question-circle" /> fa-question-circle</strong> },
  { value: 'times-circle', label: <strong><Fa icon="times-circle" /> fa-times-circle</strong> },
  { value: 'exclamation-triangle', label: <strong><Fa icon="exclamation-triangle" /> fa-exclamation-triangle</strong> },
]

class AddTour extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tour: {
        name: "",
        pageType: "5dea2304f6bba08323a3ddce",
        about: "",
        numberOfPax: "",
        numberOfGroups: "",
        minNumber: "",
        maxNumber: "",
        isSuperGuide: true,
        highlights: [],
        sections: [],
        addons: [],
      },
      highlight: {
        name: "",
        order: 1,
        day: 1,
        image: "",
        description: "",
        dateTime: new Date(),
      },
      section: {
        name: "",
        order: 1,
        route: "",
        iconName: "",
        iconType: "FontAwesome",
        title: "",
        text: "",
      },
      addon: {
        name: "",
        image: "",
        price: "0",
        description: "",
      },
      pageType: 'sb-tours',
      isLoading: false,
      submitted: false,
      submittedHighlight: false,
      submittedSection: false,
      submittedAddon: false,
      isSaving: false,
      addingHighlight: false,
      addHighlightModalOpen: false,
      addingSection: false,
      addSectionModalOpen: false,
      addAddonModalOpen: false,
      addingAddon: false,
      messageOpen: false,
      dateStart: new Date(),
      dateNow: new Date(),
    };
  }

  componentDidMount() {
    const userData = JSON.parse(getSession("userData"));
    if (userData === null) {
      this.props.history.push("/login");
      window.location.reload();
    }
  }

  handleChangeDesc = (data) => {
    this.setState({
      tour: {
        ...this.state.tour,
        about: data
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
      tour: {
        ...this.state.tour,
        [name]: value
      }
    });
  }

  handleChangeHighlight = (e) => {
    let { name, value } = e.target;
    this.setState({
      highlight: {
        ...this.state.highlight,
        [name]: value
      }
    });
  }

  handleChangeDateTime = (date) => {
    this.setState({dateStart: date});
    this.setState({
      highlight: {
        ...this.state.highlight,
        dateTime: date
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

  handleChangeSectionIcon = (e) => {
    let value = e.value;
    this.setState({
      section: {
        ...this.state.section,
        iconName: value
      }
    });
  }

  handleChangeAddon = (e) => {
    let { name, value } = e.target;
    this.setState({
      addon: {
        ...this.state.addon,
        [name]: value
      }
    });
  }

  handleAddHighlight = (e) => {
    e.preventDefault();
    let highlightsLength = 1;
    let { highlights } = this.state.tour;
    if(highlights instanceof Array && highlights.length > 0) {
      highlightsLength = highlights.length + 1;
    }
    this.setState({ submittedHighlight: true, addingHighlight: true });
    const { highlight } = this.state;
    let isAdded = false;
    if(highlight && highlight.name && highlight.order && highlight.day) {
      if(highlights && highlights.length > 0) {
        const added = highlights.find(item => item.name === highlight.name);
        if(typeof added === 'object' && added.name !=="") {
          isAdded = true;
        }
      }
      if(!isAdded) {
        highlights = [...highlights,highlight];
        this.setState({
          submittedHighlight: false,
          addingHighlight: false,
          tour: {
            ...this.state.tour,
            highlights: highlights
          },
          highlight: {
            name: "",
            order: highlightsLength + 1,
            day: 1,
            image: "",
            description: "",
            dateTime: new Date(),
          }
        });
        this.setState(prevState => ({ addHighlightModalOpen: !prevState.addHighlightModalOpen }));
        this.showNotification('Tour highlight has been added!');
      } else {
        this.setState({ submittedHighlight: false, addingHighlight: false });
        this.showNotificationError('Tour highlight is already on the list!');
      }
    } else {
      this.setState({ addingHighlight: false });
      this.showNotificationError('Some fields are required!');
    }
  }

  handleAddSection = (e) => {
    e.preventDefault();
    let sectionsLength = 1;
    let { sections } = this.state.tour;
    if(sections instanceof Array && sections.length > 0) {
      sectionsLength = sections.length + 1;
    }
    this.setState({ submittedSection: true, addingSection: true });
    const { section } = this.state;
    let data = [];
    let sectionData = {
      title: section.title,
      text: section.text,
    }
    data = [...data,sectionData];
    section.data = data;
    let isAdded = false;
    if(section && section.name && section.order && section.iconName && section.route) {
      if(sections && sections.length > 0) {
        const added = sections.find(item => item.name === section.name);
        if(typeof added === 'object' && added.name !=="") {
          isAdded = true;
        }
      }
      if(!isAdded) {
        delete section.title;
        delete section.text;
        sections = [...sections,section];
        this.setState({ 
          submittedSection: false,
          addingSection: false,
          tour: {
            ...this.state.tour,
            sections: sections
          },
          section: {
            name: "",
            order: sectionsLength + 1,
            route: "",
            iconName: "",
            iconType: "FontAwesome",
            title: "",
            text: "",
          }
        });
        this.toggleAddSectionModal();
        this.showNotification('Tour section has been added!');
      } else {
        this.setState({ submittedSection: false, addingSection: false });
        this.showNotificationError('Tour section is already on the list!');
      }
    } else {
      this.setState({ addingSection: false });
      this.showNotificationError('Some fields are required!');
    }
  }

  handleAddAddon = (e) => {
    e.preventDefault();
    let { addons } = this.state.tour;
    this.setState({ submittedAddon: true, addingAddon: true });
    const { addon } = this.state;
    let isAdded = false;
    if(addon && addon.title && addon.price) {
      if(addons && addons.length > 0) {
        const added = addons.find(item => item.title === addon.title);
        if(typeof added === 'object' && added.title !=="") {
          isAdded = true;
        }
      }
      if(!isAdded) {
        addons = [...addons,addon];
        this.setState({ 
          addingAddon: false,
          tour: {
            ...this.state.tour,
            addons: addons
          },
          addon: {
            title: "",
            image: "",
            price: "0",
            description: "",
          }
        });
        this.toggleAddAddonModal();
        this.showNotification('Tour addon has been added!');
      } else {
        this.setState({ submittedAddon: false, addingAddon: false });
        this.showNotificationError('Tour addon is already on the list!');
      }
    } else {
      this.setState({ addingAddon: false });
      this.showNotificationError('Some fields are required!');
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
        iconName: "",
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
        iconName: "",
        autoDismiss: 5
      }
      this.refs.notify.notificationAlert(notification);
    }
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const userData = JSON.parse(getSession("userData"));

    if(userData) {
      const sessionToken = userData.sessionToken;
      const tour = {...this.state.tour};
      if ( tour.name && !isNaN(tour.price) && !isNaN(tour.numberOfPax) ) {
        if (!window.confirm("Do you want to save this tour?")) {
          return false;
        }
        this.setState({ submitted: true, isSaving: true });
        this.props.addTour(tour, sessionToken, (error, result) => {
          if (result) {
            setTimeout(() => {
              this.setState({ submitted: false, isSaving: false });
              if (result && result.place) {
                const { _id:tourId } = result.place;
                this.props.history.push(`/tours/${tourId}/edit?message=A tour has been added!`);
              }
            }, 1000);
          } else {
            if (error) {
              setTimeout(() => { this.setState({ submitted: false, isSaving: false }); }, 1000);
              if(error.response && typeof error.response === 'string' ) {
                this.showNotificationError(error.response);
              } else {
                this.showNotificationError('There is a error saving the tour!');
              }
            } else {
              setTimeout(() => { this.setState({ submitted: false, isSaving: false }); }, 1000);
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
      this.state.tourTypes !== undefined ||
      this.state.tourTypes !== null
    ) {
      const activeProductTypes = this.state.tourTypes.filter(
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

  renderTourHighlights() {
    if(this.state.tour && this.state.tour.highlights && this.state.tour.highlights.length > 0) {
      return(
        <ListGroup>
          {this.state.tour.highlights.map((item, index) => {
            return(
              <ListGroupItem key={index}>
                <span>
                  <Label className="header-label text-info-v2">{item.name}</Label>
                  <span onClick={this.removeHighlight} className="pointer text-muted pull-right-v2" data-id={index}><Fa icon="times" /></span>
                  <br />
                  {item.description}
                </span>
              </ListGroupItem>
            );
          })}
        </ListGroup>
      );
    } else {
      return(
        <em className="text-danger">Please add a highlight.</em>
      );
    }
  }

  renderTourSections() {
    if(this.state.tour && this.state.tour.sections && this.state.tour.sections.length > 0) {
      return(
        <ListGroup>
          {this.state.tour.sections.map((item, index) => {
            return(
              <ListGroupItem key={index}>
                <span>
                  <Label className="header-label text-info-v2"><Fa icon={item.iconName} /> {item.name}</Label>
                  <span onClick={this.removeSection} className="pointer text-muted pull-right-v2" data-id={index}><Fa icon="times" /></span>
                  <br />
                  {item.description}
                </span>
              </ListGroupItem>
            );
          })}
        </ListGroup>
      );
    } else {
      return(
        <em className="text-danger">Please add a section.</em>
      );
    }
  }

  renderTourAddons() {
    if(this.state.tour && this.state.tour.addons && this.state.tour.addons.length > 0) {
      return(
        <ListGroup>
          {this.state.tour.addons.map((item, index) => {
            return(
              <ListGroupItem key={index}>
                <span>
                  <Label className="header-label text-info-v2"><Fa icon={item.iconName} /> {item.title}</Label>
                  <span onClick={this.removeAddon} className="pointer text-muted pull-right-v2" data-id={index}><Fa icon="times" /></span><br />
                  <Label className="text-navy">&#8369;{numberWithCommas(item.price)}</Label><br />
                  {item.description}
                </span>
              </ListGroupItem>
            );
          })}
        </ListGroup>
      );
    } else {
      return(
        <em className="text-danger">Please add an addon.</em>
      );
    }
  }

  renderAddHighlightModal() {
    return (
      <Modal className="modal-lg" isOpen={this.state.addHighlightModalOpen} toggle={this.toggleAddHighlightModal} backdrop="static">
        <div className="modal-header">
          <h4 className="modal-title">Add Tour Highlight</h4>
          <button type="button" className="close" onClick={this.toggleAddHighlightModal} aria-label="Close" style={{color:"rgba(0, 0, 0, 0.6)"}}><span aria-hidden="true">×</span></button>
        </div>
        <ModalBody>
          <form action="">
            <Col sm="12">
              <Row>
                <Col sm="12">
                  <FormGroup className={ this.state.submittedHighlight && !this.state.highlight.name ? " has-danger" : "" }>
                    <label htmlFor="name" className="control-label">Tour Highlight <em className="text-muted">(Required)</em></label>
                    <Input
                      id="name"
                      name="name"
                      className="name"
                      placeholder="Highlight"
                      type="text"
                      defaultValue={this.state.highlight.name}
                      onChange={this.handleChangeHighlight}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12" md="6" lg="6">
                  <FormGroup className={ this.state.submittedHighlight && !this.state.highlight.order ? " has-danger" : "" }>
                    <label htmlFor="order" className="control-label">Order <em className="text-muted">(Required)</em></label>
                    <Input
                      id="order"
                      name="order"
                      className="order"
                      placeholder="Order"
                      type="number"
                      defaultValue={this.state.highlight.order}
                      onChange={this.handleChangeHighlight}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12" md="6" lg="6">
                  <FormGroup className={ this.state.submittedHighlight && !this.state.highlight.day ? " has-danger" : "" }>
                    <label htmlFor="day" className="control-label">Day <em className="text-muted">(Required)</em></label>
                    <Input
                      id="day"
                      name="day"
                      placeholder="Day"
                      type="number"
                      defaultValue={this.state.highlight.day}
                      onChange={this.handleChangeHighlight}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12" md="6" lg="6">
                  <FormGroup className={ this.state.submittedHighlight && !this.state.highlight.dateTime ? " has-danger" : "" }>
                    <label htmlFor="dateTime" className="control-label" style={{display:'block'}}>
                      Date Time:
                    </label>
                    <DatePicker
                      id="dateTime"
                      name="dateTime"
                      className="form-control"
                      autoComplete="off"
                      selectsStart
                      startDate={this.state.dateStart}
                      minDate={this.state.dateNow}
                      selected={this.state.highlight.dateTime}
                      onChange={this.handleChangeDateTime}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      timeCaption="time"
                      dateFormat="MMM d, yyyy h:mm aa"
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup>
                    <label htmlFor="description" className="control-label">Description</label>
                    <Input
                      id="description"
                      name="description"
                      placeholder="Description"
                      type="textarea"
                      defaultValue={this.state.highlight.description}
                      onChange={this.handleChangeHighlight}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </Col>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button color="info" onClick={this.handleAddHighlight}>Add</Button>{' '}
            {this.state.addingHighlight && (
              <img
                alt="loading"
                src="data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA=="
              />
            )}
          <Button color="secondary" onClick={this.toggleAddHighlightModal}>Cancel</Button>
        </ModalFooter>
      </Modal>
    );
  }

  toggleAddHighlightModal = () => {
    if(this.state.addHighlightModalOpen) {
      if (!window.confirm("Do you want to discard this highlight?")){
        return false;
      }
    }
    let highlightsLength = 1;
    let { highlights } = this.state.tour;
    if(highlights instanceof Array && highlights.length > 0) {
      highlightsLength = highlights.length + 1;
    }
    this.setState(prevState => ({
      submittedHighlight: false,
      addHighlightModalOpen: !prevState.addHighlightModalOpen,
      highlight: {
        name: "",
        order: highlightsLength,
        day: 1,
        image: "",
        description: "",
        dateTime: new Date(),
      }
    }));
  }

  removeHighlight = (e) => {
    if (!window.confirm("Are you sure you sure you want to remove this highlight?")){
      return false;
    }
    const itemIndex = Number(e.currentTarget.dataset.id);
    const { highlights } = this.state.tour;
    if(highlights instanceof Array && highlights.length > 0) {
      const newHighlights = highlights.filter((item, index) => index !== itemIndex);
      this.setState({
        tour: {
          ...this.state.tour,
          highlights: newHighlights
        },
      })
    }
  }

  renderAddSectionModal() {
    return (
      <Modal className="modal-lg" isOpen={this.state.addSectionModalOpen} toggle={this.toggleAddSectionModal} backdrop="static">
        <div className="modal-header">
          <h4 className="modal-title">Add Tour Section</h4>
          <button type="button" className="close" onClick={this.toggleAddSectionModal} aria-label="Close" style={{color:"rgba(0, 0, 0, 0.6)"}}><span aria-hidden="true">×</span></button>
        </div>
        <ModalBody>
          <form action="">
            <Col sm="12">
              <Row>
                <Col sm="12">
                  <FormGroup className={ this.state.submittedSection && !this.state.section.name ? " has-danger" : "" }>
                    <label htmlFor="name" className="control-label">Tour Section <em className="text-muted">(Required)</em></label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Section Name"
                      type="text"
                      defaultValue={this.state.section.name}
                      onChange={this.handleChangeSection}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup className={ this.state.submittedSection && !this.state.section.order ? " has-danger" : "" }>
                    <label htmlFor="order" className="control-label">Order <em className="text-muted">(Required)</em></label>
                    <Input
                      id="order"
                      name="order"
                      placeholder="Order"
                      type="number"
                      defaultValue={this.state.section.order}
                      onChange={this.handleChangeSection}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup className={ this.state.submittedSection && !this.state.section.route ? " has-danger" : "" }>
                    <label htmlFor="route" className="control-label">Route <em className="text-muted">(Required)</em></label>
                    <Input
                      id="route"
                      name="route"
                      placeholder="Section Route"
                      type="text"
                      defaultValue={this.state.section.route}
                      onChange={this.handleChangeSection}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup className={ this.state.submittedSection && !this.state.section.iconName ? " has-danger" : "" }>
                    <label htmlFor="location" className="control-label">Icon <em className="text-muted">(Required)</em></label>
                    <Select
                      className="react-select"
                      styles={{fontSize:'13px !important'}}
                      options={options}
                      onChange={this.handleChangeSectionIcon}
                      placeholder="Select icon"
                      defaultValue={options.filter(item => item.value === this.state.section.iconName)}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup>
                    <label htmlFor="title" className="control-label">Title</label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Section Title"
                      type="text"
                      defaultValue={this.state.section.title}
                      onChange={this.handleChangeSection}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup>
                    <label htmlFor="text" className="control-label">Text</label>
                    <Input
                      id="text"
                      name="text"
                      placeholder="Section Text"
                      type="textarea"
                      defaultValue={this.state.section.text}
                      onChange={this.handleChangeSection}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </Col>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button color="info" onClick={this.handleAddSection}>Add</Button>{' '}
            {this.state.addingHighlight && (
              <img
                alt="loading"
                src="data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA=="
              />
            )}
          <Button color="secondary" onClick={this.toggleAddSectionModal}>Cancel</Button>
        </ModalFooter>
      </Modal>
    );
  }

  toggleAddSectionModal = () => {
    let sectionsLength = 1;
    let { sections } = this.state.tour;
    if(sections instanceof Array && sections.length > 0) {
      sectionsLength = sections.length + 1;
    }
    this.setState(prevState => ({
      submittedSection: false,
      addSectionModalOpen: !prevState.addSectionModalOpen,
      section: {
        name: "",
        order: sectionsLength,
        route: "",
        iconName: "",
        iconType: "FontAwesome",
        title: "",
        text: "",
      }
    }));
  }

  removeSection = (e) => {
    if (!window.confirm("Are you sure you sure you want to remove this section?")){
      return false;
    }
    const itemIndex = Number(e.currentTarget.dataset.id);
    const { sections } = this.state.tour;
    if(sections instanceof Array && sections.length > 0) {
      const newSections = sections.filter((item, index) => index !== itemIndex);
      this.setState({
        tour: {
          ...this.state.tour,
          sections: newSections
        }
      })
    }
  }

  renderAddTourAddonModal() {
    return (
      <Modal className="modal-lg" isOpen={this.state.addAddonModalOpen} toggle={this.toggleAddAddonModal} backdrop="static">
        <div className="modal-header">
          <h4 className="modal-title">Add Tour Addon</h4>
          <button type="button" className="close" onClick={this.toggleAddAddonModal} aria-label="Close" style={{color:"rgba(0, 0, 0, 0.6)"}}><span aria-hidden="true">×</span></button>
        </div>
        <ModalBody>
          <form action="">
            <Col sm="12">
              <Row>
                <Col sm="12">
                  <FormGroup className={ this.state.submittedAddon && !this.state.addon.title ? " has-danger" : "" }>
                    <label htmlFor="name" className="control-label">Title <em className="text-muted">(Required)</em></label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Title"
                      type="text"
                      defaultValue={this.state.addon.title}
                      onChange={this.handleChangeAddon}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup className={ this.state.submittedAddon && !this.state.addon.price ? " has-danger" : "" }>
                    <label htmlFor="price" className="control-label">Price <em className="text-muted">(Required)</em></label>
                    <Input
                      id="price"
                      name="price"
                      placeholder="&#8369;"
                      type="text"
                      defaultValue={this.state.addon.price}
                      onChange={this.handleChangeAddon}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup>
                    <label htmlFor="description" className="control-label">Description</label>
                    <Input
                      id="description"
                      name="description"
                      placeholder="Description"
                      type="textarea"
                      defaultValue={this.state.addon.description}
                      onChange={this.handleChangeAddon}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </Col>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button color="info" onClick={this.handleAddAddon}>Add</Button>{' '}
            {this.state.addingAddon && (
              <img
                alt="loading"
                src="data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA=="
              />
            )}
          <Button color="secondary" onClick={this.toggleAddAddonModal}>Cancel</Button>
        </ModalFooter>
      </Modal>
    );
  }

  toggleAddAddonModal = () => {
    this.setState(prevState => ({
      submittedAddon: false,
      addAddonModalOpen: !prevState.addAddonModalOpen,
      section: {
        title: "",
        image: "",
        price: "0",
        description: "",
      }
    }));
  }

  removeAddon = (e) => {
    if (!window.confirm("Are you sure you sure you want to remove this addon?")){
      return false;
    }
    const itemIndex = Number(e.currentTarget.dataset.id);
    const { addons } = this.state.tour;
    if(addons instanceof Array && addons.length > 0) {
      const newAddons = addons.filter((item, index) => index !== itemIndex);
      this.setState({
        tour: {
          ...this.state.tour,
          addons: newAddons
        }
      })
    }
  }

  render() {
    let { submitted, pageType } = this.state;

    if(pageType === 'sb-tours') {
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
                      <h3 className="title">Add New Tour</h3>
                    </CardHeader>
                    <CardBody>
                      <Row style={{marginBottom:'20px'}}>
                        <Col sm="12" md="3" lg="3">
                          <legend>General</legend>
                          <p>Change general information for this tour.</p>
                        </Col>
                        <Col sm="12" md="9" lg="9">
                          <Row>
                            <Col sm="12" md="12" lg="12">
                              <FormGroup className={submitted && !this.state.tour.name ? " has-danger" : "" }>
                                <label htmlFor="name" className="control-label">
                                  Tour Name <em className="text-muted">(Required)</em>
                                </label>
                                <Input
                                  id="name"
                                  name="name"
                                  placeholder="Tour Name"
                                  type="text"
                                  defaultValue={this.state.tour.name}
                                  onChange={this.handleChange}
                                />
                              </FormGroup>
                            </Col>
                          </Row>
                          <Row>
                            <Col sm="12" md="12" lg="12">
                              <Row>
                                <Col className="pr-md-1" md="4">
                                  <FormGroup className={ submitted && !this.state.tour.numberOfPax ? " has-danger" : "" }>
                                    <label htmlFor="price" className="control-label">
                                      No. of Pax <em className="text-muted">(Required)</em>
                                    </label>
                                    <Input
                                      id="numberOfPax"
                                      name="numberOfPax"
                                      placeholder="No. of Pax"
                                      type="number"
                                      defaultValue={this.state.tour.numberOfPax}
                                      onChange={this.handleChange}
                                    />
                                  </FormGroup>
                                </Col>
                                <Col className="px-md-1" md="4">
                                  <FormGroup className={ submitted && !this.state.tour.price ? " has-danger" : "" }>
                                    <label htmlFor="price" className="control-label">
                                      Price <em className="text-muted">(Required)</em>
                                    </label>
                                    <Input
                                      id="price"
                                      name="price"
                                      placeholder="&#8369;"
                                      type="text"
                                      defaultValue={this.state.tour.price}
                                      onChange={this.handleChange}
                                    />
                                  </FormGroup>
                                </Col>
                                <Col className="pl-md-1" md="4">
                                  <FormGroup>
                                    <label htmlFor="compare-price" className="control-label">Compare Price</label>
                                    <Input
                                      id="comparePrice"
                                      name="comparePrice"
                                      placeholder="&#8369;"
                                      type="text"
                                      defaultValue={this.state.tour.comparePrice}
                                      onChange={this.handleChange}
                                    />
                                  </FormGroup>
                                </Col>
                              </Row>
                            </Col>
                          </Row>
                          <Row>
                            <Col md="12">
                              <FormGroup>
                                <label htmlFor="about"><strong>About</strong></label>
                                <Input
                                  style={{height: '200px'}}
                                  id="about"
                                  name="about"
                                  placeholder="About"
                                  type="textarea"
                                  value={this.state.section.about}
                                  onChange={this.handleChangeSection}
                                />
                              </FormGroup>
                            </Col>
                          </Row>            
                        </Col>
                      </Row>
                      <Row>
                        <Col sm="12" md="3" lg="3">
                          <legend>Tour Settings</legend>
                        </Col>
                        <Col sm="12" md="9" lg="9">
                          <Row>
                            <Col className="pr-md-1" md="4">
                              <FormGroup className={ submitted && !this.state.tour.numberOfGroups ? " has-danger" : "" }>
                                <label htmlFor="price" className="control-label">No. of Groups <em className="text-muted">(Required)</em></label>
                                <Input
                                  id="numberOfGroups"
                                  name="numberOfGroups"
                                  placeholder="No. of Groups"
                                  type="number"
                                  defaultValue={this.state.tour.numberOfGroups}
                                  onChange={this.handleChange}
                                />
                              </FormGroup>
                            </Col>
                            <Col className="px-md-1" md="4">
                              <FormGroup>
                                <label htmlFor="minNumber" className="control-label">Min. number</label>
                                <Input
                                  id="minNumber"
                                  name="minNumber"
                                  placeholder="Min. number"
                                  type="number"
                                  defaultValue={this.state.tour.minNumber}
                                  onChange={this.handleChange}
                                />
                              </FormGroup>
                            </Col>
                            <Col className="pl-md-1" md="4">
                              <FormGroup>
                                <label htmlFor="maxNumber" className="control-label">Max number</label>
                                <Input
                                  id="maxNumber"
                                  name="maxNumber"
                                  placeholder="Nax number"
                                  type="number"
                                  defaultValue={this.state.tour.maxNumber}
                                  onChange={this.handleChange}
                                />
                              </FormGroup>
                            </Col>
                          </Row>
                          <Row>
                            <Col sm="12">
                              <legend>Tour Highlights</legend>
                            </Col>
                            <Col sm="12">
                              {this.renderTourHighlights()}
                            </Col>
                            <Col sm="12">
                              <FormGroup>
                                <Button color="primary-v2" className="btn-sm" type="button" onClick={this.toggleAddHighlightModal}><Fa icon="plus" /> Add Highlight</Button>
                              </FormGroup>
                            </Col>
                          </Row>
                          <Row>
                            <Col sm="12">
                              <legend>Tour Sections</legend>
                            </Col>
                            <Col sm="12">
                              {this.renderTourSections()}
                            </Col>
                            <Col sm="12">
                              <FormGroup>
                                <Button color="primary-v2" className="btn-sm" type="button" onClick={this.toggleAddSectionModal}><Fa icon="plus" /> Add Section</Button>
                              </FormGroup>
                            </Col>
                          </Row>
                          <Row>
                            <Col sm="12">
                              <legend>Tour Addons</legend>
                            </Col>
                            <Col sm="12">
                              {this.renderTourAddons()}
                            </Col>
                            <Col sm="12">
                              <FormGroup>
                                <Button color="primary-v2" className="btn-sm" type="button" onClick={this.toggleAddAddonModal}><Fa icon="plus" /> Add Addon</Button>
                              </FormGroup>
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                    </CardBody>
                    <CardFooter className="pull-right">
                      <Button color="info" type="submit">Save</Button>
                      <Link to="/tours" className="btn btn-light">Cancel</Link>
                    </CardFooter>
                  </Form>
                </Card>
              </Col>
            </Row>
            <div>
              {this.renderAddHighlightModal()}
              {this.renderAddSectionModal()}
              {this.renderAddTourAddonModal()}
            </div>
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
    addTour,
  }
)(AddTour);
