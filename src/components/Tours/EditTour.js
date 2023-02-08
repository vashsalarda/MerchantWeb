import React from "react";
import { connect } from "react-redux";
import { getSession } from "../../config/session";
import api from "../../config/api";
import { Link } from "react-router-dom";
import { FontAwesomeIcon as Fa } from '@fortawesome/react-fontawesome';
import queryString from "query-string";
import { PulseLoader, SyncLoader } from 'react-spinners';
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';
import Select from 'react-select';
import DatePicker from "react-datepicker";

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

import { Alert, Button, Card, CardHeader, CardBody, CardFooter, FormGroup, Form, Input, 
  Row, Col, Label, ListGroup, ListGroupItem, Media, Modal, ModalBody, ModalFooter
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
    const tourId = props.match.params._id;
    this.state = {
      tourId,
      tour: {
        name: "",
        about: "",
        photos: [],
        numberOfPax: "",
        numberOfGroups: "",
        minNumber: "",
        maxNumber: "",
        highlights: [],
        sections: [],
        addons: [],
      },
      highlight: {
        name: "",
        order: 1,
        day: 1,
        image: {},
        description: "",
        dateTime: new Date(),
      },
      highlightEdit: {
        index: "",
        name: "",
        order: 1,
        day: 1,
        image: {},
        description: "",
        dateTime: new Date(),
      },
      section: {
        name: "",
        order: 1,
        route: "",
        iconName: "",
        iconType: "FontAwesome",
        map: {},
        title: "",
        text: "",
      },
      sectionEdit: {
        index: "",
        name: "",
        order: 1,
        route: "",
        iconName: "",
        iconType: "FontAwesome",
        map: {},
        title: "",
        text: "",
      },
      addon: {
        name: "",
        image: {},
        price: "0",
        type: "group",
        description: "",
      },
      addonEdit: {
        name: "",
        image: {},
        price: "0",
        type: "group",
        description: "",
      },
      
      pageType: 'sb-tours',
      isLoading: false,
      submitted: false,
      isSaving: false,
      
      addHighlightModalOpen: false,
      submittedHighlight: false,
      addingHighlight: false,
      
      editHighlightModalOpen: false,
      submittedHighlightEdit: false,
      editingHighlight: false,

      addSectionModalOpen: false,
      submittedSection: false,
      addingSection: false,

      editSectionModalOpen: false,
      submittedSectionEdit: false,
      editingSection: false,
      
      addAddonModalOpen: false,
      submittedAddon: false,
      addingAddon: false,

      editAddonModalOpen: false,
      submittedAddonEdit: false,
      editingAddon: false,
      
      messageOpen: false,
      isUploading: false,
      isUploadingHighlight: false,
      isUploadingSection: false,
      isUploadingAddon: false,

      dateStart: new Date(),
      dateNow: new Date(),
    };
  }

  componentDidMount() {
    const userData = JSON.parse(getSession("userData"));
    const url = this.props.location.search;
    const query = queryString.parse(url);
    const message = query.message;
    if(message) {
      this.setState({
        message: message,
        messageOpen: true,
      });
    }

    if (userData !== null) {
      const sessionToken = userData.sessionToken;
      const tourId = this.state.tourId;

      api(sessionToken).get(`/provider/tours/${tourId}`)
        .then(response => {
          if(response && response.data) {
              const { page:tour } = response.data;
              this.setState({
                tour: {
                  name: tour.name ? tour.name : "",
                  about: tour.about ? tour.about : "",
                  photos: tour.photos ? tour.photos : [],
                  price: tour.tourDetails.price,
                  comparePrice: tour.tourDetails.comparePrice,
                  numberOfPax: tour.tourDetails.numberOfPax,
                  numberOfGroups: tour.tourDetails.numberOfGroups,
                  minNumber: tour.tourDetails.minNumber,
                  maxNumber: tour.tourDetails.maxNumber,
                  highlights: tour.tourDetails.activities ? tour.tourDetails.activities : [],
                  sections: tour.tourDetails.sections ? tour.tourDetails.sections : [],
                  addons: tour.tourDetails.addons ? tour.tourDetails.addons : [],
                },
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

  handleChangeHighlightEdit = (e) => {
    let { name, value } = e.target;
    this.setState({
      highlightEdit: {
        ...this.state.highlightEdit,
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

  handleChangeDateTimeEdit = (date) => {
    this.setState({dateStart: date});
    this.setState({
      highlightEdit: {
        ...this.state.highlightEdit,
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

  handleChangeSectionEdit = (e) => {
    let { name, value } = e.target;
    this.setState({
      sectionEdit: {
        ...this.state.sectionEdit,
        [name]: value
      }
    });
  }

  handleChangeSectionIconEdit = (e) => {
    let value = e.value;
    this.setState({
      sectionEdit: {
        ...this.state.sectionEdit,
        iconName: value
      }
    });
  }

  handleChangeCheckbox = (e) => {
    let { name } = e.target;
    this.setState(prevState => ({
      tourDate: {
        ...this.state.tourDate,
        [name]: !prevState.tourDate.name
      }
    }));
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

  handleChangeAddonEdit = (e) => {
    let { name, value } = e.target;
    this.setState({
      addonEdit: {
        ...this.state.addonEdit,
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
            id: "",
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

  handleEditHighlight = (e) => {
    e.preventDefault();
    let { highlights } = this.state.tour;
    this.setState({ submittedHighlightEdit: true, editingHighlight: true });
    const { highlightEdit } = this.state;
    let newHighlights = highlights.filter((item, index) => index !== highlightEdit.index);
    
    let isAdded = false;
    if(highlightEdit && highlightEdit.name && highlightEdit.order && highlightEdit.day) {
      if(newHighlights && newHighlights.length > 0) {
        const added = newHighlights.find(item => item.name === highlightEdit.name);
        if(typeof added === 'object' && added.name !=="") {
          isAdded = true;
        }
      }
      if(!isAdded) {
        for( var i = 0; i < highlights.length; i++){ 
          if (i === highlightEdit.index) {
            delete highlightEdit.index;
            highlights.splice(i, 1, highlightEdit); 
          }
        }
        this.setState({ 
          submittedHighlightEdit: false,
          editingHighlight: false,
          tour: {
            ...this.state.tour,
            highlights: highlights
          },
          highlightEdit: {
            index: "",
            name: "",
            order: 1,
            day: 1,
            image: {},
            description: "",
            dateTime: new Date(),
          }
        });
        //this.toggleEditHighlightModal();
        this.setState(prevState => ({ editHighlightModalOpen: !prevState.editHighlightModalOpen }) )
        this.showNotification('Tour highlight has been updated!');
      } else {
        this.setState({ submittedHighlightEdit: false, editingHighlight: false });
        this.showNotificationError('Tour highlight name is already on the list!');
      }
    } else {
      this.setState({ editingHighlight: false });
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
    let { section } = this.state;
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
            map: {},
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

  handleEditSection = (e) => {
    e.preventDefault();
    let sectionsLength = 1;
    let { sections } = this.state.tour;
    if(sections instanceof Array && sections.length > 0) {
      sectionsLength = sections.length + 1;
    }
    this.setState({ submittedSectionEdit: true, editingSection: true });
    let { sectionEdit } = this.state;
    let newSections = sections.filter((item, index) => index !== sectionEdit.index);
    let data = [];
    let sectionData = {
      title: sectionEdit.title,
      text: sectionEdit.text,
    }
    data = [...data,sectionData];
    sectionEdit.data = data;
    let isAdded = false;
    if(sectionEdit && sectionEdit.name && sectionEdit.order && sectionEdit.iconName && sectionEdit.route) {
      if(newSections && newSections.length > 0) {
        const added = newSections.find(item => item.name === sectionEdit.name);
        if(typeof added === 'object' && added.name !=="") {
          isAdded = true;
        }
      }
      if(!isAdded) {
        delete sectionEdit.title;
        delete sectionEdit.text;
        for( var i = 0; i < sections.length; i++){ 
          if (i === sectionEdit.index) {
            delete sectionEdit.index;
            sections.splice(i, 1, sectionEdit); 
          }
        }
        //sections = [...sections,sectionEdit];
        this.setState({ 
          submittedSectionEdit: false, 
          editingSection: false,
          tour: {
            ...this.state.tour,
            sections: sections
          },
          sectionEdit: {
            index: "",
            name: "",
            order: sectionsLength + 1,
            route: "",
            iconName: "",
            iconType: "FontAwesome",
            map: {},
            title: "",
            text: "",
          }
        });
        this.setState(prevState => ({ editSectionModalOpen: !prevState.editSectionModalOpen }) )
        this.showNotification('Tour section has been updated!');
      } else {
        this.setState({ submittedSectionEdit: false, editingSection: false });
        this.showNotificationError('Tour section is already on the list!');
      }
    } else {
      this.setState({ editingSection: false });
      this.showNotificationError('Some fields are required!');
    }
  }

  handleAddAddon = (e) => {
    e.preventDefault();
    let { addons } = this.state.tour;
    this.setState({ submittedAddon: true, addingAddon: true });
    const { addon } = this.state;
    let isAdded = false;
    if(addon && addon.name && addon.price) {
      if(addons && addons.length > 0) {
        const added = addons.find(item => item.name === addon.name);
        if(typeof added === 'object' && added.name !=="") {
          isAdded = true;
        }
      }
      if(!isAdded) {
        addons = [...addons,addon];
        this.setState({
          submittedAddon: false,
          addingAddon: false,
          tour: {
            ...this.state.tour,
            addons: addons
          },
          addon: {
            name: "",
            image: {},
            price: "0",
            type: "group",
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

  handleEditAddon = (e) => {
    e.preventDefault();
    let { addons } = this.state.tour;
    this.setState({ submittedAddonEdit: true, editingAddon: true });
    const { addonEdit } = this.state;
    let newAddons = addons.filter((item, index) => index !== addonEdit.index);
    let isAdded = false;
    if(addonEdit && addonEdit.name && addonEdit.price) {
      if(newAddons && newAddons.length > 0) {
        const added = newAddons.find(item => item.name === addonEdit.name);
        if(typeof added === 'object' && added.name !=="") {
          isAdded = true;
        }
      }
      if(!isAdded) {
        for( var i = 0; i < addons.length; i++){ 
          if (i === addonEdit.index) {
            delete addonEdit.index;
            addons.splice(i, 1, addonEdit); 
          }
        }
        this.setState({
          submittedAddonEdit: false,
          editingAddon: false,
          tour: {
            ...this.state.tour,
            addons: addons
          },
          addonEdit: {
            name: "",
            image: {},
            price: "0",
            type: "group",
            description: "",
          }
        });
        this.toggleEditAddonModal();
        this.showNotification('Tour addon has been added!');
      } else {
        this.setState({ submittedAddonEdit: false, editingAddon: false });
        this.showNotificationError('Tour addon is already on the list!');
      }
    } else {
      this.setState({ editingAddon: false });
      this.showNotificationError('Some fields are required!');
    }
  }

  handleFileUpload = (e) => {
    const userData = JSON.parse(getSession("userData"));
    const files = e.target.files;
    const images = this.state.tour.photos;
    if(files[0]) {
      if(images.length<6) {
        this.setState({isUploading: true});
        const tourId = this.state.tourId;
        const sessionToken = userData.sessionToken;
        const images = this.state.tour.photos;
        const formData = new FormData();
        formData.append('file', files[0]);
        api(sessionToken)
          .post(`/provider/tours/${tourId}/media`, formData)
          .then(resp => {
            this.setState({ isUploading:false });
            const photo = resp.data;
            if(photo._id) {
              images.push(photo);
              this.setState({
                tour: {
                  ...this.state.tour,
                  photos: images
                }
              });
            }
          })
          .catch(error => {
            this.setState({ isUploading:false });
            if (error.response && typeof error.response === 'string') {
              console.error(error.response);
              this.showNotificationError(error.response);
            } else {
              console.error({error});
              this.showNotificationError('There is an error uploading the file. Please try again');
            }
          });
      } else {
        this.setState({ isUploading:false });
        console.log('No. of files: ',files.length);
        this.showNotificationError('You are only allowed to upload a maximum of 6 files!');
      }
    }
  }

  handleFileUploadHighlight = (e) => {
    const files = e.target.files;
    if(files[0]) {
      this.setState({isUploadingHighlight: true});
      const userData = JSON.parse(getSession("userData"));
      const tourId = this.state.tourId;
      const sessionToken = userData.sessionToken;
      const formData = new FormData();
      formData.append('file', files[0]);
      api(sessionToken)
        .post(`/provider/tours/${tourId}/upload-content-image`, formData)
        .then(resp => {
          this.setState({ isUploadingHighlight:false });
          const image = resp.data;
          if(image) {
            this.setState({
              highlight: {
                ...this.state.highlight,
                image: image
              }
            });
          }
        })
        .catch(error => {
          this.setState({ isUploadingHighlight:false });
          if (error.response && typeof error.response === 'string') {
            console.error(error.response);
            this.showNotificationError(error.response);
          } else {
            console.error({error});
            this.showNotificationError('There is an error uploading the file. Please try again');
          }
        });
    }
  }

  handleFileUploadHighlightEdit = (e) => {
    const files = e.target.files;
    if(files[0]) {
      this.setState({isUploadingHighlight: true});
      const userData = JSON.parse(getSession("userData"));
      const tourId = this.state.tourId;
      const sessionToken = userData.sessionToken;
      const formData = new FormData();
      formData.append('file', files[0]);
      api(sessionToken)
        .post(`/provider/tours/${tourId}/upload-content-image`, formData)
        .then(resp => {
          this.setState({ isUploadingHighlight:false });
          const image = resp.data;
          if(image) {
            this.setState({
              highlightEdit: {
                ...this.state.highlightEdit,
                image: image
              }
            });
          }
        })
        .catch(error => {
          this.setState({ isUploadingHighlight:false });
          if (error.response && typeof error.response === 'string') {
            console.error(error.response);
            this.showNotificationError(error.response);
          } else {
            console.error({error});
            this.showNotificationError('There is an error uploading the file. Please try again');
          }
        });
    }
  }

  handleFileUploadSection = (e) => {
    const files = e.target.files;
    if(files[0]) {
      this.setState({isUploadingSection: true});
      const userData = JSON.parse(getSession("userData"));
      const tourId = this.state.tourId;
      const sessionToken = userData.sessionToken;
      const formData = new FormData();
      formData.append('file', files[0]);
      api(sessionToken)
        .post(`/provider/tours/${tourId}/upload-content-image`, formData)
        .then(resp => {
          this.setState({ isUploadingSection:false });
          const image = resp.data;
          if(image) {
            this.setState({
              section: {
                ...this.state.section,
                map: image
              }
            });
          }
        })
        .catch(error => {
          this.setState({ isUploadingSection:false });
          if (error.response && typeof error.response === 'string') {
            console.error(error.response);
            this.showNotificationError(error.response);
          } else {
            console.error({error});
            this.showNotificationError('There is an error uploading the file. Please try again');
          }
        });
    }
  }

  handleFileUploadSectionEdit = (e) => {
    const files = e.target.files;
    if(files[0]) {
      this.setState({isUploadingSection: true});
      const userData = JSON.parse(getSession("userData"));
      const tourId = this.state.tourId;
      const sessionToken = userData.sessionToken;
      const formData = new FormData();
      formData.append('file', files[0]);
      api(sessionToken)
        .post(`/provider/tours/${tourId}/upload-content-image`, formData)
        .then(resp => {
          this.setState({ isUploadingSection:false });
          const image = resp.data;
          if(image) {
            this.setState({
              sectionEdit: {
                ...this.state.sectionEdit,
                map: image
              }
            });
          }
        })
        .catch(error => {
          this.setState({ isUploadingSection:false });
          if (error.response && typeof error.response === 'string') {
            console.error(error.response);
            this.showNotificationError(error.response);
          } else {
            console.error({error});
            this.showNotificationError('There is an error uploading the file. Please try again');
          }
        });
    }
  }

  handleFileUploadAddon = (e) => {
    const files = e.target.files;
    if(files[0]) {
      this.setState({isUploadingAddon: true});
      const userData = JSON.parse(getSession("userData"));
      const tourId = this.state.tourId;
      const sessionToken = userData.sessionToken;
      const formData = new FormData();
      formData.append('file', files[0]);
      api(sessionToken)
        .post(`/provider/tours/${tourId}/upload-content-image`, formData)
        .then(resp => {
          this.setState({ isUploadingAddon:false });
          const image = resp.data;
          if(image) {
            this.setState({
              addon: {
                ...this.state.addon,
                image: image
              }
            });
          }
        })
        .catch(error => {
          this.setState({ isUploadingAddon:false });
          if (error.response && typeof error.response === 'string') {
            console.error(error.response);
            this.showNotificationError(error.response);
          } else {
            console.error({error});
            this.showNotificationError('There is an error uploading the file. Please try again');
          }
        });
    }
  }

  handleFileUploadAddonEdit = (e) => {
    const files = e.target.files;
    if(files[0]) {
      this.setState({isUploadingAddon: true});
      const userData = JSON.parse(getSession("userData"));
      const tourId = this.state.tourId;
      const sessionToken = userData.sessionToken;
      const formData = new FormData();
      formData.append('file', files[0]);
      api(sessionToken)
        .post(`/provider/tours/${tourId}/upload-content-image`, formData)
        .then(resp => {
          this.setState({ isUploadingAddon:false });
          const image = resp.data;
          if(image) {
            this.setState({
              addonEdit: {
                ...this.state.addonEdit,
                image: image
              }
            });
          }
        })
        .catch(error => {
          this.setState({ isUploadingAddon:false });
          if (error.response && typeof error.response === 'string') {
            console.error(error.response);
            this.showNotificationError(error.response);
          } else {
            console.error({error});
            this.showNotificationError('There is an error uploading the file. Please try again');
          }
        });
    }
  }

  removeImage = (e) => {
    const userData = JSON.parse(getSession("userData"));
    const tourId = this.state.tourId;
    const mediaId = e.currentTarget.dataset.id;
    const sessionToken = userData.sessionToken;
    api(sessionToken)
      .delete(`provider/tours/${tourId}/media/${mediaId}`)
      .then(resp => {
        if(resp && resp.data.deleted==='ok') {
          const images = this.state.tour.photos;
          const newImages = images.filter(item => item._id.toString() !== mediaId);
          this.setState({
            tour: {
              ...this.state.tour,
              photos: newImages
            }
          });
          this.showNotification('Image was successfully removed.');
        }
      })
      .catch(error => {
        if (error.response && typeof error.response === 'string') {
          console.error(error.response);
          this.showNotificationError(error.response);
        } else {
          console.error({error});
          this.showNotificationError('There is error removing the image.');
        }
      });
  }

  removeImageHighlight = (e) => {
    this.setState({
      highlight: {
        ...this.state.highlight,
        image: ""
      }
    });
    this.showNotification('Highlight image has been removed!');
  }

  removeImageHighlightEdit = (e) => {
    this.setState({
      highlightEdit: {
        ...this.state.highlightEdit,
        image: ""
      }
    });
    this.showNotification('Highlight image has been removed!');
  }

  removeImageSection = (e) => {
    this.setState({
      section: {
        ...this.state.section,
        map: {}
      }
    });
    this.showNotification('Section image has been removed!');
  }

  removeImageSectionEdit = (e) => {
    this.setState({
      sectionEdit: {
        ...this.state.sectionEdit,
        map: ""
      }
    });
    this.showNotification('Section image has been removed!');
  }

  removeImageAddon = (e) => {
    this.setState({
      addonEdit: {
        ...this.state.addon,
        image: ""
      }
    });
    this.showNotification('Addon image has been removed!');
  }

  removeImageAddonEdit = (e) => {
    this.setState({
      addonEdit: {
        ...this.state.addonEdit,
        image: ""
      }
    });
    this.showNotification('Addon image has been removed!');
  }

  onAlertDismiss = (e) => {
    this.setState(prevState => ({
      messageOpen: !prevState.messageOpen
    }));
  };

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
    let sessionToken = "";
    let tour;
    let tourId;
    if(userData) {
      sessionToken = userData.sessionToken;
      tour = {...this.state.tour};
      tourId = this.state.tourId;
      delete tour.photos;
    } else {
      this.props.history.push("/login");
      window.location.reload();
    }

    if (tour) {
      if ( tour.name && !isNaN(tour.price) && !isNaN(tour.numberOfPax) ) {
        if (!window.confirm("Do you want to save this item?")){
          return false;
        }
        this.setState({ submitted: true, isSaving: true });
        api(sessionToken).patch(`/provider/tours/${tourId}`, tour)
          .then(response => {
            if (response && response.data) {
              this.setState({ submitted: false, isSaving: false });
              this.props.history.push("/tours?message=Tour changes has been saved!");
            }
          })
          .catch(error => {
            this.setState({ submitted: false, isSaving: false });
            if(error.response && typeof error.response === 'string' ) {
              this.showNotificationError(error.response);
            } else {
              this.showNotificationError('There is a error saving the tour!');
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

  renderProductTypes() {
    if(this.state.tourTypes !== undefined || this.state.tourTypes != null) {
      const activeProductTypes = this.state.tourTypes.filter(item => item.isActive);
      return activeProductTypes.map((item, index) => (
        <option key={index} value={item._id}>{item.name}</option>
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
                  <Label className="pointer header-label text-info-v2" onClick={this.editHighlight} data-id={index}>{item.name}</Label>
                  <span className="pointer text-muted pull-right-v2" onClick={this.removeHighlight} data-id={index}><Fa icon="times" /></span>
                  <br />
                  <Media className="mt-1">
                    {item.image && item.image.thumb &&
                      <Media left middle>
                        <Media
                          object
                          data-src={item.image.thumb}
                          src={item.image.thumb}
                          alt={item.name}
                          title={item.name}
                        />
                      </Media>
                    }
                    <Media body>
                      <Media>
                        <p>{item.description}</p>
                      </Media>
                    </Media>
                  </Media>
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
                  <Label className="pointer header-label text-info-v2" onClick={this.editSection} data-id={index}><Fa icon={item.iconName} /> {item.name}</Label>
                  <span onClick={this.removeSection} className="text-muted pull-right-v2" data-id={index}><Fa icon="times" /></span>
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
                  <Label className="pointer header-label text-info-v2" onClick={this.editAddon} data-id={index}>{item.name}</Label>
                  <span className="pointer text-muted pull-right-v2" onClick={this.removeAddon} data-id={index}><Fa icon="times" /></span><br />
                  <Media className="mt-1">
                    {item.image && item.image.thumb &&
                      <Media left middle>
                        <Media
                          object
                          data-src={item.image.thumb}
                          src={item.image.thumb}
                          alt={item.name}
                          title={item.name}
                        />
                      </Media>
                    }
                    <Media body>
                      <Media>
                        <Label className="text-navy">&#8369;{numberWithCommas(item.price)}</Label>
                      </Media>
                      <Media>
                        <p>{item.description}</p>
                      </Media>
                    </Media>
                  </Media>  
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
                      placeholder="Highlight"
                      type="text"
                      defaultValue={this.state.highlight.name}
                      onChange={this.handleChangeHighlight}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup>
                    <label htmlFor="image" className="control-label">Image</label>
                    <div style={{ border: '1px solid #ccc', borderRadius: '3px', padding: '3px' }}>
                      <Input name="images" label='upload file' type='file' onChange={this.handleFileUploadHighlight} style={{ position:'relative', cursor: 'pointer' }} />
                    </div>
                    {this.state.highlight.image && this.state.highlight.image.thumb &&
                      <div className="item-image" style={{border:'0',padding:'10px'}}>
                        <img alt={this.state.highlight.name} title={this.state.highlight.name} src={this.state.highlight.image.thumb}/>
                        <button type="button" onClick={this.removeImageHighlight} className="remove-image-tour"><span style={{color:'#fefefe'}}>&times;</span></button>
                      </div>
                    }
                    {this.state.isUploadingHighlight &&
                      <div className="item-image" style={{border:'0',padding:'10px'}}>
                        <SyncLoader
                          sizeUnit={"px"}
                          size={15}
                          color={"#1d8cf8"}
                          loading={this.state.isUploadingHighlight}
                        />
                      </div>
                    }
                  </FormGroup>
                </Col>
                <Col sm="12" md="6" lg="6">
                  <FormGroup className={ this.state.submittedHighlight && !this.state.highlight.order ? " has-danger" : "" }>
                    <label htmlFor="order" className="control-label">Order <em className="text-muted">(Required)</em></label>
                    <Input
                      id="order"
                      name="order"
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

  renderEditHighlightModal() {
    return (
      <Modal className="modal-lg" isOpen={this.state.editHighlightModalOpen} toggle={this.toggleEditHighlightModal} backdrop="static">
        <div className="modal-header">
          <h4 className="modal-title">Edit Tour Highlight - <em className="text-info">{this.state.highlightEdit.name}</em></h4>
          <button type="button" className="close" onClick={this.toggleEditHighlightModal} aria-label="Close" style={{color:"rgba(0, 0, 0, 0.6)"}}><span aria-hidden="true">×</span></button>
        </div>
        <ModalBody>
          <form action="">
            <Col sm="12">
              <Row>
                <Col sm="12">
                  <FormGroup className={ this.state.submittedHighlightEdit && !this.state.highlightEdit.name ? " has-danger" : "" }>
                    <label htmlFor="name" className="control-label">Tour Highlight <em className="text-muted">(Required)</em></label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Highlight"
                      type="text"
                      defaultValue={this.state.highlightEdit.name}
                      onChange={this.handleChangeHighlightEdit}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup>
                    <label htmlFor="image" className="control-label">Image</label>
                    <div style={{ border: '1px solid #ccc', borderRadius: '3px', padding: '3px' }}>
                      <Input name="images" label='upload file' type='file' onChange={this.handleFileUploadHighlightEdit} style={{ position:'relative', cursor: 'pointer' }} />
                    </div>
                    {this.state.highlightEdit.image && this.state.highlightEdit.image.thumb &&
                      <div className="item-image" style={{border:'0',padding:'10px'}}>
                        <img alt={this.state.highlightEdit.name} title={this.state.highlightEdit.name} src={this.state.highlightEdit.image.thumb}/>
                        <button type="button" onClick={this.removeImageHighlightEdit} className="remove-image-tour"><span style={{color:'#fefefe'}}>&times;</span></button>
                      </div>
                    }
                    {this.state.isUploadingHighlight &&
                      <div className="item-image" style={{border:'0',padding:'10px'}}>
                        <SyncLoader
                          sizeUnit={"px"}
                          size={15}
                          color={'#1d8cf8'}
                          loading={this.state.isUploadingHighlight}
                        />
                      </div>
                    }
                  </FormGroup>
                </Col>
                <Col sm="12" md="6" lg="6">
                  <FormGroup className={ this.state.submittedHighlightEdit && !this.state.highlightEdit.order ? " has-danger" : "" }>
                    <label htmlFor="order" className="control-label">Order <em className="text-muted">(Required)</em></label>
                    <Input
                      id="order"
                      name="order"
                      placeholder="Order"
                      type="number"
                      defaultValue={this.state.highlightEdit.order}
                      onChange={this.handleChangeHighlightEdit}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12" md="6" lg="6">
                  <FormGroup className={ this.state.submittedHighlightEdit && !this.state.highlightEdit.day ? " has-danger" : "" }>
                    <label htmlFor="day" className="control-label">Day <em className="text-muted">(Required)</em></label>
                    <Input
                      id="day"
                      name="day"
                      placeholder="Day"
                      type="number"
                      defaultValue={this.state.highlightEdit.day}
                      onChange={this.handleChangeHighlightEdit}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12" md="6" lg="6">
                  <FormGroup className={ this.state.highlightEdit && !this.state.highlightEdit.dateTime ? " has-danger" : "" }>
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
                      selected={this.state.highlightEdit.dateTime}
                      onChange={this.handleChangeDateTimeEdit}
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
                      defaultValue={this.state.highlightEdit.description}
                      onChange={this.handleChangeHighlightEdit}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </Col>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button color="info" onClick={this.handleEditHighlight}>Save</Button>{' '}
            {this.state.editingHighlight && (
              <img
                alt="loading"
                src="data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA=="
              />
            )}
          <Button color="secondary" onClick={this.toggleEditHighlightModal}>Cancel</Button>
        </ModalFooter>
      </Modal>
    );
  }

  editHighlight = (e) => {
    const itemIndex = Number(e.currentTarget.dataset.id);
    const { highlights } = this.state.tour;
    if(highlights instanceof Array && highlights.length > 0) {
      const highlight = highlights.find((item, index) => index === itemIndex);
      this.setState(prevState => ({ 
        submittedHighlightEdit: false,
        editHighlightModalOpen: !prevState.editHighlightModalOpen,
        highlightEdit: {
          index: itemIndex,
          name: highlight.name ? highlight.name : "",
          order: highlight.order ? highlight.order : "",
          day: highlight.day ? highlight.day : "",
          image: highlight.image ? highlight.image : "",
          description: highlight.description ? highlight.description : "",
          dateTime: highlight.dateTime ?  new Date(highlight.dateTime) : new Date(),
        } 
      }));
    }
  }

  toggleEditHighlightModal = () => {
    if(this.state.editHighlightModalOpen === true) {
      if (!window.confirm("Do you want to discard these changes?")){
        return false;
      }
    }
    this.setState(prevState => ({
      submittedHighlightEdit: false,
      editHighlightModalOpen: !prevState.editHighlightModalOpen,
      highlight: {
        name: "",
        order: "",
        day: "",
        image: {},
        description: "",
        dateTime: new Date(),
      }
    }));
  }

  removeHighlight = (e) => {
    if (!window.confirm("Do you want to remove this highlight?")){
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
                    <label htmlFor="price" className="control-label">Order <em className="text-muted">(Required)</em></label>
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
                <Col className="pr-md-1" sm="12">
                  <FormGroup>
                    <label htmlFor="image" className="control-label">Image</label>
                    <div style={{ border: '1px solid #ccc', borderRadius: '3px', padding: '3px' }}>
                      <Input name="images" label='upload file' type='file' onChange={this.handleFileUploadSection} style={{ position:'relative', cursor: 'pointer' }} />
                    </div>
                    {this.state.section.map && this.state.section.map.thumb &&
                      <div className="item-image" style={{border:'0',padding:'10px'}}>
                        <img alt={this.state.section.name} title={this.state.section.name} src={this.state.section.map.thumb}/>
                        <button type="button" onClick={this.removeImageSection} className="remove-image-tour"><span style={{color:'#fefefe'}}>&times;</span></button>
                      </div>
                    }
                    {this.state.isUploadingSection &&
                      <div className="item-image" style={{border:'0',padding:'10px'}}>
                        <SyncLoader
                          sizeUnit={"px"}
                          size={15}
                          color={"#1d8cf8"}
                          loading={this.state.isUploadingSection}
                        />
                      </div>
                    }
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
            {this.state.addingSection && (
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
      addSectionModalOpen: !prevState.addSectionModalOpen,
      section: {
        name: "",
        order: sectionsLength,
        route: "",
        iconName: "",
        iconType: "FontAwesome",
        map: {},
        title: "",
        text: "",
      }
    }));
  }

  renderEditSectionModal() {
    return (
      <Modal className="modal-lg" isOpen={this.state.editSectionModalOpen} toggle={this.toggleEditSectionModal} backdrop="static">
        <div className="modal-header">
          <h4 className="modal-title">Edit Tour Section - <em>{this.state.sectionEdit.name}</em></h4>
          <button type="button" className="close" onClick={this.toggleEditSectionModal} aria-label="Close" style={{color:"rgba(0, 0, 0, 0.6)"}}><span aria-hidden="true">×</span></button>
        </div>
        <ModalBody>
          <form action="">
            <Col sm="12">
              <Row>
                <Col sm="12">
                  <FormGroup className={ this.state.submittedSectionEdit && !this.state.sectionEdit.name ? " has-danger" : "" }>
                    <label htmlFor="name" className="control-label">Tour Section <em className="text-muted">(Required)</em></label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Section Name"
                      type="text"
                      defaultValue={this.state.sectionEdit.name}
                      onChange={this.handleChangeSectionEdit}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup className={ this.state.submittedSection && !this.state.sectionEdit.order ? " has-danger" : "" }>
                    <label htmlFor="price" className="control-label">Order <em className="text-muted">(Required)</em></label>
                    <Input
                      id="order"
                      name="order"
                      placeholder="Order"
                      type="number"
                      defaultValue={this.state.sectionEdit.order}
                      onChange={this.handleChangeSectionEdit}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup className={ this.state.submittedSectionEdit && !this.state.sectionEdit.route ? " has-danger" : "" }>
                    <label htmlFor="route" className="control-label">Route <em className="text-muted">(Required)</em></label>
                    <Input
                      id="route"
                      name="route"
                      placeholder="Section Route"
                      type="text"
                      defaultValue={this.state.sectionEdit.route}
                      onChange={this.handleChangeSectionEdit}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup className={ this.state.submittedSectionEdit && !this.state.sectionEdit.iconName ? " has-danger" : "" }>
                    <label htmlFor="location" className="control-label">Icon <em className="text-muted">(Required)</em></label>
                    <Select
                      className="react-select"
                      styles={{fontSize:'13px !important'}}
                      options={options}
                      onChange={this.handleChangeSectionIconEdit}
                      placeholder="Select icon"
                      defaultValue={options.filter(item => item.value === this.state.sectionEdit.iconName)}
                    />
                  </FormGroup>
                </Col>
                <Col className="pr-md-1" sm="12">
                  <FormGroup>
                    <label htmlFor="image" className="control-label">Image</label>
                    <div style={{ border: '1px solid #ccc', borderRadius: '3px', padding: '3px' }}>
                      <Input name="images" label='upload file' type='file' onChange={this.handleFileUploadSectionEdit} style={{ position:'relative', cursor: 'pointer' }} />
                    </div>
                    {this.state.sectionEdit.map && this.state.sectionEdit.map.thumb &&
                      <div className="item-image" style={{border:'0',padding:'10px'}}>
                        <img alt={this.state.sectionEdit.name} title={this.state.sectionEdit.name} src={this.state.sectionEdit.map.thumb}/>
                        <button type="button" onClick={this.removeImageSectionEdit} className="remove-image-tour"><span style={{color:'#fefefe'}}>&times;</span></button>
                      </div>
                    }
                    {this.state.isUploadingSection &&
                      <div className="item-image" style={{border:'0',padding:'10px'}}>
                        <SyncLoader
                          sizeUnit={"px"}
                          size={15}
                          color={"#1d8cf8"}
                          loading={this.state.isUploadingSection}
                        />
                      </div>
                    }
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
                      defaultValue={this.state.sectionEdit.title}
                      onChange={this.handleChangeSectionEdit}
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
                      defaultValue={this.state.sectionEdit.text}
                      onChange={this.handleChangeSectionEdit}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </Col>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button color="info" onClick={this.handleEditSection}>Save</Button>{' '}
            {this.state.editingSection && (
              <img
                alt="loading"
                src="data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA=="
              />
            )}
          <Button color="secondary" onClick={this.toggleEditSectionModal}>Cancel</Button>
        </ModalFooter>
      </Modal>
    );
  }

  toggleEditSectionModal = () => {
    if(this.state.editSectionModalOpen === true) {
      if (!window.confirm("Do you want to discard these changes?")){
        return false;
      }
    }
    this.setState(prevState => ({
      editSectionModalOpen: !prevState.editSectionModalOpen,
      submittedSectionEdit: false,
      sectionEdit: {
        index: "",
        name: "",
        order: "",
        route: "",
        iconName: "",
        map: {},
        title: "",
        text: "",
      }
    }));
  }

  editSection = (e) => {
    let sectionsLength = 1;
    const itemIndex = Number(e.currentTarget.dataset.id);
    let { sections } = this.state.tour;
    if(sections instanceof Array && sections.length > 0) {
      sectionsLength = sections.length + 1;
      const section = sections.find((item, index) => index === itemIndex);
      const data = (section.data instanceof Array && section.data.length > 0) ? section.data[0] : null;
      this.setState(prevState => ({
        editSectionModalOpen: !prevState.editSectionModalOpen,
        submittedSectionEdit: false,
        sectionEdit: {
          index: itemIndex,
          name: section.name ? section.name : "",
          order: section.order ? section.order : sectionsLength,
          route: section.route ? section.route : "",
          iconName: section.iconName ? section.iconName : "",
          map: section.map ? section.map : {},
          title: (data && data.title) ? data.title : "",
          text: (data && data.text) ? data.text : "",
        }
      }));
    }
  }

  removeSection = (e) => {
    if (!window.confirm("Are you sure you want to remove this section?")){
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
      <Modal isOpen={this.state.addAddonModalOpen} toggle={this.toggleAddAddonModal} backdrop="static">
        <div className="modal-header">
          <h4 className="modal-title">Add Tour Addon</h4>
          <button type="button" className="close" onClick={this.toggleAddAddonModal} aria-label="Close" style={{color:"rgba(0, 0, 0, 0.6)"}}><span aria-hidden="true">×</span></button>
        </div>
        <ModalBody>
          <form action="">
            <Col sm="12">
              <Row>
                <Col sm="12">
                  <FormGroup className={ this.state.submittedAddon && !this.state.addon.name ? " has-danger" : "" }>
                    <label htmlFor="name" className="control-label">Title <em className="text-muted">(Required)</em></label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Name"
                      type="text"
                      defaultValue={this.state.addon.name}
                      onChange={this.handleChangeAddon}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup>
                    <label htmlFor="image" className="control-label">Image</label>
                    <div style={{ border: '1px solid #ccc', borderRadius: '3px', padding: '3px' }}>
                      <Input name="images" label='upload file' type='file' onChange={this.handleFileUploadAddon} style={{ position:'relative', cursor: 'pointer' }} />
                    </div>
                    {this.state.addon.image && this.state.addon.image.thumb &&
                      <div className="item-image" style={{border:'0',padding:'10px'}}>
                        <img alt={this.state.addon.name} title={this.state.addon.name} src={this.state.addon.image.thumb}/>
                        <button type="button" onClick={this.removeImageAddon} className="remove-image-tour"><span style={{color:'#fefefe'}}>&times;</span></button>
                      </div>
                    }
                    {this.state.isUploadingAddon &&
                      <div className="item-image" style={{border:'0',padding:'10px'}}>
                        <SyncLoader
                          sizeUnit={"px"}
                          size={15}
                          color={'#1d8cf8'}
                          loading={this.state.isUploadingAddon}
                        />
                      </div>
                    }
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
                    <label htmlFor="addon-type" className="control-label">Type:</label>
                    <Input
                      id="addon-type"
                      name="type"
                      type="select"
                      onChange={this.handleChangeAddon}
                      value={this.state.addon.type}
                    >
                      <option value="group">Group</option>
                      <option value="person">Person</option>
                    </Input>
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

  renderEditTourAddonModal() {
    return (
      <Modal className="modal-lg" isOpen={this.state.editAddonModalOpen} toggle={this.toggleEditAddonModal} backdrop="static">
        <div className="modal-header">
          <h4 className="modal-title">Edit Tour Addon - <em className="text-info">{this.state.addonEdit.name}</em></h4>
          <button type="button" className="close" onClick={this.toggleEditAddonModal} aria-label="Close" style={{color:"rgba(0, 0, 0, 0.6)"}}><span aria-hidden="true">×</span></button>
        </div>
        <ModalBody>
          <form action="">
            <Col sm="12">
              <Row>
                <Col sm="12">
                  <FormGroup className={ this.state.submittedAddonEdit && !this.state.addonEdit.name ? " has-danger" : "" }>
                    <label htmlFor="name" className="control-label">Title <em className="text-muted">(Required)</em></label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Name"
                      type="text"
                      defaultValue={this.state.addonEdit.name}
                      onChange={this.handleChangeAddonEdit}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup>
                    <label htmlFor="image" className="control-label">Image</label>
                    <div style={{ border: '1px solid #ccc', borderRadius: '3px', padding: '3px' }}>
                      <Input name="images" label='upload file' type='file' onChange={this.handleFileUploadAddonEdit} style={{ position:'relative', cursor: 'pointer' }} />
                    </div>
                    {this.state.addonEdit.image && this.state.addonEdit.image.thumb &&
                      <div className="item-image" style={{border:'0',padding:'10px'}}>
                        <img alt={this.state.addonEdit.name} title={this.state.addonEdit.name} src={this.state.addonEdit.image.thumb}/>
                        <button type="button" onClick={this.removeImageAddonEdit} className="remove-image-tour"><span style={{color:'#fefefe'}}>&times;</span></button>
                      </div>
                    }
                    {this.state.isUploadingAddon &&
                      <div className="item-image" style={{border:'0',padding:'10px'}}>
                        <SyncLoader
                          sizeUnit={"px"}
                          size={15}
                          color={'#1d8cf8'}
                          loading={this.state.isUploadingAddon}
                        />
                      </div>
                    }
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup className={ this.state.submittedAddonEdit && !this.state.addonEdit.price ? " has-danger" : "" }>
                    <label htmlFor="price" className="control-label">Price <em className="text-muted">(Required)</em></label>
                    <Input
                      id="price"
                      name="price"
                      placeholder="&#8369;"
                      type="text"
                      defaultValue={this.state.addonEdit.price}
                      onChange={this.handleChangeAddonEdit}
                    />
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup>
                    <label htmlFor="addon-type" className="control-label">Type:</label>
                    <Input
                      id="addon-type"
                      name="type"
                      type="select"
                      onChange={this.handleChangeAddonEdit}
                      value={this.state.addonEdit.type}
                    >
                      <option value="group">Group</option>
                      <option value="person">Person</option>
                    </Input>
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
                      defaultValue={this.state.addonEdit.description}
                      onChange={this.handleChangeAddonEdit}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </Col>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button color="info" onClick={this.handleEditAddon}>Save</Button>{' '}
            {this.state.editingAddon && (
              <img
                alt="loading"
                src="data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA=="
              />
            )}
          <Button color="secondary" onClick={this.toggleEditAddonModal}>Cancel</Button>
        </ModalFooter>
      </Modal>
    );
  }

  editAddon = (e) => {
    const itemIndex = Number(e.currentTarget.dataset.id);
    const { addons } = this.state.tour;
    if(addons instanceof Array && addons.length > 0) {
      const addon = addons.find((item, index) => index === itemIndex);
      this.setState(prevState => ({ 
        submittedAddonEdit: false,
        editAddonModalOpen: !prevState.editAddonModalOpen,
        addonEdit: {
          index: itemIndex,
          name: addon.name ? addon.name : "",
          image: addon.image ? addon.image : "",
          price: addon.price ? addon.price : "0",
          type: addon.type ? addon.type : "group",
          description: addon.description ? addon.description : "",
        } 
      }));
    }
  }

  toggleAddAddonModal = () => {
    this.setState(prevState => ({
      addAddonModalOpen: !prevState.addAddonModalOpen,
      addon: {
        name: "",
        image: {},
        price: "0",
        description: "",
      }
    }));
  }

  toggleEditAddonModal = () => {
    this.setState(prevState => ({
      editAddonModalOpen: !prevState.editAddonModalOpen,
      addonEdit: {
        name: "",
        image: {},
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
    const userData = JSON.parse(getSession("userData"));

    if(!userData) {
      this.props.history.push("/login");
      window.location.reload();
    }

    let { submitted } = this.state;

    if(this.state.isLoading) {
      return (
        <>
          <div className="content">
            <Row>
              <Col sm="12" md="12" lg="12">
                <Card>
                  <CardHeader>
                    <h4 className="title">Edit Tour</h4>
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
      if(this.state.tour) {
        return (
          <>
            <div className="content">
              <div className="react-notification-alert-container">
                <NotificationAlert ref="notify" />
              </div>
              <Row>
                <Col sm="12" md="12" lg="12">
                <Alert color="info" isOpen={this.state.messageOpen} toggle={this.onAlertDismiss}>
                  {this.state.message}
                </Alert>
                </Col>
                <Col sm="12" md="12" lg="12">
                  <Card>
                    <Form onSubmit={this.handleSubmit} onKeyPress={this.onKeyPress}>
                      <CardHeader>
                        <h3 className="title">Edit Tour - <em className="text-info">{this.state.tour.name}</em></h3>
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
                              <Col sm="12" md="6" lg="6">
                                <FormGroup>
                                  <label htmlFor="images"><strong>Upload Photo</strong></label>
                                  <div className="upload-photo" style={{ margin: '10px auto', border: '1px solid #ccc', 'backgroundColor': '#efefef' }}>
                                  <Input name="images" label='upload file' type='file' onChange={this.handleFileUpload} style={divStyle} />
                                    <ul className="product-photos">
                                      {this.state.tour.photos.length > 0 &&
                                        <>
                                          {this.state.tour.photos.map(({original, thumb, _id: id }) => 
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
                                    value={this.state.tour.about}
                                    onChange={this.handleChange}
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
                {this.renderEditHighlightModal()}
                {this.renderAddSectionModal()}
                {this.renderEditSectionModal()}
                {this.renderAddTourAddonModal()}
                {this.renderEditTourAddonModal()}
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
                      <h4 className="title">Edit Tour</h4>
                    </CardHeader>
                    <CardBody>
                      <h4 className="text-danger"><strong>Tour not found</strong></h4>
                    </CardBody>
                    <CardFooter>
                      <Link to="/tours" className="btn btn-round btn-default">Back to Tours</Link>
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