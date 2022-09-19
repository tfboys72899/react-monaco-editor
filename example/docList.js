import { Button, Drawer, Input, Modal, Tree, ConfigProvider, Space } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import MonacoEditor, { MonacoDiffEditor } from "react-monaco-editor";
import { SaveOutlined, CaretRightOutlined } from '@ant-design/icons';
import axios from 'axios';
import zhCN from 'antd/es/locale/zh_CN';
import './index.css';

const { Search } = Input;

const { DirectoryTree } = Tree;

function GetRequest() {
  var url = location.search; //获取url中"?"符后的字串
  var theRequest = new Object();
  if (url.indexOf("?") != -1) {
      var str = url.slice(1);
      var strs = str.split("&");
      for(var i = 0; i < strs.length; i ++) {
          theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
      }
  }
  return theRequest;
}

const getData = (res) => {
  var data = {};
  data.title = res.name;
  data.key = res.id;
  var children = [];
  if(res.type === "2"){
    data.isLeaf = true;
    return data;
  } else {
    for(var i = 0; i < res.childrenNodes.length; i++){
      children.push(getData(res.childrenNodes[i]));
    }
    data.children = children;
    return data;
  }
}

const dataList = [];

const getParentKey = (key, tree) => {
  let parentKey;

  for (let i = 0; i < tree.length; i++) {
    const node = tree[i];

    if (node.children) {
      if (node.children.some((item) => item.key === key)) {
        parentKey = node.key;
      } else if (getParentKey(key, node.children)) {
        parentKey = getParentKey(key, node.children);
      }
    }
  }

  return parentKey;
};

const DocList = () => {
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [open, setOpen] = useState(false);                                                  //初始化抽屉可见控制变量
  const [isModalCreateFolderOpen, setIsModalCreateFolderOpen] = useState(false);
  const [isModalCreateDocOpen, setIsModalCreateDocOpen] = useState(false);
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [isModalRenameOpen, setIsModalRenameOpen] = useState(false);
  const [name, setName] = useState('');                                                     //初始化文件/文件夹名
  const [current_menu, setCurrent_menu] = useState('');                                     //初始化当前目录
  const [code, setCode] = useState('//comment');
  const [isLeaf, setIsLeaf] = useState(false);
  const [current_name, setCurrent_name] = useState('');

  const [globalData, setGlobalData] = useState([]);

  const userId = GetRequest()['userId'];
  const applicationId = GetRequest()['applicationId'];

  //获取文件树
  const docLoad = () => {
    axios.get('/api/folder/', {
      params:{
        userId: userId,
        applicationId: applicationId
      }
    }).then(res => {
      setGlobalData([getData(res.data.result.data[0])]);
    }, err=> {
      console.log(err, "Error");
    });
  }
  
  //渲染前获取文件树
  useEffect(() => {
    docLoad();
  }, []);
  
  const onExpand = (newExpandedKeys) => {
    setExpandedKeys(newExpandedKeys);
    setAutoExpandParent(false);
  };


  //搜索框功能
  const onChange = (e) => {
    const { value } = e.target;
    const newExpandedKeys = dataList
      .map((item) => {
        if (item.title.indexOf(value) > -1) {
          return getParentKey(item.key, defaultData);
        }

        return null;
      })
      .filter((item, i, self) => item && self.indexOf(item) === i);
    setExpandedKeys(newExpandedKeys);
    setSearchValue(value);
    setAutoExpandParent(true);
  };

  //选中文件/文件夹功能
  const onSelect = (keys, e) => {
    setCurrent_menu(e.selectedNodes[0].key);
    setCurrent_name(e.selectedNodes[0].title);
    if(e.selectedNodes[0].isLeaf === true){
      axios.get('/api/details/' + e.selectedNodes[0].key,{
      }).then(res => {
        console.log(res.data);
        if(res.data.result === null){
          setCode('');
        }else{
          setCode(res.data.result.content);
        }
      }, err=> {
        console.log(err, "Error");
      });
    }
    console.log(e.selectedNodes);
  };

  //右击文件/文件夹
  const onRightSelect = (data) => {
    setCurrent_menu(data.node.key);
    setCurrent_name(data.node.title);
    if(data.node.isLeaf === true){
      setIsLeaf(true);
    } else {
      setIsLeaf(false);
    }
    setOpen(true);
    console.log(current_menu);
  };

  //关闭窗口
  const onClose = () => {
    setOpen(false);
  }

  const canlcelDoc = () => {
    setIsModalCreateDocOpen(false);
  }

  const canlcelFolder = () => {
    setIsModalCreateFolderOpen(false);
  }

  //新建文件夹
  const createFolder = () => {
    console.log(name);
    axios.post('/api/folder/', {
      "name": name,
      "type": "1",
      "parentId": current_menu,
      "applicationId": applicationId,
      "userId": userId
    }).then(res =>{
      console.log(res, "OK");
      docLoad();
      
    }, err=>{
      console.log(err, "Error");
    });
    
    setIsModalCreateFolderOpen(false);
    setName('');
    onClose();
  }
  //新建文件
  const createDoc = () => {
    axios.post('/api/folder/', {
      "name": name,
      "type": "2",
      "parentId": current_menu,
      "applicationId": applicationId,
      "userId": userId
    }).then(res =>{
      console.log(res, "OK");
      docLoad();
      
    }, err=>{
      console.log(err, "Error");
    });
    
    setIsModalCreateDocOpen(false);
    setName('');
    onClose();
  }
  //重命名文件
  const renameDoc = () => {
    axios.put('/api/folder/', {
      "id": current_menu,
      "name": name
    }).then(res => {
      console.log(res, "OK");
      docLoad();
    }, err=>{
      console.log(err, "Error");
    });
    setIsModalRenameOpen(false);
    setName('');
    onClose();
  }
  //代码变更
  const onCodeChange = (e) => {
    console.log(e);
    setCode(e)
  }
  //保存文件
  const saveFile = (e) =>{
    axios.post('/api/details/',{
      "id" : current_menu,
      "content": code,
      "userId": userId,
      "applicationId": applicationId
    }).then(res => {
      console.log(res, "OK");
      Modal.success({
        title: "文件管理",
        content:(
          <p>文件{current_name}保存成功</p>
        )
      })
    }, err=>{
      console.log(err, "Error");
    });
  }
  // 编译文件
  const compile = () =>{
    Modal.info({
      title: "编译",
      content:(
        <p>文件{current_name}已完成编译并生成可执行文件</p>
      )
    })
  }

  //删除文件
  const deleteFile = (e) => {
    axios.delete('/api/folder/'+current_menu).then(res => {
      console.log(res, "OK");
      docLoad();
    }, err=> {
      console.log(err, "Error");
    });
    
    setIsModalDeleteOpen(false);
    onClose();
  }

  //渲染
  return (
    <div id="content">
       <ConfigProvider locale={zhCN}>
        <div id='doclist'>
      {/* <Search
        style={{
          marginBottom: 8,
        }}
        placeholder="Search"
        onChange={onChange}
      /> */}
        <DirectoryTree
          defaultExpandAll
          onExpand={onExpand}
          onSelect={onSelect}
          onRightClick={onRightSelect}
          expandedKeys={expandedKeys}
          autoExpandParent={autoExpandParent}
          treeData={globalData}
        />
        <Drawer title='文件管理' placement='left' onClose={onClose} open={open} width='180px'>
          <Button type='text' onClick={() => setIsModalCreateFolderOpen(true)} disabled={isLeaf}> 新建文件夹 </Button>
          <Button type = 'text' onClick={() => setIsModalCreateDocOpen(true)} disabled={isLeaf}> 新建文件 </Button>
          <Button type='text' onClick={() => setIsModalDeleteOpen(true)}> 删除 </Button>
          <Button type='text' onClick={() => setIsModalRenameOpen(true)}> 重命名 </Button>
        </Drawer>

        <div id='button'>
          <Space>
            <Button type='primary' icon={<CaretRightOutlined />} onClick={compile}> 编译 </Button>
          
          <Button type='primary' icon={<SaveOutlined/>} onClick={saveFile}> 保存 </Button>
          </Space>
          
        </div>

        <Modal title='新建文件夹' open={isModalCreateFolderOpen} onOk={createFolder} onCancel={canlcelFolder}>
          <p>请输入文件夹名字</p>
          <Input id='FolderName' onChange={(e) => setName(document.getElementById('FolderName').value)}></Input>
        </Modal>
        <Modal title='新建文件' open={isModalCreateDocOpen} onOk={createDoc} onCancel={canlcelDoc}>
          <p>请输入文件名</p>
          <Input id='DocName' onChange={(e) => setName(document.getElementById('DocName').value)}></Input>
        </Modal>
        <Modal title='删除文件' open={isModalDeleteOpen} onOk={deleteFile} onCancel={() => setIsModalDeleteOpen(false)}></Modal>
        <Modal title='重命名' open={isModalRenameOpen} onOk={renameDoc} onCancel={() => setIsModalRenameOpen(false)}>
          <p>请输入文件/文件名</p>
          <Input id='reName' onChange={(e) => setName(document.getElementById('reName').value)}></Input>
        </Modal>
      </div>
      <div id='editor'>
        <MonacoEditor
        height="100%"
        width="100%"
        language="cpp"
        theme="vs-dark"
        value={code}
        onChange={onCodeChange}
      />
      </div>
    
      </ConfigProvider>
    </div>
  );
};

export default DocList;