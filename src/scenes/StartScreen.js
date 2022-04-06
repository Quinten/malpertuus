import Screen from './Screen';

class StartScreen extends Screen {

    constructor (config)
    {
        super((config) ? config : { key: 'startscreen' });
        this.centerText = 'CLICK anywhere\n\nto START';
        this.clickFade = true;
        this.nextScene = 'menu';
    }

    create ()
    {
        super.create();

        if (this.centerTextField) {
            this.centerTextField.setCenterAlign();
        }
    }
}

export default StartScreen;
