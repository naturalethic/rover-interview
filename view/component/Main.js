import React from 'react'
import axios from 'axios'

import config from '../../client.config'

import {
  Container,
  Dropdown,
  Header,
  Icon,
  Image,
  Menu,
  Table
} from 'semantic-ui-react'

export default class Main extends React.Component {
  constructor () {
    super()
    this.state = {
      sitters: [],
      pageCount: 1,
      sittersQuery: {
        minRank: 1,
        pageNumber: 1,
        pageSize: 10,
        sortBy: 'rank',
        sortReverse: true
      }
    }
    this.fetchSitters()
  }

  fetchSitters () {
    console.log('Fetching')
    const query = new URLSearchParams()
    for (var key in this.state.sittersQuery) {
      query.set(key, this.state.sittersQuery[key])
    }
    axios.get(`http://${config.api.host}:${config.api.port}/sitters?${query.toString()}`)
    .then(({ data }) => this.setState(data))
  }

  onChangePageSize (pageSize) {
    const sittersQuery = Object.assign(this.state.sittersQuery, { pageSize, pageNumber: 1 })
    this.setState({ sittersQuery })
    this.fetchSitters()
  }

  onChangePageNumber (pageNumber) {
    pageNumber = pageNumber < 1 ? 1 : pageNumber
    pageNumber = pageNumber > this.state.pageCount ? this.state.pageCount : pageNumber
    if (pageNumber === this.state.sittersQuery.pageNumber) return
    const sittersQuery = Object.assign(this.state.sittersQuery, { pageNumber })
    this.setState({ sittersQuery })
    this.fetchSitters()
  }

  onChangeMinRank (minRank) {
    const sittersQuery = Object.assign(this.state.sittersQuery, { minRank })
    this.setState({ sittersQuery })
  }

  render () {
    const pageSizes = [ 10, 25, 50, 100 ].map(n => ({ value: n, text: n }))
    const { pageNumber, pageSize, minRank } = this.state.sittersQuery
    var pageButtonCount = Math.max(1, Math.min(9, this.state.pageCount) - 1)
    const pageNumbers = [ pageNumber ]
    while (this.state.pageCount > 1 && pageButtonCount) {
      if (pageNumbers[0] - 1 > 0) {
        pageNumbers.unshift(pageNumbers[0] - 1)
        pageButtonCount--
      }
      if (pageNumbers[pageNumbers.length - 1] + 1 <= this.state.pageCount) {
        pageNumbers.push(pageNumbers[pageNumbers.length - 1] + 1)
        pageButtonCount--
      }
    }
    return (
      <Container style={{ marginTop: '15px' }}>
        <Table basic='very' celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell colSpan='3'>
                Show&nbsp;
                <Menu compact>
                  <Dropdown options={pageSizes} value={pageSize} item compact
                    onChange={(_, it) => this.onChangePageSize(it.value)}
                  />
                </Menu>
                &nbsp;results
                <div style={{ float: 'right', marginTop: '10px' }}>
                  Minimum Rank&nbsp;&nbsp;&nbsp;&nbsp;
                  <input
                    style={{ position: 'relative', top: '3px' }}
                    type='range' min='0' max='5' step='0.05'
                    defaultValue={minRank}
                    onChange={e => this.onChangeMinRank(e.target.valueAsNumber)}
                    onMouseUp={e => this.fetchSitters()}
                  />
                  &nbsp;&nbsp;&nbsp;&nbsp;{ minRank.toFixed(2) }
                </div>
              </Table.HeaderCell>
            </Table.Row>
            <Table.Row>
              <Table.HeaderCell>Sitter</Table.HeaderCell>
              <Table.HeaderCell>Rank</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {this.state.sitters.map(sitter => (
              <Table.Row key={sitter.id}>
                <Table.Cell>
                  <Header as='h4' image>
                    <Image rounded bordered size='mini' src={sitter.image} />
                    <Header.Content>{sitter.name}</Header.Content>
                  </Header>
                </Table.Cell>
                <Table.Cell>{sitter.rank.toFixed(2)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
          <Table.Footer>
            <Table.Row>
              <Table.HeaderCell colSpan='3'>
                <Menu floated='right' pagination>
                  <Menu.Item icon onClick={(_, it) => this.onChangePageNumber(pageNumber - 1)}>
                    <Icon name='left chevron' />
                  </Menu.Item>
                  {pageNumbers.map(n => (
                    <Menu.Item
                      style={{width: '20px'}}
                      key={n}
                      content={n}
                      active={n === pageNumber}
                      onClick={(_, it) => this.onChangePageNumber(it.content)}
                    />
                  ))}
                  <Menu.Item icon onClick={(_, it) => this.onChangePageNumber(pageNumber + 1)}>
                    <Icon name='right chevron' />
                  </Menu.Item>
                </Menu>
              </Table.HeaderCell>
            </Table.Row>
          </Table.Footer>
        </Table>
      </Container>
    )
  }
}
