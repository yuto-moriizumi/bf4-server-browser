import React from "react";
import { Image, Button, Container, Nav, Navbar, Table, Spinner } from "react-bootstrap";
import axios from "axios";

type Server = {
  guid: string;
  img: string;
  name: string;
  details: string;
  players: string;
  teams?: Team[];
};
type Team = {
  name: string;
  ticket: number;
};
type State = {
  isUpdate: boolean;
  servers: Server[];
};
export default class App extends React.Component<{}, State> {
  state = { isUpdate: false, servers: new Array<Server>() };
  private SERVER_HOST = process.env.REACT_APP_SERVER_URL || "SERVER_HOST";

  componentWillMount() {
    this.update();
  }
  private async update() {
    this.setState({ isUpdate: true });
    try {
      const res = await axios.get(`${this.SERVER_HOST}/servers`);
      if (res) this.setState({ servers: res.data });
      for await (const server of this.state.servers) {
        const res = (await axios
          .get(`${this.SERVER_HOST}/servers/${server.guid}`)
          .catch((e) => console.log(e))) as { data: any };
        console.log(res.data);
        this.setState({
          servers: this.state.servers.map((server2) => {
            if (server2 === server) server2.teams = res.data;
            return server2;
          }),
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      this.setState({ isUpdate: false });
    }
  }
  private getTicketDiff(teams: Team[]) {
    if (!(teams instanceof Array) || teams.length < 2) return <>NONE</>;
    //降順に整列
    const sorted_teams = teams.sort((a, b) => b.ticket - a.ticket);
    const obj = { winner: sorted_teams[0].name, diff: sorted_teams[0].ticket - sorted_teams[1].ticket };
    return (
      <>
        <p className="mb-0">優勢：{obj.winner}</p>
        <p className="mb-0">差：{obj.diff}</p>
      </>
    );
  }
  render() {
    return (
      <>
        <Navbar bg="light" expand="sm">
          <Navbar.Brand>
            <h1>Yuto's BF4 Server Browser</h1>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ml-auto"></Nav>
          </Navbar.Collapse>
        </Navbar>
        <Container className="text-center">
          <Button
            size="lg"
            className="my-4"
            disabled={this.state.isUpdate}
            onClick={(e) => {
              this.update();
            }}
          >
            {this.state.isUpdate ? <Spinner animation="border" /> : "更新"}
          </Button>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>#</th>
                <th>サーバ</th>
                <th>プレイヤー</th>
                <th>チケット</th>
              </tr>
            </thead>
            <tbody>
              {this.state.servers.map((server) => {
                return (
                  <tr key={server.guid}>
                    <td className="p-1">
                      <Image src={server.img} fluid />
                    </td>
                    <td className="p-1">
                      {server.name}
                      <br />
                      {server.details}
                    </td>
                    <td className="p-1">{server.players}</td>
                    <td className="p-1">{server.teams ? this.getTicketDiff(server.teams) : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Container>
      </>
    );
  }
}
