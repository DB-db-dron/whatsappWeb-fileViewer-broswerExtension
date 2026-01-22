const _NAME = 'WA-FileViewer';
const originalClick = HTMLAnchorElement.prototype.click;

class FileHandlerRegistry {
    constructor() {
        this.handlers = [];
    }

    register(handler) {
        if (!handler || typeof handler !== 'object') {
            console.error(`[${_NAME}] Registration failed: Handler must be an object.`);
            return;
        }
        if (typeof handler.shouldHandle !== 'function' || typeof handler.handle !== 'function') {
            console.error(`[${_NAME}] Registration failed: Handler must implement 'shouldHandle' and 'handle' functions.`);
            return;
        }
        this.handlers.push(handler);
    }

    process(anchor) {
        for (const handler of this.handlers) {
            if (handler.shouldHandle(anchor)) {
                if (handler.handle(anchor)) {
                    return true;
                }
            }
        }
        return false;
    }
}

const fileHandler = new FileHandlerRegistry();

fileHandler.register({
    type: 'PDF',
    shouldHandle: (anchor) => anchor.download && anchor.download.toLowerCase().endsWith('.pdf'),
    handle: (anchor) => {
        console.debug(`[${_NAME}] Intercepted PDF download:`, anchor.download);
        const blobUrl = anchor.href;
        if (blobUrl) {
            window.open(blobUrl, '_blank');
            return true;
        }
        return false;
    }
});

fileHandler.register({
    type: 'CSV',
    shouldHandle: (anchor) => anchor.download && anchor.download.toLowerCase().endsWith('.csv'),
    handle: (anchor) => {
        console.debug(`[${_NAME}] Intercepted CSV download:`, anchor.download);
        const blobUrl = anchor.href;
        if (blobUrl) {
            const newWindow = window.open('', '_blank');
            if (newWindow) {
                fetch(blobUrl)
                    .then(response => response.text())
                    .then(csvText => {
                        CsvTools.view(newWindow, csvText, anchor.download);
                    })
                    .catch(err => console.error(`[${_NAME}] Error parsing CSV:`, err));
            }
            return true;
        }
        return false;
    }
});

fileHandler.register({
    type: 'JSON',
    shouldHandle: (anchor) => anchor.download && anchor.download.toLowerCase().endsWith('.json'),
    handle: (anchor) => {
        console.debug(`[${_NAME}] Intercepted JSON download:`, anchor.download);
        const blobUrl = anchor.href;
        if (blobUrl) {
            const newWindow = window.open(blobUrl, '_blank');
            return true;
        }
        return false;
    }
})

HTMLAnchorElement.prototype.click = function () {
    if (fileHandler.process(this)) {
        return;
    }
    return originalClick.apply(this, arguments);
};

console.debug(`[${_NAME}] Interceptor loaded.`);