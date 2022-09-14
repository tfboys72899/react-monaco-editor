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
  const [date, setDate] = useState(null);
  const handleChange = value => {
    message.info(`您选择的日期是: ${value ? value.format('YYYY年MM月DD日') : '未选择'}`);
    setDate(value);
  };
  return (
    <div id='content'>
      <DocList></DocList>
    </div>
      
  );
};

render(<App/>, document.getElementById("root"));
