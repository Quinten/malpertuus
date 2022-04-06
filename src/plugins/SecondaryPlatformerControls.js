import SimplePlatformerControls from './SimplePlatformerControls.js';

class SecondaryPlatformerControls extends SimplePlatformerControls {

    constructor (scene, pluginManager) {
        super(scene, pluginManager);
        this.playerKey = 'b';
    }
}

export default SecondaryPlatformerControls;
