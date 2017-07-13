import React from 'react';
import { ThemeProvider } from 'styled-components';
import ChatBot from '../../lib/index';

const otherFontTheme = {
  background: '#f5f8fb',
  fontFamily: 'Helvetica Neue',
  headerBgColor: '#6e48aa',
  headerFontColor: '#fff',
  botBubbleColor: '#6E48AA',
  botFontColor: '#fff',
  userBubbleColor: '#fff',
  userFontColor: '#4a4a4a',
};

const Test = () =>
  <div>Hello</div>;

const steps = [
  {
    id: '1',
    message: 'Hello World',
    delay: 1000,
    trigger: '2',
  },
  {
    id: '2',
    options: [
      { value: 'a', label: 'aaa', trigger: '3' },
    ],
  },
  {
    id: '3',
    component: <Test />,
    // asMessage: true,
    // delay: 0,
    end: true,
  },
];

const Example = () =>
  <ChatBot steps={steps} />;

const ThemedExample = () => (
  <ThemeProvider theme={otherFontTheme}>
    <Example />
  </ThemeProvider>
);

export default ThemedExample;
