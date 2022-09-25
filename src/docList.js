import { Button, Input, Modal, Tree, ConfigProvider, Space, Form, Menu, Dropdown } from 'antd';
import React, { useEffect, useState } from 'react';
import MonacoEditor from "react-monaco-editor";
import { SaveOutlined, CaretRightOutlined } from '@ant-design/icons';
import axios from 'axios';
import zhCN from 'antd/es/locale/zh_CN';
import './index.css';

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
    data.isLeaf = false;
    for(var i = 0; i < res.childrenNodes.length; i++){
      children.push(getData(res.childrenNodes[i]));
    }
    children.sort((a, b) => {return a.isLeaf - b.isLeaf});
    data.children = children;
    return data;
  }
}

const DocList = () => {
  const [open, setOpen] = useState(false);                                                  //初始化抽屉可见控制变量
  const [isModalCreateFolderOpen, setIsModalCreateFolderOpen] = useState(false);
  const [isModalCreateDocOpen, setIsModalCreateDocOpen] = useState(false);
  const [isModalRenameOpen, setIsModalRenameOpen] = useState(false);
  const [current_menu, setCurrent_menu] = useState('');                                     //初始化当前目录
  const [temp_menu, setTemp_menu] = useState('');
  const [code, setCode] = useState('//comment');
  const [isLeaf, setIsLeaf] = useState(false);
  const [current_name, setCurrent_name] = useState('');
  const [current_leaf, setCurrent_leaf] = useState(true);
  const [temp_name, setTemp_name] = useState('');

  const [globalData, setGlobalData] = useState([{key:'', }]);

  const userId = GetRequest()['userId'];
  const applicationId = GetRequest()['applicationId'];

  const [form] = Form.useForm();
  const [formC] = Form.useForm();

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
    document.getElementById('editor').style.display = 'none';
    docLoad();
  }, []);
  
  //选中文件/文件夹功能
  const onSelect = (keys, e) => {
    setCurrent_menu(e.selectedNodes[0].key);
    setCurrent_name(e.selectedNodes[0].title);
    if(e.selectedNodes[0].isLeaf === true){
      document.getElementById('editor').style.display = '';
      setCurrent_leaf(false);
      axios.get('/api/details/' + e.selectedNodes[0].key,{
      }).then(res => {
        console.log(res.data);
        if(res.data.result === null){
          setCode('');
        }else{
          setCode(res.data.result.content);
        }
        let path = res.data.result.out;
        if(path === null) {
          formC.setFieldsValue({comPath:""});
          formC.setFieldsValue({comDoc:""});
        } else {
          let temp = path.split('/');
          let d = temp[temp.length - 1];
          let p = path.substring(0, path.length - d.length - 1);
          formC.setFieldsValue({comPath:p});
          formC.setFieldsValue({comDoc:d});
        }
        
      }, err=> {
        console.log(err, "Error");
      });
    } else {
      document.getElementById('editor').style.display = 'none';
      setCurrent_leaf(true);
      setCode('');
    }
    console.log(e.selectedNodes);
  };

  //右击文件/文件夹
  const onRightSelect = (data) => {
    // setTemp_menu(current_menu);
    // setTemp_name(current_name);
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

  const canlcelDoc = () => {
    setIsModalCreateDocOpen(false);
    // setCurrent_menu(temp_menu);
    // setCurrent_name(temp_name);
  }

  const canlcelFolder = () => {
    setIsModalCreateFolderOpen(false);
    // setCurrent_menu(temp_menu);
    // setCurrent_name(temp_name);
  }

  const cancelRename = () => {
    setIsModalRenameOpen(false);
    // setCurrent_menu(temp_menu);
    // setCurrent_name(temp_name);
  }

  //新建文件夹
  const createFolderOpen = () => {
    setIsModalCreateFolderOpen(true);
    setOpen(false);
  }

  const createFolder = () => {
    if(document.getElementById('FolderName').value === ''){
      Modal.error({
        title: "错误",
        content: (
          <p>名字不能为空</p>
        ),
        onOk: ()=>{
          setIsModalCreateFolderOpen(false);
        }
      })
    } else {
      axios.post('/api/folder/', {
        "name": document.getElementById('FolderName').value,
        "type": "1",
        "parentId": current_menu,
        "applicationId": applicationId,
        "userId": userId
      }).then(res =>{
        console.log(res, "OK");
        form.resetFields();
        docLoad();
      }, err=>{
        console.log(err, "Error");
      });
      setIsModalCreateFolderOpen(false);
    }
    
  }
  //新建文件
  const createDocOpen = () => {
    setIsModalCreateDocOpen(true);
    setOpen(false);
  }

  const createDoc = () => {
    if(document.getElementById('DocName').value === ''){
      Modal.error({
        title: "错误",
        content: (
          <p>名字不能为空</p>
        ),
        onOk: ()=>{
          setIsModalCreateDocOpen(false);
        }
      })
    } else {
      axios.post('/api/folder/', {
        "name": document.getElementById('DocName').value,
        "type": "2",
        "parentId": current_menu,
        "applicationId": applicationId,
        "userId": userId
      }).then(res =>{
        console.log(res, "OK");
        form.resetFields();
        docLoad();
      }, err=>{
        console.log(err, "Error");
      });
      setIsModalCreateDocOpen(false);
    }
  }
  //重命名文件
  const renameOpen = () => {
    setIsModalRenameOpen(true);
    setOpen(false);
  }

  const renameDoc = () => {
    if(document.getElementById('reName').value === ''){
      Modal.error({
        title: "错误",
        content: (
          <p>名字不能为空</p>
        ),
        onOk: ()=>{
          setIsModalRenameOpen(false);
        }
      })
    } else {
      axios.put('/api/folder/', {
        "id": current_menu,
        "name": document.getElementById('reName').value
      }).then(res => {
        console.log(res, "OK");
        form.resetFields();
        docLoad();
      }, err=>{
        console.log(err, "Error");
      });
      setIsModalRenameOpen(false);
    }
  }
  //代码变更
  const onCodeChange = (e) => {
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
    if(document.getElementById('compilePath').value === '' || document.getElementById('compileDoc').value === ''){
      Modal.error({
        title: "错误",
        content: (
          <p>路径与文件名不能为空</p>
        ),
      })
    } else {
      let p = document.getElementById('compilePath').value;
      let temp = p.split('\\');
      p = '';
      for(let i of temp){
        p = p + i + '/';  
      }
      axios.post('/api/details/',{
        "id" : current_menu,
        "content": code,
        "userId": userId,
        "applicationId": applicationId
      }).then(res => {
        let d = document.getElementById('compileDoc').value;
        let path = p + (p[p.length - 1] === '/' ? '' : '/') + d;
        console.log(path);
        axios.put('/api/details/', {
          "id": current_menu,
          "out": path
        }).then(res => {
          console.log(res, "OK");
          Modal.success({
            title: "编译",
            content:(
              <p>文件{current_name}已完成编译并生成可执行文件</p>
            )
          })
        }, err => {
          console.log(err, "Error");
          Modal.error({
            title: "编译",
            content: (
              <p>编译出现错误</p>
           )
          })
        })
      }, err=>{
        Modal.error({
          title: "保存",
          content: (
            <p>保存出现错误，请重新编译</p>
         )
        })
      });
    }
  }

  //删除文件
  const deleteFile = (e) => {
    setOpen(false);
    Modal.confirm({
      title: "删除文件/文件夹",
      content:(
        <p>确定要删除{current_name}吗</p>
      ),
      onOk: () =>{
        axios.delete('/api/folder/'+current_menu).then(res => {
          console.log(res, "OK");
          docLoad();
          setCurrent_menu('');
          setCurrent_name('');
          document.getElementById('editor').style.display = 'none';
        }, err=> {
          console.log(err, "Error");
        });
      },
    })
    
  }

  //下拉框设计

  //选中item
  const menuClick = (data) =>{
    data.domEvent.stopPropagation();
    switch(data.key){
      case('folder'):{
        createFolderOpen();
        break;
      }
      case('doc'):{
        createDocOpen();
        break;
      }
      case('delete'):{
        deleteFile();
        break;
      }
      case('rename'):{
        renameOpen();
        break;
      }
    }
  }

  const menu = (
    <Menu
      onClick={menuClick}
      items={[
        {
          key: 'folder',
          label: '新建文件夹',
          disabled: isLeaf,
        },
        {
          key: 'doc',
          label: '新建文件',
          disabled: isLeaf,
        },
        {
          key: 'delete',
          label: '删除',
          disabled :current_menu === globalData[0].key,
        },
        {
          key: 'rename',
          label: '重命名',
        }
      ]}
    />
  );

  const titleRender = (nodeData) => {
    return (
      <Dropdown overlay={menu} trigger={['contextMenu']}>
        <Button type='text' size='small'>{nodeData.title}</Button>
      </Dropdown>
    );
  };


  //渲染
  return (
    <div id="content">
       <ConfigProvider locale={zhCN}>
        <div id='doclist'>
        <DirectoryTree
          defaultExpandAll
          onSelect={onSelect}
          onRightClick={onRightSelect}
          titleRender={titleRender}
          treeData={globalData}
        />

        <div id='button'>
          <Space>
            <Button type='primary' icon={<SaveOutlined/>} onClick={saveFile} disabled={current_leaf}> 保存 </Button>
            <Button type='primary' icon={<CaretRightOutlined />} onClick={compile} disabled={current_leaf}> 编译 </Button>
          </Space>
          
        </div>

        <Modal title='新建文件夹' open={isModalCreateFolderOpen} onOk={createFolder} onCancel={canlcelFolder}>
          <p>请输入文件夹名字</p>
          <Form form={form} name="FN">
            <Form.Item name="FN"  label=""  rules={[{ required: true, message: '请输入文件夹名' }]}>
              <Input id='FolderName' allowClear></Input>
            </Form.Item>
          </Form>
          
        </Modal>
        <Modal title='新建文件' open={isModalCreateDocOpen} onOk={createDoc} onCancel={canlcelDoc}>
          <p>请输入文件名</p>
          <Form form={form} name="DN">
            <Form.Item name="DN" label="" rules={[{ required: true, message: '请输入文件名' }]}>
              <Input id='DocName' allowClear></Input>
            </Form.Item>
          </Form>
        </Modal>
        <Modal title='重命名' open={isModalRenameOpen} onOk={renameDoc} onCancel={cancelRename}>
          <p>请输入文件/文件名</p>
          <Form form={form} name="RN">
            <Form.Item name="RN" label="" rules={[{ required: true, message: '请输入文件/文件夹名' }]}>
              <Input id='reName' allowClear></Input>
            </Form.Item>
          </Form> 
        </Modal>
      </div>
      <div id='editor'>
        <MonacoEditor
        height="85%"
        width="99.5%"
        language="c"
        theme="vs-dark"
        value={code}
        onChange={onCodeChange}
      />
        <div id='path'>
          <Form 
          form={formC} 
          name='compile' 
          size='small' 
          labelCol={{span: 4}}
          
          >
            <Form.Item name='comPath' label="编译输出路径" rules={[{ required: true, message: '请输入输出路径' }]} >
              <Input id='compilePath' allowClear></Input>
            </Form.Item>
            <Form.Item name='comDoc' label='输出文件名' rules={[{ required: true, message: '请输入输出文件名' }]}>
              <Input id='compileDoc' allowClear></Input>
            </Form.Item>
          </Form>
        </div>
      </div>
    
      </ConfigProvider>
    </div>
  );
};

export default DocList;