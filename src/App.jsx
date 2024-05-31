import React, { useState, useEffect, useRef } from "react";
import { UserOutlined, SyncOutlined, EnterOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Popconfirm, Input, Avatar, Image } from 'antd';
const { TextArea } = Input;
import { useParams } from 'react-router-dom';
import MarkdownDisplay from './MarkdownDisplay';
import axios from 'axios';
import './App.css'
import Apis from './Apis.jsx';

let messages = [];

const App = () => {
  const { key } = useParams();
  const [input, setInput] = useState("");
  const [images, setImages] = useState([]);
  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const cancelTokenSourceRef = useRef(null);
  const pageDiv = useRef(null);
  const topDiv = useRef(null);
  const scrollContainerRef = useRef(null);
  const bottomDiv = useRef(null);
  const inputRef = useRef(null);
  const isMoble = () => /iphone|ipad|ipod|android/.test(navigator.userAgent.toLowerCase());

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    const setPageResize = () => {
      const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
      const widowWeight = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      const flag = widowWeight >= 768;
      pageDiv.current.className = flag ? 'page' : '';
      const pageDivHeight = pageDiv.current.offsetHeight;
      const totalHeight = flag ? pageDivHeight : windowHeight;
      const topDivHeight = topDiv.current.offsetHeight;
      const bottomDivHeight = 92;
      const middleDivHeight = totalHeight - topDivHeight - bottomDivHeight - 63;
      scrollContainerRef.current.style.height = `${middleDivHeight}px`;
    };
    setPageResize();
    window.addEventListener('resize', setPageResize);
    return () => {
      cancelTokenSource.cancel("Component unmounted");
      window.removeEventListener('resize', setPageResize);
    };
  }, []);

  useEffect(() => {
    if (!isMoble()) inputFocus();
  }, [list]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.keyCode === 13 && !event.shiftKey) {
        if (input.trim() && !isLoading) {
          event.preventDefault();
          handleSubmit();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [input]);

  useEffect(() => {
    setTimeout(scrollToBottom, 100);
  }, [isLoading]);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      const maxScrollTop = scrollHeight - clientHeight;
      const content = scrollContainerRef.current;
      content.scrollTo({ top: maxScrollTop > 0 ? maxScrollTop : 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    const TrimInput = input.trim();
    if (TrimInput || images.length > 0) {
      if (TrimInput === '/clear') {
        await reflsh();
        return;
      }

      setInput("");
      setImages([]);
      setIsLoading(true);
      const base64 = [];
      images.map(img => {
        base64.push({ type: "image_url", image_url: { url: `${img}` } })
      })

      setList((prevList) => [
        ...prevList,
        { type: "user", content: [...base64, { type: "text", text: input }] },
        { type: "bot", text: "分析中..." },
      ]);

      if (cancelTokenSourceRef.current) {
        cancelTokenSourceRef.current.cancel("New request");
      }
      cancelTokenSourceRef.current = axios.CancelToken.source();

      messages = [...messages, { role: "user", content: [...base64, { type: "text", text: input }] }]

      try {
        // const result = await axios.post(`/api/chatgpt`, { messages: messages, key: key },
        //   {
        //     headers: {
        //       "Content-Type": "application/json",
        //     },
        //     cancelToken: cancelTokenSourceRef.current.token,
        //   }
        // );
        const result = await Apis.chatgpt({messages});
        const generatedText = result.data.choices[0].message.content;
        messages = [...messages, { "role": "assistant", "content": generatedText }];
        displayResponse(generatedText);

      } catch (error) {
        const { response } = error;
        if (response && response.status == 403) {
          displayResponse("您无权限，请联系管理员！");
        } else {
          displayResponse("您的网络异常，请重试！");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const displayResponse = (generatedText) => {
    setList((prevList) => {
      const newList = [...prevList];
      const lastIndex = newList.length - 1;
      const botMessage = newList[lastIndex];
      if (botMessage.type === "bot") {
        newList[lastIndex] = {
          ...botMessage,
          text: generatedText,
        };
      }
      return newList;
    });
  };

  const inputFocus = () => {
    inputRef.current.focus({
      cursor: 'start',
    });
  };

  const reflsh = async () => {
    setList([])
    setInput("")
    messages = []
  };

  const handlePaste = (event) => {
    const items = event.clipboardData && event.clipboardData.items;

    if (items) {
      for (let i = 0; i < items.length; i++) {

        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();

          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target.result;
            setImages([...images, base64]);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const deleteImage = (index) => {
    const result = images.filter((img, i) => i !== index)
    setImages([...result])
  }

  return (
    <div ref={pageDiv}>
      <div ref={topDiv} className="header" >
        AI-Chat
        <Popconfirm
          disabled={isLoading}
          placement="right"
          title={"开启新一轮会话"}
          onConfirm={reflsh}
          okText="Yes"
          cancelText="No"
        >
          <SyncOutlined style={{ marginLeft: "0.5rem" }} spin={isLoading} />
        </Popconfirm>
      </div>
      <div ref={scrollContainerRef} className='content'>
        {list.map((d, index) => {
          return (
            <div key={index} className={`item ${d.type === 'user' ? 'question' : "answer"}`}>
              <div className="icon">
                {d.type === 'user' && <Avatar shape="square" size={32} style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />}
                {d.type === 'bot' && <Avatar shape="square" size={32} style={{ backgroundColor: '#1890ff' }}>小轩</Avatar>}
              </div>
              <div className="info">
                {d.type === 'user' &&
                  d.content.map((c, i) => {
                    return (
                      <React.Fragment key={i}>
                        {c.type === 'image_url' && <Image key={i} src={c.image_url.url} style={{ maxWidth: '500px', maxHeight: '500px' }} />}
                        {c.type === 'text' && <TextArea key={i} style={{ minHeight: 0 }} className="userInput inputArea" variant="borderless" autoSize value={c.text} />}
                      </React.Fragment>
                    )
                  })}
                {d.type === 'bot' && <MarkdownDisplay markdownContent={d.text} />}
              </div>
            </div>
          )
        })}
      </div>

      <div ref={bottomDiv} style={{ height: '152px' }}>
        <div className="imageContainer">
          {images.length > 0 && (
            <>
              {images.map((src, index) => (
                <div key={index} className="imageDiv">
                  <Image src={src} width={60} height={60} />
                  <CloseCircleOutlined className="delete-icon" onClick={() => deleteImage(index)} />
                </div>
              ))}
            </>
          )}
        </div>
        <div className='inputDiv' >
          <TextArea ref={inputRef}
            className="inputArea"
            style={{ fontSize: '1rem' }}
            autoSize={{ minRows: 1, maxRows: 2 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
          />
          <div className={isLoading ? 'subBtn-disabled' : 'subBtn'} onClick={handleSubmit}><EnterOutlined /></div>
        </div>
      </div>
    </div>
  );
};
export default App;