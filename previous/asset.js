class AssetManager {
    constructor() {
        this.assets = {};
        this.loadingPromises = {};
        this.loadStates = {};
        this.initializeAssets();
    }

    initializeAssets() {
        const assetPaths = {
            background: {
                office: 'office.png'
            },
            character: {
                stand: 'character-stand.png',
                walk: 'character-walk.png'
            }
        };

        this.assets = {
            background: {},
            character: {}
        };

        // Load all assets
        for (const [type, items] of Object.entries(assetPaths)) {
            for (const [key, path] of Object.entries(items)) {
                this.loadingPromises[`${type}_${key}`] = this.loadImage(path, type, key);
            }
        }
    }

    loadImage(path, type, key) {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            const assetId = `${type}_${key}`;
            
            this.loadStates[assetId] = 'loading';
            
            img.onload = () => {
                console.log(`[Assets] Successfully loaded: ${path}`);
                this.assets[type][key] = img;
                this.loadStates[assetId] = 'loaded';
                this.updateImageStatus();
                resolve(img);
            };
            
            img.onerror = (e) => {
                console.error(`[Assets] Failed to load: ${path}`, e);
                this.loadStates[assetId] = 'error';
                this.updateImageStatus();
                reject(e);
            };
            
            img.src = path;
        });
    }

    updateImageStatus() {
        const statusElement = document.getElementById('imageStatus');
        if (statusElement) {
            const totalAssets = Object.keys(this.loadStates).length;
            const loadedAssets = Object.values(this.loadStates).filter(state => state === 'loaded').length;
            const errorAssets = Object.values(this.loadStates).filter(state => state === 'error').length;
            
            if (loadedAssets === totalAssets) {
                statusElement.textContent = 'All images loaded';
                statusElement.style.color = 'green';
            } else if (errorAssets > 0) {
                statusElement.textContent = `${loadedAssets}/${totalAssets} loaded, ${errorAssets} errors`;
                statusElement.style.color = 'orange';
            } else {
                statusElement.textContent = `Loading... ${loadedAssets}/${totalAssets}`;
                statusElement.style.color = 'blue';
            }
        }
    }

    get(type, key) {
        const asset = this.assets[type] && this.assets[type][key];
        return asset && asset.complete && asset.naturalWidth > 0 ? asset : null;
    }

    isLoaded(type, key) {
        const assetId = `${type}_${key}`;
        return this.loadStates[assetId] === 'loaded';
    }

    isReady() {
        return Object.values(this.loadStates).every(state => state === 'loaded' || state === 'error');
    }

    getAllLoadingPromises() {
        return Promise.allSettled(Object.values(this.loadingPromises));
    }

    getLoadingStats() {
        const total = Object.keys(this.loadStates).length;
        const loaded = Object.values(this.loadStates).filter(state => state === 'loaded').length;
        const errors = Object.values(this.loadStates).filter(state => state === 'error').length;
        const loading = Object.values(this.loadStates).filter(state => state === 'loading').length;
        
        return { total, loaded, errors, loading };
    }
}

const Assets = new AssetManager();

