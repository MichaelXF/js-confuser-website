
import {Navbar, Nav, Dropdown, Icon} from "rsuite";
import "./Nav.scss"

export default function SiteNav(){
  return <Navbar>
  <Navbar.Header>
    <a href="#" className="navbar-brand logo">
      RSUITE
    </a>
  </Navbar.Header>
  <Navbar.Body>
    <Nav>
      <Nav.Item eventKey="1" icon={<Icon icon="home" />}>
        Home
      </Nav.Item>
      <Nav.Item eventKey="2">News</Nav.Item>
      <Nav.Item eventKey="3">Products</Nav.Item>
      <Dropdown title="About">
        <Dropdown.Item eventKey="4">Company</Dropdown.Item>
        <Dropdown.Item eventKey="5">Team</Dropdown.Item>
        <Dropdown.Item eventKey="6">Contact</Dropdown.Item>
      </Dropdown>
    </Nav>
    <Nav pullRight>
      <Nav.Item icon={<Icon icon="cog" />}>Settings</Nav.Item>
    </Nav>
  </Navbar.Body>
</Navbar>
}