import React from 'react'

import { Classes, ITreeNode, Tree } from '@blueprintjs/core'

import { buildTree } from './utils/tree'

export default class FileNavigator extends React.Component<any, any> {
  state = {
    files: undefined,
    nodes: []
  }

  async componentDidMount() {
    await this.refreshNodes()
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.files !== this.props.files && this.props.files) {
      await this.refreshNodes()
    }
  }

  async refreshNodes() {
    if (!this.props.files) {
      return
    }

    const { actionsGlobal, actionsBot } = this.props.files

    const nodes = []

    if (actionsBot) {
      nodes.push({
        label: `${window['BOT_NAME']} (bot)`,
        icon: 'folder-close',
        hasCaret: true,
        isExpanded: true,
        childNodes: buildTree(this.props.files.actionsBot)
      })
    }

    if (actionsGlobal) {
      nodes.push({
        label: 'Global',
        icon: 'folder-close',
        isExpanded: true,
        childNodes: buildTree(this.props.files.actionsGlobal)
      })
    }

    this.setState({ nodes })
  }

  private handleNodeClick = (node: ITreeNode) => {
    const originallySelected = node.isSelected

    this.traverseTree(this.state.nodes, n => (n.isSelected = false))

    node.isSelected = originallySelected !== null

    this.props.onFileSelected && this.props.onFileSelected(node.nodeData)
    this.setState(this.state)
  }

  private handleNodeCollapse = (node: ITreeNode) => {
    node.isExpanded = false
    this.setState(this.state)
  }

  private handleNodeExpand = (node: ITreeNode) => {
    node.isExpanded = true
    this.setState(this.state)
  }

  private traverseTree(nodes: ITreeNode[], callback: (node: ITreeNode) => void) {
    if (nodes == null) {
      return
    }

    for (const node of nodes) {
      callback(node)
      this.traverseTree(node.childNodes, callback)
    }
  }

  render() {
    if (!this.state.nodes) {
      return null
    }

    return (
      <Tree
        contents={this.state.nodes}
        onNodeClick={this.handleNodeClick}
        onNodeCollapse={this.handleNodeCollapse}
        onNodeExpand={this.handleNodeExpand}
        className={Classes.ELEVATION_0}
      />
    )
  }
}
