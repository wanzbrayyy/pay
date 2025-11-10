document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.btn-copy').forEach(button => {
        button.addEventListener('click', () => {
            const targetSelector = button.dataset.copyTarget;
            const targetElement = document.querySelector(targetSelector);
            if (targetElement) {
                navigator.clipboard.writeText(targetElement.value).then(() => {
                    button.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        button.innerHTML = '<i class="fas fa-copy"></i>';
                    }, 2000);
                });
            }
        });
    });

    const statusIndicator = document.getElementById('api-status-indicator');
    if (statusIndicator) {
        fetch('/v1/account/prices?limit=1')
            .then(response => {
                statusIndicator.classList.add(response.ok ? 'online' : 'offline');
                statusIndicator.title = `API is ${response.ok ? 'Online' : 'Offline'}`;
            })
            .catch(() => {
                statusIndicator.classList.add('offline');
                statusIndicator.title = 'API is Offline';
            });
    }

    if (document.getElementById('swagger-ui')) {
        const observer = new MutationObserver(() => {
            document.querySelectorAll('.opblock.is-open:not(.processed)').forEach(block => {
                block.classList.add('processed');
                generateCodeSnippets(block);
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
});

function generateCodeSnippets(block) {
    const method = block.querySelector('.opblock-summary-method').innerText.trim();
    const path = block.querySelector('.opblock-summary-path').dataset.path.trim();
    const productionUrl = `https://wanzofc.site/v1${path}`;

    const curlSnippet = `curl -X ${method} "${productionUrl}" \\\n-H "Accept: application/json"`;
    const fetchSnippet = `fetch('${productionUrl}', {\n  method: '${method}',\n  headers: {\n    'Accept': 'application/json'\n  }\n})\n.then(response => response.json())\n.then(data => console.log(data));`;

    const container = document.createElement('div');
    container.className = 'code-generator-container';
    container.innerHTML = `
        <h4>Code Snippets (For Production)</h4>
        <div class="code-box">
            <label>cURL</label>
            <pre><code>${curlSnippet}</code></pre>
            <button class="btn-copy-snippet"><i class="fas fa-copy"></i></button>
        </div>
        <div class="code-box">
            <label>JavaScript Fetch</label>
            <pre><code>${fetchSnippet}</code></pre>
            <button class="btn-copy-snippet"><i class="fas fa-copy"></i></button>
        </div>
    `;

    block.querySelector('.opblock-body').appendChild(container);
    
    container.querySelectorAll('.btn-copy-snippet').forEach(button => {
        button.addEventListener('click', () => {
            const code = button.parentElement.querySelector('pre code').innerText;
            navigator.clipboard.writeText(code).then(() => {
                button.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            });
        });
    });
}