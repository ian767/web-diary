import React, { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/default.css'; // You can change this to another theme like 'github', 'atom-one-dark', etc.
import './RichTextDisplay.css';

/**
 * Component to safely render rich text HTML content with syntax highlighting for code blocks
 * @param {string} htmlContent - HTML content to render (will be sanitized)
 * @param {string} plainTextContent - Plain text fallback (used if htmlContent is empty, for backward compatibility)
 */
const RichTextDisplay = ({ htmlContent, plainTextContent }) => {
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      // Highlight code blocks
      contentRef.current.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  }, [htmlContent, plainTextContent]);

  // Determine what content to display
  let contentToDisplay = '';
  
  if (htmlContent) {
    // Use HTML content if available (new format)
    // Post-process to ensure links have proper attributes
    const tmp = document.createElement('div');
    tmp.innerHTML = htmlContent;
    const links = tmp.querySelectorAll('a[href]');
    links.forEach(link => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
    const processedHtml = tmp.innerHTML;
    
    contentToDisplay = DOMPurify.sanitize(processedHtml, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'blockquote', 'pre', 'code',
        'div', 'span'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      ALLOW_DATA_ATTR: false,
    });
  } else if (plainTextContent) {
    // Fallback to plain text (backward compatibility)
    // Escape HTML and wrap in <p> tags, preserving line breaks
    const escaped = plainTextContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    contentToDisplay = escaped.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('');
  }

  if (!contentToDisplay) {
    return null;
  }

  return (
    <div 
      ref={contentRef}
      className="rich-text-content"
      dangerouslySetInnerHTML={{ __html: contentToDisplay }}
    />
  );
};

export default RichTextDisplay;

