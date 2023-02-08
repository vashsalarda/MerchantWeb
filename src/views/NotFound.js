import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";  
import { getProviderInfo, updateProfile } from "../layouts/User/UserActions";

import {
  Alert,
  Card,
  CardBody,
  Row,
  Col
} from "reactstrap";

class Settings extends React.Component {
  render() {
    return (
      <>
        <div className="content">
          <Row>
            <Col sm="12" md="12" lg="12">
              <Card>
                <CardBody>
                  <Alert color="danger">
                    <h4 className="alert-heading">Page Not Found</h4>
                    <hr />
                    <p className="mb-0">
                      We are sorry, the page you requested could not be found . Click {" "} <Link to="/products">here</Link> {" "} go back to the homepage.
                    </p>
                  </Alert>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      </>
    );
  }
}

const mapStateToProps = () => ({});

//export default UserProfile;
export default connect(mapStateToProps,{getProviderInfo, updateProfile})(Settings);
