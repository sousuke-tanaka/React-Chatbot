import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import Random from 'random-id';
import { CustomStep, OptionsStep, TextStep } from './steps/steps';
import styles from './ChatBot.styles';

class ChatBot extends Component {
  constructor(props) {
    super(props);

    this.state = {
      renderedSteps: [],
      previousSteps: [],
      currentStep: {},
      previousStep: {},
      steps: {},
      disabled: true,
      inputValue: '',
      inputInvalid: false,
      defaulBotSettings: {},
      defaulUserSettings: {},
    };

    this.renderStep = this.renderStep.bind(this);
    this.triggerNextStep = this.triggerNextStep.bind(this);
    this.onValueChange = this.onValueChange.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  componentWillMount() {
    const {
      delay,
      botAvatar,
      botBubbleColor,
      botFontColor,
      userAvatar,
      userBubbleColor,
      userFontColor,
    } = this.props;
    const steps = {};

    const defaulBotSettings = {
      delay,
      avatar: botAvatar,
      bubbleColor: botBubbleColor,
      fontColor: botFontColor,
    };
    const defaulUserSettings = {
      delay,
      avatar: userAvatar,
      bubbleColor: userBubbleColor,
      fontColor: userFontColor,
    };

    for (let i = 0, len = this.props.steps.length; i < len; i += 1) {
      const step = this.props.steps[i];

      steps[step.id] = Object.assign(
        {},
        step,
        defaulBotSettings,
      );
    }

    const currentStep = this.props.steps[0];
    const renderedSteps = [steps[currentStep.id]];
    const previousSteps = [steps[currentStep.id]];

    this.setState({
      defaulBotSettings,
      defaulUserSettings,
      steps,
      currentStep,
      renderedSteps,
      previousSteps,
    });
  }

  componentDidMount() {
    const chatbotMain = document.querySelector('.simple-chatbot-main');
    chatbotMain.addEventListener('DOMNodeInserted', onNodeInserted, false);

    function onNodeInserted() {
      chatbotMain.scrollTop = chatbotMain.scrollHeight;
    }
  }

  onValueChange(event) {
    this.setState({ inputValue: event.target.value });
  }

  triggerNextStep(value) {
    const {
      renderedSteps,
      previousSteps,
      steps,
      defaulUserSettings,
    } = this.state;
    let { currentStep, previousStep } = this.state;
    const isEnd = currentStep.end;

    if (value) {
      currentStep.value = value;
    }

    if (isEnd) {
      this.handleEnd();
    } else {
      const isReplace = currentStep.replace && !currentStep.option;

      if (isReplace) {
        renderedSteps.pop();
      }

      if (currentStep.options) {
        const option = currentStep.options.filter(o => o.value === value)[0];
        delete currentStep.options;

        currentStep = Object.assign(
          {},
          currentStep,
          option,
          defaulUserSettings,
          {
            user: true,
            trigger: option.trigger,
            message: option.label,
          },
        );

        renderedSteps.pop();
        previousSteps.pop();
        renderedSteps.push(currentStep);
        previousSteps.push(currentStep);

        this.setState({
          currentStep,
          renderedSteps,
          previousSteps,
        });
      } else if (currentStep.trigger) {
        const nextSteps = Object.assign({}, steps[currentStep.trigger]);
        nextSteps.key = Random(24);

        previousStep = currentStep;
        currentStep = nextSteps;

        this.setState({ currentStep, previousStep });

        if (nextSteps.user && nextSteps.type) {
          this.setState({ disabled: false }, () => {
            document.querySelector('.chat-input').focus();
          });
        } else {
          renderedSteps.push(nextSteps);
          previousSteps.push(nextSteps);

          this.setState({ renderedSteps, previousSteps });
        }
      }
    }
  }

  handleEnd() {
    const { previousSteps } = this.state;

    const steps = previousSteps.map((step) => {
      const { id, message, value } = step;
      return { id, message, value };
    });

    if (this.props.handleEnd) {
      this.props.handleEnd({ steps });
    }
  }

  checkLastPosition(step) {
    const { renderedSteps } = this.state;
    const length = renderedSteps.length;
    const stepIndex = renderedSteps.map(s => s.key).indexOf(step.key);

    if (length <= 1 || (stepIndex + 1) === length || !renderedSteps[stepIndex + 1].message) {
      return true;
    }

    const isLast = step.user !== renderedSteps[stepIndex + 1].user;
    return isLast;
  }

  checkFirstPosition(step) {
    const { renderedSteps } = this.state;
    const stepIndex = renderedSteps.map(s => s.key).indexOf(step.key);

    if (stepIndex === 0 || !renderedSteps[stepIndex - 1].message) {
      return true;
    }

    const isFirst = step.user !== renderedSteps[stepIndex - 1].user;
    return isFirst;
  }

  handleKeyPress(event) {
    if (event.key === 'Enter') {
      const {
        renderedSteps,
        previousSteps,
        inputValue,
        defaulUserSettings,
      } = this.state;
      let { currentStep } = this.state;

      const isInvalid = currentStep.validator && this.checkInvalidInput();

      if (!isInvalid) {
        const step = {
          message: inputValue,
          value: inputValue,
        };

        currentStep = Object.assign(
          {},
          currentStep,
          defaulUserSettings,
          step,
        );

        renderedSteps.push(currentStep);
        previousSteps.push(currentStep);

        this.setState({
          currentStep,
          renderedSteps,
          previousSteps,
          disabled: true,
          inputValue: '',
        });
      }
    }
  }

  checkInvalidInput() {
    const { currentStep, inputValue } = this.state;
    const result = currentStep.validator(inputValue);
    const value = inputValue;

    if (typeof result !== 'boolean' || !result) {
      this.setState({
        inputValue: result.toString(),
        inputInvalid: true,
        disabled: true,
      }, () => {
        setTimeout(() => {
          this.setState({
            inputValue: value,
            inputInvalid: false,
            disabled: false,
          }, () => {
            document.querySelector('.chat-input').focus();
          });
        }, 2000);
      });

      return true;
    }

    return false;
  }

  renderStep(step, index) {
    const { renderedSteps, previousSteps } = this.state;
    const { options, component } = step;
    const steps = {};
    const stepIndex = renderedSteps.map(s => s.id).indexOf(step.id);
    const previousStep = stepIndex > 0 ? renderedSteps[stepIndex - 1] : {};

    for (let i = 0, len = previousSteps.length; i < len; i += 1) {
      const ps = previousSteps[i];

      steps[ps.id] = {
        id: ps.id,
        message: ps.message,
        value: ps.value,
      };
    }

    if (component) {
      return (
        <CustomStep
          key={index}
          step={step}
          steps={steps}
          previousStep={previousStep}
          triggerNextStep={this.triggerNextStep}
        />
      );
    }

    if (options) {
      return (
        <OptionsStep
          key={index}
          {...step}
          triggerNextStep={this.triggerNextStep}
        />
      );
    }

    return (
      <TextStep
        key={index}
        {...step}
        previousValue={previousStep.value}
        triggerNextStep={this.triggerNextStep}
        isFirst={this.checkFirstPosition(step)}
        isLast={this.checkLastPosition(step)}
      />
    );
  }

  render() {
    const { disabled, inputValue, inputInvalid, renderedSteps } = this.state;
    const { style, contentStyle, footerStyle, inputStyle } = this.props;

    const chatbotStyle = Object.assign({}, styles.chatbot, style);
    const chatbotMainStyle = Object.assign({}, styles.chatbotMain, contentStyle);
    const chatInputDisabledStyle = disabled ? styles.chatInputDisabled : {};
    const chatInputInvalidStyle = inputInvalid ? styles.chatInputInvalid : {};
    const chatInputStyle = Object.assign(
      {},
      styles.chatInput,
      chatInputDisabledStyle,
      chatInputInvalidStyle,
      inputStyle,
    );

    return (
      <div
        className="simple-chatbot"
        style={chatbotStyle}
      >
        <div
          className="simple-chatbot-main"
          style={chatbotMainStyle}
        >
          {_.map(renderedSteps, this.renderStep)}
        </div>
        <div
          className="simple-chatbot-footer"
          style={footerStyle}
        >
          <input
            type="textarea"
            id="chatInput"
            style={chatInputStyle}
            className="chat-input"
            placeholder="Type the message ..."
            onKeyPress={this.handleKeyPress}
            onChange={this.onValueChange}
            value={inputValue}
            disabled={disabled}
          />
        </div>
      </div>
    );
  }
}

ChatBot.propTypes = {
  steps: PropTypes.array.isRequired,
  style: PropTypes.object,
  contentStyle: PropTypes.object,
  footerStyle: PropTypes.object,
  inputStyle: PropTypes.object,
  botAvatar: PropTypes.string,
  botBubbleColor: PropTypes.string,
  botFontColor: PropTypes.string,
  userAvatar: PropTypes.string,
  userBubbleColor: PropTypes.string,
  userFontColor: PropTypes.string,
  delay: PropTypes.number,
  handleEnd: PropTypes.func,
};

ChatBot.defaultProps = {
  handleEnd: undefined,
  delay: 1000,
  style: {},
  contentStyle: {},
  footerStyle: {},
  inputStyle: {},
  botBubbleColor: '#eee',
  botFontColor: '#000',
  userBubbleColor: '#baf5fd',
  userFontColor: '#000',
  botAvatar: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxwYXRoIHN0eWxlPSJmaWxsOiM5M0M3RUY7IiBkPSJNMzAyLjU0NSw2OS44MThjMC0yNS43MDctMjAuODQtNDYuNTQ1LTQ2LjU0NS00Ni41NDVzLTQ2LjU0NSwyMC44MzgtNDYuNTQ1LDQ2LjU0NQ0KCWMwLDE3LjIyNSw5LjM2NSwzMi4yNTQsMjMuMjczLDQwLjMwNHY4My44MThoNDYuNTQ1di04My44MThDMjkzLjE4MSwxMDIuMDczLDMwMi41NDUsODcuMDQzLDMwMi41NDUsNjkuODE4eiIvPg0KPHBhdGggc3R5bGU9ImZpbGw6IzVBOEJCMDsiIGQ9Ik0yNTYsMjMuMjczdjE3MC42NjdoMjMuMjczdi04My44MThjMTMuOTA4LTguMDQ5LDIzLjI3My0yMy4wNzcsMjMuMjczLTQwLjMwNA0KCUMzMDIuNTQ1LDQ0LjExMSwyODEuNzA1LDIzLjI3MywyNTYsMjMuMjczeiIvPg0KPHJlY3QgeT0iMjQwLjQ4NSIgc3R5bGU9ImZpbGw6IzkzQzdFRjsiIHdpZHRoPSIyNDguMjQyIiBoZWlnaHQ9IjEyNC4xMjEiLz4NCjxyZWN0IHg9IjI2My43NTgiIHk9IjI0MC40ODUiIHN0eWxlPSJmaWxsOiM1QThCQjA7IiB3aWR0aD0iMjQ4LjI0MiIgaGVpZ2h0PSIxMjQuMTIxIi8+DQo8cmVjdCB4PSIxODYuMTgyIiB5PSIzNjQuNjA2IiBzdHlsZT0iZmlsbDojOTNDN0VGOyIgd2lkdGg9IjEzOS42MzYiIGhlaWdodD0iMTI0LjEyMSIvPg0KPHJlY3QgeD0iMjU2IiB5PSIzNjQuNjA2IiBzdHlsZT0iZmlsbDojNUE4QkIwOyIgd2lkdGg9IjY5LjgxOCIgaGVpZ2h0PSIxMjQuMTIxIi8+DQo8cmVjdCB4PSI0Ni41NDUiIHk9IjE2Mi45MDkiIHN0eWxlPSJmaWxsOiNDQ0U5Rjk7IiB3aWR0aD0iNDE4LjkwOSIgaGVpZ2h0PSIyNzkuMjczIi8+DQo8cmVjdCB4PSIyNTYiIHk9IjE2Mi45MDkiIHN0eWxlPSJmaWxsOiM5M0M3RUY7IiB3aWR0aD0iMjA5LjQ1NSIgaGVpZ2h0PSIyNzkuMjczIi8+DQo8cGF0aCBzdHlsZT0iZmlsbDojM0M1RDc2OyIgZD0iTTE5My45MzksMjcxLjUxNWMwLDE3LjEzOC0xMy44OTQsMzEuMDMtMzEuMDMsMzEuMDNsMCwwYy0xNy4xMzYsMC0zMS4wMy0xMy44OTItMzEuMDMtMzEuMDNsMCwwDQoJYzAtMTcuMTM4LDEzLjg5NC0zMS4wMywzMS4wMy0zMS4wM2wwLDBDMTgwLjA0NiwyNDAuNDg1LDE5My45MzksMjU0LjM3NywxOTMuOTM5LDI3MS41MTVMMTkzLjkzOSwyNzEuNTE1eiIvPg0KPHBhdGggc3R5bGU9ImZpbGw6IzFFMkUzQjsiIGQ9Ik0zODAuMTIxLDI3MS41MTVjMCwxNy4xMzgtMTMuODk0LDMxLjAzLTMxLjAzLDMxLjAzbDAsMGMtMTcuMTM3LDAtMzEuMDMtMTMuODkyLTMxLjAzLTMxLjAzbDAsMA0KCWMwLTE3LjEzOCwxMy44OTQtMzEuMDMsMzEuMDMtMzEuMDNsMCwwQzM2Ni4yMjcsMjQwLjQ4NSwzODAuMTIxLDI1NC4zNzcsMzgwLjEyMSwyNzEuNTE1TDM4MC4xMjEsMjcxLjUxNXoiLz4NCjxwYXRoIHN0eWxlPSJmaWxsOiMzQzVENzY7IiBkPSJNMTg2LjE4MiwzNDkuMDkxYzAsMzguNTU4LDMxLjI1OCw2OS44MTgsNjkuODE4LDY5LjgxOGwwLDBjMzguNTU4LDAsNjkuODE4LTMxLjI2LDY5LjgxOC02OS44MTgNCglIMTg2LjE4MnoiLz4NCjxwYXRoIHN0eWxlPSJmaWxsOiMxRTJFM0I7IiBkPSJNMjU2LDM0OS4wOTFjMCwzOC41NTgsMCw0Ni41NDUsMCw2OS44MThsMCwwYzM4LjU1OCwwLDY5LjgxOC0zMS4yNiw2OS44MTgtNjkuODE4SDI1NnoiLz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjwvc3ZnPg0K',
  userAvatar: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjwhRE9DVFlQRSBzdmcgIFBVQkxJQyAnLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4nICAnaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkJz48c3ZnIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgLTIwOC41IDIxIDEwMCAxMDAiIGlkPSJMYXllcl8xIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9Ii0yMDguNSAyMSAxMDAgMTAwIiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnNrZXRjaD0iaHR0cDovL3d3dy5ib2hlbWlhbmNvZGluZy5jb20vc2tldGNoL25zIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PGc+PGNpcmNsZSBjeD0iLTE1OC41IiBjeT0iNzEiIGZpbGw9IiNGNUVFRTUiIGlkPSJNYXNrIiByPSI1MCIvPjxnPjxkZWZzPjxjaXJjbGUgY3g9Ii0xNTguNSIgY3k9IjcxIiBpZD0iTWFza18yXyIgcj0iNTAiLz48L2RlZnM+PGNsaXBQYXRoIGlkPSJNYXNrXzRfIj48dXNlIG92ZXJmbG93PSJ2aXNpYmxlIiB4bGluazpocmVmPSIjTWFza18yXyIvPjwvY2xpcFBhdGg+PHBhdGggY2xpcC1wYXRoPSJ1cmwoI01hc2tfNF8pIiBkPSJNLTEwOC41LDEyMXYtMTRjMCwwLTIxLjItNC45LTI4LTYuN2MtMi41LTAuNy03LTMuMy03LTEyICAgICBjMC0xLjcsMC02LjMsMC02LjNoLTE1aC0xNWMwLDAsMCw0LjYsMCw2LjNjMCw4LjctNC41LDExLjMtNywxMmMtNi44LDEuOS0yOC4xLDcuMy0yOC4xLDYuN3YxNGg1MC4xSC0xMDguNXoiIGZpbGw9IiNFNkMxOUMiIGlkPSJNYXNrXzNfIi8+PGcgY2xpcC1wYXRoPSJ1cmwoI01hc2tfNF8pIj48ZGVmcz48cGF0aCBkPSJNLTEwOC41LDEyMXYtMTRjMCwwLTIxLjItNC45LTI4LTYuN2MtMi41LTAuNy03LTMuMy03LTEyYzAtMS43LDAtNi4zLDAtNi4zaC0xNWgtMTVjMCwwLDAsNC42LDAsNi4zICAgICAgIGMwLDguNy00LjUsMTEuMy03LDEyYy02LjgsMS45LTI4LjEsNy4zLTI4LjEsNi43djE0aDUwLjFILTEwOC41eiIgaWQ9Ik1hc2tfMV8iLz48L2RlZnM+PGNsaXBQYXRoIGlkPSJNYXNrXzVfIj48dXNlIG92ZXJmbG93PSJ2aXNpYmxlIiB4bGluazpocmVmPSIjTWFza18xXyIvPjwvY2xpcFBhdGg+PHBhdGggY2xpcC1wYXRoPSJ1cmwoI01hc2tfNV8pIiBkPSJNLTE1OC41LDEwMC4xYzEyLjcsMCwyMy0xOC42LDIzLTM0LjQgICAgICBjMC0xNi4yLTEwLjMtMjQuNy0yMy0yNC43cy0yMyw4LjUtMjMsMjQuN0MtMTgxLjUsODEuNS0xNzEuMiwxMDAuMS0xNTguNSwxMDAuMXoiIGZpbGw9IiNENEIwOEMiIGlkPSJoZWFkLXNoYWRvdyIvPjwvZz48L2c+PHBhdGggZD0iTS0xNTguNSw5NmMxMi43LDAsMjMtMTYuMywyMy0zMWMwLTE1LjEtMTAuMy0yMy0yMy0yM3MtMjMsNy45LTIzLDIzICAgIEMtMTgxLjUsNzkuNy0xNzEuMiw5Ni0xNTguNSw5NnoiIGZpbGw9IiNGMkNFQTUiIGlkPSJoZWFkIi8+PC9nPjwvc3ZnPg==',
};

export default ChatBot;
