/**
 * Go generics support for Jekyll Rouge
 * This works with Rouge's pre-tokenized HTML structure
 */

(function() {
    function enhanceRougeTokens() {
        const goCodeBlocks = document.querySelectorAll('code.language-go');
        
        goCodeBlocks.forEach(function(codeBlock) {
            const walker = document.createTreeWalker(
                codeBlock,
                NodeFilter.SHOW_ALL,
                null,
                false
            );
            
            const allNodes = [];
            let node;
            while (node = walker.nextNode()) {
                allNodes.push(node);
            }
            
            for (let i = 0; i < allNodes.length - 1; i++) {
                const currentNode = allNodes[i];
                const nextNode = allNodes[i + 1];
                
                // Pattern: text node with function name + [ punctuation token
                if (currentNode.nodeType === Node.TEXT_NODE &&
                    nextNode.nodeType === Node.ELEMENT_NODE &&
                    nextNode.classList &&
                    nextNode.classList.contains('token') &&
                    nextNode.classList.contains('punctuation') &&
                    nextNode.textContent === '[') {
                    
                    const text = currentNode.textContent.trim();
                    
                    if (text && text.match(/^[a-zA-Z_]\w*$/)) {
                        const functionSpan = document.createElement('span');
                        functionSpan.className = 'token function';
                        functionSpan.textContent = text;
                        currentNode.parentNode.replaceChild(functionSpan, currentNode);
                    }
                }
                
                // Pattern: text node with 'any' keyword
                else if (currentNode.nodeType === Node.TEXT_NODE &&
                         currentNode.textContent.trim() === 'any') {
                    
                    const keywordSpan = document.createElement('span');
                    keywordSpan.className = 'token keyword';
                    keywordSpan.textContent = 'any';
                    currentNode.parentNode.replaceChild(keywordSpan, currentNode);
                }
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enhanceRougeTokens);
    } else {
        enhanceRougeTokens();
    }
})();