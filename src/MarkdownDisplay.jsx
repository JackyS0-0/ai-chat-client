import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import gfm from 'remark-gfm';
import './App.css';

const CodeBlock = ({ language, value }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div>
            <div className='codeTop'>
                <span>{language}</span>
                <CopyToClipboard text={value} onCopy={handleCopy}>
                    <div className='copyBtn'>{isCopied ? 'Copied!' : 'Copy'}</div>
                </CopyToClipboard>
            </div>
            <div className='codeMain'>
                <SyntaxHighlighter language={language} style={darcula}>
                    {value}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

const MarkdownDisplay = ({ markdownContent }) => {
    return (
        <ReactMarkdown
            className='markdown'
            rehypePlugins={[gfm]}
            components={{
                code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '') || '';
                    return (
                        !inline && match ? <CodeBlock
                            language={match[1]}
                            value={children}
                            {...props}
                        /> : <code>{children}</code>)
                },
            }}
        >
            {markdownContent}
        </ReactMarkdown>
    );
};

export default MarkdownDisplay;
