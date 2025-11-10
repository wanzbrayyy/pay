document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.btn-copy').forEach(button => {
        button.addEventListener('click', () => {
            const targetSelector = button.dataset.copyTarget;
            const targetElement = document.querySelector(targetSelector);
            if (targetElement) {
                const originalType = targetElement.type;
                targetElement.type = 'text';
                targetElement.select();
                document.execCommand('copy');
                targetElement.type = originalType; // Sembunyikan lagi
                
                button.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            }
        });
    });

    // 2. Indikator Status API
    const statusIndicator = document.getElementById('api-status-indicator');
    if (statusIndicator) {
        // Cek status dengan menghubungi endpoint via proxy kita
        fetch('/v1/account/balance')
            .then(response => {
                if (response.ok) {
                    statusIndicator.classList.add('online');
                    statusIndicator.title = 'API is Online';
                } else {
                    statusIndicator.classList.add('offline');
                    statusIndicator.title = 'API is Offline';
                }
            })
            .catch(() => {
                statusIndicator.classList.add('offline');
                statusIndicator.title = 'API is Offline';
            });
    }

    // 3. Generator Kode (jika di halaman endpoints)
    if (document.getElementById('swagger-ui')) {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    // Cek jika ada elemen .opblock-body yang baru ditambahkan/dibuka
                    const openApiBlocks = document.querySelectorAll('.opblock.is-open');
                    openApiBlocks.forEach(block => {
                        // Cek jika generator belum ditambahkan
                        if (!block.querySelector('.code-generator-container')) {
                            generateCodeSnippets(block);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
});

function generateCodeSnippets(block) {
    const method = block.querySelector('.opblock-summary-method').innerText.trim();
    const path = block.querySelector('.opblock-summary-path').dataset.path.trim();
    const fullUrl = `${window.location.origin}/v1${path}`;

    const curlSnippet = `curl -X ${method} "${fullUrl}" \\\n-H "Accept: application/json"`;
    const fetchSnippet = `fetch('${fullUrl}', {\n  method: '${method}',\n  headers: {\n    'Accept': 'application/json'\n  }\n})\n.then(response => response.json())\n.then(data => console.log(data));`;

    const container = document.createElement('div');
    container.className = 'code-generator-container';
    container.innerHTML = `
        <h4>Code Snippets</h4>
        <div class="code-box">
            <pre><code>${curlSnippet}</code></pre>
            <button class="btn-copy-snippet"><i class="fas fa-copy"></i></button>
        </div>
        <div class="code-box">
            <pre><code>${fetchSnippet}</code></pre>
            <button class="btn-copy-snippet"><i class="fas fa-copy"></i></button>
        </div>
    `;

    block.querySelector('.opblock-body').appendChild(container);
    
    // Fungsikan tombol copy untuk snippet baru
    container.querySelectorAll('.btn-copy-snippet').forEach(button => {
        button.addEventListener('click', () => {
            const code = button.previousElementSibling.innerText;
            navigator.clipboard.writeText(code).then(() => {
                button.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            });
        });
    });
}