/*eslint-disable*/
import React from "react";
// used for making the prop types of this component
import PropTypes from "prop-types";

// reactstrap components
import { Container, Row, Nav, NavItem, NavLink } from "reactstrap";

class Footer extends React.Component {
  render() {
    return (
      <footer className="footer">
        <Container fluid>
          <Nav>
            <NavItem>
              <NavLink href="https://www.streetby.com">StreetBy</NavLink>
            </NavItem>
            <NavItem>
              <NavLink href="https://www.streetby.com/contact-us">Contact Us</NavLink>
            </NavItem>
          </Nav>
          <div className="copyright">
            &copy; {new Date().getFullYear()} Agila Innovations Inc.
          </div>
        </Container>
      </footer>
    );
  }
}

export default Footer;
