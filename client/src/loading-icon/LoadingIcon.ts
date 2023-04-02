import './style.css';

export class LoadingIcon {
    private icon: HTMLElement;

    constructor() {
        this.icon = document.getElementById('loading-icon') as HTMLElement;
        if (!this.icon) {
            throw new Error('Loading icon not found');
        }

        this.hide();
    }

    public hide(): void {
        this.icon.style.display = 'none';
    }

    public show(): void {
        this.icon.style.display = 'block';
    }
}