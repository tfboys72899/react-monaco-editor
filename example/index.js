import React, { useState } from 'react';
import { render } from 'react-dom';

import DocList from './docList';

import { message } from 'antd';
// 由于 antd 组件的默认文案是英文，所以需要修改为中文
import moment from 'moment';
import 'moment/locale/zh-cn';
import 'antd/dist/antd.css';

moment.locale('zh-cn');

const App = () => {
  return (
    <div id='content'>
      <DocList></DocList>
    </div>
      
  );
};

render(<App/>, document.getElementById("root"));
