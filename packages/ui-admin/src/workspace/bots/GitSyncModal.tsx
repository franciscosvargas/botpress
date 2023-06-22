import { Button, Checkbox, Classes, Dialog, FileInput, FormGroup, InputGroup, Intent, Callout } from '@blueprintjs/core'
import { lang, toast } from 'botpress/shared'
import _ from 'lodash'
import ms from 'ms'
import React, { Component } from 'react'

import api from '~/app/api'
import { sanitizeBotId } from './CreateBotModal'

interface Props {
  onCreateBotSuccess: () => void
  toggle: () => void
  isOpen: boolean
  botId: string
}

interface State {
  error: any
  filePath: string | null
  fileContent: Buffer | null
  isIdTaken: boolean
  isExistingBot: boolean
  isProcessing: boolean
  overwrite: boolean
  progress: number
  gitCommitMessage: string
  gitCommitAuthorName: string
  gitCommitAuthorEmail: string
  gitSecurityToken: string
}

const defaultState: State = {
  gitCommitMessage: '',
  gitSecurityToken: '',
  gitCommitAuthorName: '',
  gitCommitAuthorEmail: '',
  error: null,
  filePath: null,
  fileContent: null,
  isIdTaken: false,
  isExistingBot: false,
  isProcessing: false,
  overwrite: false,
  progress: 0
}

class ImportBotModal extends Component<Props, State> {
  private _form: HTMLFormElement | null = null

  state: State = { ...defaultState }

  importBot = async e => {
    e.preventDefault()
    if (this.isButtonDisabled) {
      return
    }

    this.setState({ isProcessing: true, progress: 0 })

    try {
      await api.getSecured({ timeout: ms('20m') }).post(`/admin/workspace/bots/${this.props.botId}/git/export`, {
        commitMessage: this.state.gitCommitMessage,
        author: {
          email: this.state.gitCommitAuthorEmail,
          name: this.state.gitCommitAuthorName
        },
        securityToken: this.state.gitSecurityToken
      })

      toast.success('Changes pushed to main!', this.props.botId)

      this.props.onCreateBotSuccess()
      this.toggleDialog()
    } catch (error) {
      this.setState({ error: error.message, isProcessing: false })
    } finally {
      this.setState({ progress: 0 })
    }
  }

  handleGitSecurityTokenChanged = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({ gitSecurityToken: e.currentTarget.value, overwrite: false })

  handleGitCommitMessageChanged = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({ gitCommitMessage: e.currentTarget.value, overwrite: false })

  handleGitCommitAuthorEmailChanged = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({ gitCommitAuthorEmail: e.currentTarget.value, overwrite: false })

  handleGitCommitAuthorNameChanged = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({ gitCommitAuthorName: e.currentTarget.value, overwrite: false })

  toggleDialog = () => {
    this.setState({ ...defaultState })
    this.props.toggle()
  }

  get isButtonDisabled() {
    const { isProcessing, gitCommitMessage, gitCommitAuthorName, gitCommitAuthorEmail, gitSecurityToken } = this.state
    return (
      isProcessing ||
      !gitCommitMessage ||
      !gitCommitAuthorName ||
      !gitCommitAuthorEmail ||
      !gitSecurityToken ||
      !this._form ||
      !this._form.checkValidity()
    )
  }

  render() {
    const { isProcessing, progress } = this.state

    let buttonText = lang.tr('admin.workspace.bots.import.import')
    if (isProcessing) {
      if (progress !== 0) {
        buttonText = lang.tr('admin.versioning.uploadProgress', { progress })
      } else {
        buttonText = lang.tr('admin.versioning.processing')
      }
    }
    return (
      <Dialog
        title={'Git Sync'}
        icon="git-branch"
        isOpen={this.props.isOpen}
        onClose={this.toggleDialog}
        transitionDuration={0}
        canOutsideClickClose={false}
      >
        <form ref={form => (this._form = form)}>
          <div className={Classes.DIALOG_BODY}>
            <FormGroup
              label={'Commit Message'}
              labelInfo="*"
              labelFor="archive"
              helperText={'The default commit branch is main/master, you cannot change it at this point.'}
            >
              <InputGroup
                id="input-gitCommitMessage"
                tabIndex={1}
                placeholder={'Your simple commit message'}
                intent={Intent.PRIMARY}
                minLength={3}
                maxLength={500}
                value={this.state.gitCommitMessage}
                onChange={this.handleGitCommitMessageChanged}
                autoFocus={false}
              />
            </FormGroup>
            <FormGroup label={'Commit Author Name'} labelInfo="" labelFor="archive">
              <InputGroup
                id="input-gitCommitAuthorName"
                tabIndex={1}
                placeholder={'Name of the commit author'}
                intent={Intent.PRIMARY}
                minLength={3}
                maxLength={500}
                value={this.state.gitCommitAuthorName}
                onChange={this.handleGitCommitAuthorNameChanged}
                autoFocus={false}
              />
            </FormGroup>
            <FormGroup label={'Commit Author Email'} labelInfo="" labelFor="archive">
              <InputGroup
                id="input-gitCommitAuthorEmail"
                tabIndex={1}
                placeholder={'Email of the commit author'}
                intent={Intent.PRIMARY}
                minLength={3}
                maxLength={500}
                value={this.state.gitCommitAuthorEmail}
                onChange={this.handleGitCommitAuthorEmailChanged}
                autoFocus={false}
              />
            </FormGroup>
            <FormGroup label={lang.tr('admin.workspace.bots.import.gitSecurityToken')} labelInfo="" labelFor="archive">
              <InputGroup
                id="input-gitSecurityToken"
                tabIndex={1}
                placeholder={'The personal token to push commits'}
                intent={Intent.PRIMARY}
                minLength={3}
                maxLength={500}
                value={this.state.gitSecurityToken}
                onChange={this.handleGitSecurityTokenChanged}
                autoFocus={false}
              />
            </FormGroup>
          </div>
          <div className={Classes.DIALOG_FOOTER}>
            {!!this.state.error && <Callout intent={Intent.DANGER}>{this.state.error}</Callout>}
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <Button
                id="btn-import-bot"
                tabIndex={3}
                type="submit"
                text={'Commit & Push'}
                onClick={this.importBot}
                disabled={this.isButtonDisabled}
                intent={Intent.PRIMARY}
              />
            </div>
          </div>
        </form>
      </Dialog>
    )
  }
}

export default ImportBotModal
